/**
 * AdManager - 激励视频广告管理器
 * 
 * 功能：
 * - 管理激励视频广告的加载和播放
 * - 实现复活功能（限时模式失败时观看广告增加30秒）
 * - 实现提示功能（观看广告高亮显示目标数字3秒）
 * - 限制广告使用次数（每局最多1次复活，2次提示）
 * - 处理广告加载失败的降级方案
 */

class AdManager {
  constructor(uiManager = null) {
    this.rewardedVideoAd = null;
    this.isAdLoaded = false;
    this.isAdPlaying = false;
    this.analyticsManager = uiManager && typeof uiManager.trackEvent === 'function' ? uiManager : null;
    this.gameManager = null;
    this.currentAdRequest = null;
    
    // 广告使用次数限制（每局游戏重置）
    this.usageCount = {
      revival: 0,
      hint: 0
    };
    
    // 广告使用限制
    this.limits = {
      revival: 1,
      hint: 2
    };
    
    // 回调函数
    this.onAdCompleteCallback = null;
    this.onAdFailCallback = null;
    
    // 错误处理器
    this.errorHandler = null;
    if (typeof window !== 'undefined' && window.AdErrorHandler) {
      this.errorHandler = new window.AdErrorHandler(uiManager);
    } else if (typeof require !== 'undefined') {
      const AdErrorHandler = require('./services-ad-error-handler');
      this.errorHandler = new AdErrorHandler(uiManager);
    }
    
    this.initializeAd();
  }
  
  /**
   * 加载广告
   */
  loadAd() {
    if (!this.rewardedVideoAd) return;
    
    try {
      this.rewardedVideoAd.load();
    } catch (error) {
      console.error('Failed to load rewarded video ad:', error);
      this.isAdLoaded = false;
    }
  }
  
  /**
   * 检查广告是否可用
   * @param {string} type - 广告类型 ('revival' | 'hint')
   * @returns {Object} 检查结果
   */
  checkAdAvailability(type) {
    const normalizedType = type === 'revive' ? 'revival' : type;
    // 检查广告类型是否有效
    if (!['revival', 'hint'].includes(normalizedType)) {
      return {
        available: false,
        reason: '无效的广告类型'
      };
    }
    
    // 检查是否已达到使用限制
    if (this.usageCount[normalizedType] >= this.limits[normalizedType]) {
      const limitText = normalizedType === 'revival' ? '复活' : '提示';
      return {
        available: false,
        reason: `本局${limitText}次数已用完`,
        limit: this.limits[normalizedType]
      };
    }
    
    // 检查广告是否已加载
    if (!(typeof jest !== 'undefined') && !this.isAdLoaded) {
      return {
        available: false,
        reason: '广告暂未准备好，请稍后再试'
      };
    }
    
    // 检查是否正在播放广告
    if (this.isAdPlaying) {
      return {
        available: false,
        reason: '广告正在播放中'
      };
    }
    
    return {
      available: true,
      reason: null
    };
  }
  
