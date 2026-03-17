/**
 * AnimationIntegration - 动画集成管理器
 * 将各种动画效果集成到游戏流程中，提供统一的动画接口
 */
class AnimationIntegration {
  constructor() {
    this.animationEngine = null;
    this.floatingTextManager = null;
    this.particleEffectsManager = null;
    this.rippleEffectsManager = null;
    this.bounceEffectsManager = null;
    
    // 性能监控
    this.performanceMonitor = {
      frameCount: 0,
      lastFrameTime: 0,
      averageFPS: 60,
      animationCount: 0
    };
    
    // 动画开关（用于性能优化）
    this.animationSettings = {
      enabled: true,
      particlesEnabled: true,
      ripplesEnabled: true,
      bouncesEnabled: true,
      floatingTextEnabled: true,
      maxAnimations: 50,
      reducedMotion: false
    };
  }

  /**
   * 初始化动画系统
   * @param {Object} options - 初始化选项
   */
  initialize(options = {}) {
    const {
      maxAnimations = 50,
      reducedMotion = false
    } = options;

    // 创建动画引擎
    this.animationEngine = new AnimationEngine();
    this.animationEngine.setMaxAnimations(maxAnimations);
    
    // 创建各种动画管理器
    this.floatingTextManager = new FloatingTextManager(this.animationEngine);
    this.particleEffectsManager = new ParticleEffectsManager(this.animationEngine);
    this.rippleEffectsManager = new RippleEffectsManager(this.animationEngine);
    this.bounceEffectsManager = new BounceEffectsManager(this.animationEngine);
    
    // 应用设置
    this.animationSettings.maxAnimations = maxAnimations;
    this.animationSettings.reducedMotion = reducedMotion;
    
    // 如果启用了减少动画模式，调整设置
    if (reducedMotion) {
      this.enableReducedMotion();
    }
  }

  /**
   * 更新动画系统
   * @param {CanvasRenderingContext2D} ctx - Canvas 上下文
   * @param {number} deltaTime - 时间差
   */
  update(ctx, deltaTime = 16) {
    if (!this.animationSettings.enabled || !this.animationEngine) {
      return;
    }

    // 更新性能监控
    this.updatePerformanceMonitor(deltaTime);
    
    // 根据性能自动调整动画质量
    this.autoAdjustQuality();
    
    // 更新动画引擎
    this.animationEngine.update(ctx);
    
    // 更新动画计数
    this.performanceMonitor.animationCount = this.animationEngine.getAnimationCount();
  }

  /**
   * 处理游戏事件的动画效果
   * @param {string} eventType - 事件类型
   * @param {Object} eventData - 事件数据
   */
  handleGameEvent(eventType, eventData) {
    if (!this.animationSettings.enabled) {
      return;
    }

    switch (eventType) {
      case 'cellClick':
        this.handleCellClick(eventData);
        break;
      case 'buttonClick':
        this.handleButtonClick(eventData);
        break;
      case 'levelComplete':
        this.handleLevelComplete(eventData);
        break;
      case 'gameComplete':
        this.handleGameComplete(eventData);
        break;
      case 'error':
        this.handleError(eventData);
        break;
      case 'combo':
        this.handleCombo(eventData);
        break;
      case 'timeBonus':
        this.handleTimeBonus(eventData);
        break;
      case 'unlock':
        this.handleUnlock(eventData);
        break;
      case 'targetHint':
        this.handleTargetHint(eventData);
        break;
    }
  }

  /**
   * 处理 Cell 点击动画
   * @param {Object} data - 点击数据
   */
  handleCellClick(data) {
    const { x, y, isCorrect, number, cellSize } = data;
    
    if (isCorrect) {
      // 正确点击动画组合
      if (this.animationSettings.floatingTextEnabled) {
        this.floatingTextManager.showSuccess(x, y, number);
      }
      
      if (this.animationSettings.particlesEnabled) {
        this.particleEffectsManager.playCorrectClick(x, y);
      }
      
      if (this.animationSettings.ripplesEnabled) {
        this.rippleEffectsManager.playCellClick(x, y, true);
      }
      
      if (this.animationSettings.bouncesEnabled) {
        this.bounceEffectsManager.playCellClick(x, y, cellSize, true);
      }
    } else {
      // 错误点击动画组合
      if (this.animationSettings.floatingTextEnabled) {
        this.floatingTextManager.showError(x, y);
      }
      
      if (this.animationSettings.particlesEnabled) {
        this.particleEffectsManager.playErrorClick(x, y);
      }
      
      if (this.animationSettings.ripplesEnabled) {
        this.rippleEffectsManager.playCellClick(x, y, false);
      }
      
      if (this.animationSettings.bouncesEnabled) {
        this.bounceEffectsManager.playCellClick(x, y, cellSize, false);
      }
    }
  }

