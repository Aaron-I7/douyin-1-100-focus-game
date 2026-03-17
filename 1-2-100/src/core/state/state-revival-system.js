/**
 * RevivalSystem - 复活系统
 * 
 * 功能：
 * - 在限时模式失败时显示"观看广告复活"选项
 * - 调用 AdManager 播放激励视频广告
 * - 观看完成后增加 30 秒游戏时间
 * - 限制每局最多 1 次复活
 */

class RevivalSystem {
  constructor(adManager, gameManager) {
    this.adManager = adManager;
    this.gameManager = gameManager;
    this.isRevivalActive = false;
    this.revivalTimeBonus = 30; // 复活增加的时间（秒）
  }
  
  /**
   * 检查是否可以显示复活选项
   * @param {Object} gameState - 游戏状态
   * @returns {boolean} 是否可以复活
   */
  canShowRevival(gameState) {
    // 只有在限时模式下才能复活
    if (gameState.difficulty === 0) {
      return false; // 自由模式不支持复活
    }
    
    // 检查游戏是否因为超时而失败
    if (gameState.state !== 'failed' || gameState.failReason !== 'timeout') {
      return false;
    }
    
    // 检查广告是否可用
    const adAvailability = this.adManager.checkAdAvailability('revival');
    return adAvailability.available;
  }
  
  /**
   * 显示复活界面
   * @param {Object} gameState - 游戏状态
   * @param {Function} onRevive - 复活成功回调
   * @param {Function} onDecline - 拒绝复活回调
   */
  showRevivalDialog(gameState, onRevive, onDecline) {
    if (!this.canShowRevival(gameState)) {
      if (onDecline) onDecline('不满足复活条件');
      return;
    }
    
    // 创建复活对话框数据
    const revivalData = {
      type: 'revival',
      title: '游戏失败',
      message: '时间到了！观看广告可以复活并获得30秒额外时间',
      buttons: [
        {
          text: '观看广告复活',
          type: 'primary',
          action: () => this.startRevival(onRevive, onDecline)
        },
        {
          text: '结束游戏',
          type: 'secondary',
          action: () => {
            if (onDecline) onDecline('用户选择结束游戏');
          }
        }
      ],
      remainingUses: this.adManager.getRemainingUses('revival'),
      timeBonus: this.revivalTimeBonus
    };
    
    // 通知游戏管理器显示复活界面
    if (this.gameManager && this.gameManager.showDialog) {
      this.gameManager.showDialog(revivalData);
    }
  }
  
  /**
   * 开始复活流程
   * @param {Function} onRevive - 复活成功回调
   * @param {Function} onDecline - 复活失败回调
   */
  async startRevival(onRevive, onDecline) {
    if (this.isRevivalActive) {
      console.warn('Revival already in progress');
      return;
    }
    
    this.isRevivalActive = true;
    
    try {
      // 显示激励视频广告
      const success = await this.adManager.showRewardedAd(
        'revival',
        () => this.handleRevivalSuccess(onRevive),
        (reason) => this.handleRevivalFail(reason, onDecline)
      );
      
      if (!success) {
        this.isRevivalActive = false;
        if (onDecline) onDecline('广告播放失败');
      }
      
    } catch (error) {
      console.error('Revival failed:', error);
      this.isRevivalActive = false;
      if (onDecline) onDecline('复活过程出错');
    }
  }
  
  /**
   * 处理复活成功
   * @param {Function} onRevive - 复活成功回调
   */
  handleRevivalSuccess(onRevive) {
    console.log('Revival successful, adding time bonus');
    
    this.isRevivalActive = false;
    
    // 创建复活结果数据
    const revivalResult = {
      success: true,
      timeBonus: this.revivalTimeBonus,
      message: `复活成功！获得${this.revivalTimeBonus}秒额外时间`
    };
    
    // 调用复活成功回调
    if (onRevive) {
      onRevive(revivalResult);
    }
    
    // 记录复活事件（用于数据分析）
    this.trackRevivalEvent('success', {
      timeBonus: this.revivalTimeBonus,
      remainingUses: this.adManager.getRemainingUses('revival')
    });
  }
  
  /**
   * 处理复活失败
   * @param {string} reason - 失败原因
   * @param {Function} onDecline - 复活失败回调
   */
  handleRevivalFail(reason, onDecline) {
    console.log('Revival failed:', reason);
    
    this.isRevivalActive = false;
    
    // 创建失败结果数据
    const failResult = {
      success: false,
      reason: reason,
      message: `复活失败：${reason}`
    };
    
    // 调用复活失败回调
    if (onDecline) {
      onDecline(failResult);
    }
    
    // 记录复活事件（用于数据分析）
    this.trackRevivalEvent('failed', {
      reason: reason,
      remainingUses: this.adManager.getRemainingUses('revival')
    });
  }
  
  /**
   * 应用复活效果到游戏状态
   * @param {Object} gameState - 游戏状态
   * @returns {Object} 更新后的游戏状态
   */
  applyRevivalEffect(gameState) {
    const newGameState = { ...gameState };
    
    // 增加游戏时间
    newGameState.timeLeft = this.revivalTimeBonus;
    newGameState.elapsedTime = newGameState.elapsedTime || 0;
    
    // 重置游戏状态为进行中
    newGameState.state = 'playing';
    newGameState.failReason = null;
    
    // 标记已使用复活
    newGameState.revivalUsed = true;
    
    console.log(`Revival applied: added ${this.revivalTimeBonus} seconds`);
    
    return newGameState;
  }
  
  /**
   * 获取复活状态信息
   * @returns {Object} 复活状态
   */
  getRevivalStatus() {
    return {
      isRevivalActive: this.isRevivalActive,
      timeBonus: this.revivalTimeBonus,
      remainingUses: this.adManager.getRemainingUses('revival'),
      adAvailable: this.adManager.checkAdAvailability('revival').available
    };
  }
  
  /**
   * 记录复活事件（用于数据分析）
   * @param {string} eventType - 事件类型
   * @param {Object} eventData - 事件数据
   */
  trackRevivalEvent(eventType, eventData) {
    try {
      // 如果有分析管理器，记录事件
      if (this.gameManager && this.gameManager.analyticsManager) {
        this.gameManager.analyticsManager.trackEvent('revival', {
          type: eventType,
          ...eventData,
          timestamp: Date.now()
        });
      }
    } catch (error) {
      console.error('Failed to track revival event:', error);
    }
  }
  
  /**
   * 重置复活系统（新游戏开始时调用）
   */
  reset() {
    this.isRevivalActive = false;
    console.log('Revival system reset');
  }
}

// 导出 RevivalSystem 类
if (typeof module !== 'undefined' && module.exports) {
  module.exports = RevivalSystem;
} else if (typeof window !== 'undefined') {
  window.RevivalSystem = RevivalSystem;
}