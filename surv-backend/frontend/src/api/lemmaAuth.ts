/**
 * Lemma Wallet Authentication Service v2.9.0
 * 
 * Smart auto-authentication with wallet-first architecture.
 * Users who unlock once on lemma.id auto-sign-in with zero clicks.
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
  walletSecret: string;
  permissions: string[];
  credential: any;
}

// v2.9.0 SDK types
export interface AutoAuthResult {
  authenticated: boolean;
  walletSecret?: string;
  needsPasskey?: boolean;
  message?: string;
}

export interface AuthState {
  hasWallet: boolean;
  isUnlocked: boolean;
  walletSecret?: string;
  suggestedAction: 'register' | 'unlock' | 'ready';
  suggestedButtonText: string;
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
   * v2.9.0 Smart Auto-Authentication
   * Checks if wallet is already unlocked (e.g., from lemma.id)
   * Returns authentication state for zero-click sign-in
   */
  async autoAuthenticate(): Promise<AutoAuthResult> {
    if (!this.wallet) {
      return { authenticated: false, message: 'Wallet not initialized' };
    }

    try {
      const result = await this.wallet.autoAuthenticate();
      console.log('Auto-auth result:', result);
      return result;
    } catch (error) {
      console.error('Auto-authenticate failed:', error);
      return { authenticated: false, needsPasskey: true };
    }
  }

  /**
   * v2.9.0 Get Authentication State
   * Returns wallet state and suggested button text
   */
  async getAuthState(): Promise<AuthState> {
    if (!this.wallet) {
      return {
        hasWallet: false,
        isUnlocked: false,
        suggestedAction: 'register',
        suggestedButtonText: 'Create Passkey & Sign In',
      };
    }

    try {
      const state = await this.wallet.getAuthState();
      return {
        hasWallet: state.hasWallet ?? false,
        isUnlocked: state.isUnlocked ?? false,
        walletSecret: state.walletSecret,
        suggestedAction: state.suggestedAction || (state.hasWallet ? 'unlock' : 'register'),
        suggestedButtonText: state.suggestedButtonText || 
          (state.hasWallet ? 'Unlock Wallet & Sign In' : 'Create Passkey & Sign In'),
      };
    } catch (error) {
      console.error('Get auth state failed:', error);
      return {
        hasWallet: false,
        isUnlocked: false,
        suggestedAction: 'register',
        suggestedButtonText: 'Create Passkey & Sign In',
      };
    }
  }

  /**
   * Register or use passkey to get wallet secret
   */
  async registerPasskey(): Promise<{ walletSecret?: string; success: boolean }> {
    if (!this.wallet) {
      throw new Error('Wallet not initialized');
    }

    try {
      const result = await this.wallet.registerPasskey();
      const walletSecret = result?.walletSecret || await this.wallet.getWalletSecret();
      return { walletSecret, success: true };
    } catch (error) {
      console.error('Register passkey failed:', error);
      throw error;
    }
  }

  /**
   * Unlock existing wallet with passkey
   */
  async unlockWallet(): Promise<{ walletSecret?: string; success: boolean }> {
    if (!this.wallet) {
      throw new Error('Wallet not initialized');
    }

    try {
      await this.wallet.unlock();
      const walletSecret = await this.wallet.getWalletSecret();
      return { walletSecret, success: true };
    } catch (error) {
      console.error('Unlock wallet failed:', error);
      throw error;
    }
  }

  /**
   * Get wallet secret (after authenticated)
   */
  async getWalletSecret(): Promise<string | null> {
    if (!this.wallet) return null;
    try {
      return await this.wallet.getWalletSecret();
    } catch {
      return null;
    }
  }

  /**
   * Sign in using wallet secret - issues credential from Lemma API
   */
  async signInWithWalletSecret(walletSecret: string): Promise<LemmaUser | null> {
    if (!this.config) {
      throw new Error('Lemma not initialized');
    }

    try {
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
      console.log('Credential issue response:', data);
      
      if (data.success && data.permission_lemma) {
        // Store credential in wallet if available
        if (this.wallet?.storeCredential) {
          await this.wallet.storeCredential(data.permission_lemma);
        }
        
        return {
          ppid: data.ppid,
          siteId: this.config.siteId,
          walletSecret,
          permissions: data.permissions || [],
          credential: data.permission_lemma,
        };
      }
      
      // Return basic user even without full credential
      if (data.ppid) {
        return {
          ppid: data.ppid,
          siteId: this.config.siteId,
          walletSecret,
          permissions: data.permissions || [],
          credential: null,
        };
      }
      
      return null;
    } catch (error) {
      console.error('Sign in with wallet secret failed:', error);
      throw error;
    }
  }

  /**
   * Legacy sign in method (uses new v2.9.0 methods internally)
   */
  async signIn(): Promise<LemmaUser | null> {
    if (!this.wallet || !this.config) {
      throw new Error('Lemma not initialized');
    }

    try {
      // First try auto-authenticate
      const autoResult = await this.autoAuthenticate();
      
      if (autoResult.authenticated && autoResult.walletSecret) {
        return await this.signInWithWalletSecret(autoResult.walletSecret);
      }

      // Need passkey interaction
      const state = await this.getAuthState();
      let walletSecret: string | undefined;

      if (state.hasWallet) {
        // Unlock existing wallet
        const unlockResult = await this.unlockWallet();
        walletSecret = unlockResult.walletSecret;
      } else {
        // Register new passkey
        const regResult = await this.registerPasskey();
        walletSecret = regResult.walletSecret;
      }

      if (!walletSecret) {
        walletSecret = await this.getWalletSecret() || undefined;
      }

      if (!walletSecret) {
        throw new Error('Failed to get wallet secret');
      }

      return await this.signInWithWalletSecret(walletSecret);
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
      const authCheck = this.wallet.isAuthenticated?.();
      if (authCheck === false) {
        return false;
      }
      
      const cred = await this.wallet.getCredential?.('permission', this.config.siteId);
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
      const cred = await this.wallet.getCredential?.('permission', this.config.siteId);
      if (!cred) return null;

      const walletSecret = await this.getWalletSecret();

      return {
        ppid: cred.ppid || cred.subject_did,
        siteId: this.config.siteId,
        walletSecret: walletSecret || '',
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
      const cred = await this.wallet.getCredential?.('permission', this.config.siteId);
      
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
   * Get wallet info (legacy method)
   */
  async getWalletInfo(): Promise<{ hasPasskey: boolean; isLocked: boolean } | null> {
    if (!this.wallet) return null;
    try {
      const info = await this.wallet.getWalletInfo?.();
      if (info) return info;
      
      // Fallback to getAuthState
      const state = await this.getAuthState();
      return {
        hasPasskey: state.hasWallet,
        isLocked: !state.isUnlocked,
      };
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
