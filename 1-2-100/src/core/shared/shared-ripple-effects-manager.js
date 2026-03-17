/**
 * RippleEffectsManager - 波纹效果管理器
 * 专门处理游戏中的各种波纹效果，包括按钮点击波纹和目标提示脉冲
 */
class RippleEffectsManager {
  constructor(animationEngine) {
    this.animationEngine = animationEngine;
    
    // 预设的波纹效果配置
    this.presets = {
      // 按钮点击波纹
      buttonClick: {
        maxRadius: 80,
        color: '#4ECDC4',
        lineWidth: 3,
        duration: 400,
        pulseCount: 1
      },
      
      // Cell 点击波纹
      cellClick: {
        maxRadius: 60,
        color: '#4CAF50',
        lineWidth: 2,
        duration: 300,
        pulseCount: 1
      },
      
      // 错误点击波纹
      errorClick: {
        maxRadius: 50,
        color: '#EF5350',
        lineWidth: 3,
        duration: 250,
        pulseCount: 2
      },
      
      // 目标数字脉冲提示
      targetPulse: {
        maxRadius: 40,
        color: '#FFE66D',
        lineWidth: 2,
        duration: 1000,
        pulseCount: 3
      },
      
      // 关卡完成波纹
      levelComplete: {
        maxRadius: 150,
        color: '#4CAF50',
        lineWidth: 4,
        duration: 800,
        pulseCount: 2
      },
      
      // 解锁效果波纹
      unlock: {
        maxRadius: 120,
        color: '#9C27B0',
        lineWidth: 3,
        duration: 600,
        pulseCount: 3
      }
    };
  }

  /**
   * 播放按钮点击波纹效果
   * @param {number} x - 中心X坐标
   * @param {number} y - 中心Y坐标
   * @param {Object} customOptions - 自定义选项
   */
  playButtonClick(x, y, customOptions = {}) {
    const preset = { ...this.presets.buttonClick, ...customOptions };
    this.animationEngine.addRippleEffect(x, y, preset.maxRadius, preset);
  }

  /**
   * 播放 Cell 点击波纹效果
   * @param {number} x - 中心X坐标
   * @param {number} y - 中心Y坐标
   * @param {boolean} isCorrect - 是否正确点击
   */
  playCellClick(x, y, isCorrect = true) {
    const preset = isCorrect ? this.presets.cellClick : this.presets.errorClick;
    this.animationEngine.addRippleEffect(x, y, preset.maxRadius, preset);
  }

  /**
   * 播放目标数字脉冲提示
   * @param {number} x - 中心X坐标
   * @param {number} y - 中心Y坐标
   * @param {Object} customOptions - 自定义选项
   */
  playTargetPulse(x, y, customOptions = {}) {
    const preset = { ...this.presets.targetPulse, ...customOptions };
    
    // 使用脉冲动画而不是普通波纹
    this.animationEngine.addPulseEffect(x, y, preset.maxRadius, {
      color: preset.color,
      lineWidth: preset.lineWidth,
      duration: preset.duration,
      repeat: true
    });
  }

  /**
   * 停止目标数字脉冲提示
   * @param {number} x - 中心X坐标
   * @param {number} y - 中心Y坐标
   */
  stopTargetPulse(x, y) {
    // 清除脉冲类型的动画
    this.animationEngine.clearByType('pulse');
  }

  /**
   * 播放关卡完成波纹效果
   * @param {number} x - 中心X坐标
   * @param {number} y - 中心Y坐标
   */
  playLevelComplete(x, y) {
    const preset = this.presets.levelComplete;
    this.animationEngine.addRippleEffect(x, y, preset.maxRadius, preset);
    
    // 添加延迟的第二层波纹
    setTimeout(() => {
      this.animationEngine.addRippleEffect(x, y, preset.maxRadius * 1.3, {
        ...preset,
        color: '#8BC34A',
        duration: preset.duration * 1.2
      });
    }, 200);
  }

  /**
   * 播放解锁效果波纹
   * @param {number} x - 中心X坐标
   * @param {number} y - 中心Y坐标
   */
  playUnlock(x, y) {
    const preset = this.presets.unlock;
    this.animationEngine.addRippleEffect(x, y, preset.maxRadius, preset);
  }

