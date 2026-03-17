/**
 * ParticleEffectsManager - 粒子效果管理器
 * 专门处理游戏中的各种粒子效果，提供预设效果和便捷方法
 */
class ParticleEffectsManager {
  constructor(animationEngine) {
    this.animationEngine = animationEngine;
    
    // 预设的粒子效果配置
    this.presets = {
      // 关卡完成庆祝效果
      levelComplete: {
        count: 20,
        colors: ['#4CAF50', '#8BC34A', '#CDDC39', '#FFEB3B', '#FFC107'],
        minSize: 3,
        maxSize: 8,
        minSpeed: 80,
        maxSpeed: 200,
        duration: 1200,
        spread: Math.PI * 2
      },
      
      // 正确点击效果
      correctClick: {
        count: 8,
        colors: ['#4ECDC4', '#95E1D3', '#A8E6CF'],
        minSize: 2,
        maxSize: 5,
        minSpeed: 60,
        maxSpeed: 120,
        duration: 800,
        spread: Math.PI * 1.5
      },
      
      // 错误点击效果
      errorClick: {
        count: 6,
        colors: ['#EF5350', '#FF7043', '#FF8A65'],
        minSize: 2,
        maxSize: 4,
        minSpeed: 40,
        maxSpeed: 80,
        duration: 600,
        spread: Math.PI
      },
      
      // 连击效果
      combo: {
        count: 15,
        colors: ['#FF6B6B', '#FF8E53', '#FF6B9D'],
        minSize: 3,
        maxSize: 7,
        minSpeed: 100,
        maxSpeed: 180,
        duration: 1000,
        spread: Math.PI * 2
      },
      
      // 时间奖励效果
      timeBonus: {
        count: 12,
        colors: ['#FFE66D', '#FFD93D', '#FFC107'],
        minSize: 2,
        maxSize: 6,
        minSpeed: 70,
        maxSpeed: 140,
        duration: 900,
        spread: Math.PI * 1.8
      },
      
      // 解锁效果
      unlock: {
        count: 25,
        colors: ['#9C27B0', '#E91E63', '#F06292', '#BA68C8'],
        minSize: 4,
        maxSize: 9,
        minSpeed: 90,
        maxSpeed: 220,
        duration: 1500,
        spread: Math.PI * 2
      }
    };
  }

  /**
   * 播放关卡完成庆祝粒子效果
   * @param {number} x - 中心X坐标
   * @param {number} y - 中心Y坐标
   * @param {Object} customOptions - 自定义选项
   */
  playLevelComplete(x, y, customOptions = {}) {
    const preset = { ...this.presets.levelComplete, ...customOptions };
    this.animationEngine.addParticleEffect(x, y, preset.count, preset);
    
    // 添加延迟的第二波效果
    setTimeout(() => {
      this.animationEngine.addParticleEffect(x, y, preset.count * 0.6, {
        ...preset,
        minSpeed: preset.minSpeed * 0.7,
        maxSpeed: preset.maxSpeed * 0.7,
        duration: preset.duration * 0.8
      });
    }, 300);
  }

  /**
   * 播放正确点击粒子效果
   * @param {number} x - 中心X坐标
   * @param {number} y - 中心Y坐标
   */
  playCorrectClick(x, y) {
    const preset = this.presets.correctClick;
    this.animationEngine.addParticleEffect(x, y, preset.count, preset);
  }

  /**
   * 播放错误点击粒子效果
   * @param {number} x - 中心X坐标
   * @param {number} y - 中心Y坐标
   */
  playErrorClick(x, y) {
    const preset = this.presets.errorClick;
    this.animationEngine.addParticleEffect(x, y, preset.count, preset);
  }

  /**
   * 播放连击粒子效果
   * @param {number} x - 中心X坐标
   * @param {number} y - 中心Y坐标
   * @param {number} comboCount - 连击数
   */
  playCombo(x, y, comboCount) {
    const preset = this.presets.combo;
    // 连击数越高，粒子越多
    const count = Math.min(preset.count + comboCount * 2, 30);
    this.animationEngine.addParticleEffect(x, y, count, { ...preset, count });
  }

  /**
   * 播放时间奖励粒子效果
   * @param {number} x - 中心X坐标
   * @param {number} y - 中心Y坐标
   */
  playTimeBonus(x, y) {
    const preset = this.presets.timeBonus;
    this.animationEngine.addParticleEffect(x, y, preset.count, preset);
  }

