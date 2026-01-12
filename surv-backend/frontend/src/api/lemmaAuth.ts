/**
 * Lemma IAM Authentication Service
 * 
 * Uses Lemma's central wallet for credential storage.
 * No local passkey setup required - credentials stored at lemma.id
 * 
 * Documentation: https://lemma.id/docs
 */

// Lemma IAM SDK loaded from CDN
declare global {
  interface Window {
    LemmaIAM: any;
  }
}

export interface LemmaConfig {
  apiKey: string;
  siteId: string;
  debug?: boolean;
}

export interface LemmaUser {
  ppid: string;
  email?: string;
  siteId: string;
  permissions: string[];
  credential: any;
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
   * Initialize the Lemma IAM SDK with central wallet
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
      useCentralWallet: true,  // Use Lemma's central wallet
      debug: config.debug || false,
    });

    this.initialized = true;
  }

  /**
   * Load the Lemma IAM SDK from CDN
   */
  private loadSDK(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (window.LemmaIAM) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://lemma.id/static/js/lemma-iam-sdk.js';
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Lemma IAM SDK'));
      document.head.appendChild(script);
    });
  }

  /**
   * Sign in using Lemma central wallet
   */
  async signIn(): Promise<LemmaUser | null> {
    if (!this.lemmaIAM || !this.config) {
      throw new Error('Lemma not initialized');
    }

    try {
      const result = await this.lemmaIAM.signIn();
      
      if (result && result.success) {
        return {
          ppid: result.ppid || result.user_did,
          email: result.email,
          siteId: this.config.siteId,
          permissions: result.permissions || [],
          credential: result.credential || result,
        };
      }
      
      return null;
    } catch (error) {
      console.error('Sign in failed:', error);
      return null;
    }
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    if (!this.lemmaIAM) {
      return false;
    }

    try {
      return await this.lemmaIAM.isAuthenticated();
    } catch {
      return false;
    }
  }

  /**
   * Get current user
   */
  async getCurrentUser(): Promise<LemmaUser | null> {
    if (!this.lemmaIAM || !this.config) {
      return null;
    }

    try {
      const user = await this.lemmaIAM.getUser();
      if (!user) return null;

      return {
        ppid: user.ppid || user.did || user.user_did,
        email: user.email,
        siteId: this.config.siteId,
        permissions: user.permissions || user.role ? [user.role] : [],
        credential: user,
      };
    } catch {
      return null;
    }
  }

  /**
   * Verify access to a specific resource
   */
  async verifyAccess(
    resource: string, 
    action: 'read' | 'write' | 'delete' = 'read'
  ): Promise<{ hasAccess: boolean; verificationTimeUs: number }> {
    if (!this.lemmaIAM) {
      return { hasAccess: false, verificationTimeUs: 0 };
    }

    try {
      const result = await this.lemmaIAM.verifyAccess(resource, action);
      return {
        hasAccess: result.hasAccess || result.has_access || false,
        verificationTimeUs: result.verificationTimeUs || result.verification_time_us || 0,
      };
    } catch {
      return { hasAccess: false, verificationTimeUs: 0 };
    }
  }

  /**
   * Sign out
   */
  async signOut(): Promise<void> {
    if (this.lemmaIAM) {
      try {
        await this.lemmaIAM.signOut();
      } catch {
        // Ignore errors during sign out
      }
    }
    
    localStorage.removeItem('lemma_user');
  }

  /**
   * Get storage info
   */
  getStorageInfo(): any {
    if (!this.lemmaIAM) return null;
    try {
      return this.lemmaIAM.getStorageInfo();
    } catch {
      return null;
    }
  }

  /**
   * Get Surv role from Lemma permissions
   */
  getSurvRoleFromPermissions(permissions: string[]): string {
    if (permissions.includes(SURV_PERMISSIONS.ADMIN) || permissions.includes('admin') || permissions.includes('*')) {
      return 'admin';
    }
    if (permissions.includes(SURV_PERMISSIONS.MANAGER) || permissions.includes('manager')) {
      return 'manager';
    }
    return 'technician';
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
