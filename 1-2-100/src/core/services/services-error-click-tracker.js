/**
 * ErrorClickTracker - 错误点击数据跟踪器
 * 负责累计错误点击数据并定期批量上报
 * 
 * 功能：
 * - 累计错误点击数据
 * - 定期批量上报（每10个事件或30秒）
 * - 错误模式分析
 * - 热点区域统计
 */

const { getAnalyticsManager } = require('./services-analytics-manager');

class ErrorClickTracker {
  constructor() {
    this.analyticsManager = getAnalyticsManager();
    this.errorClicks = [];
    this.batchSize = 10;
    this.batchTimeout = 30000; // 30秒
    this.maxStoredClicks = 100;
    
    this.batchTimer = null;
    this.startBatchTimer();
  }
  
  /**
   * 记录错误点击
   * @param {Object} clickData - 点击数据
   */
  recordErrorClick(clickData) {
    const {
      gameSessionId,
      level,
      targetNumber,
      clickedNumber,
      clickPosition,    // {x, y}
      currentProgress,
      timeElapsed,
      cellIndex
    } = clickData;
    
    const errorClick = {
      id: this.generateClickId(),
      timestamp: Date.now(),
      gameSessionId,
      level,
      targetNumber,
      clickedNumber,
      clickPosition,
      currentProgress,
      timeElapsed,
      cellIndex,
      errorType: this.classifyError(targetNumber, clickedNumber),
      progressStage: this.getProgressStage(currentProgress, level)
    };
    
    this.errorClicks.push(errorClick);
    
    // 限制存储数量
    if (this.errorClicks.length > this.maxStoredClicks) {
      this.errorClicks.shift();
    }
    
    // 检查是否需要批量上报
    if (this.errorClicks.length >= this.batchSize) {
      this.flushErrorClicks();
    }
  }
  
  /**
   * 批量上报错误点击数据
   */
  async flushErrorClicks() {
    if (this.errorClicks.length === 0) {
      return;
    }
    
    try {
      // 复制当前数据并清空
      const clicksToReport = [...this.errorClicks];
      this.errorClicks = [];
      
      // 重置定时器
      this.resetBatchTimer();
      
      // 生成批量报告
      const batchReport = this.generateBatchReport(clicksToReport);
      
      // 上报批量数据
      this.analyticsManager.trackEvent('error_click_batch', batchReport);
      
      // 上报详细数据（可选，用于深度分析）
      if (clicksToReport.length <= 5) {
        clicksToReport.forEach(click => {
          this.analyticsManager.trackEvent('error_click_detail', click);
        });
      }
      
      console.log(`Flushed ${clicksToReport.length} error clicks`);
      
    } catch (error) {
      console.error('Failed to flush error clicks:', error);
      // 失败的数据重新加入队列
      this.errorClicks.unshift(...clicksToReport);
    }
  }
  
  /**
   * 生成批量报告
   * @param {Array} clicks - 错误点击数组
   */
  generateBatchReport(clicks) {
    const report = {
      batchId: this.generateBatchId(),
      clickCount: clicks.length,
      timeRange: {
        start: Math.min(...clicks.map(c => c.timestamp)),
        end: Math.max(...clicks.map(c => c.timestamp))
      },
      errorTypes: this.analyzeErrorTypes(clicks),
      progressStages: this.analyzeProgressStages(clicks),
      hotspots: this.analyzeClickHotspots(clicks),
      patterns: this.analyzeErrorPatterns(clicks)
    };
    
    return report;
  }
  
  /**
   * 分析错误类型分布
   */
  analyzeErrorTypes(clicks) {
    const types = {};
    clicks.forEach(click => {
      types[click.errorType] = (types[click.errorType] || 0) + 1;
    });
    return types;
  }
  
  /**
   * 分析进度阶段分布
   */
  analyzeProgressStages(clicks) {
    const stages = {};
    clicks.forEach(click => {
      stages[click.progressStage] = (stages[click.progressStage] || 0) + 1;
    });
    return stages;
  }
  
  /**
   * 分析点击热点区域
   */
  analyzeClickHotspots(clicks) {
    const hotspots = {};
    clicks.forEach(click => {
      if (click.clickPosition) {
        const region = this.getScreenRegion(click.clickPosition);
        hotspots[region] = (hotspots[region] || 0) + 1;
      }
    });
    return hotspots;
  }
  
  /**
   * 分析错误模式
   */
  analyzeErrorPatterns(clicks) {
    const patterns = {
      consecutiveErrors: this.findConsecutiveErrors(clicks),
      numberConfusion: this.findNumberConfusion(clicks),
      timeBasedErrors: this.analyzeTimeBasedErrors(clicks)
    };
    return patterns;
  }
  
