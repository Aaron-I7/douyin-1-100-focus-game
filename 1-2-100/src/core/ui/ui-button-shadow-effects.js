/**
 * ButtonShadowEffects - 按钮阴影效果系统
 * 为按钮添加柔和的投影和按下时的阴影变化
 * 需求: 15.6 - 添加装饰性元素
 */

class ButtonShadowEffects {
  constructor(themeSystem) {
    this.themeSystem = themeSystem;
    this.shadowCache = new Map(); // 缓存阴影配置
  }

  /**
   * 获取按钮阴影配置
   * @param {string} type - 按钮类型
   * @param {string} state - 按钮状态 (normal, hover, active, disabled)
   * @returns {Object} 阴影配置对象
   */
  getShadowConfig(type = 'primary', state = 'normal') {
    const cacheKey = `${type}_${state}`;
    
    if (this.shadowCache.has(cacheKey)) {
      return this.shadowCache.get(cacheKey);
    }

    const buttonStyle = this.themeSystem.getButtonStyle(type);
    const config = this.createShadowConfig(buttonStyle, state);
    
    this.shadowCache.set(cacheKey, config);
    return config;
  }

  /**
   * 创建阴影配置
   * @param {Object} buttonStyle - 按钮样式
   * @param {string} state - 按钮状态
   * @returns {Object} 阴影配置
   */
  createShadowConfig(buttonStyle, state) {
    const baseConfig = {
      // 外阴影（投影）
      outerShadow: {
        color: buttonStyle.shadowColor || 'rgba(0, 0, 0, 0.3)',
        blur: buttonStyle.shadowBlur || 15,
        offsetX: 0,
        offsetY: buttonStyle.shadowOffsetY || 4,
        spread: 0
      },
      
      // 内阴影（立体感）
      innerShadow: {
        color: 'rgba(255, 255, 255, 0.2)',
        blur: 3,
        offsetX: 0,
        offsetY: -1,
        inset: true
      },
      
      // 发光效果（可选）
      glow: {
        enabled: false,
        color: buttonStyle.shadowColor || 'rgba(0, 0, 0, 0.3)',
        blur: 20,
        intensity: 0.5
      }
    };

    // 根据状态调整阴影
    switch (state) {
      case 'normal':
        // 默认状态，使用基础配置
        break;
        
      case 'hover':
        // 悬停状态：阴影更明显，添加发光效果
        baseConfig.outerShadow.blur += 5;
        baseConfig.outerShadow.offsetY += 2;
        baseConfig.glow.enabled = true;
        baseConfig.glow.intensity = 0.3;
        break;
        
      case 'active':
        // 按下状态：阴影减小，模拟按下效果
        baseConfig.outerShadow.blur = Math.max(5, baseConfig.outerShadow.blur - 8);
        baseConfig.outerShadow.offsetY = Math.max(1, baseConfig.outerShadow.offsetY - 3);
        baseConfig.innerShadow.offsetY = 1; // 反转内阴影
        baseConfig.innerShadow.color = 'rgba(0, 0, 0, 0.1)';
        break;
        
      case 'disabled':
        // 禁用状态：阴影变淡
        baseConfig.outerShadow.color = 'rgba(0, 0, 0, 0.1)';
        baseConfig.outerShadow.blur = 8;
        baseConfig.outerShadow.offsetY = 2;
        baseConfig.innerShadow.color = 'rgba(255, 255, 255, 0.1)';
        break;
    }

    return baseConfig;
  }

  /**
   * 应用按钮阴影效果
   * @param {CanvasRenderingContext2D} ctx - Canvas 2D 上下文
   * @param {number} x - 按钮 X 坐标
   * @param {number} y - 按钮 Y 坐标
   * @param {number} width - 按钮宽度
   * @param {number} height - 按钮高度
   * @param {number} borderRadius - 按钮圆角半径
   * @param {string} type - 按钮类型
   * @param {string} state - 按钮状态
   */
  applyButtonShadow(ctx, x, y, width, height, borderRadius, type = 'primary', state = 'normal') {
    const shadowConfig = this.getShadowConfig(type, state);
    
    ctx.save();
    
    // 1. 绘制外阴影（投影）
    this.drawOuterShadow(ctx, x, y, width, height, borderRadius, shadowConfig.outerShadow);
    
    // 2. 绘制发光效果（如果启用）
    if (shadowConfig.glow.enabled) {
      this.drawGlowEffect(ctx, x, y, width, height, borderRadius, shadowConfig.glow);
    }
    
    ctx.restore();
  }

  /**
   * 绘制外阴影
   * @param {CanvasRenderingContext2D} ctx - Canvas 2D 上下文
   * @param {number} x - X 坐标
   * @param {number} y - Y 坐标
   * @param {number} width - 宽度
   * @param {number} height - 高度
   * @param {number} borderRadius - 圆角半径
   * @param {Object} shadowConfig - 阴影配置
   */
  drawOuterShadow(ctx, x, y, width, height, borderRadius, shadowConfig) {
    ctx.save();
    
    // 设置阴影属性
    ctx.shadowColor = shadowConfig.color;
    ctx.shadowBlur = shadowConfig.blur;
    ctx.shadowOffsetX = shadowConfig.offsetX;
    ctx.shadowOffsetY = shadowConfig.offsetY;
    
    // 绘制阴影形状（使用透明填充）
    ctx.fillStyle = 'rgba(0, 0, 0, 0.01)'; // 几乎透明，只为产生阴影
    
    if (borderRadius > 0) {
      this.drawRoundedRect(ctx, x, y, width, height, borderRadius);
    } else {
      ctx.fillRect(x, y, width, height);
    }
    
    ctx.fill();
    ctx.restore();
  }

