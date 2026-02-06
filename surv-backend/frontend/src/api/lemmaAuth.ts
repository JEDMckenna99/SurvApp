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

    // If returning from redirect, wait for SDK to finish processing
    if (this.isRedirectReturn()) {
      console.log('[Surv] Detected redirect return - waiting for SDK to process...');
      await this.waitForRedirectProcessing();
      console.log('[Surv] Redirect processing complete');
    }
  }

  /**
   * Check if we're returning from a lemma.id redirect
   */
  private isRedirectReturn(): boolean {
    // Check referrer
    if (document.referrer.includes('lemma.id')) {
      console.log('[Surv] Detected redirect return via referrer');
      return true;
    }
    
    // Check sessionStorage flag (set before redirect)
    if (sessionStorage.getItem('lemma_redirect_pending')) {
      console.log('[Surv] Detected redirect return via session flag');
      sessionStorage.removeItem('lemma_redirect_pending');
      return true;
    }
    
    return false;
  }

  /**
   * Mark that we're about to redirect to Lemma
   */
  markRedirectPending(): void {
    sessionStorage.setItem('lemma_redirect_pending', 'true');
  }

  /**
   * Wait for the SDK to finish processing the redirect return
   * Uses a simple delay instead of polling to avoid spamming the console
   */
  private async waitForRedirectProcessing(): Promise<void> {
    // Give the SDK time to process the redirect (it does this asynchronously)
    // The SDK logs show it takes about 50-200ms to process
    console.log('[Surv] Waiting for SDK to process redirect...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('[Surv] Wait complete, checking auth state...');
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
   * Unlock existing wallet with passkey - uses redirect flow
   */
  async unlockWallet(): Promise<{ walletSecret?: string; success: boolean }> {
    if (!this.wallet) {
      throw new Error('Wallet not initialized');
    }

    try {
      // Try smart unlock with redirect - this is the recommended approach
      console.log('[Surv] Attempting smart unlock with redirect...');
      // Mark that we're redirecting so we know when we come back
      this.markRedirectPending();
      await this.wallet.smartUnlock({
        returnUrl: window.location.href
      });
      // If we get here without redirect, try to get the wallet secret
      const walletSecret = await this.wallet.getWalletSecret();
      return { walletSecret, success: true };
    } catch (error) {
      console.error('[Surv] Unlock wallet failed:', error);
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
   * Get authenticated PPID using the SDK's local cryptographic derivation
   * NO network call to lemma.id - PPID is derived client-side
   */
  async getAuthenticatedPPID(): Promise<{ authenticated: boolean; ppid?: string }> {
    if (!this.wallet) {
      return { authenticated: false };
    }

    try {
      const result = await this.wallet.getAuthenticatedPPID();
      console.log('getAuthenticatedPPID result:', result);
      return result;
    } catch (error) {
      console.error('getAuthenticatedPPID failed:', error);
      return { authenticated: false };
    }
  }

  /**
   * Unlock wallet with redirect flow (sends user to lemma.id/unlock, then back)
   */
  async unlockWithRedirect(): Promise<void> {
    if (!this.wallet) {
      throw new Error('Wallet not initialized');
    }

    try {
      console.log('[Surv] Starting redirect unlock flow...');
      // Mark that we're redirecting so we know when we come back
      this.markRedirectPending();
      await this.wallet.unlockWithRedirect({
        returnUrl: window.location.href
      });
      // Note: This will redirect the page, so code after this won't execute
    } catch (error) {
      console.error('[Surv] unlockWithRedirect failed:', error);
      throw error;
    }
  }

  /**
   * Smart unlock - convenience wrapper that handles the redirect flow
   */
  async smartUnlock(): Promise<void> {
    if (!this.wallet) {
      throw new Error('Wallet not initialized');
    }

    try {
      console.log('[Surv] Starting smart unlock flow...');
      // Mark that we're redirecting so we know when we come back
      this.markRedirectPending();
      await this.wallet.smartUnlock({
        returnUrl: window.location.href
      });
      // Note: This may redirect the page
    } catch (error) {
      console.error('[Surv] smartUnlock failed:', error);
      throw error;
    }
  }

  /**
   * Sign in with Lemma - the correct way
   * Uses getAuthenticatedPPID() for local PPID derivation (no network call to lemma.id)
   * Returns the PPID to send to YOUR backend
   */
  async signInWithLemma(): Promise<{ 
    authenticated: boolean; 
    ppid?: string; 
    needsSetup?: boolean;
  }> {
    if (!this.wallet) {
      throw new Error('Lemma not initialized');
    }

    try {
      const result = await this.wallet.getAuthenticatedPPID();
      console.log('signInWithLemma - getAuthenticatedPPID result:', result);
      
      if (!result.authenticated) {
        // Wallet not unlocked - may need passkey creation after device link
        if (result.needsPasskey) {
          // User needs to create a passkey
          return { authenticated: false, needsSetup: true };
        }
        return { authenticated: false };
      }
      
      // Return the PPID to send to YOUR backend
      return { 
        authenticated: true, 
        ppid: result.ppid 
      };
    } catch (error) {
      console.error('signInWithLemma failed:', error);
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

  /**
   * Check if the session is still valid (wallet not locked remotely)
   */
  async isSessionValid(): Promise<boolean> {
    if (!this.wallet) return false;
    try {
      const isValid = await this.wallet.isSessionValid?.();
      return isValid ?? true; // Assume valid if method not available
    } catch {
      return false;
    }
  }

  /**
   * Register callback for session expiry (remote wallet lock)
   * Returns cleanup function to remove the listener
   */
  onSessionExpired(callback: (event?: any) => void): () => void {
    if (!this.wallet) {
      console.warn('Cannot register session expiry handler - wallet not initialized');
      return () => {};
    }

    try {
      this.wallet.onSessionExpired?.(callback);
      console.log('Session expiry handler registered');
      
      // Return cleanup function
      return () => {
        // Stop heartbeat if running
        if (this.wallet?._heartbeatInterval) {
          clearInterval(this.wallet._heartbeatInterval);
          console.log('Heartbeat interval cleared');
        }
      };
    } catch (error) {
      console.error('Failed to register session expiry handler:', error);
      return () => {};
    }
  }

  /**
   * Get the raw wallet instance (for advanced use cases)
   */
  getWallet(): any {
    return this.wallet;
  }

  /**
   * Get link device HTML for users who want to link an existing wallet from another device
   * Returns null if user is already signed in or linking isn't available
   */
  async getLinkDeviceHtml(options?: {
    text?: string;
    linkText?: string;
    className?: string;
  }): Promise<string | null> {
    if (!this.wallet) {
      console.warn('Cannot get link device HTML - wallet not initialized');
      return null;
    }

    try {
      const linkHtml = await this.wallet.getLinkDeviceHtml?.(options);
      return linkHtml || null;
    } catch (error) {
      console.error('Failed to get link device HTML:', error);
      return null;
    }
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
