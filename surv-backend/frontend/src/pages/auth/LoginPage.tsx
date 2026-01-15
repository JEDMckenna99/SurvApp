import { useState, useEffect, useCallback } from 'react'
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
  const navigate = useNavigate()
  const dispatch = useDispatch()

  // Sign in with wallet secret - verifies with backend
  const signInWithWalletSecret = useCallback(async (walletSecret: string): Promise<{ userExists: boolean; user?: any }> => {
    try {
      // Get user from Lemma credential
      const lemmaUser = await lemmaAuth.signInWithWalletSecret(walletSecret)
      
      if (!lemmaUser) {
        return { userExists: false }
      }

      // Verify with backend and get/create user record
      const response = await apiClient.post('/api/v1/auth/lemma-verify', {
        user_did: lemmaUser.ppid,
        user_email: `${(lemmaUser.ppid || '').slice(-8)}@wallet.lemma.id`,
        permissions: lemmaUser.permissions || [],
        lemmas: lemmaUser.credential ? [lemmaUser.credential] : [],
      })

      return { userExists: true, user: response.data }
    } catch (err: any) {
      console.error('Sign in with wallet secret failed:', err)
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

  // Create account with wallet secret
  const createAccount = useCallback(async (walletSecret: string) => {
    setAuthStep('creating-account')
    dispatch(loginStart())

    try {
      const result = await signInWithWalletSecret(walletSecret)
      
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
  }, [signInWithWalletSecret, onSignInSuccess, dispatch])

  // v2.9.0 Smart Sign In Handler
  const handleLemmaSignIn = useCallback(async () => {
    setError('')
    setAuthStep('authenticating')
    dispatch(loginStart())

    try {
      // Step 1: Try auto-authenticate (checks if wallet already unlocked)
      const autoResult = await lemmaAuth.autoAuthenticate()
      console.log('Auto-auth result:', autoResult)

      if (autoResult.authenticated && autoResult.walletSecret) {
        // User has unlocked wallet from lemma.id - try to sign in
        setAuthStep('verifying')
        const response = await signInWithWalletSecret(autoResult.walletSecret)

        if (response.userExists && response.user) {
          // SUCCESS: Auto sign-in complete!
          onSignInSuccess(response.user)
          return
        } else {
          // User has wallet but no account here - create account
          await createAccount(autoResult.walletSecret)
          return
        }
      }

      // Step 2: No auto-auth - need passkey interaction
      const state = await lemmaAuth.getAuthState()
      let walletSecret: string | undefined

      if (state.hasWallet) {
        // Unlock existing wallet
        const unlockResult = await lemmaAuth.unlockWallet()
        walletSecret = unlockResult.walletSecret
      } else {
        // Register new passkey
        const regResult = await lemmaAuth.registerPasskey()
        walletSecret = regResult.walletSecret
      }

      if (!walletSecret) {
        walletSecret = await lemmaAuth.getWalletSecret() || undefined
      }

      if (!walletSecret) {
        throw new Error('Failed to get wallet secret')
      }

      // Sign in with the wallet secret
      setAuthStep('verifying')
      const response = await signInWithWalletSecret(walletSecret)

      if (response.userExists && response.user) {
        onSignInSuccess(response.user)
      } else {
        await createAccount(walletSecret)
      }
    } catch (err: any) {
      console.error('Sign in error:', err)
      dispatch(loginFailure())
      setError(err.message || 'Authentication failed. Please try again.')
      setAuthStep('error')
    }
  }, [signInWithWalletSecret, onSignInSuccess, createAccount, dispatch])

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

          // v2.9.0: Check auth state for button text
          setAuthStep('auto-auth')
          const state = await lemmaAuth.getAuthState()
          setAuthState(state)
          console.log('Auth state:', state)

          // Check if wallet is already unlocked - auto sign-in!
          if (state.isUnlocked && state.walletSecret) {
            console.log('Wallet unlocked - attempting auto sign-in...')
            setButtonText('Signing in...')
            
            try {
              dispatch(loginStart())
              setAuthStep('verifying')
              
              const response = await signInWithWalletSecret(state.walletSecret)
              
              if (response.userExists && response.user) {
                // Auto sign-in success!
                onSignInSuccess(response.user)
                return
              } else {
                // Wallet exists but no account - show create account
                setButtonText('Create Account')
                setAuthStep('ready')
              }
            } catch (err) {
              console.error('Auto sign-in failed:', err)
              dispatch(loginFailure())
              // Fall through to show button
            }
          }

          // Set appropriate button text based on state
          setButtonText(state.suggestedButtonText || 'Sign In with Passkey')
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
  }, [signInWithWalletSecret, onSignInSuccess, dispatch])

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
