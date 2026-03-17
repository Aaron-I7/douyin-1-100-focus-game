/**
 * BounceEffectsManager - 弹跳动画效果管理器
 * 专门处理游戏中的各种弹跳和缩放动画效果
 */
class BounceEffectsManager {
  constructor(animationEngine) {
    this.animationEngine = animationEngine;
    
    // 预设的弹跳效果配置
    this.presets = {
      // 按钮按下弹跳
      buttonPress: {
        maxScale: 0.95,
        duration: 150,
        bounceType: 'simple',
        color: '#4ECDC4'
      },
      
      // 按钮释放弹跳
      buttonRelease: {
        maxScale: 1.1,
        duration: 200,
        bounceType: 'elastic',
        color: '#4ECDC4'
      },
      
      // Cell 点击弹跳
      cellClick: {
        maxScale: 1.2,
        duration: 300,
        bounceType: 'elastic',
        color: '#4CAF50'
      },
      
      // 错误点击弹跳
      errorClick: {
        maxScale: 0.8,
        duration: 200,
        bounceType: 'simple',
        color: '#EF5350'
      },
      
      // 目标数字强调弹跳
      targetHighlight: {
        maxScale: 1.3,
        duration: 400,
        bounceType: 'elastic',
        color: '#FFE66D'
      },
      
      // 关卡完成弹跳
      levelComplete: {
        maxScale: 1.5,
        duration: 600,
        bounceType: 'elastic',
        color: '#4CAF50'
      }
    };
  }

  /**
   * 播放按钮按下弹跳效果
   * @param {number} x - 中心X坐标
   * @param {number} y - 中心Y坐标
   * @param {number} size - 元素大小
   * @param {Object} customOptions - 自定义选项
   */
  playButtonPress(x, y, size, customOptions = {}) {
    const preset = { ...this.presets.buttonPress, ...customOptions };
    this.animationEngine.addBounceEffect(x, y, size, preset);
  }

  /**
   * 播放按钮释放弹跳效果
   * @param {number} x - 中心X坐标
   * @param {number} y - 中心Y坐标
   * @param {number} size - 元素大小
   * @param {Object} customOptions - 自定义选项
   */
  playButtonRelease(x, y, size, customOptions = {}) {
    const preset = { ...this.presets.buttonRelease, ...customOptions };
    this.animationEngine.addBounceEffect(x, y, size, preset);
  }

  /**
   * 播放 Cell 点击弹跳效果
   * @param {number} x - 中心X坐标
   * @param {number} y - 中心Y坐标
   * @param {number} size - Cell 大小
   * @param {boolean} isCorrect - 是否正确点击
   */
  playCellClick(x, y, size, isCorrect = true) {
    const preset = isCorrect ? this.presets.cellClick : this.presets.errorClick;
    this.animationEngine.addBounceEffect(x, y, size, preset);
  }

  /**
   * 播放目标数字强调弹跳
   * @param {number} x - 中心X坐标
   * @param {number} y - 中心Y坐标
   * @param {number} size - 数字大小
   */
  playTargetHighlight(x, y, size) {
    const preset = this.presets.targetHighlight;
    this.animationEngine.addBounceEffect(x, y, size, preset);
  }

  /**
   * 播放关卡完成弹跳效果
   * @param {number} x - 中心X坐标
   * @param {number} y - 中心Y坐标
   * @param {number} size - 元素大小
   */
  playLevelComplete(x, y, size) {
    const preset = this.presets.levelComplete;
    this.animationEngine.addBounceEffect(x, y, size, preset);
    
    // 添加延迟的第二次弹跳
    setTimeout(() => {
      this.animationEngine.addBounceEffect(x, y, size, {
        ...preset,
        maxScale: 1.2,
        duration: 400
      });
    }, 300);
  }

  /**
   * 播放连续弹跳效果
   * @param {number} x - 中心X坐标
   * @param {number} y - 中心Y坐标
   * @param {number} size - 元素大小
   * @param {Object} options - 选项
   */
  playContinuousBounce(x, y, size, options = {}) {
    const {
      bounceCount = 3,
      maxScale = 1.2,
      duration = 300,
      delay = 200,
      bounceType = 'elastic',
      color = '#4ECDC4'
    } = options;

    for (let i = 0; i < bounceCount; i++) {
      setTimeout(() => {
        const scale = maxScale - (i * 0.1); // 每次弹跳稍微小一点
        this.animationEngine.addBounceEffect(x, y, size, {
          maxScale: scale,
          duration: duration - (i * 20),
          bounceType,
          color
        });
      }, i * delay);
    }
  }

  /**
   * 播放摇摆弹跳效果
   * @param {number} x - 中心X坐标
   * @param {number} y - 中心Y坐标
   * @param {number} size - 元素大小
   * @param {Object} options - 选项
   */
  playWiggleBounce(x, y, size, options = {}) {
    const {
      wiggleAmount = 10,
      bounceScale = 1.1,
      duration = 500,
      color = '#FF6B6B'
    } = options;

    // 添加摇摆弹跳动画
    this.animationEngine.addAnimation({
      type: 'wiggleBounce',
      x,
      y,
      size,
      wiggleAmount,
      bounceScale,
      color,
      duration,
      startTime: Date.now(),
      frequency: 8 // 摇摆频率
    });
  }

