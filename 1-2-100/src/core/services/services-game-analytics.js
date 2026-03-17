/**
 * GameAnalytics - 游戏事件分析
 * 封装游戏相关的数据分析事件上报
 * 
 * 功能：
 * - 游戏开始事件
 * - 游戏完成事件
 * - 游戏失败事件
 * - 错误点击事件
 * - 关卡过渡事件
 */

const { getAnalyticsManager } = require('./services-analytics-manager');

class GameAnalytics {
  constructor() {
    this.analyticsManager = getAnalyticsManager();
    this.currentGameSession = null;
  }
  
  /**
   * 跟踪游戏开始事件
   * @param {Object} gameConfig - 游戏配置
   */
  trackGameStart(gameConfig) {
    const {
      level,           // 1 | 2 | 'custom'
      customMode,      // '10' | '100' | null
      difficulty,      // 0 | 60 | 120 | 180 (时间限制秒数)
      totalNumbers     // 10 | 100
    } = gameConfig;
    
    // 创建游戏会话
    this.currentGameSession = {
      sessionId: this.generateGameSessionId(),
      startTime: Date.now(),
      level,
      customMode,
      difficulty,
      totalNumbers
    };
    
    const eventData = {
      gameSessionId: this.currentGameSession.sessionId,
      level: level,
      levelType: this.getLevelType(level, customMode),
      timeLimit: difficulty,
      totalNumbers: totalNumbers,
      isCustomMode: level === 'custom',
      difficultyName: this.getDifficultyName(difficulty),
      deviceInfo: this.getDeviceInfo()
    };
    
    this.analyticsManager.trackEvent('game_start', eventData);
    
    console.log('Game start tracked:', eventData);
  }
  
  /**
   * 跟踪游戏完成事件
   * @param {Object} gameResult - 游戏结果
   */
  trackGameComplete(gameResult) {
    if (!this.currentGameSession) {
      console.warn('No active game session for completion tracking');
      return;
    }
    
    const {
      completionTime,  // 完成时间（秒）
      errors,          // 错误次数
      isNewRecord      // 是否新纪录
    } = gameResult;
    
    const sessionDuration = Date.now() - this.currentGameSession.startTime;
    
    const eventData = {
      gameSessionId: this.currentGameSession.sessionId,
      level: this.currentGameSession.level,
      levelType: this.getLevelType(this.currentGameSession.level, this.currentGameSession.customMode),
      timeLimit: this.currentGameSession.difficulty,
      totalNumbers: this.currentGameSession.totalNumbers,
      completionTime: completionTime,
      errors: errors,
      isNewRecord: isNewRecord,
      sessionDuration: Math.round(sessionDuration / 1000),
      accuracy: this.calculateAccuracy(this.currentGameSession.totalNumbers, errors),
      performance: this.calculatePerformance(completionTime, errors, this.currentGameSession.totalNumbers)
    };
    
    this.analyticsManager.trackEvent('game_complete', eventData, true); // 立即上报
    
    console.log('Game completion tracked:', eventData);
    
    // 清理会话
    this.currentGameSession = null;
  }
  
  /**
   * 跟踪游戏失败事件
   * @param {Object} failureInfo - 失败信息
   */
  trackGameFailure(failureInfo) {
    if (!this.currentGameSession) {
      console.warn('No active game session for failure tracking');
      return;
    }
    
    const {
      reason,          // 'timeout' | 'user_quit' | 'error'
      progress,        // 当前进度 (1-totalNumbers)
      errors,          // 错误次数
      timeSpent        // 已用时间（秒）
    } = failureInfo;
    
    const sessionDuration = Date.now() - this.currentGameSession.startTime;
    
    const eventData = {
      gameSessionId: this.currentGameSession.sessionId,
      level: this.currentGameSession.level,
      levelType: this.getLevelType(this.currentGameSession.level, this.currentGameSession.customMode),
      timeLimit: this.currentGameSession.difficulty,
      totalNumbers: this.currentGameSession.totalNumbers,
      failureReason: reason,
      progress: progress,
      progressPercentage: Math.round((progress / this.currentGameSession.totalNumbers) * 100),
      errors: errors,
      timeSpent: timeSpent,
      sessionDuration: Math.round(sessionDuration / 1000)
    };
    
    this.analyticsManager.trackEvent('game_failure', eventData, true); // 立即上报
    
    console.log('Game failure tracked:', eventData);
    
    // 清理会话
    this.currentGameSession = null;
  }
  