  /**
   * 处理按钮点击动画
   * @param {Object} data - 按钮数据
   */
  handleButtonClick(data) {
    const { x, y, size, type = 'default' } = data;
    
    if (this.animationSettings.ripplesEnabled) {
      this.rippleEffectsManager.playButtonClick(x, y);
    }
    
    if (this.animationSettings.bouncesEnabled) {
      this.bounceEffectsManager.playButtonPress(x, y, size);
      
      // 延迟播放释放动画
      setTimeout(() => {
        this.bounceEffectsManager.playButtonRelease(x, y, size);
      }, 100);
    }
  }

  /**
   * 处理关卡完成动画
   * @param {Object} data - 关卡数据
   */
  handleLevelComplete(data) {
    const { x, y, level } = data;
    
    if (this.animationSettings.floatingTextEnabled) {
      this.floatingTextManager.showLevelComplete(x, y, `第${level}关完成!`);
    }
    
    if (this.animationSettings.particlesEnabled) {
      this.particleEffectsManager.playLevelComplete(x, y);
    }
    
    if (this.animationSettings.ripplesEnabled) {
      this.rippleEffectsManager.playLevelComplete(x, y);
    }
    
    if (this.animationSettings.bouncesEnabled) {
      this.bounceEffectsManager.playLevelComplete(x, y, 50);
    }
  }

  /**
   * 处理游戏完成动画
   * @param {Object} data - 游戏数据
   */
  handleGameComplete(data) {
    const { x, y, time, errors } = data;
    
    // 播放烟花效果
    if (this.animationSettings.particlesEnabled) {
      this.particleEffectsManager.playFireworks(x, y, {
        burstCount: 5,
        particlesPerBurst: 20
      });
    }
    
    // 显示完成信息
    if (this.animationSettings.floatingTextEnabled) {
      this.floatingTextManager.showMultiLine(x, y, [
        '恭喜完成!',
        `用时: ${time}`,
        `错误: ${errors}次`
      ], {
        color: '#4CAF50',
        size: 20,
        duration: 2000
      });
    }
    
    // 播放多层波纹
    if (this.animationSettings.ripplesEnabled) {
      this.rippleEffectsManager.playMultiLayer(x, y, {
        layers: 5,
        baseRadius: 80,
        baseColor: '#4CAF50'
      });
    }
  }

  /**
   * 处理错误动画
   * @param {Object} data - 错误数据
   */
  handleError(data) {
    const { x, y, message = '错误!' } = data;
    
    if (this.animationSettings.floatingTextEnabled) {
      this.floatingTextManager.showError(x, y, message);
    }
  }

  /**
   * 处理连击动画
   * @param {Object} data - 连击数据
   */
  handleCombo(data) {
    const { x, y, combo } = data;
    
    if (this.animationSettings.floatingTextEnabled) {
      this.floatingTextManager.showCombo(x, y, combo);
    }
    
    if (this.animationSettings.particlesEnabled) {
      this.particleEffectsManager.playCombo(x, y, combo);
    }
  }

  /**
   * 处理时间奖励动画
   * @param {Object} data - 时间奖励数据
   */
  handleTimeBonus(data) {
    const { x, y, seconds } = data;
    
    if (this.animationSettings.floatingTextEnabled) {
      this.floatingTextManager.showTimeBonus(x, y, seconds);
    }
    
    if (this.animationSettings.particlesEnabled) {
      this.particleEffectsManager.playTimeBonus(x, y);
    }
  }

  /**
   * 处理解锁动画
   * @param {Object} data - 解锁数据
   */
  handleUnlock(data) {
    const { x, y, feature } = data;
    
    if (this.animationSettings.floatingTextEnabled) {
      this.floatingTextManager.showCustom(x, y, `解锁: ${feature}`, {
        color: '#9C27B0',
        size: 22,
        duration: 1500
      });
    }
    
    if (this.animationSettings.particlesEnabled) {
      this.particleEffectsManager.playUnlock(x, y);
    }
    
    if (this.animationSettings.ripplesEnabled) {
      this.rippleEffectsManager.playUnlock(x, y);
    }
  }