  /**
   * 播放脉冲弹跳效果
   * @param {number} x - 中心X坐标
   * @param {number} y - 中心Y坐标
   * @param {number} size - 元素大小
   * @param {Object} options - 选项
   */
  playPulseBounce(x, y, size, options = {}) {
    const {
      minScale = 0.9,
      maxScale = 1.1,
      duration = 800,
      color = '#FFE66D',
      repeat = true
    } = options;

    // 添加脉冲弹跳动画
    this.animationEngine.addAnimation({
      type: 'pulseBounce',
      x,
      y,
      size,
      minScale,
      maxScale,
      color,
      duration,
      repeat,
      startTime: Date.now()
    });
  }

  /**
   * 播放橡皮球弹跳效果
   * @param {number} x - 起始X坐标
   * @param {number} y - 起始Y坐标
   * @param {number} size - 球的大小
   * @param {Object} options - 选项
   */
  playRubberBallBounce(x, y, size, options = {}) {
    const {
      bounceHeight = 100,
      bounceCount = 3,
      gravity = 500,
      damping = 0.7,
      color = '#4ECDC4',
      duration = 2000
    } = options;

    // 添加橡皮球弹跳动画
    this.animationEngine.addAnimation({
      type: 'rubberBallBounce',
      x,
      y,
      size,
      bounceHeight,
      bounceCount,
      gravity,
      damping,
      color,
      duration,
      startTime: Date.now(),
      currentBounce: 0,
      velocity: 0,
      groundY: y
    });
  }

  /**
   * 播放弹簧弹跳效果
   * @param {number} x - 中心X坐标
   * @param {number} y - 中心Y坐标
   * @param {number} size - 元素大小
   * @param {Object} options - 选项
   */
  playSpringBounce(x, y, size, options = {}) {
    const {
      amplitude = 1.5,
      frequency = 4,
      damping = 0.8,
      duration = 1000,
      color = '#95E1D3'
    } = options;

    // 添加弹簧弹跳动画
    this.animationEngine.addAnimation({
      type: 'springBounce',
      x,
      y,
      size,
      amplitude,
      frequency,
      damping,
      color,
      duration,
      startTime: Date.now()
    });
  }

  /**
   * 播放果冻弹跳效果
   * @param {number} x - 中心X坐标
   * @param {number} y - 中心Y坐标
   * @param {number} size - 元素大小
   * @param {Object} options - 选项
   */
  playJellyBounce(x, y, size, options = {}) {
    const {
      squashAmount = 0.3,
      stretchAmount = 0.2,
      duration = 400,
      color = '#F38BA8'
    } = options;

    // 添加果冻弹跳动画
    this.animationEngine.addAnimation({
      type: 'jellyBounce',
      x,
      y,
      size,
      squashAmount,
      stretchAmount,
      color,
      duration,
      startTime: Date.now()
    });
  }

  /**
   * 播放自定义弹跳效果
   * @param {number} x - 中心X坐标
   * @param {number} y - 中心Y坐标
   * @param {number} size - 元素大小
   * @param {Object} options - 自定义选项
   */
  playCustom(x, y, size, options = {}) {
    const defaultOptions = {
      maxScale: 1.2,
      duration: 300,
      bounceType: 'elastic',
      color: '#4ECDC4'
    };
    
    const finalOptions = { ...defaultOptions, ...options };
    this.animationEngine.addBounceEffect(x, y, size, finalOptions);
  }

  /**
   * 停止指定位置的弹跳效果
   * @param {number} x - X坐标
   * @param {number} y - Y坐标
   * @param {number} tolerance - 容差范围
   */
  stopBounceAt(x, y, tolerance = 10) {
    this.animationEngine.animations = this.animationEngine.animations.filter(animation => {
      if (animation.type.includes('bounce') || animation.type.includes('Bounce')) {
        const distance = Math.sqrt(
          Math.pow(animation.x - x, 2) + Math.pow(animation.y - y, 2)
        );
        return distance > tolerance;
      }
      return true;
    });
  }

  /**
   * 更新预设效果
   * @param {string} presetName - 预设名称
   * @param {Object} options - 选项
   */
  updatePreset(presetName, options) {
    if (this.presets[presetName]) {
      this.presets[presetName] = { ...this.presets[presetName], ...options };
    }
  }

  /**
   * 添加新的预设效果
   * @param {string} name - 预设名称
   * @param {Object} options - 选项
   */
  addPreset(name, options) {
    this.presets[name] = options;
  }

  /**
   * 获取预设效果
   * @param {string} name - 预设名称
   * @returns {Object|null}
   */
  getPreset(name) {
    return this.presets[name] || null;
  }

  /**
   * 清除所有弹跳效果
   */
  clearAll() {
    this.animationEngine.animations = this.animationEngine.animations.filter(animation => {
      return !animation.type.includes('bounce') && !animation.type.includes('Bounce');
    });
  }
}

// 导出类
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BounceEffectsManager;
} else if (typeof window !== 'undefined') {
  window.BounceEffectsManager = BounceEffectsManager;
}