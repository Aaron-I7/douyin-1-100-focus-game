class DouyinAuthService {
  constructor() {
    this.openId = null;
    this.isAuthorized = false;
    this.loginAttempts = 0;
    this.maxLoginAttempts = 3;
    this.authorizationDenied = false;
    this.needsAuthorization = false;
  }

  needsAuthorizationGuidance() {
    return this.needsAuthorization && !this.authorizationDenied && !this.isAuthorized;
  }

  async userAuthorized() {
    this.authorizationDenied = false;
    this.needsAuthorization = false;
    try {
      return await this.performLogin();
    } catch (error) {
      console.error('Authorization login failed:', error);
      throw error;
    }
  }

  userDeniedAuthorization() {
    this.authorizationDenied = true;
    this.needsAuthorization = false;
    this.isAuthorized = false;
    this.openId = this.generateAnonymousId();
    console.log('User denied authorization, using anonymous ID:', this.openId);
    return this.openId;
  }

  async login() {
    try {
      console.log('Starting Douyin login process...');
      if (this.isAuthorized && this.openId) {
        console.log('User already logged in:', this.openId);
        return this.openId;
      }
      if (this.authorizationDenied) {
        console.log('User previously denied authorization, using anonymous ID');
        return this.openId;
      }
      this.loginAttempts++;
      return await this.performLogin();
    } catch (error) {
      console.error('Login failed:', error);
      if (this.loginAttempts >= this.maxLoginAttempts) {
        console.warn('Max login attempts reached, showing authorization guidance');
        this.needsAuthorization = true;
        throw new Error('NEEDS_AUTHORIZATION');
      }
      throw error;
    }
  }

  async performLogin() {
    const loginResult = await this.callDouyinLogin();
    if (loginResult.success) {
      const openIdResult = await this.exchangeOpenId(loginResult.code);
      if (openIdResult.success) {
        this.openId = openIdResult.openId;
        this.isAuthorized = true;
        this.loginAttempts = 0;
        console.log('Login successful, openId:', this.openId);
        return this.openId;
      } else {
        throw new Error(`Failed to exchange openId: ${openIdResult.error}`);
      }
    } else {
      throw new Error(`Douyin login failed: ${loginResult.error}`);
    }
  }

  async callDouyinLogin() {
    return new Promise((resolve) => {
      try {
        if (typeof tt === 'undefined' || !tt.login) {
          console.warn('tt.login not available, using mock for development');
          resolve({
            success: true,
            code: `mock_code_${Date.now()}`
          });
          return;
        }
        tt.login({
          success: (res) => {
            console.log('tt.login success:', res);
            resolve({
              success: true,
              code: res.code
            });
          },
          fail: (err) => {
            console.error('tt.login failed:', err);
            resolve({
              success: false,
              error: err.errMsg || 'Login failed'
            });
          }
        });
      } catch (error) {
        console.error('tt.login exception:', error);
        resolve({
          success: false,
          error: error.message
        });
      }
    });
  }

  async exchangeOpenId(code) {
    try {
      if (typeof tt === 'undefined' || !tt.cloud || !tt.cloud.callFunction) {
        console.warn('tt.cloud not available, using mock openId');
        return {
          success: true,
          openId: `mock_openid_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        };
      }
      const result = await tt.cloud.callFunction({
        name: 'get_open_id',
        data: { code }
      });
      if (result.result && result.result.openId) {
        return {
          success: true,
          openId: result.result.openId
        };
      } else {
        return {
          success: false,
          error: result.result?.error || 'Failed to get openId'
        };
      }
    } catch (error) {
      console.error('Cloud function call failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  generateAnonymousId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `anon_${timestamp}_${random}`;
  }

  async checkAuthStatus() {
    return {
      isAuthorized: this.isAuthorized,
      openId: this.openId,
      hasValidSession: this.isAuthorized && this.openId !== null
    };
  }

  getOpenId() {
    return this.openId;
  }

  isAnonymous() {
    return this.openId && this.openId.startsWith('anon_');
  }
}

module.exports = DouyinAuthService;
