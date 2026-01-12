import { useState, useEffect } from 'react'
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
import { lemmaAuth } from '../../api/lemmaAuth'
import { apiClient } from '../../api/client'

type AuthStep = 'ready' | 'authenticating' | 'verifying' | 'error'

export default function LoginPage() {
  const [authStep, setAuthStep] = useState<AuthStep>('ready')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [lemmaReady, setLemmaReady] = useState(false)
  const [walletInfo, setWalletInfo] = useState<{ hasPasskey: boolean } | null>(null)
  const navigate = useNavigate()
  const dispatch = useDispatch()

  // Initialize Lemma Wallet SDK on mount
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

          // Check wallet status
          const info = await lemmaAuth.getWalletInfo()
          setWalletInfo(info)

          // Check if already authenticated with stored credential
          try {
            const isAuth = await lemmaAuth.isAuthenticated()
            if (isAuth) {
              const user = await lemmaAuth.getCurrentUser()
              if (user) {
                await completeLogin(user)
                return
              }
            }
          } catch {
            // Not authenticated yet - show sign-in button
          }
        }
      } catch (err) {
        console.error('Failed to initialize Lemma:', err)
      } finally {
        setLoading(false)
      }
    }
    initLemma()
  }, [])

  // Complete login and sync with backend
  const completeLogin = async (lemmaUser: any) => {
    setAuthStep('verifying')
    dispatch(loginStart())

    try {
      // Verify with backend and get/create user record
      const response = await apiClient.post('/api/v1/auth/lemma-verify', {
        user_did: lemmaUser.ppid,
        user_email: `${(lemmaUser.ppid || '').slice(-8)}@wallet.lemma.id`,
        permissions: lemmaUser.permissions || [],
        lemmas: lemmaUser.credential ? [lemmaUser.credential] : [],
      })

      const userData = response.data

      dispatch(loginSuccess({
        user: userData.user,
        token: userData.access_token,
        verificationMethod: 'lemma',
      }))

      toast.success('Welcome to Surv!')
      navigate('/')
    } catch (err: any) {
      dispatch(loginFailure())
      setError(err.response?.data?.detail || 'Login verification failed')
      setAuthStep('error')
    }
  }

  // Sign in with Lemma wallet (passkey)
  const handleSignIn = async () => {
    setError('')
    setAuthStep('authenticating')
    
    try {
      const user = await lemmaAuth.signIn()
      
      if (user) {
        await completeLogin(user)
      } else {
        throw new Error('Authentication cancelled or failed')
      }
    } catch (err: any) {
      console.error('Sign in error:', err)
      setError(err.message || 'Authentication failed. Please try again.')
      setAuthStep('error')
    }
  }

  // Reset to ready state
  const handleTryAgain = () => {
    setError('')
    setAuthStep('ready')
  }

  // Show loading while initializing
  if (loading) {
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
            Initializing secure authentication...
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
                  {walletInfo?.hasPasskey 
                    ? 'Sign in with your passkey' 
                    : 'Create your secure wallet'
                  }
                </Typography>

                <Button
                  fullWidth
                  variant="contained"
                  onClick={handleSignIn}
                  size="large"
                  sx={{ 
                    py: 1.5,
                    textTransform: 'none',
                    fontSize: '1rem',
                    fontWeight: 600,
                  }}
                >
                  {walletInfo?.hasPasskey 
                    ? '🔐 Sign In with Passkey' 
                    : '🔐 Create Passkey & Sign In'
                  }
                </Button>

                <Divider sx={{ my: 3 }}>
                  <Typography variant="caption" color="text.secondary">
                    {walletInfo?.hasPasskey ? 'Touch ID · Face ID · Windows Hello' : 'No password needed'}
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
