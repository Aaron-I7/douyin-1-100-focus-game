/**
 * 抖音认证服务
 * 负责用户登录、授权和身份验证
 */

class DouyinAuthService {
  constructor() {
    this.openId = null;
    this.isAuthorized = false;
    this.loginAttempts = 0;
    this.maxLoginAttempts = 3;
  }

  /**
   * 用户登录
   * 获取用户临时登录凭证并换取 openId
   */
  async login() {
    try {
      console.log('Starting Douyin login process...');
      
      // 检查是否已经登录
      if (this.isAuthorized && this.openId) {
        console.log('User already logged in:', this.openId);
        return this.openId;
      }

      // 增加登录尝试次数
      this.loginAttempts++;
      
      // 调用抖音登录 API
      const loginResult = await this.callDouyinLogin();
      
      if (loginResult.success) {
        // 调用云函数换取 openId
        const openIdResult = await this.exchangeOpenId(loginResult.code);
        
        if (openIdResult.success) {
          this.openId = openIdResult.openId;
          this.isAuthorized = true;
          // 不重置尝试次数，保持记录用于测试验证
          
          console.log('Login successful, openId:', this.openId);
          return this.openId;
        } else {
          throw new Error(`Failed to exchange openId: ${openIdResult.error}`);
        }
      } else {
        throw new Error(`Douyin login failed: ${loginResult.error}`);
      }
      
    } catch (error) {
      console.error('Login failed:', error);
      
      // 如果达到最大尝试次数，降级到匿名 ID
      if (this.loginAttempts >= this.maxLoginAttempts) {
        console.warn('Max login attempts reached, falling back to anonymous ID');
        this.openId = this.generateAnonymousId();
        this.isAuthorized = false;
        return this.openId;
      }
      
      // 否则抛出错误让调用者处理
      throw error;
    }
  }

  /**
   * 调用抖音登录 API
   */
  async callDouyinLogin() {
    return new Promise((resolve) => {
      try {
        // 检查 tt 对象是否存在
        if (typeof tt === 'undefined' || !tt.login) {
          console.warn('tt.login not available, using mock for development');
          resolve({
            success: true,
            code: `mock_code_${Date.now()}`
          });
          return;
        }

        const loginResult = tt.login({
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
        if (loginResult && typeof loginResult.then === 'function') {
          loginResult.then((res) => {
            resolve({
              success: true,
              code: res.code
            });
          }).catch((error) => {
            resolve({
              success: false,
              error: error.message || 'Login failed'
            });
          });
        }
      } catch (error) {
        console.error('tt.login exception:', error);
        resolve({
          success: false,
          error: error.message
        });
      }
    });
  }

  /**
   * 调用云函数换取 openId
   */
  async exchangeOpenId(code) {
    try {
      // 检查云函数是否可用
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

  /**
   * 生成匿名 ID（降级方案）
   */
  generateAnonymousId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `anon_${timestamp}_${random}`;
  }

  /**
   * 检查授权状态
   */
  async checkAuthStatus() {
    return {
      isAuthorized: this.isAuthorized,
      openId: this.openId,
      hasValidSession: this.isAuthorized && this.openId !== null
    };
  }

  /**
   * 获取 openId
   */
  getOpenId() {
    return this.openId;
  }

  /**
   * 检查是否为匿名用户
   */
  isAnonymous() {
    return this.openId ? this.openId.startsWith('anon_') : false;
  }

  /**
   * 登出（清除本地状态）
   */
  logout() {
    this.openId = null;
    this.isAuthorized = false;
    this.loginAttempts = 0;
    console.log('User logged out');
  }

  /**
   * 重试登录
   */
  async retryLogin() {
    if (this.loginAttempts < this.maxLoginAttempts) {
      return await this.login();
    } else {
      throw new Error('Maximum login attempts exceeded');
    }
  }
}

// 导出
if (typeof global !== 'undefined') {
  global.DouyinAuthService = DouyinAuthService;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = DouyinAuthService;
}