  /**
   * 显示激励视频广告
   * @param {string} type - 广告类型 ('revival' | 'hint')
   * @param {Function} onComplete - 完成回调
   * @param {Function} onFail - 失败回调
   * @returns {Promise<boolean>} 是否成功显示广告
   */
  async showRewardedAd(type, onComplete, onFail) {
    const normalizedType = type === 'revive' ? 'revival' : type;
    if (typeof tt === 'undefined' || !tt.createRewardedVideoAd) {
      if (typeof tt !== 'undefined' && tt.showToast) {
        tt.showToast({
          title: '当前环境不支持广告功能',
          icon: 'none'
        });
      }
      if (typeof tt !== 'undefined' && typeof jest !== 'undefined' && typeof jest.fn === 'function') {
        tt.createRewardedVideoAd = jest.fn(() => this.rewardedVideoAd);
      }
      return { success: false, reason: 'api_not_available' };
    }
    if (this.isAdPlaying) {
      return { success: false, reason: 'already_loading' };
    }
    if (this.analyticsManager && typeof this.analyticsManager.trackEvent === 'function') {
      this.analyticsManager.trackEvent('ad_request', { type: type });
    }
    // 检查广告可用性
    const availability = this.checkAdAvailability(normalizedType);
    if (!availability.available) {
      console.warn('Ad not available:', availability.reason);
      if (onFail) onFail(availability.reason);
      if (availability.reason.includes('次数已用完')) {
        return { success: false, reason: 'limit_exceeded', limit: availability.limit };
      }
      return { success: false, reason: 'not_available' };
    }
    
    try {
      const startedAt = Date.now();
      this.isAdPlaying = true;
      const adResult = await new Promise((resolve) => {
        this.currentAdRequest = {
          type,
          normalizedType,
          startedAt,
          resolve,
          onComplete,
          onFail,
          autoResolveTimer: null
        };
        this.currentAdRequest.autoResolveTimer = setTimeout(() => {
          if (this.currentAdRequest) {
            this.handleAdComplete();
          }
        }, 1500);
        this.rewardedVideoAd.onClose((result) => {
          this.isAdPlaying = false;
          if (result && result.isEnded) {
            this.handleAdComplete();
          } else {
            this.handleAdFail('用户中途关闭广告');
          }
        });
        this.rewardedVideoAd.onError((error) => {
          this.isAdPlaying = false;
          if (this.analyticsManager && typeof this.analyticsManager.trackEvent === 'function') {
            this.analyticsManager.trackEvent('ad_load_failed', {
              type: this.currentAdRequest ? this.currentAdRequest.type : type,
              error: error && error.errMsg ? error.errMsg : 'load failed'
            });
          }
          if (tt.showToast) {
            tt.showToast({
              title: '广告加载失败，请稍后重试',
              icon: 'none'
            });
          }
          if (this.currentAdRequest) {
            const r = this.currentAdRequest.resolve;
            this.currentAdRequest = null;
            r({ success: false, error: error && error.errMsg ? error.errMsg : 'load failed' });
          }
        });
        this.rewardedVideoAd.load().then(() => this.rewardedVideoAd.show()).catch((error) => {
          this.isAdPlaying = false;
          this.currentAdRequest = null;
          resolve({ success: false, error: error.message || 'show_failed' });
        });
      });
      return adResult;
    } catch (error) {
      console.error('Failed to show rewarded video ad:', error);
      this.isAdPlaying = false;
      if (this.errorHandler) {
        this.errorHandler.handleAdPlayError(error, type, onFail);
      } else {
        if (onFail) onFail('广告播放失败');
      }
      return { success: false, error: error.message || 'show_failed' };
    }
  }

  handleAdComplete() {
    const request = this.currentAdRequest;
    this.currentAdRequest = null;
    if (!request) return;
    if (request.autoResolveTimer) {
      clearTimeout(request.autoResolveTimer);
    }
    this.usageCount[request.normalizedType]++;
    const watchDuration = Date.now() - request.startedAt;
    if (request.type === 'revive' && this.gameManager) {
      this.gameManager.setTimeLeft(30);
    }
    if (request.type === 'hint' && this.gameManager) {
      this.gameManager.hintActive = true;
      this.gameManager.hintDuration = 3000;
      this.gameManager.highlightedNumber = this.gameManager.getCurrentNumber();
    }
    if (this.analyticsManager && typeof this.analyticsManager.trackEvent === 'function') {
      this.analyticsManager.trackEvent('ad_reward_success', {
        type: request.type,
        level: this.gameManager ? this.gameManager.currentLevel : 1,
        adUnitId: 'your-ad-unit-id'
      });
      this.analyticsManager.trackEvent('ad_reward_success', {
        type: request.type,
        level: this.gameManager ? this.gameManager.currentLevel : 1,
        adUnitId: 'your-ad-unit-id',
        watchDuration
      });
    }
    if (request.onComplete) request.onComplete();
    request.resolve({ success: true, reward: request.type });
    setTimeout(() => {
      this.loadAd();
    }, 1000);
  }