  /**
   * 错误分类
   */
  classifyError(targetNumber, clickedNumber) {
    const diff = Math.abs(targetNumber - clickedNumber);
    
    if (diff === 1) {
      return 'adjacent';
    } else if (diff <= 5) {
      return 'nearby';
    } else if (diff <= 10) {
      return 'close';
    } else if (this.isSimilarShape(targetNumber, clickedNumber)) {
      return 'shape_similar';
    } else {
      return 'random';
    }
  }
  
  /**
   * 获取进度阶段
   */
  getProgressStage(currentProgress, level) {
    const totalNumbers = level === 1 ? 10 : (level === 2 ? 100 : 100);
    const percentage = (currentProgress / totalNumbers) * 100;
    
    if (percentage <= 25) return 'early';
    if (percentage <= 50) return 'middle';
    if (percentage <= 75) return 'late';
    return 'final';
  }
  
  /**
   * 获取屏幕区域
   */
  getScreenRegion(position) {
    // 假设屏幕分为9个区域（3x3网格）
    const { x, y } = position;
    const screenWidth = 375; // 默认值，实际应从系统获取
    const screenHeight = 667;
    
    const regionX = Math.floor((x / screenWidth) * 3);
    const regionY = Math.floor((y / screenHeight) * 3);
    
    return `region_${regionX}_${regionY}`;
  }
  
  /**
   * 检查数字形状相似性
   */
  isSimilarShape(num1, num2) {
    const similarPairs = [
      [6, 9], [1, 7], [3, 8], [0, 8]
    ];
    
    return similarPairs.some(pair => 
      (pair[0] === num1 && pair[1] === num2) ||
      (pair[1] === num1 && pair[0] === num2)
    );
  }
  
  /**
   * 查找连续错误
   */
  findConsecutiveErrors(clicks) {
    let maxConsecutive = 0;
    let currentConsecutive = 1;
    
    for (let i = 1; i < clicks.length; i++) {
      if (clicks[i].timestamp - clicks[i-1].timestamp < 5000) { // 5秒内
        currentConsecutive++;
      } else {
        maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
        currentConsecutive = 1;
      }
    }
    
    return Math.max(maxConsecutive, currentConsecutive);
  }
  
  /**
   * 查找数字混淆模式
   */
  findNumberConfusion(clicks) {
    const confusions = {};
    clicks.forEach(click => {
      const key = `${click.targetNumber}_${click.clickedNumber}`;
      confusions[key] = (confusions[key] || 0) + 1;
    });
    
    // 返回最常见的混淆
    const sortedConfusions = Object.entries(confusions)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3);
    
    return Object.fromEntries(sortedConfusions);
  }
  
  /**
   * 分析基于时间的错误
   */
  analyzeTimeBasedErrors(clicks) {
    const timeRanges = {
      '0-30s': 0,
      '30-60s': 0,
      '60-120s': 0,
      '120s+': 0
    };
    
    clicks.forEach(click => {
      const timeElapsed = click.timeElapsed;
      if (timeElapsed <= 30) {
        timeRanges['0-30s']++;
      } else if (timeElapsed <= 60) {
        timeRanges['30-60s']++;
      } else if (timeElapsed <= 120) {
        timeRanges['60-120s']++;
      } else {
        timeRanges['120s+']++;
      }
    });
    
    return timeRanges;
  }
  
  /**
   * 启动批量上报定时器
   */
  startBatchTimer() {
    this.batchTimer = setInterval(() => {
      if (this.errorClicks.length > 0) {
        this.flushErrorClicks();
      }
    }, this.batchTimeout);
  }
  
  /**
   * 重置批量上报定时器
   */
  resetBatchTimer() {
    if (this.batchTimer) {
      clearInterval(this.batchTimer);
      this.startBatchTimer();
    }
  }
  
  /**
   * 生成点击ID
   */
  generateClickId() {
    return `click_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  }
  
  /**
   * 生成批次ID
   */
  generateBatchId() {
    return `batch_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  }
  
  /**
   * 获取统计信息
   */
  getStats() {
    return {
      pendingClicks: this.errorClicks.length,
      batchSize: this.batchSize,
      batchTimeout: this.batchTimeout
    };
  }
  
  /**
   * 清理资源
   */
  destroy() {
    if (this.batchTimer) {
      clearInterval(this.batchTimer);
      this.batchTimer = null;
    }
    
    // 最后一次上报
    this.flushErrorClicks();
  }
}

// 导出单例实例
let errorClickTrackerInstance = null;

function getErrorClickTracker() {
  if (!errorClickTrackerInstance) {
    errorClickTrackerInstance = new ErrorClickTracker();
  }
  return errorClickTrackerInstance;
}

module.exports = {
  ErrorClickTracker,
  getErrorClickTracker
};