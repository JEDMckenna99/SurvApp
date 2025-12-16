import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Paper,
  Alert,
} from '@mui/material'
import { toast } from 'react-toastify'
import { authAPI } from '../../api/auth'
import { loginStart, loginSuccess, loginFailure } from '../../store/authSlice'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const dispatch = useDispatch()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    dispatch(loginStart())

    try {
      const response = await authAPI.login({ email, password })
      dispatch(loginSuccess({
        user: response.user,
        token: response.access_token
      }))
      toast.success('Login successful!')
      navigate('/')
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Login failed'
      setError(errorMessage)
      dispatch(loginFailure())
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
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
        <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
            <Typography component="h1" variant="h4" fontWeight="bold" color="primary">
              Surv
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Field Service Management
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleLogin} noValidate>
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
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </Button>
          </Box>

          <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="caption" color="text.secondary" component="div">
              <strong>Test Accounts:</strong>
            </Typography>
            <Typography variant="caption" color="text.secondary" component="div" sx={{ mt: 1 }}>
              Admin: admin@surv.com / admin123
            </Typography>
            <Typography variant="caption" color="text.secondary" component="div">
              Manager: manager@surv.com / manager123
            </Typography>
            <Typography variant="caption" color="text.secondary" component="div">
              Technician: tech@surv.com / tech123
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  )
}

