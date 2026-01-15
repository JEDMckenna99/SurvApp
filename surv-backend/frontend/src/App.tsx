import { useEffect, useCallback } from 'react'
import { BrowserRouter as Router, useNavigate, useLocation } from 'react-router-dom'
import { Provider, useDispatch, useSelector } from 'react-redux'
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { store, RootState } from './store/store'
import { logout } from './store/authSlice'
import { lemmaAuth } from './api/lemmaAuth'
import { apiClient } from './api/client'
import AppRoutes from './routes/AppRoutes'

// Create Surv theme based on branding
const theme = createTheme({
  palette: {
    primary: {
      main: '#0066CC', // Surv blue from logo
      light: '#3399FF',
      dark: '#004499',
    },
    secondary: {
      main: '#00CC66',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  },
})

/**
 * Session Manager Component
 * Handles Lemma wallet session expiry detection
 */
function SessionManager() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated)

  // Sign out handler
  const handleSignOut = useCallback(() => {
    console.log('Signing out due to session expiry')
    
    // Clear Lemma credentials
    lemmaAuth.signOut()
    
    // Dispatch logout action
    dispatch(logout())
    
    // Show notification
    toast.warning('Your session has expired. Please sign in again.', {
      autoClose: 5000,
    })
    
    // Navigate to login
    navigate('/login', { replace: true })
  }, [dispatch, navigate])

  useEffect(() => {
    // Only set up session monitoring if user is authenticated and not on login page
    if (!isAuthenticated || location.pathname === '/login') {
      return
    }

    let cleanup: (() => void) | undefined

    const initSessionMonitoring = async () => {
      try {
        // Fetch Lemma config from backend
        const configResponse = await apiClient.get('/api/v1/auth/lemma-config')
        const siteId = configResponse.data.site_id || ''

        if (!siteId || !configResponse.data.configured) {
          return
        }

        // Initialize Lemma if not already
        if (!lemmaAuth.isInitialized()) {
          await lemmaAuth.initialize({
            siteId,
            debug: true,
          })
        }

        // Check session validity on load
        const isValid = await lemmaAuth.isSessionValid()
        if (!isValid) {
          console.log('Session invalid on load - signing out')
          handleSignOut()
          return
        }

        // Register session expiry handler
        cleanup = lemmaAuth.onSessionExpired((event) => {
          console.log('Wallet locked remotely:', event)
          handleSignOut()
        })

        console.log('Lemma session monitoring initialized')
      } catch (error) {
        console.error('Failed to initialize session monitoring:', error)
      }
    }

    initSessionMonitoring()

    // Cleanup on unmount
    return () => {
      if (cleanup) {
        cleanup()
      }
    }
  }, [isAuthenticated, location.pathname, handleSignOut])

  return null // This component doesn't render anything
}

/**
 * App Content with Session Manager
 */
function AppContent() {
  return (
    <>
      <SessionManager />
      <AppRoutes />
    </>
  )
}

function App() {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <AppContent />
        </Router>
        <ToastContainer 
          position="top-right" 
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
      </ThemeProvider>
    </Provider>
  )
}

export default App

