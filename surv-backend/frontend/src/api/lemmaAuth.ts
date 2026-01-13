/**
 * Lemma Wallet Authentication Service
 * 
 * Wallet-first architecture with passkey authentication.
 * Uses LemmaWallet SDK with /api/wallet-auth/issue endpoint.
 * 
 * Documentation: https://lemma.id/docs
 */

// Lemma Wallet SDK loaded from CDN
declare global {
  interface Window {
    LemmaWallet: any;
  }
}

export interface LemmaConfig {
  siteId: string;
  debug?: boolean;
}

export interface LemmaUser {
  ppid: string;
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
  private wallet: any = null;
  private config: LemmaConfig | null = null;
  private initialized: boolean = false;

  /**
   * Initialize the Lemma Wallet SDK
   */
  async initialize(config: LemmaConfig): Promise<void> {
    this.config = config;
    
    // Wait for SDK to load
    if (!window.LemmaWallet) {
      await this.loadSDK();
    }

    this.wallet = new window.LemmaWallet({
      debug: config.debug || false,
    });

    await this.wallet.init();
    this.initialized = true;
  }

  /**
   * Load the Lemma Wallet SDK from CDN
   */
  private loadSDK(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (window.LemmaWallet) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://lemma.id/sdk/lemma-wallet.js';
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Lemma Wallet SDK'));
      document.head.appendChild(script);
    });
  }

  /**
   * Sign in using Lemma wallet
   */
  async signIn(): Promise<LemmaUser | null> {
    if (!this.wallet || !this.config) {
      throw new Error('Lemma not initialized');
    }

    try {
      // Check if user has an existing passkey/wallet
      const info = await this.wallet.getWalletInfo();
      
      if (info.hasPasskey) {
        // Unlock existing wallet with passkey
        await this.wallet.unlock();
      } else {
        // Register new passkey
        await this.wallet.registerPasskey();
      }

      // Get wallet secret for credential issuance
      const walletSecret = await this.wallet.getWalletSecret();
      
      // Request credential from Lemma API
      const response = await fetch('https://lemma.id/api/wallet-auth/issue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          site_id: this.config.siteId,
          wallet_secret: walletSecret,
        }),
      });

      const data = await response.json();
      
      if (data.success && data.permission_lemma) {
        // Store credential in wallet
        await this.wallet.storeCredential(data.permission_lemma);
        
        return {
          ppid: data.ppid,
          siteId: this.config.siteId,
          permissions: data.permissions || [],
          credential: data.permission_lemma,
        };
      }
      
      return null;
    } catch (error) {
      console.error('Sign in failed:', error);
      throw error;
    }
  }

  /**
   * Check if user is authenticated (has valid credential)
   */
  async isAuthenticated(): Promise<boolean> {
    if (!this.wallet || !this.config) {
      return false;
    }

    try {
      // Check if wallet is authenticated and has credential for this site
      if (!this.wallet.isAuthenticated()) {
        return false;
      }
      
      const cred = await this.wallet.getCredential('permission', this.config.siteId);
      return !!cred;
    } catch {
      return false;
    }
  }

  /**
   * Get current user from stored credential
   */
  async getCurrentUser(): Promise<LemmaUser | null> {
    if (!this.wallet || !this.config) {
      return null;
    }

    try {
      const cred = await this.wallet.getCredential('permission', this.config.siteId);
      if (!cred) return null;

      return {
        ppid: cred.ppid || cred.subject_did,
        siteId: this.config.siteId,
        permissions: cred.permissions || cred.scope || [],
        credential: cred,
      };
    } catch {
      return null;
    }
  }

  /**
   * Verify access to a specific resource (client-side, ~30µs)
   */
  async verifyAccess(
    resource: string, 
    action: 'read' | 'write' | 'delete' = 'read'
  ): Promise<{ hasAccess: boolean; verificationTimeUs: number }> {
    if (!this.wallet || !this.config) {
      return { hasAccess: false, verificationTimeUs: 0 };
    }

    try {
      const start = performance.now();
      const cred = await this.wallet.getCredential('permission', this.config.siteId);
      
      if (!cred) {
        return { hasAccess: false, verificationTimeUs: 0 };
      }

      // Check if scope includes the resource
      const scope = cred.scope || cred.permissions || [];
      const hasAccess = scope.includes('*') || 
                        scope.includes(`${resource}:*`) || 
                        scope.includes(`${resource}:${action}`);
      
      const verificationTimeUs = (performance.now() - start) * 1000;
      
      return { hasAccess, verificationTimeUs };
    } catch {
      return { hasAccess: false, verificationTimeUs: 0 };
    }
  }

  /**
   * Sign out
   */
  async signOut(): Promise<void> {
    // Clear local storage
    localStorage.removeItem('lemma_user');
    
    // Optionally lock the wallet
    if (this.wallet) {
      try {
        // Clear stored credentials for this site
        await this.wallet.clearCredentials?.(this.config?.siteId);
      } catch {
        // Ignore errors during sign out
      }
    }
  }

  /**
   * Get wallet info
   */
  async getWalletInfo(): Promise<{ hasPasskey: boolean; isLocked: boolean } | null> {
    if (!this.wallet) return null;
    try {
      return await this.wallet.getWalletInfo();
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
