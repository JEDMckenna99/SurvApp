/**
 * Lemma Wallet Authentication Service
 * 
 * Passkey-protected wallet-based authentication.
 * No passwords, no email verification - biometric authentication only.
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
  ppid: string;  // Privacy-Preserving ID (unique per site)
  siteId: string;
  permissions: string[];
  credential: any;
}

export interface WalletInfo {
  hasPasskey: boolean;
  isLocked: boolean;
  walletId?: string;
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
      script.src = 'https://lemma.id/static/js/lemma-wallet.js';
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Lemma Wallet SDK'));
      document.head.appendChild(script);
    });
  }

  /**
   * Get wallet info (has passkey, is locked, etc.)
   */
  async getWalletInfo(): Promise<WalletInfo> {
    if (!this.wallet) {
      throw new Error('Lemma wallet not initialized');
    }
    return await this.wallet.getWalletInfo();
  }

  /**
   * Register a new passkey for the wallet
   * Prompts user for biometric authentication
   */
  async registerPasskey(): Promise<boolean> {
    if (!this.wallet) {
      throw new Error('Lemma wallet not initialized');
    }
    
    try {
      await this.wallet.registerPasskey();
      return true;
    } catch (error) {
      console.error('Passkey registration failed:', error);
      return false;
    }
  }

  /**
   * Unlock the wallet using passkey (biometric)
   */
  async unlockWallet(): Promise<boolean> {
    if (!this.wallet) {
      throw new Error('Lemma wallet not initialized');
    }

    try {
      await this.wallet.unlock();
      return true;
    } catch (error) {
      console.error('Wallet unlock failed:', error);
      return false;
    }
  }

  /**
   * Sign in with passkey - handles both registration and authentication
   */
  async signIn(): Promise<LemmaUser | null> {
    if (!this.wallet || !this.config) {
      throw new Error('Lemma not initialized');
    }

    try {
      // Check wallet state
      const info = await this.getWalletInfo();
      
      // Register passkey if none exists, otherwise unlock
      if (info.hasPasskey) {
        await this.unlockWallet();
      } else {
        await this.registerPasskey();
      }

      // Get wallet secret for credential issuance
      const walletSecret = await this.wallet.getWalletSecret();

      // Request permission credential from Lemma
      const response = await fetch('https://lemma.id/api/wallet-auth/issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          site_id: this.config.siteId,
          wallet_secret: walletSecret,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to get credential');
      }

      // Store the credential in the wallet
      await this.wallet.storeCredential(data.permission_lemma);

      return {
        ppid: data.ppid,
        siteId: this.config.siteId,
        permissions: data.permission_lemma?.claims?.permissions || [],
        credential: data.permission_lemma,
      };
    } catch (error) {
      console.error('Sign in failed:', error);
      return null;
    }
  }

  /**
   * Check if user is authenticated (has valid credential for this site)
   */
  async isAuthenticated(): Promise<boolean> {
    if (!this.wallet || !this.config) {
      return false;
    }

    try {
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
        ppid: cred.subject || cred.claims?.ppid,
        siteId: this.config.siteId,
        permissions: cred.claims?.permissions || [],
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

      // Check if credential grants access to resource
      const scope = cred.claims?.scope || [];
      const hasAccess = scope.includes('*') || 
        scope.some((s: string) => {
          if (s === '*') return true;
          if (s.endsWith(':*')) {
            const resourcePath = s.replace(':*', '');
            return resource.startsWith(resourcePath);
          }
          const [path, act] = s.split(':');
          return resource.startsWith(path) && (act === '*' || act === action);
        });

      const verificationTimeUs = (performance.now() - start) * 1000;
      return { hasAccess, verificationTimeUs };
    } catch {
      return { hasAccess: false, verificationTimeUs: 0 };
    }
  }

  /**
   * Sign out - clear credentials from wallet
   */
  async signOut(): Promise<void> {
    if (this.wallet && this.config) {
      try {
        await this.wallet.removeCredential('permission', this.config.siteId);
      } catch {
        // Ignore errors during sign out
      }
    }
    
    // Clear local storage
    localStorage.removeItem('lemma_user');
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