  /**
   * 播放解锁效果
   * @param {number} x - 中心X坐标
   * @param {number} y - 中心Y坐标
   */
  playUnlock(x, y) {
    const preset = this.presets.unlock;
    this.animationEngine.addParticleEffect(x, y, preset.count, preset);
    
    // 添加多层效果
    setTimeout(() => {
      this.animationEngine.addParticleEffect(x, y, preset.count * 0.8, {
        ...preset,
        minSpeed: preset.minSpeed * 0.6,
        maxSpeed: preset.maxSpeed * 0.6
      });
    }, 200);
    
    setTimeout(() => {
      this.animationEngine.addParticleEffect(x, y, preset.count * 0.5, {
        ...preset,
        minSpeed: preset.minSpeed * 0.4,
        maxSpeed: preset.maxSpeed * 0.4
      });
    }, 400);
  }

  /**
   * 播放烟花效果
   * @param {number} x - 中心X坐标
   * @param {number} y - 中心Y坐标
   * @param {Object} options - 选项
   */
  playFireworks(x, y, options = {}) {
    const {
      burstCount = 3,
      particlesPerBurst = 15,
      colors = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3', '#F38BA8'],
      delay = 200
    } = options;

    for (let i = 0; i < burstCount; i++) {
      setTimeout(() => {
        this.animationEngine.addParticleEffect(x, y, particlesPerBurst, {
          colors,
          minSize: 3,
          maxSize: 7,
          minSpeed: 100 + i * 20,
          maxSpeed: 180 + i * 30,
          duration: 1000 + i * 200,
          spread: Math.PI * 2
        });
      }, i * delay);
    }
  }

  /**
   * 播放螺旋粒子效果
   * @param {number} x - 中心X坐标
   * @param {number} y - 中心Y坐标
   * @param {Object} options - 选项
   */
  playSpiral(x, y, options = {}) {
    const {
      count = 20,
      colors = ['#9C27B0', '#E91E63', '#F06292'],
      radius = 100,
      duration = 1500
    } = options;

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      const spiralRadius = radius * (i / count);
      
      setTimeout(() => {
        const particleX = x + Math.cos(angle) * spiralRadius;
        const particleY = y + Math.sin(angle) * spiralRadius;
        
        this.animationEngine.addParticleEffect(particleX, particleY, 1, {
          colors,
          minSize: 2,
          maxSize: 5,
          minSpeed: 50,
          maxSpeed: 100,
          duration: duration - i * 50,
          spread: Math.PI * 0.5
        });
      }, i * 50);
    }
  }

  /**
   * 播放心形粒子效果
   * @param {number} x - 中心X坐标
   * @param {number} y - 中心Y坐标
   */
  playHeart(x, y) {
    const heartPoints = this.generateHeartShape(x, y, 50);
    const colors = ['#FF6B9D', '#FF8E53', '#FFB74D'];
    
    heartPoints.forEach((point, index) => {
      setTimeout(() => {
        this.animationEngine.addParticleEffect(point.x, point.y, 1, {
          colors,
          minSize: 3,
          maxSize: 6,
          minSpeed: 30,
          maxSpeed: 80,
          duration: 1200,
          spread: Math.PI * 0.3
        });
      }, index * 30);
    });
  }

  /**
   * 生成心形路径点
   * @param {number} centerX - 中心X坐标
   * @param {number} centerY - 中心Y坐标
   * @param {number} size - 大小
   * @returns {Array} 点数组
   */
  generateHeartShape(centerX, centerY, size) {
    const points = [];
    const steps = 30;
    
    for (let i = 0; i < steps; i++) {
      const t = (i / steps) * Math.PI * 2;
      const x = centerX + size * (16 * Math.pow(Math.sin(t), 3)) / 16;
      const y = centerY - size * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) / 16;
      points.push({ x, y });
    }
    
    return points;
  }

  /**
   * 播放自定义粒子效果
   * @param {number} x - 中心X坐标
   * @param {number} y - 中心Y坐标
   * @param {Object} options - 自定义选项
   */
  playCustom(x, y, options = {}) {
    const defaultOptions = {
      count: 10,
      colors: ['#4ECDC4'],
      minSize: 2,
      maxSize: 5,
      minSpeed: 50,
      maxSpeed: 100,
      duration: 800,
      spread: Math.PI * 2
    };
    
    const finalOptions = { ...defaultOptions, ...options };
    this.animationEngine.addParticleEffect(x, y, finalOptions.count, finalOptions);
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
}

// 导出类
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ParticleEffectsManager;
} else if (typeof window !== 'undefined') {
  window.ParticleEffectsManager = ParticleEffectsManager;
}