/**
 * Lemma Access Guard Component
 * 
 * Provides role-based access control using Lemma IAM authentication.
 * Uses ~63µs client-side verification via WebCrypto API.
 */

import { useState, useEffect, ReactNode } from 'react'
import { useSelector } from 'react-redux'
import { Navigate, useLocation } from 'react-router-dom'
import { Box, CircularProgress, Typography } from '@mui/material'
import { lemmaAuth, SURV_RESOURCES } from '../../api/lemmaAuth'
import type { RootState } from '../../store/store'

interface LemmaAccessGuardProps {
  children: ReactNode
  requiredRoles?: string[]
  resource?: string
  action?: 'read' | 'write' | 'delete'
  fallback?: ReactNode
  loadingComponent?: ReactNode
}

/**
 * Guard component that verifies access before rendering children
 */
export function LemmaAccessGuard({
  children,
  requiredRoles = [],
  resource,
  action = 'read',
  fallback,
  loadingComponent,
}: LemmaAccessGuardProps) {
  const [hasAccess, setHasAccess] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const user = useSelector((state: RootState) => state.auth.user)
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated)
  const location = useLocation()

  useEffect(() => {
    checkAccess()
  }, [user, resource, action, requiredRoles])

  const checkAccess = async () => {
    setLoading(true)

    try {
      // First check authentication
      if (!isAuthenticated || !user) {
        setHasAccess(false)
        setLoading(false)
        return
      }

      // Check role-based access
      if (requiredRoles.length > 0) {
        const userRole = user.role || 'technician'
        const roleAccess = requiredRoles.includes(userRole)
        
        if (!roleAccess) {
          setHasAccess(false)
          setLoading(false)
          return
        }
      }

      // Check resource-based access using Lemma (if configured and resource specified)
      if (resource && lemmaAuth.isInitialized()) {
        const result = await lemmaAuth.verifyAccess(resource, action)
        setHasAccess(result.hasAccess)
      } else {
        // No resource check needed or Lemma not initialized
        setHasAccess(true)
      }
    } catch (error) {
      console.error('Access check failed:', error)
      // On error, default to role-based check
      if (requiredRoles.length > 0 && user) {
        setHasAccess(requiredRoles.includes(user.role || 'technician'))
      } else {
        setHasAccess(isAuthenticated)
      }
    } finally {
      setLoading(false)
    }
  }

  // Show loading state
  if (loading) {
    if (loadingComponent) {
      return <>{loadingComponent}</>
    }
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress size={32} />
      </Box>
    )
  }

  // Not authenticated - redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // No access - show fallback or access denied
  if (!hasAccess) {
    if (fallback) {
      return <>{fallback}</>
    }
    return (
      <Box 
        display="flex" 
        flexDirection="column" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="200px"
        p={3}
      >
        <Typography variant="h6" color="error" gutterBottom>
          Access Denied
        </Typography>
        <Typography variant="body2" color="text.secondary">
          You don't have permission to view this content.
        </Typography>
      </Box>
    )
  }

  // Access granted
  return <>{children}</>
}

/**
 * Hook to check Lemma access for a specific resource
 */
export function useLemmaAccess(resource: string, action: 'read' | 'write' | 'delete' = 'read') {
  const [hasAccess, setHasAccess] = useState(false)
  const [loading, setLoading] = useState(true)
  const [verificationTime, setVerificationTime] = useState(0)

  useEffect(() => {
    const checkAccess = async () => {
      try {
        if (lemmaAuth.isInitialized()) {
          const result = await lemmaAuth.verifyAccess(resource, action)
          setHasAccess(result.hasAccess)
          setVerificationTime(result.verificationTimeUs)
        } else {
          // Lemma not initialized, default to true (rely on backend auth)
          setHasAccess(true)
        }
      } catch {
        setHasAccess(false)
      } finally {
        setLoading(false)
      }
    }

    checkAccess()
  }, [resource, action])

  return { hasAccess, loading, verificationTime }
}

/**
 * Hook to check role-based access
 */
export function useRoleAccess(requiredRoles: string[]) {
  const user = useSelector((state: RootState) => state.auth.user)
  
  if (!user) return false
  
  const userRole = user.role || 'technician'
  return requiredRoles.includes(userRole)
}

/**
 * Convenience component for admin-only content
 */
export function AdminOnly({ 
  children, 
  fallback 
}: { 
  children: ReactNode
  fallback?: ReactNode 
}) {
  return (
    <LemmaAccessGuard 
      requiredRoles={['admin']} 
      resource={SURV_RESOURCES.ADMIN}
      fallback={fallback}
    >
      {children}
    </LemmaAccessGuard>
  )
}

/**
 * Convenience component for manager and above content
 */
export function ManagerOnly({ 
  children, 
  fallback 
}: { 
  children: ReactNode
  fallback?: ReactNode 
}) {
  return (
    <LemmaAccessGuard 
      requiredRoles={['admin', 'manager']} 
      fallback={fallback}
    >
      {children}
    </LemmaAccessGuard>
  )
}

/**
 * Convenience component for technician and above content
 */
export function TechnicianOnly({ 
  children, 
  fallback 
}: { 
  children: ReactNode
  fallback?: ReactNode 
}) {
  return (
    <LemmaAccessGuard 
      requiredRoles={['admin', 'manager', 'technician']} 
      fallback={fallback}
    >
      {children}
    </LemmaAccessGuard>
  )
}

export default LemmaAccessGuard
