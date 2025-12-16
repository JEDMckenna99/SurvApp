/**
 * Lemma Access Guard Component
 * 
 * Provides client-side access verification using Lemma's ~63µs WebCrypto API.
 * Use this to protect routes, features, and UI elements based on permissions.
 */

import { useState, useEffect, ReactNode } from 'react'
import { useSelector } from 'react-redux'
import { Box, CircularProgress, Typography, Alert, Button } from '@mui/material'
import { RootState } from '../../store/store'
import { lemmaAuth, SURV_RESOURCES } from '../../api/lemmaAuth'

interface LemmaAccessGuardProps {
  children: ReactNode
  resource?: string
  action?: 'read' | 'write' | 'delete'
  requiredRoles?: string[]
  fallback?: ReactNode
  showDenied?: boolean
  onAccessDenied?: () => void
}

/**
 * Guard component for Lemma-based access control
 * 
 * Usage:
 * <LemmaAccessGuard resource="/admin" requiredRoles={['admin']}>
 *   <AdminPanel />
 * </LemmaAccessGuard>
 */
export function LemmaAccessGuard({
  children,
  resource,
  action = 'read',
  requiredRoles = [],
  fallback,
  showDenied = true,
  onAccessDenied,
}: LemmaAccessGuardProps) {
  const [checking, setChecking] = useState(true)
  const [hasAccess, setHasAccess] = useState(false)
  const [verificationTimeUs, setVerificationTimeUs] = useState<number | null>(null)
  
  const user = useSelector((state: RootState) => state.auth.user)
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated)

  useEffect(() => {
    const checkAccess = async () => {
      setChecking(true)

      // Not authenticated = no access
      if (!isAuthenticated || !user) {
        setHasAccess(false)
        setChecking(false)
        if (onAccessDenied) onAccessDenied()
        return
      }

      // Check role-based access first (fast)
      if (requiredRoles.length > 0) {
        const userRole = user.role
        if (!requiredRoles.includes(userRole)) {
          setHasAccess(false)
          setChecking(false)
          if (onAccessDenied) onAccessDenied()
          return
        }
      }

      // Check Lemma permission if resource specified
      if (resource && lemmaAuth.isInitialized()) {
        try {
          const result = await lemmaAuth.verifyAccess(resource, action)
          setHasAccess(result.hasAccess)
          setVerificationTimeUs(result.verificationTimeUs)
          
          if (!result.hasAccess && onAccessDenied) {
            onAccessDenied()
          }
        } catch (err) {
          console.error('Lemma verification error:', err)
          // Fall back to role-based access
          setHasAccess(requiredRoles.length === 0 || requiredRoles.includes(user.role))
        }
      } else {
        // No resource check needed, role check passed
        setHasAccess(true)
      }

      setChecking(false)
    }

    checkAccess()
  }, [user, isAuthenticated, resource, action, requiredRoles, onAccessDenied])

  // Loading state
  if (checking) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress size={24} />
      </Box>
    )
  }

  // Access granted
  if (hasAccess) {
    return <>{children}</>
  }

  // Custom fallback
  if (fallback) {
    return <>{fallback}</>
  }

  // Access denied
  if (showDenied) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Alert severity="warning" sx={{ mb: 2 }}>
          <Typography variant="body1">
            You don't have permission to access this content.
          </Typography>
        </Alert>
        {user && (
          <Typography variant="body2" color="text.secondary">
            Current role: {user.role}
          </Typography>
        )}
      </Box>
    )
  }

  // Hidden when denied
  return null
}

/**
 * Hook for checking access in components
 */
export function useLemmaAccess(resource?: string, action: 'read' | 'write' | 'delete' = 'read') {
  const [hasAccess, setHasAccess] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const [verificationTimeUs, setVerificationTimeUs] = useState<number | null>(null)
  
  const user = useSelector((state: RootState) => state.auth.user)
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated)

  useEffect(() => {
    const check = async () => {
      if (!isAuthenticated) {
        setHasAccess(false)
        setLoading(false)
        return
      }

      if (resource && lemmaAuth.isInitialized()) {
        try {
          const result = await lemmaAuth.verifyAccess(resource, action)
          setHasAccess(result.hasAccess)
          setVerificationTimeUs(result.verificationTimeUs)
        } catch {
          setHasAccess(true)  // Fallback to allow
        }
      } else {
        setHasAccess(true)
      }

      setLoading(false)
    }

    check()
  }, [resource, action, isAuthenticated])

  return { hasAccess, loading, verificationTimeUs, user }
}

/**
 * Role-based access check (no Lemma verification)
 */
export function useRoleAccess(allowedRoles: string[]) {
  const user = useSelector((state: RootState) => state.auth.user)
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated)

  if (!isAuthenticated || !user) {
    return false
  }

  return allowedRoles.includes(user.role)
}

/**
 * Admin-only guard
 */
export function AdminOnly({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
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
 * Manager and above guard
 */
export function ManagerOnly({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
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
 * Feature flag component
 */
export function FeatureGuard({ 
  feature, 
  children,
  fallback,
}: { 
  feature: string;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const hasFeature = useLemmaAccess(`/features/${feature}`)
  
  if (hasFeature.loading) {
    return <CircularProgress size={16} />
  }
  
  if (hasFeature.hasAccess) {
    return <>{children}</>
  }
  
  return fallback ? <>{fallback}</> : null
}

export default LemmaAccessGuard

