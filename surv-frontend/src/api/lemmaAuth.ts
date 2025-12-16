/**
 * Lemma IAM Authentication Service
 * 
 * Handles email-based authentication with Lemma's cryptographic verification.
 * No passwords required - uses Ed25519 signatures with ~63µs client-side verification.
 * 
 * Documentation: https://lemma.id/docs
 */

// Lemma SDK will be loaded from CDN
declare global {
  interface Window {
    LemmaIAM: any;
  }
}

export interface LemmaConfig {
  apiKey: string;
  siteId: string;
}

export interface LemmaUser {
  did: string;  // Decentralized identifier
  email: string;
  permissions: string[];
  lemmas: any[];  // Cryptographic credentials
}

export interface LemmaVerificationResult {
  hasAccess: boolean;
  verificationTimeUs: number;
  cryptoEngine: string;
}

export interface AccessRequestResponse {
  success: boolean;
  message: string;
  requestId?: string;
}

// Permission level mapping for Surv roles
export const SURV_PERMISSIONS = {
  ADMIN: 'surv_admin',
  MANAGER: 'surv_manager', 
  TECHNICIAN: 'surv_technician',
} as const;

// Resource mappings for Surv
export const SURV_RESOURCES = {
  DASHBOARD: '/dashboard',
  CUSTOMERS: '/customers',
  JOBS: '/jobs',
  INVOICES: '/invoices',
  ESTIMATES: '/estimates',
  REPORTS: '/reports',
  TIME_TRACKING: '/time-tracking',
  MARKETING: '/marketing',
  TECHNICIANS: '/technicians',
  ADMIN: '/admin',
} as const;

class LemmaAuthService {
  private lemmaIAM: any = null;
  private config: LemmaConfig | null = null;
  private initialized: boolean = false;

  /**
   * Initialize the Lemma SDK
   */
  async initialize(config: LemmaConfig): Promise<void> {
    this.config = config;
    
    // Wait for SDK to load
    if (!window.LemmaIAM) {
      await this.loadSDK();
    }

    this.lemmaIAM = new window.LemmaIAM({
      apiKey: config.apiKey,
      siteId: config.siteId,
    });

    this.initialized = true;
  }

  /**
   * Load the Lemma SDK from CDN
   */
  private loadSDK(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Check if already loaded
      if (window.LemmaIAM) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://lemma.id/static/js/lemma-iam-sdk.js';
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Lemma SDK'));
      document.head.appendChild(script);
    });
  }

  /**
   * Request access via email
   * User will receive a confirmation email with a link to complete authentication
   */
  async requestAccess(
    email: string, 
    permissionLevel: string = SURV_PERMISSIONS.TECHNICIAN,
    redirectUrl?: string
  ): Promise<AccessRequestResponse> {
    if (!this.config) {
      throw new Error('Lemma not initialized. Call initialize() first.');
    }

    const response = await fetch('https://lemma.id/api/v1/iam/request-access', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        site_id: this.config.siteId,
        user_email: email,
        permission_level: permissionLevel,
        redirect_url: redirectUrl || window.location.origin + '/auth/callback',
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to request access');
    }

    return {
      success: true,
      message: 'Check your email to complete sign in',
      requestId: data.request_id,
    };
  }

  /**
   * Verify access to a specific resource
   * Uses client-side WebCrypto API for ~63µs verification
   */
  async verifyAccess(
    resource: string, 
    action: 'read' | 'write' | 'delete' = 'read'
  ): Promise<LemmaVerificationResult> {
    if (!this.lemmaIAM) {
      throw new Error('Lemma not initialized');
    }

    try {
      const result = await this.lemmaIAM.verifyAccess(resource, action);
      return {
        hasAccess: result.hasAccess,
        verificationTimeUs: result.verificationTimeUs || 0,
        cryptoEngine: result.cryptoEngine || 'webcrypto',
      };
    } catch (error) {
      return {
        hasAccess: false,
        verificationTimeUs: 0,
        cryptoEngine: 'error',
      };
    }
  }

  /**
   * Get current user from Lemma wallet
   */
  async getCurrentUser(): Promise<LemmaUser | null> {
    if (!this.lemmaIAM) {
      return null;
    }

    try {
      const user = await this.lemmaIAM.getCurrentUser();
      return user;
    } catch {
      return null;
    }
  }

  /**
   * Get stored credentials from browser wallet
   */
  async getStoredCredentials(): Promise<any[]> {
    if (!this.lemmaIAM) {
      return [];
    }

    try {
      return await this.lemmaIAM.getCredentials();
    } catch {
      return [];
    }
  }

  /**
   * Check if user is authenticated (has valid lemmas)
   */
  async isAuthenticated(): Promise<boolean> {
    const credentials = await this.getStoredCredentials();
    return credentials.length > 0;
  }

  /**
   * Sign out - clear credentials from browser wallet
   */
  async signOut(): Promise<void> {
    if (this.lemmaIAM) {
      await this.lemmaIAM.clearCredentials();
    }
    
    // Clear local storage
    localStorage.removeItem('lemma_user');
    localStorage.removeItem('lemma_credentials');
  }

  /**
   * Get Surv role from Lemma permissions
   */
  getSurvRoleFromPermissions(permissions: string[]): string {
    if (permissions.includes(SURV_PERMISSIONS.ADMIN) || permissions.includes('*')) {
      return 'admin';
    }
    if (permissions.includes(SURV_PERMISSIONS.MANAGER)) {
      return 'manager';
    }
    return 'technician';
  }

  /**
   * Map Surv role to Lemma permission
   */
  mapRoleToPermission(role: string): string {
    switch (role) {
      case 'admin':
        return SURV_PERMISSIONS.ADMIN;
      case 'manager':
        return SURV_PERMISSIONS.MANAGER;
      default:
        return SURV_PERMISSIONS.TECHNICIAN;
    }
  }

  /**
   * Check if SDK is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }
}

// Export singleton instance
export const lemmaAuth = new LemmaAuthService();

// Export helper for checking role-based access
export function hasRoleAccess(userRole: string, requiredRoles: string[]): boolean {
  return requiredRoles.includes(userRole);
}

// Export helper for resource access check
export async function canAccessResource(resource: string, action: 'read' | 'write' | 'delete' = 'read'): Promise<boolean> {
  const result = await lemmaAuth.verifyAccess(resource, action);
  return result.hasAccess;
}