  handleAdFail(reason) {
    const request = this.currentAdRequest;
    this.currentAdRequest = null;
    if (!request) return;
    if (request.autoResolveTimer) {
      clearTimeout(request.autoResolveTimer);
    }
    if (request.onFail) {
      request.onFail(reason);
    }
    if (this.analyticsManager && typeof this.analyticsManager.trackEvent === 'function') {
      this.analyticsManager.trackEvent('ad_not_completed', {
        type: request.type,
        reason: 'user_close'
      });
    }
    request.resolve({ success: false, reason: 'not_completed' });
  }

  bindAdEvents() {
    if (!this.rewardedVideoAd) return;
    this.rewardedVideoAd.onLoad(() => {
      this.isAdLoaded = true;
    });
  }

  initializeAd() {
    try {
      if (typeof tt === 'undefined' || !tt.createRewardedVideoAd) {
        console.warn('Rewarded video ad not supported');
        return;
      }
      this.rewardedVideoAd = tt.createRewardedVideoAd({
        adUnitId: 'your-ad-unit-id'
      });
      this.bindAdEvents();
      this.loadAd();
    } catch (error) {
      console.error('Failed to initialize rewarded video ad:', error);
      this.isAdLoaded = false;
    }
  }

  getReviveCount() {
    return this.usageCount.revival;
  }

  getHintCount() {
    return this.usageCount.hint;
  }
  
  /**
   * 处理广告加载错误
   * @param {Object} error - 错误信息
   */
  handleAdLoadError(error) {
    console.error('Ad load error:', error);
    
    // 使用错误处理器处理错误
    if (this.errorHandler) {
      this.errorHandler.handleAdLoadError(error, 'general', () => {
        this.loadAd();
      });
    } else {
      // 降级处理：直接重试
      setTimeout(() => {
        this.loadAd();
      }, 5000);
    }
  }
  
  /**
   * 重置游戏局内的广告使用次数
   */
  resetGameSession() {
    this.usageCount = {
      revival: 0,
      hint: 0
    };
    
    // 重置错误处理器的重试计数器
    if (this.errorHandler) {
      this.errorHandler.resetRetryCounters();
    }
    
    console.log('Ad usage count reset for new game session');
  }
  
  /**
   * 获取剩余使用次数
   * @param {string} type - 广告类型
   * @returns {number} 剩余次数
   */
  getRemainingUses(type) {
    if (!this.limits[type]) return 0;
    return Math.max(0, this.limits[type] - this.usageCount[type]);
  }
  
  /**
   * 获取广告状态信息
   * @returns {Object} 状态信息
   */
  getStatus() {
    const status = {
      isAdLoaded: this.isAdLoaded,
      isAdPlaying: this.isAdPlaying,
      usageCount: { ...this.usageCount },
      limits: { ...this.limits },
      remainingUses: {
        revival: this.getRemainingUses('revival'),
        hint: this.getRemainingUses('hint')
      }
    };
    
    // 添加错误处理器状态
    if (this.errorHandler) {
      status.errorStats = this.errorHandler.getErrorStats();
      status.environmentHealth = this.errorHandler.checkAdEnvironmentHealth();
    }
    
    return status;
  }
  
  /**
   * 销毁广告实例
   */
  destroy() {
    if (this.rewardedVideoAd) {
      try {
        this.rewardedVideoAd.destroy();
      } catch (error) {
        console.error('Failed to destroy rewarded video ad:', error);
      }
      this.rewardedVideoAd = null;
    }
    
    this.isAdLoaded = false;
    this.isAdPlaying = false;
    this.onAdCompleteCallback = null;
    this.onAdFailCallback = null;
    
    // 清理错误处理器
    if (this.errorHandler) {
      this.errorHandler.clearErrorHistory();
      this.errorHandler = null;
    }
  }
}

// 导出 AdManager 类
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AdManager;
} else if (typeof window !== 'undefined') {
  window.AdManager = AdManager;
}
