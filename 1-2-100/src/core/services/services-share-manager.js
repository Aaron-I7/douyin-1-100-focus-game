/**
 * ShareManager - 分享管理器
 * 
 * 职责：
 * - 封装抖音分享 API (tt.shareAppMessage())
 * - 生成分享内容（基于游戏成绩）
 * - 跟踪分享事件（集成数据分析）
 * 
 * 验证需求: 12.1, 12.2, 12.3, 12.4, 12.5
 */

class ShareManager {
  /**
   * 创建 ShareManager 实例
   * @param {Object} analyticsManager - 数据分析管理器（可选）
   */
  constructor(analyticsManager = null) {
    this.analyticsManager = analyticsManager;
    this.shareCount = 0;
    this.lastShareTime = 0;
    this.shareHistory = [];
  }

  /**
   * 分享游戏成绩
   * @param {Object} scoreData - 成绩数据
   * @param {number} scoreData.level - 关卡（1, 2, 或 'custom'）
   * @param {number} scoreData.time - 完成时间（秒）
   * @param {number} scoreData.errors - 错误次数
   * @returns {Promise<boolean>} - 分享是否成功
   * 
   * 验证需求: 12.2
   */
  async shareScore(scoreData) {
    try {
      const content = this.generateShareContent(scoreData);
      
      if (typeof tt === 'undefined' || !tt.shareAppMessage) {
        if (typeof tt !== 'undefined' && tt.showToast) {
          tt.showToast({
            title: '当前环境不支持分享功能',
            icon: 'none'
          });
        }
        return {
          success: false,
          reason: 'api_not_available'
        };
      }

      return new Promise((resolve) => {
        try {
          tt.shareAppMessage({
            title: content.title,
            desc: '测试你的专注力和视觉搜索能力！',
            imageUrl: content.imageUrl,
            success: () => {
              this.trackShare(scoreData);
              resolve({
                success: true,
                platform: 'douyin'
              });
            },
            fail: (error) => {
              this.trackShareFail(scoreData, error);
              resolve({
                success: false,
                error: error && error.errMsg ? error.errMsg : 'share_failed'
              });
            }
          });
        } catch (error) {
          resolve({
            success: false,
            error: error.message || 'share_exception'
          });
        }
      });
    } catch (error) {
      return {
        success: false,
        error: error.message || 'share_error'
      };
    }
  }

  /**
   * 生成分享内容
   * @param {Object} scoreData - 成绩数据
   * @param {number} scoreData.time - 完成时间（秒）
   * @param {number} scoreData.errors - 错误次数（可选）
   * @returns {Object} - 分享内容 { title, imageUrl }
   * 
   * 格式: "我在 1-100 专注力挑战中用时 XX:XX，你能超越我吗？"
   * 验证需求: 12.3, 12.4
   */
  generateShareContent(scoreData) {
    const totalSeconds = Math.max(0, Math.floor(scoreData.time || 0));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const timeStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    let title = `我在 1-100 专注力挑战中用时 ${timeStr}，你能超越我吗？`;
    if (scoreData.level === 'level1') {
      title = scoreData.errors === 0
        ? `我在 1-10 专注力挑战中用时 ${timeStr}，零失误完成！你能超越我吗？`
        : `我在 1-10 专注力挑战中用时 ${timeStr}，你能超越我吗？`;
    } else if (scoreData.level === 'level2') {
      title = `我在 1-100 专注力挑战中用时 ${timeStr}，你能超越我吗？`;
    } else if (scoreData.level === 'custom_10_60') {
      title = `我在 1-10 限时挑战中用时 ${timeStr}，你能超越我吗？`;
    } else if (scoreData.level === 'custom_100_free') {
      title = `我在 1-100 自由挑战中用时 ${timeStr}，你能超越我吗？`;
    }
    
    return {
      title: title,
      imageUrl: ''
    };
  }

  /**
   * 跟踪分享事件
   * @param {Object} scoreData - 成绩数据
   * @param {number} scoreData.level - 关卡
   * @param {number} scoreData.time - 完成时间
   * @param {number} scoreData.errors - 错误次数
   * 
   * 验证需求: 12.5
   */
  trackShare(scoreData) {
    this.shareCount++;
    this.lastShareTime = Date.now();
    this.shareHistory.push({
      level: scoreData.level,
      time: scoreData.time,
      errors: scoreData.errors,
      timestamp: this.lastShareTime,
      success: true
    });
    if (this.analyticsManager && typeof this.analyticsManager.trackEvent === 'function') {
      this.analyticsManager.trackEvent('share_success', {
        level: scoreData.level,
        time: scoreData.time,
        errors: scoreData.errors,
        platform: 'douyin'
      });
      this.analyticsManager.trackEvent('share_success', {
        level: scoreData.level,
        time: scoreData.time,
        errors: scoreData.errors,
        platform: 'douyin',
        shareMethod: 'result_screen'
      });
    }
  }

  trackShareFail(scoreData, error) {
    if (this.analyticsManager && typeof this.analyticsManager.trackEvent === 'function') {
      const errMsg = error && error.errMsg ? error.errMsg : 'share_failed';
      this.analyticsManager.trackEvent('share_fail', {
        level: scoreData.level,
        error: errMsg.includes('cancel') ? 'cancel' : errMsg,
        reason: errMsg.includes('cancel') ? 'user_cancel' : 'other'
      });
    }
  }

  getShareCount() {
    return this.shareCount;
  }

  getLastShareTime() {
    return this.lastShareTime;
  }

  getShareHistory() {
    return [...this.shareHistory];
  }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ShareManager;
}
