import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import {
  Box,
  Button,
  Container,
  Typography,
  Paper,
  Alert,
  CircularProgress,
  Divider,
  Fade,
} from '@mui/material'
import { toast } from 'react-toastify'
import { loginStart, loginSuccess, loginFailure } from '../../store/authSlice'
import { lemmaAuth, AuthState } from '../../api/lemmaAuth'
import { apiClient } from '../../api/client'

type AuthStep = 'initializing' | 'auto-auth' | 'ready' | 'authenticating' | 'verifying' | 'creating-account' | 'error'

export default function LoginPage() {
  const [authStep, setAuthStep] = useState<AuthStep>('initializing')
  const [error, setError] = useState('')
  const [lemmaReady, setLemmaReady] = useState(false)
  const [authState, setAuthState] = useState<AuthState | null>(null)
  const [buttonText, setButtonText] = useState('Sign In')
  const [linkDeviceHtml, setLinkDeviceHtml] = useState<string | null>(null)
  const linkContainerRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const dispatch = useDispatch()

  // Authenticate with PPID - sends to OUR backend (not lemma.id)
  const authenticateWithPPID = useCallback(async (ppid: string): Promise<{ userExists: boolean; user?: any }> => {
    try {
      // Send PPID to YOUR backend - NO network call to lemma.id needed
      // Backend will either sign in existing user or create new account
      const response = await apiClient.post('/api/v1/auth/lemma-verify', {
        user_did: ppid,
        user_email: `${ppid.slice(-8)}@wallet.lemma.id`,
        permissions: [],
        lemmas: [],
      })

      return { userExists: true, user: response.data }
    } catch (err: any) {
      console.error('Authentication with PPID failed:', err)
      // Check if it's a "user not found" type error
      if (err.response?.status === 404) {
        return { userExists: false }
      }
      throw err
    }
  }, [])

  // Complete login success
  const onSignInSuccess = useCallback((userData: any) => {
    dispatch(loginSuccess({
      user: userData.user,
      token: userData.access_token,
      verificationMethod: 'lemma',
    }))

    toast.success('Welcome to Surv!')
    navigate('/')
  }, [dispatch, navigate])

  // Create account with PPID
  const createAccountWithPPID = useCallback(async (ppid: string) => {
    setAuthStep('creating-account')
    dispatch(loginStart())

    try {
      const result = await authenticateWithPPID(ppid)
      
      if (result.user) {
        onSignInSuccess(result.user)
      } else {
        throw new Error('Failed to create account')
      }
    } catch (err: any) {
      dispatch(loginFailure())
      setError(err.message || 'Account creation failed')
      setAuthStep('error')
    }
  }, [authenticateWithPPID, onSignInSuccess, dispatch])

  // Sign In Handler - handles all wallet states correctly
  const handleLemmaSignIn = useCallback(async () => {
    setError('')
    setAuthStep('authenticating')
    dispatch(loginStart())

    try {
      // Step 1: Check current auth state
      const state = await lemmaAuth.getAuthState()
      console.log('Current auth state:', state)

      // Step 2: Try to get authenticated PPID
      let result = await lemmaAuth.signInWithLemma()
      console.log('signInWithLemma result:', result)

      // If already authenticated, proceed
      if (result.authenticated && result.ppid) {
        setAuthStep('verifying')
        const response = await authenticateWithPPID(result.ppid)
        if (response.userExists && response.user) {
          onSignInSuccess(response.user)
        } else {
          await createAccountWithPPID(result.ppid)
        }
        return
      }

      // Step 3: Not authenticated - need to create or unlock passkey
      console.log('Not authenticated. hasWallet:', state.hasWallet)
      
      if (state.hasWallet) {
        // User has a wallet - try to unlock it
        console.log('Unlocking existing wallet...')
        try {
          await lemmaAuth.unlockWallet()
        } catch (unlockErr) {
          console.error('Unlock failed:', unlockErr)
          // Maybe try popup unlock as fallback
          await lemmaAuth.smartUnlock()
          // smartUnlock may redirect - if we're still here, try again
        }
      } else {
        // User needs to create a passkey first
        console.log('Creating new passkey...')
        await lemmaAuth.registerPasskey()
      }
      
      // Step 4: Try signInWithLemma again after passkey interaction
      result = await lemmaAuth.signInWithLemma()
      console.log('signInWithLemma after passkey interaction:', result)
      
      if (result.authenticated && result.ppid) {
        setAuthStep('verifying')
        const response = await authenticateWithPPID(result.ppid)
        if (response.userExists && response.user) {
          onSignInSuccess(response.user)
        } else {
          await createAccountWithPPID(result.ppid)
        }
        return
      }

      // Step 5: Still not working - try one more approach
      // Get wallet secret directly after passkey creation/unlock
      console.log('Trying to get wallet secret directly...')
      const walletSecret = await lemmaAuth.getWalletSecret()
      console.log('Wallet secret obtained:', !!walletSecret)
      
      if (walletSecret) {
        // We have a wallet secret - try getAuthenticatedPPID one more time
        const finalResult = await lemmaAuth.getAuthenticatedPPID()
        console.log('Final getAuthenticatedPPID result:', finalResult)
        
        if (finalResult.authenticated && finalResult.ppid) {
          setAuthStep('verifying')
          const response = await authenticateWithPPID(finalResult.ppid)
          if (response.userExists && response.user) {
            onSignInSuccess(response.user)
          } else {
            await createAccountWithPPID(finalResult.ppid)
          }
          return
        }
      }

      throw new Error('Could not authenticate. Please try again or contact support.')
    } catch (err: any) {
      console.error('Sign in error:', err)
      dispatch(loginFailure())
      setError(err.message || 'Authentication failed. Please try again.')
      setAuthStep('error')
    }
  }, [authenticateWithPPID, onSignInSuccess, createAccountWithPPID, dispatch])

  // Initialize Lemma Wallet SDK and check for auto-auth on mount
  useEffect(() => {
    const initLemma = async () => {
      try {
        // Fetch Lemma config from backend
        const configResponse = await apiClient.get('/api/v1/auth/lemma-config')
        const siteId = configResponse.data.site_id || ''

        if (siteId && configResponse.data.configured) {
          await lemmaAuth.initialize({
            siteId,
            debug: true,
          })
          
          setLemmaReady(true)

          // Check auth state for button text
          setAuthStep('auto-auth')
          const state = await lemmaAuth.getAuthState()
          setAuthState(state)
          console.log('Auth state:', state)

          // Check if already authenticated - use signInWithLemma (correct implementation)
          const authResult = await lemmaAuth.signInWithLemma()
          console.log('signInWithLemma on load:', authResult)

          if (authResult.authenticated && authResult.ppid) {
            console.log('Already authenticated - attempting auto sign-in...')
            setButtonText('Signing in...')
            
            try {
              dispatch(loginStart())
              setAuthStep('verifying')
              
              const response = await authenticateWithPPID(authResult.ppid)
              
              if (response.userExists && response.user) {
                // Auto sign-in success!
                onSignInSuccess(response.user)
                return
              } else {
                // PPID exists but no account - show create account
                setButtonText('Create Account')
                setAuthStep('ready')
              }
            } catch (err) {
              console.error('Auto sign-in failed:', err)
              dispatch(loginFailure())
              // Fall through to show button
            }
          } else if (authResult.needsSetup) {
            // User linked device but needs to create passkey
            setButtonText('Create Passkey & Sign In')
          }

          // Set appropriate button text based on state
          if (!authResult.needsSetup) {
            setButtonText(state.suggestedButtonText || 'Sign In with Passkey')
          }

          // Get link device HTML for users with wallets on other devices
          const linkHtml = await lemmaAuth.getLinkDeviceHtml()
          if (linkHtml) {
            setLinkDeviceHtml(linkHtml)
          }

          setAuthStep('ready')
        } else {
          setAuthStep('ready')
        }
      } catch (err) {
        console.error('Failed to initialize Lemma:', err)
        setAuthStep('ready')
      }
    }
    initLemma()
  }, [authenticateWithPPID, onSignInSuccess, dispatch])

  // Inject link device HTML when it changes
  useEffect(() => {
    if (linkDeviceHtml && linkContainerRef.current) {
      linkContainerRef.current.innerHTML = linkDeviceHtml
    }
  }, [linkDeviceHtml])

  // Reset to ready state
  const handleTryAgain = () => {
    setError('')
    setAuthStep('ready')
  }

  // Show loading while initializing
  if (authStep === 'initializing' || authStep === 'auto-auth') {
    return (
      <Container component="main" maxWidth="xs">
        <Box
          sx={{
            marginTop: 8,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <CircularProgress />
          <Typography variant="body2" sx={{ mt: 2 }}>
            {authStep === 'auto-auth' ? 'Checking authentication...' : 'Initializing secure authentication...'}
          </Typography>
        </Box>
      </Container>
    )
  }

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper 
          elevation={3} 
          sx={{ 
            p: 4, 
            width: '100%',
            background: 'linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)',
          }}
        >
          {/* Logo and Title */}
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
            <Typography 
              component="h1" 
              variant="h4" 
              fontWeight="bold" 
              sx={{ 
                color: '#1976d2',
                letterSpacing: '-0.5px',
              }}
            >
              Surv
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Field Service Management
            </Typography>
          </Box>

          {/* Ready State - Show Sign In Button */}
          {authStep === 'ready' && lemmaReady && (
            <Fade in>
              <Box sx={{ textAlign: 'center' }}>
                <Typography 
                  variant="body1" 
                  color="text.secondary" 
                  sx={{ mb: 3 }}
                >
                  {authState?.hasWallet 
                    ? (authState?.isUnlocked ? 'Ready to sign in' : 'Unlock your wallet to continue')
                    : 'Create your secure wallet'
                  }
                </Typography>

                <Button
                  fullWidth
                  variant="contained"
                  onClick={handleLemmaSignIn}
                  size="large"
                  sx={{ 
                    py: 1.5,
                    textTransform: 'none',
                    fontSize: '1rem',
                    fontWeight: 600,
                  }}
                >
                  🔐 {buttonText}
                </Button>

                {/* Link existing wallet from another device */}
                <Box
                  ref={linkContainerRef}
                  sx={{
                    mt: 2,
                    '& .lemma-link-device': {
                      textAlign: 'center',
                      fontSize: '0.85rem',
                    },
                    '& a': {
                      color: 'primary.main',
                      textDecoration: 'none',
                      fontWeight: 500,
                      '&:hover': {
                        textDecoration: 'underline',
                      },
                    },
                  }}
                />

                <Divider sx={{ my: 3 }}>
                  <Typography variant="caption" color="text.secondary">
                    {authState?.hasWallet ? 'Touch ID · Face ID · Windows Hello' : 'No password needed'}
                  </Typography>
                </Divider>

                <Box sx={{ 
                  p: 2, 
                  bgcolor: 'rgba(25, 118, 210, 0.04)', 
                  borderRadius: 1,
                  border: '1px solid rgba(25, 118, 210, 0.1)',
                }}>
                  <Typography variant="caption" color="text.secondary" component="div">
                    Powered by <strong>Lemma</strong> wallet-based authentication.
                    Your credentials are protected by your device's biometrics.
                  </Typography>
                </Box>
              </Box>
            </Fade>
          )}

          {/* Not Ready - Lemma not configured */}
          {authStep === 'ready' && !lemmaReady && (
            <Fade in>
              <Box sx={{ textAlign: 'center' }}>
                <Alert severity="warning" sx={{ mb: 2 }}>
                  Authentication system not configured
                </Alert>
                <Typography variant="body2" color="text.secondary">
                  Please contact your administrator to set up Lemma authentication.
                </Typography>
              </Box>
            </Fade>
          )}

          {/* Authenticating */}
          {authStep === 'authenticating' && (
            <Fade in>
              <Box sx={{ textAlign: 'center', py: 3 }}>
                <Box sx={{ mb: 3 }}>
                  <CircularProgress size={48} thickness={2} />
                </Box>
                
                <Typography variant="h6" gutterBottom>
                  Authenticating...
                </Typography>
                
                <Typography variant="body2" color="text.secondary">
                  Complete the passkey prompt on your device
                </Typography>
              </Box>
            </Fade>
          )}

          {/* Verifying with Backend */}
          {authStep === 'verifying' && (
            <Fade in>
              <Box sx={{ textAlign: 'center', py: 3 }}>
                <CircularProgress size={48} />
                <Typography variant="body1" sx={{ mt: 2 }}>
                  Verifying credentials...
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  This only takes a moment
                </Typography>
              </Box>
            </Fade>
          )}

          {/* Creating Account */}
          {authStep === 'creating-account' && (
            <Fade in>
              <Box sx={{ textAlign: 'center', py: 3 }}>
                <CircularProgress size={48} />
                <Typography variant="body1" sx={{ mt: 2 }}>
                  Creating your account...
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Setting up your workspace
                </Typography>
              </Box>
            </Fade>
          )}

          {/* Error State */}
          {authStep === 'error' && (
            <Fade in>
              <Box>
                <Alert severity="error" sx={{ mb: 3 }}>
                  {error || 'Authentication failed. Please try again.'}
                </Alert>
                
                <Button 
                  fullWidth 
                  variant="contained" 
                  onClick={handleTryAgain}
                >
                  Try Again
                </Button>
              </Box>
            </Fade>
          )}
        </Paper>

        {/* Security Badge */}
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            Secured with Ed25519 cryptographic signatures
          </Typography>
        </Box>
      </Box>
    </Container>
  )
}