  /**
   * 绘制发光效果
   * @param {CanvasRenderingContext2D} ctx - Canvas 2D 上下文
   * @param {number} x - X 坐标
   * @param {number} y - Y 坐标
   * @param {number} width - 宽度
   * @param {number} height - 高度
   * @param {number} borderRadius - 圆角半径
   * @param {Object} glowConfig - 发光配置
   */
  drawGlowEffect(ctx, x, y, width, height, borderRadius, glowConfig) {
    ctx.save();
    
    // 创建径向渐变发光效果
    const centerX = x + width / 2;
    const centerY = y + height / 2;
    const maxRadius = Math.max(width, height) / 2 + glowConfig.blur;
    
    const gradient = ctx.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, maxRadius
    );
    
    // 解析颜色并添加透明度
    const glowColor = this.parseColor(glowConfig.color);
    gradient.addColorStop(0, `rgba(${glowColor.r}, ${glowColor.g}, ${glowColor.b}, ${glowConfig.intensity})`);
    gradient.addColorStop(0.7, `rgba(${glowColor.r}, ${glowColor.g}, ${glowColor.b}, ${glowConfig.intensity * 0.3})`);
    gradient.addColorStop(1, `rgba(${glowColor.r}, ${glowColor.g}, ${glowColor.b}, 0)`);
    
    ctx.fillStyle = gradient;
    ctx.fillRect(
      x - glowConfig.blur,
      y - glowConfig.blur,
      width + glowConfig.blur * 2,
      height + glowConfig.blur * 2
    );
    
    ctx.restore();
  }

  /**
   * 绘制圆角矩形路径
   * @param {CanvasRenderingContext2D} ctx - Canvas 2D 上下文
   * @param {number} x - X 坐标
   * @param {number} y - Y 坐标
   * @param {number} width - 宽度
   * @param {number} height - 高度
   * @param {number} radius - 圆角半径
   */
  drawRoundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  /**
   * 解析颜色字符串为 RGB 值
   * @param {string} colorStr - 颜色字符串
   * @returns {Object} RGB 颜色对象
   */
  parseColor(colorStr) {
    // 简单的颜色解析，支持 hex 和 rgba 格式
    if (colorStr.startsWith('#')) {
      // Hex 格式
      const hex = colorStr.slice(1);
      return {
        r: parseInt(hex.substr(0, 2), 16),
        g: parseInt(hex.substr(2, 2), 16),
        b: parseInt(hex.substr(4, 2), 16)
      };
    } else if (colorStr.startsWith('rgba')) {
      // RGBA 格式
      const values = colorStr.match(/\d+/g);
      return {
        r: parseInt(values[0]),
        g: parseInt(values[1]),
        b: parseInt(values[2])
      };
    } else {
      // 默认黑色
      return { r: 0, g: 0, b: 0 };
    }
  }

  /**
   * 创建按钮阴影动画
   * @param {string} type - 按钮类型
   * @param {string} fromState - 起始状态
   * @param {string} toState - 目标状态
   * @param {number} progress - 动画进度 (0-1)
   * @returns {Object} 插值后的阴影配置
   */
  createShadowAnimation(type, fromState, toState, progress) {
    const fromConfig = this.getShadowConfig(type, fromState);
    const toConfig = this.getShadowConfig(type, toState);
    
    return {
      outerShadow: {
        color: fromConfig.outerShadow.color, // 颜色不插值
        blur: this.lerp(fromConfig.outerShadow.blur, toConfig.outerShadow.blur, progress),
        offsetX: this.lerp(fromConfig.outerShadow.offsetX, toConfig.outerShadow.offsetX, progress),
        offsetY: this.lerp(fromConfig.outerShadow.offsetY, toConfig.outerShadow.offsetY, progress),
        spread: this.lerp(fromConfig.outerShadow.spread, toConfig.outerShadow.spread, progress)
      },
      innerShadow: {
        color: fromConfig.innerShadow.color,
        blur: this.lerp(fromConfig.innerShadow.blur, toConfig.innerShadow.blur, progress),
        offsetX: this.lerp(fromConfig.innerShadow.offsetX, toConfig.innerShadow.offsetX, progress),
        offsetY: this.lerp(fromConfig.innerShadow.offsetY, toConfig.innerShadow.offsetY, progress),
        inset: toConfig.innerShadow.inset
      },
      glow: {
        enabled: toConfig.glow.enabled,
        color: toConfig.glow.color,
        blur: this.lerp(fromConfig.glow.blur, toConfig.glow.blur, progress),
        intensity: this.lerp(fromConfig.glow.intensity, toConfig.glow.intensity, progress)
      }
    };
  }

  /**
   * 线性插值
   * @param {number} start - 起始值
   * @param {number} end - 结束值
   * @param {number} progress - 进度 (0-1)
   * @returns {number} 插值结果
   */
  lerp(start, end, progress) {
    return start + (end - start) * progress;
  }

  /**
   * 清除阴影缓存
   */
  clearCache() {
    this.shadowCache.clear();
  }
}

// 导出 ButtonShadowEffects 类
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ButtonShadowEffects;
} else if (typeof window !== 'undefined') {
  window.ButtonShadowEffects = ButtonShadowEffects;
}