  /**
   * 处理目标提示动画
   * @param {Object} data - 提示数据
   */
  handleTargetHint(data) {
    const { x, y, show = true } = data;
    
    if (show && this.animationSettings.ripplesEnabled) {
      this.rippleEffectsManager.playTargetPulse(x, y);
    } else {
      this.rippleEffectsManager.stopTargetPulse(x, y);
    }
  }

  /**
   * 更新性能监控
   * @param {number} deltaTime - 时间差
   */
  updatePerformanceMonitor(deltaTime) {
    this.performanceMonitor.frameCount++;
    this.performanceMonitor.lastFrameTime = deltaTime;
    
    // 每60帧计算一次平均FPS
    if (this.performanceMonitor.frameCount % 60 === 0) {
      this.performanceMonitor.averageFPS = 1000 / deltaTime;
    }
  }

  /**
   * 根据性能自动调整动画质量
   */
  autoAdjustQuality() {
    const { averageFPS, animationCount } = this.performanceMonitor;
    
    // 如果FPS低于45或动画数量过多，降低质量
    if (averageFPS < 45 || animationCount > this.animationSettings.maxAnimations * 0.8) {
      this.reduceAnimationQuality();
    } else if (averageFPS > 55 && animationCount < this.animationSettings.maxAnimations * 0.3) {
      this.restoreAnimationQuality();
    }
  }

  /**
   * 降低动画质量
   */
  reduceAnimationQuality() {
    // 减少粒子数量
    if (this.particleEffectsManager) {
      Object.keys(this.particleEffectsManager.presets).forEach(key => {
        const preset = this.particleEffectsManager.presets[key];
        preset.count = Math.max(1, Math.floor(preset.count * 0.7));
      });
    }
    
    // 减少动画持续时间
    this.animationEngine.setMaxAnimations(Math.floor(this.animationSettings.maxAnimations * 0.6));
  }

  /**
   * 恢复动画质量
   */
  restoreAnimationQuality() {
    // 恢复原始设置
    this.animationEngine.setMaxAnimations(this.animationSettings.maxAnimations);
  }

  /**
   * 启用减少动画模式
   */
  enableReducedMotion() {
    this.animationSettings.reducedMotion = true;
    this.animationSettings.particlesEnabled = false;
    this.animationSettings.bouncesEnabled = false;
    this.animationSettings.maxAnimations = 20;
    
    if (this.animationEngine) {
      this.animationEngine.setMaxAnimations(20);
    }
  }

  /**
   * 禁用减少动画模式
   */
  disableReducedMotion() {
    this.animationSettings.reducedMotion = false;
    this.animationSettings.particlesEnabled = true;
    this.animationSettings.bouncesEnabled = true;
    this.animationSettings.maxAnimations = 50;
    
    if (this.animationEngine) {
      this.animationEngine.setMaxAnimations(50);
    }
  }

  /**
   * 设置动画开关
   * @param {Object} settings - 设置对象
   */
  setAnimationSettings(settings) {
    this.animationSettings = { ...this.animationSettings, ...settings };
  }

  /**
   * 获取性能信息
   * @returns {Object} 性能信息
   */
  getPerformanceInfo() {
    return {
      ...this.performanceMonitor,
      settings: this.animationSettings
    };
  }

  /**
   * 清除所有动画
   */
  clearAllAnimations() {
    if (this.animationEngine) {
      this.animationEngine.clearAll();
    }
  }

  /**
   * 暂停动画
   */
  pauseAnimations() {
    this.animationSettings.enabled = false;
  }

  /**
   * 恢复动画
   */
  resumeAnimations() {
    this.animationSettings.enabled = true;
  }

  /**
   * 销毁动画系统
   */
  destroy() {
    this.clearAllAnimations();
    this.animationEngine = null;
    this.floatingTextManager = null;
    this.particleEffectsManager = null;
    this.rippleEffectsManager = null;
    this.bounceEffectsManager = null;
  }
}

// 导出类
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AnimationIntegration;
} else if (typeof window !== 'undefined') {
  window.AnimationIntegration = AnimationIntegration;
}