  /**
   * 跟踪错误点击事件
   * @param {Object} clickInfo - 点击信息
   */
  trackErrorClick(clickInfo) {
    if (!this.currentGameSession) {
      return;
    }
    
    const {
      targetNumber,    // 目标数字
      clickedNumber,   // 点击的数字
      currentProgress, // 当前进度
      timeElapsed     // 已用时间（秒）
    } = clickInfo;
    
    const eventData = {
      gameSessionId: this.currentGameSession.sessionId,
      level: this.currentGameSession.level,
      targetNumber: targetNumber,
      clickedNumber: clickedNumber,
      currentProgress: currentProgress,
      timeElapsed: timeElapsed,
      errorType: this.getErrorType(targetNumber, clickedNumber)
    };
    
    // 错误点击不立即上报，等待批量上报
    this.analyticsManager.trackEvent('error_click', eventData);
  }
  
  /**
   * 跟踪关卡过渡事件
   * @param {Object} transitionInfo - 过渡信息
   */
  trackLevelTransition(transitionInfo) {
    const {
      fromLevel,       // 来源关卡
      toLevel,         // 目标关卡
      completionTime,  // 完成时间
      errors          // 错误次数
    } = transitionInfo;
    
    const eventData = {
      fromLevel: fromLevel,
      toLevel: toLevel,
      completionTime: completionTime,
      errors: errors,
      transitionType: 'level_progression'
    };
    
    this.analyticsManager.trackEvent('level_transition', eventData);
    
    console.log('Level transition tracked:', eventData);
  }
  
  /**
   * 跟踪自选模式解锁事件
   */
  trackCustomModeUnlock() {
    const eventData = {
      unlockTime: Date.now(),
      unlockCondition: 'level2_completed'
    };
    
    this.analyticsManager.trackEvent('custom_mode_unlock', eventData, true);
    
    console.log('Custom mode unlock tracked:', eventData);
  }
  
  /**
   * 获取关卡类型描述
   */
  getLevelType(level, customMode) {
    if (level === 'custom') {
      return customMode === '10' ? 'custom_practice' : 'custom_challenge';
    }
    return `level_${level}`;
  }
  
  /**
   * 获取难度名称
   */
  getDifficultyName(difficulty) {
    switch (difficulty) {
      case 0: return 'free_mode';
      case 60: return '1_minute';
      case 120: return '2_minutes';
      case 180: return '3_minutes';
      default: return 'unknown';
    }
  }
  
  /**
   * 计算准确率
   */
  calculateAccuracy(totalNumbers, errors) {
    const totalClicks = totalNumbers + errors;
    return totalClicks > 0 ? Math.round((totalNumbers / totalClicks) * 100) : 100;
  }
  
  /**
   * 计算性能评分
   */
  calculatePerformance(completionTime, errors, totalNumbers) {
    // 基础分数
    let score = 100;
    
    // 时间惩罚（每秒扣0.5分）
    score -= completionTime * 0.5;
    
    // 错误惩罚（每个错误扣5分）
    score -= errors * 5;
    
    // 数字数量奖励
    score += totalNumbers * 0.1;
    
    return Math.max(0, Math.round(score));
  }
  
  /**
   * 获取错误类型
   */
  getErrorType(targetNumber, clickedNumber) {
    const diff = Math.abs(targetNumber - clickedNumber);
    
    if (diff === 1) {
      return 'adjacent_number';
    } else if (diff <= 5) {
      return 'nearby_number';
    } else if (diff <= 10) {
      return 'close_number';
    } else {
      return 'distant_number';
    }
  }
  
  /**
   * 获取设备信息
   */
  getDeviceInfo() {
    try {
      if (typeof tt !== 'undefined') {
        const systemInfo = tt.getSystemInfoSync();
        return {
          platform: systemInfo.platform,
          screenWidth: systemInfo.windowWidth,
          screenHeight: systemInfo.windowHeight,
          pixelRatio: systemInfo.pixelRatio
        };
      }
    } catch (error) {
      console.error('Failed to get device info:', error);
    }
    
    return {
      platform: 'unknown',
      screenWidth: 0,
      screenHeight: 0,
      pixelRatio: 1
    };
  }
  
  /**
   * 生成游戏会话ID
   */
  generateGameSessionId() {
    return `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * 获取当前游戏会话
   */
  getCurrentGameSession() {
    return this.currentGameSession;
  }
}

// 导出单例实例
let gameAnalyticsInstance = null;

function getGameAnalytics() {
  if (!gameAnalyticsInstance) {
    gameAnalyticsInstance = new GameAnalytics();
  }
  return gameAnalyticsInstance;
}

module.exports = {
  GameAnalytics,
  getGameAnalytics
};