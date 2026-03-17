/**
 * FloatingTextManager - 浮动文字动画管理器
 * 专门处理游戏中的浮动文字效果，提供预设样式和便捷方法
 */
class FloatingTextManager {
  constructor(animationEngine) {
    this.animationEngine = animationEngine;
    
    // 预设的浮动文字样式
    this.presets = {
      success: {
        color: '#4CAF50',
        size: 18,
        duration: 800,
        velocity: -80
      },
      error: {
        color: '#EF5350',
        size: 16,
        duration: 600,
        velocity: -60
      },
      score: {
        color: '#FFE66D',
        size: 20,
        duration: 1000,
        velocity: -100
      },
      combo: {
        color: '#FF6B6B',
        size: 24,
        duration: 1200,
        velocity: -120
      },
      hint: {
        color: '#4ECDC4',
        size: 14,
        duration: 2000,
        velocity: -40
      }
    };
  }

  /**
   * 显示成功点击的浮动文字
   * @param {number} x - X坐标
   * @param {number} y - Y坐标
   * @param {number} number - 点击的数字
   */
  showSuccess(x, y, number) {
    const preset = this.presets.success;
    this.animationEngine.addFloatingText(
      x, y, 
      `+${number}`, 
      preset.color, 
      preset.size, 
      preset.duration
    );
  }

  /**
   * 显示错误点击的浮动文字
   * @param {number} x - X坐标
   * @param {number} y - Y坐标
   * @param {string} message - 错误信息
   */
  showError(x, y, message = '✗') {
    const preset = this.presets.error;
    this.animationEngine.addFloatingText(
      x, y, 
      message, 
      preset.color, 
      preset.size, 
      preset.duration
    );
  }

  /**
   * 显示得分浮动文字
   * @param {number} x - X坐标
   * @param {number} y - Y坐标
   * @param {number} score - 得分
   */
  showScore(x, y, score) {
    const preset = this.presets.score;
    this.animationEngine.addFloatingText(
      x, y, 
      `+${score}`, 
      preset.color, 
      preset.size, 
      preset.duration
    );
  }

  /**
   * 显示连击浮动文字
   * @param {number} x - X坐标
   * @param {number} y - Y坐标
   * @param {number} combo - 连击数
   */
  showCombo(x, y, combo) {
    const preset = this.presets.combo;
    const text = combo >= 10 ? `${combo}连击!` : `${combo}连击`;
    this.animationEngine.addFloatingText(
      x, y, 
      text, 
      preset.color, 
      preset.size, 
      preset.duration
    );
  }

  /**
   * 显示提示浮动文字
   * @param {number} x - X坐标
   * @param {number} y - Y坐标
   * @param {string} hint - 提示内容
   */
  showHint(x, y, hint) {
    const preset = this.presets.hint;
    this.animationEngine.addFloatingText(
      x, y, 
      hint, 
      preset.color, 
      preset.size, 
      preset.duration
    );
  }

  /**
   * 显示关卡完成浮动文字
   * @param {number} x - X坐标
   * @param {number} y - Y坐标
   * @param {string} message - 完成信息
   */
  showLevelComplete(x, y, message = '关卡完成!') {
    this.animationEngine.addFloatingText(
      x, y, 
      message, 
      '#4CAF50', 
      28, 
      1500
    );
  }

  /**
   * 显示时间奖励浮动文字
   * @param {number} x - X坐标
   * @param {number} y - Y坐标
   * @param {number} seconds - 奖励秒数
   */
  showTimeBonus(x, y, seconds) {
    this.animationEngine.addFloatingText(
      x, y, 
      `+${seconds}秒`, 
      '#FFE66D', 
      22, 
      1000
    );
  }

  /**
   * 显示自定义浮动文字
   * @param {number} x - X坐标
   * @param {number} y - Y坐标
   * @param {string} text - 文字内容
   * @param {Object} options - 自定义选项
   */
  showCustom(x, y, text, options = {}) {
    const {
      color = '#333333',
      size = 16,
      duration = 800,
      velocity = -60
    } = options;

    this.animationEngine.addFloatingText(x, y, text, color, size, duration);
  }

  /**
   * 显示多行浮动文字
   * @param {number} x - X坐标
   * @param {number} y - Y坐标
   * @param {string[]} lines - 文字行数组
   * @param {Object} options - 选项
   */
  showMultiLine(x, y, lines, options = {}) {
    const {
      color = '#333333',
      size = 16,
      duration = 800,
      lineSpacing = 25,
      staggerDelay = 100
    } = options;

    lines.forEach((line, index) => {
      setTimeout(() => {
        this.animationEngine.addFloatingText(
          x, 
          y + index * lineSpacing, 
          line, 
          color, 
          size, 
          duration
        );
      }, index * staggerDelay);
    });
  }

  /**
   * 显示彩虹色浮动文字
   * @param {number} x - X坐标
   * @param {number} y - Y坐标
   * @param {string} text - 文字内容
   */
  showRainbow(x, y, text) {
    const colors = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3', '#F38BA8'];
    const chars = text.split('');
    
    chars.forEach((char, index) => {
      const color = colors[index % colors.length];
      const offsetX = x + (index - chars.length / 2) * 15;
      
      setTimeout(() => {
        this.animationEngine.addFloatingText(
          offsetX, y, char, color, 20, 1000
        );
      }, index * 50);
    });
  }

  /**
   * 更新预设样式
   * @param {string} presetName - 预设名称
   * @param {Object} style - 样式对象
   */
  updatePreset(presetName, style) {
    if (this.presets[presetName]) {
      this.presets[presetName] = { ...this.presets[presetName], ...style };
    }
  }

  /**
   * 添加新的预设样式
   * @param {string} name - 预设名称
   * @param {Object} style - 样式对象
   */
  addPreset(name, style) {
    this.presets[name] = style;
  }

  /**
   * 获取预设样式
   * @param {string} name - 预设名称
   * @returns {Object|null}
   */
  getPreset(name) {
    return this.presets[name] || null;
  }
}

// 导出类
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FloatingTextManager;
} else if (typeof window !== 'undefined') {
  window.FloatingTextManager = FloatingTextManager;
}