  /**
   * 播放多层波纹效果
   * @param {number} x - 中心X坐标
   * @param {number} y - 中心Y坐标
   * @param {Object} options - 选项
   */
  playMultiLayer(x, y, options = {}) {
    const {
      layers = 3,
      baseRadius = 50,
      radiusIncrement = 30,
      baseColor = '#4ECDC4',
      delay = 150,
      duration = 500
    } = options;

    for (let i = 0; i < layers; i++) {
      setTimeout(() => {
        const radius = baseRadius + i * radiusIncrement;
        const alpha = 1 - (i * 0.3);
        const color = this.adjustColorAlpha(baseColor, alpha);
        
        this.animationEngine.addRippleEffect(x, y, radius, {
          maxRadius: radius,
          color,
          lineWidth: 3 - i * 0.5,
          duration: duration + i * 100,
          pulseCount: 1
        });
      }, i * delay);
    }
  }

  /**
   * 播放震荡波纹效果
   * @param {number} x - 中心X坐标
   * @param {number} y - 中心Y坐标
   * @param {Object} options - 选项
   */
  playShockwave(x, y, options = {}) {
    const {
      maxRadius = 200,
      color = '#FF6B6B',
      lineWidth = 5,
      duration = 600,
      intensity = 3
    } = options;

    for (let i = 0; i < intensity; i++) {
      setTimeout(() => {
        this.animationEngine.addRippleEffect(x, y, maxRadius, {
          maxRadius: maxRadius - i * 20,
          color,
          lineWidth: lineWidth - i,
          duration: duration - i * 50,
          pulseCount: 1
        });
      }, i * 100);
    }
  }

  /**
   * 播放彩虹波纹效果
   * @param {number} x - 中心X坐标
   * @param {number} y - 中心Y坐标
   * @param {Object} options - 选项
   */
  playRainbow(x, y, options = {}) {
    const {
      colors = ['#FF6B6B', '#FFE66D', '#4ECDC4', '#95E1D3', '#F38BA8'],
      maxRadius = 100,
      duration = 800
    } = options;

    colors.forEach((color, index) => {
      setTimeout(() => {
        this.animationEngine.addRippleEffect(x, y, maxRadius, {
          maxRadius,
          color,
          lineWidth: 3,
          duration,
          pulseCount: 1
        });
      }, index * 100);
    });
  }

  /**
   * 播放方形波纹效果
   * @param {number} x - 中心X坐标
   * @param {number} y - 中心Y坐标
   * @param {Object} options - 选项
   */
  playSquareRipple(x, y, options = {}) {
    const {
      size = 80,
      color = '#4ECDC4',
      lineWidth = 3,
      duration = 500
    } = options;

    // 添加方形波纹动画
    this.animationEngine.addAnimation({
      type: 'squareRipple',
      x,
      y,
      maxSize: size,
      color,
      lineWidth,
      duration,
      startTime: Date.now(),
      fadeStart: 0.7
    });
  }

  /**
   * 播放心形波纹效果
   * @param {number} x - 中心X坐标
   * @param {number} y - 中心Y坐标
   * @param {Object} options - 选项
   */
  playHeartRipple(x, y, options = {}) {
    const {
      size = 60,
      color = '#FF6B9D',
      lineWidth = 3,
      duration = 800
    } = options;

    // 添加心形波纹动画
    this.animationEngine.addAnimation({
      type: 'heartRipple',
      x,
      y,
      maxSize: size,
      color,
      lineWidth,
      duration,
      startTime: Date.now(),
      fadeStart: 0.6
    });
  }

  /**
   * 播放自定义波纹效果
   * @param {number} x - 中心X坐标
   * @param {number} y - 中心Y坐标
   * @param {Object} options - 自定义选项
   */
  playCustom(x, y, options = {}) {
    const defaultOptions = {
      maxRadius: 60,
      color: '#4ECDC4',
      lineWidth: 2,
      duration: 400,
      pulseCount: 1
    };
    
    const finalOptions = { ...defaultOptions, ...options };
    this.animationEngine.addRippleEffect(x, y, finalOptions.maxRadius, finalOptions);
  }

  /**
   * 调整颜色透明度
   * @param {string} color - 颜色值
   * @param {number} alpha - 透明度 (0-1)
   * @returns {string} 调整后的颜色
   */
  adjustColorAlpha(color, alpha) {
    // 简单的颜色透明度调整
    if (color.startsWith('#')) {
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    return color;
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
   * 清除所有波纹效果
   */
  clearAll() {
    this.animationEngine.clearByType('ripple');
    this.animationEngine.clearByType('pulse');
    this.animationEngine.clearByType('squareRipple');
    this.animationEngine.clearByType('heartRipple');
  }
}

// 导出类
if (typeof module !== 'undefined' && module.exports) {
  module.exports = RippleEffectsManager;
} else if (typeof window !== 'undefined') {
  window.RippleEffectsManager = RippleEffectsManager;
}