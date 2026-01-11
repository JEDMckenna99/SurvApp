import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Paper,
  Alert,
  CircularProgress,
  Divider,
  Fade,
} from '@mui/material'
import { toast } from 'react-toastify'
import { loginStart, loginSuccess, loginFailure } from '../../store/authSlice'
import { lemmaAuth, SURV_PERMISSIONS } from '../../api/lemmaAuth'
import { apiClient } from '../../api/client'

interface LemmaConfig {
  apiKey: string
  siteId: string
  configured: boolean
}

type AuthStep = 'email' | 'waiting' | 'processing' | 'error'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [authStep, setAuthStep] = useState<AuthStep>('email')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useDispatch()

  // Initialize Lemma SDK on mount
  useEffect(() => {
    const initLemma = async () => {
      try {
        // Fetch Lemma config from backend
        const configResponse = await apiClient.get('/api/v1/auth/lemma-config')
        const lemmaConfig: LemmaConfig = {
          ...configResponse.data,
          // API key comes from environment variable (VITE_LEMMA_API_KEY)
          // Site ID comes from backend config
          apiKey: import.meta.env.VITE_LEMMA_API_KEY || '',
          siteId: configResponse.data.site_id || import.meta.env.VITE_LEMMA_SITE_ID || '',
        }

        if (lemmaConfig.apiKey && lemmaConfig.siteId) {
          await lemmaAuth.initialize({
            apiKey: lemmaConfig.apiKey,
            siteId: lemmaConfig.siteId,
          })
          
          // Check if returning from email confirmation
          const params = new URLSearchParams(location.search)
          if (params.get('lemma_callback') === 'true') {
            handleAuthCallback()
          } else {
            // Check if already authenticated
            checkExistingAuth()
          }
        }
      } catch (err) {
        console.error('Failed to initialize Lemma:', err)
        // Continue without Lemma - will use fallback auth
      }
    }
    initLemma()
  }, [location])

  // Check for existing Lemma credentials
  const checkExistingAuth = async () => {
    try {
      const isAuth = await lemmaAuth.isAuthenticated()
      if (isAuth) {
        const user = await lemmaAuth.getCurrentUser()
        if (user) {
          await completeLogin(user)
        }
      }
    } catch (err) {
      console.error('Auth check failed:', err)
    }
  }

  // Handle callback from Lemma email confirmation
  const handleAuthCallback = async () => {
    setAuthStep('processing')
    setLoading(true)

    try {
      // Lemma SDK handles the callback and stores credentials
      const user = await lemmaAuth.getCurrentUser()
      
      if (user) {
        await completeLogin(user)
      } else {
        throw new Error('Failed to retrieve credentials')
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed')
      setAuthStep('error')
    } finally {
      setLoading(false)
    }
  }

  // Complete login and sync with backend
  const completeLogin = async (lemmaUser: any) => {
    dispatch(loginStart())

    try {
      // Verify with backend and get/create user record
      const response = await apiClient.post('/api/v1/auth/lemma-verify', {
        user_did: lemmaUser.did,
        user_email: lemmaUser.email,
        permissions: lemmaUser.permissions,
        lemmas: lemmaUser.lemmas,
      })

      const userData = response.data

      dispatch(loginSuccess({
        user: userData.user,
        token: userData.access_token,
      }))

      toast.success('Welcome to Surv!')
      navigate('/')
    } catch (err: any) {
      dispatch(loginFailure())
      setError(err.response?.data?.detail || 'Login verification failed')
      setAuthStep('error')
    }
  }

  // Request access via email
  const handleRequestAccess = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    
    if (!email) {
      setError('Please enter your email address')
      setLoading(false)
      return
    }

    try {
      // If Lemma is initialized, use it
      if (lemmaAuth.isInitialized()) {
        await lemmaAuth.requestAccess(
          email,
          SURV_PERMISSIONS.TECHNICIAN,
          window.location.origin + '/login?lemma_callback=true'
        )
        setAuthStep('waiting')
        toast.info('Check your email to complete sign in')
      } else {
        // Fallback: Use backend magic link (which uses Lemma API server-side)
        await apiClient.post('/api/v1/auth/magic-link', { email })
        setAuthStep('waiting')
        toast.info('Check your email for a sign-in link')
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to send login email')
      setAuthStep('error')
    } finally {
      setLoading(false)
    }
  }

  // Reset to email entry
  const handleTryAgain = () => {
    setError('')
    setAuthStep('email')
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

          {/* Email Entry Step */}
          {authStep === 'email' && (
            <Fade in>
              <Box component="form" onSubmit={handleRequestAccess} noValidate>
                <Typography 
                  variant="body1" 
                  color="text.secondary" 
                  sx={{ mb: 3, textAlign: 'center' }}
                >
                  Sign in with your email address
                </Typography>

                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="email"
                  label="Email Address"
                  name="email"
                  autoComplete="email"
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '&.Mui-focused fieldset': {
                        borderColor: '#1976d2',
                      },
                    },
                  }}
                />

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  disabled={loading || !email}
                  sx={{ 
                    mt: 3, 
                    mb: 2,
                    py: 1.5,
                    textTransform: 'none',
                    fontSize: '1rem',
                    fontWeight: 600,
                  }}
                >
                  {loading ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    'Continue with Email'
                  )}
                </Button>

                <Divider sx={{ my: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    Secure passwordless login
                  </Typography>
                </Divider>

                <Box sx={{ 
                  mt: 2, 
                  p: 2, 
                  bgcolor: 'rgba(25, 118, 210, 0.04)', 
                  borderRadius: 1,
                  border: '1px solid rgba(25, 118, 210, 0.1)',
                }}>
                  <Typography variant="caption" color="text.secondary" component="div">
                    Powered by <strong>Lemma</strong> cryptographic authentication.
                    No password required - verify your identity via email confirmation.
                  </Typography>
                </Box>
              </Box>
            </Fade>
          )}

          {/* Waiting for Email Confirmation */}
          {authStep === 'waiting' && (
            <Fade in>
              <Box sx={{ textAlign: 'center', py: 3 }}>
                <Box sx={{ mb: 3 }}>
                  <CircularProgress size={48} thickness={2} />
                </Box>
                
                <Typography variant="h6" gutterBottom>
                  Check your email
                </Typography>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  We sent a sign-in link to <strong>{email}</strong>
                </Typography>
                
                <Typography variant="caption" color="text.secondary" component="div">
                  Click the link in your email to complete sign-in.
                  The link expires in 15 minutes.
                </Typography>

                <Button 
                  variant="text" 
                  onClick={handleTryAgain}
                  sx={{ mt: 3 }}
                >
                  Use a different email
                </Button>
              </Box>
            </Fade>
          )}

          {/* Processing Authentication */}
          {authStep === 'processing' && (
            <Fade in>
              <Box sx={{ textAlign: 'center', py: 3 }}>
                <CircularProgress size={48} />
                <Typography variant="body1" sx={{ mt: 2 }}>
                  Verifying your credentials...
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

          {/* General Error Display */}
          {error && authStep === 'email' && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
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
