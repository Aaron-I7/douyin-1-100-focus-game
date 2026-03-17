/**
 * ProgressBarDesigner - 进度条设计系统
 * 实现渐变填充、圆角设计和动画效果的进度条
 * 需求: 15.6 - 添加装饰性元素
 */

class ProgressBarDesigner {
  constructor(themeSystem) {
    this.themeSystem = themeSystem;
    this.animationCache = new Map(); // 缓存动画状态
  }

  /**
   * 渲染进度条
   * @param {CanvasRenderingContext2D} ctx - Canvas 2D 上下文
   * @param {number} x - X 坐标
   * @param {number} y - Y 坐标
   * @param {number} width - 进度条宽度
   * @param {number} height - 进度条高度
   * @param {number} progress - 进度值 (0-1)
   * @param {Object} options - 渲染选项
   */
  renderProgressBar(ctx, x, y, width, height, progress, options = {}) {
    const config = this.createProgressBarConfig(options);
    const animationId = options.animationId || 'default';
    
    // 更新动画状态
    this.updateAnimation(animationId, progress, config);
    
    ctx.save();
    
    // 1. 绘制背景
    this.drawProgressBackground(ctx, x, y, width, height, config);
    
    // 2. 绘制填充
    const animatedProgress = this.getAnimatedProgress(animationId);
    this.drawProgressFill(ctx, x, y, width, height, animatedProgress, config);
    
    // 3. 绘制装饰效果
    if (config.showShine) {
      this.drawShineEffect(ctx, x, y, width, height, animatedProgress, config);
    }
    
    if (config.showPulse && progress > 0) {
      this.drawPulseEffect(ctx, x, y, width, height, animatedProgress, config);
    }
    
    // 4. 绘制边框
    if (config.borderWidth > 0) {
      this.drawProgressBorder(ctx, x, y, width, height, config);
    }
    
    ctx.restore();
  }

  /**
   * 创建进度条配置
   * @param {Object} options - 选项
   * @returns {Object} 进度条配置
   */
  createProgressBarConfig(options = {}) {
    const theme = this.themeSystem.getThemeColors();
    
    return {
      // 背景配置
      backgroundColor: options.backgroundColor || 'rgba(255, 255, 255, 0.3)',
      backgroundGradient: options.backgroundGradient || null,
      
      // 填充配置
      fillColor: options.fillColor || theme.secondary,
      fillGradient: options.fillGradient || {
        type: 'linear', // 'linear' | 'radial'
        colors: [theme.secondary, theme.secondaryLight, theme.secondary],
        stops: [0, 0.5, 1]
      },
      
      // 圆角配置
      borderRadius: options.borderRadius !== undefined ? options.borderRadius : height / 2,
      
      // 边框配置
      borderWidth: options.borderWidth || 2,
      borderColor: options.borderColor || theme.primary,
      
      // 动画配置
      animationDuration: options.animationDuration || 800, // 毫秒
      animationEasing: options.animationEasing || 'easeOutCubic',
      
      // 特效配置
      showShine: options.showShine !== false, // 默认显示光泽效果
      showPulse: options.showPulse !== false, // 默认显示脉冲效果
      shineColor: options.shineColor || 'rgba(255, 255, 255, 0.6)',
      pulseColor: options.pulseColor || theme.accent,
      
      // 文字配置
      showText: options.showText || false,
      textColor: options.textColor || theme.hud.text,
      textSize: options.textSize || 12
    };
  }

  /**
   * 绘制进度条背景
   * @param {CanvasRenderingContext2D} ctx - Canvas 2D 上下文
   * @param {number} x - X 坐标
   * @param {number} y - Y 坐标
   * @param {number} width - 宽度
   * @param {number} height - 高度
   * @param {Object} config - 配置对象
   */
  drawProgressBackground(ctx, x, y, width, height, config) {
    ctx.save();
    
    // 创建圆角矩形路径
    this.createRoundedRectPath(ctx, x, y, width, height, config.borderRadius);
    
    if (config.backgroundGradient) {
      // 渐变背景
      const gradient = this.createGradient(ctx, x, y, width, height, config.backgroundGradient);
      ctx.fillStyle = gradient;
    } else {
      // 纯色背景
      ctx.fillStyle = config.backgroundColor;
    }
    
    ctx.fill();
    ctx.restore();
  }

  /**
   * 绘制进度条填充
   * @param {CanvasRenderingContext2D} ctx - Canvas 2D 上下文
   * @param {number} x - X 坐标
   * @param {number} y - Y 坐标
   * @param {number} width - 宽度
   * @param {number} height - 高度
   * @param {number} progress - 进度值
   * @param {Object} config - 配置对象
   */
  drawProgressFill(ctx, x, y, width, height, progress, config) {
    if (progress <= 0) return;
    
    ctx.save();
    
    const fillWidth = width * progress;
    
    // 创建填充区域的裁剪路径
    this.createRoundedRectPath(ctx, x, y, fillWidth, height, config.borderRadius);
    ctx.clip();
    
    if (config.fillGradient) {
      // 渐变填充
      const gradient = this.createGradient(ctx, x, y, width, height, config.fillGradient);
      ctx.fillStyle = gradient;
    } else {
      // 纯色填充
      ctx.fillStyle = config.fillColor;
    }
    
    // 绘制填充矩形（使用完整宽度，通过裁剪控制显示区域）
    this.createRoundedRectPath(ctx, x, y, width, height, config.borderRadius);
    ctx.fill();
    
    ctx.restore();
  }

  /**
   * 绘制光泽效果
   * @param {CanvasRenderingContext2D} ctx - Canvas 2D 上下文
   * @param {number} x - X 坐标
   * @param {number} y - Y 坐标
   * @param {number} width - 宽度
   * @param {number} height - 高度
   * @param {number} progress - 进度值
   * @param {Object} config - 配置对象
   */
  drawShineEffect(ctx, x, y, width, height, progress, config) {
    if (progress <= 0) return;
    
    ctx.save();
    
    const fillWidth = width * progress;
    
    // 创建裁剪路径
    this.createRoundedRectPath(ctx, x, y, fillWidth, height, config.borderRadius);
    ctx.clip();
    
    // 创建光泽渐变（从上到下）
    const shineGradient = ctx.createLinearGradient(x, y, x, y + height);
    shineGradient.addColorStop(0, config.shineColor);
    shineGradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.3)');
    shineGradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.1)');
    shineGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    ctx.fillStyle = shineGradient;
    ctx.fillRect(x, y, fillWidth, height * 0.6); // 光泽只覆盖上半部分
    
    ctx.restore();
  }

  /**
   * 绘制脉冲效果
   * @param {CanvasRenderingContext2D} ctx - Canvas 2D 上下文
   * @param {number} x - X 坐标
   * @param {number} y - Y 坐标
   * @param {number} width - 宽度
   * @param {number} height - 高度
   * @param {number} progress - 进度值
   * @param {Object} config - 配置对象
   */
  drawPulseEffect(ctx, x, y, width, height, progress, config) {
    const time = Date.now();
    const pulsePhase = (time % 2000) / 2000; // 2秒周期
    const pulseIntensity = Math.sin(pulsePhase * Math.PI * 2) * 0.3 + 0.7;
    
    ctx.save();
    
    const fillWidth = width * progress;
    const pulseX = x + fillWidth - height / 2; // 脉冲位置在进度条末端
    
    // 创建脉冲渐变
    const pulseGradient = ctx.createRadialGradient(
      pulseX, y + height / 2, 0,
      pulseX, y + height / 2, height
    );
    
    const pulseColor = this.parseColorWithAlpha(config.pulseColor, pulseIntensity * 0.5);
    pulseGradient.addColorStop(0, pulseColor);
    pulseGradient.addColorStop(0.7, this.parseColorWithAlpha(config.pulseColor, pulseIntensity * 0.2));
    pulseGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    
    ctx.fillStyle = pulseGradient;
    ctx.fillRect(pulseX - height, y, height * 2, height);
    
    ctx.restore();
  }

  /**
   * 绘制进度条边框
   * @param {CanvasRenderingContext2D} ctx - Canvas 2D 上下文
   * @param {number} x - X 坐标
   * @param {number} y - Y 坐标
   * @param {number} width - 宽度
   * @param {number} height - 高度
   * @param {Object} config - 配置对象
   */
  drawProgressBorder(ctx, x, y, width, height, config) {
    ctx.save();
    
    ctx.strokeStyle = config.borderColor;
    ctx.lineWidth = config.borderWidth;
    
    this.createRoundedRectPath(ctx, x, y, width, height, config.borderRadius);
    ctx.stroke();
    
    ctx.restore();
  }

  /**
   * 创建圆角矩形路径
   * @param {CanvasRenderingContext2D} ctx - Canvas 2D 上下文
   * @param {number} x - X 坐标
   * @param {number} y - Y 坐标
   * @param {number} width - 宽度
   * @param {number} height - 高度
   * @param {number} radius - 圆角半径
   */
  createRoundedRectPath(ctx, x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);
    
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + width - r, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + r);
    ctx.lineTo(x + width, y + height - r);
    ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    ctx.lineTo(x + r, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  /**
   * 创建渐变
   * @param {CanvasRenderingContext2D} ctx - Canvas 2D 上下文
   * @param {number} x - X 坐标
   * @param {number} y - Y 坐标
   * @param {number} width - 宽度
   * @param {number} height - 高度
   * @param {Object} gradientConfig - 渐变配置
   * @returns {CanvasGradient} 渐变对象
   */
  createGradient(ctx, x, y, width, height, gradientConfig) {
    let gradient;
    
    if (gradientConfig.type === 'radial') {
      gradient = ctx.createRadialGradient(
        x + width / 2, y + height / 2, 0,
        x + width / 2, y + height / 2, Math.max(width, height) / 2
      );
    } else {
      // 默认线性渐变（水平）
      gradient = ctx.createLinearGradient(x, y, x + width, y);
    }
    
    gradientConfig.colors.forEach((color, index) => {
      const stop = gradientConfig.stops ? gradientConfig.stops[index] : index / (gradientConfig.colors.length - 1);
      gradient.addColorStop(stop, color);
    });
    
    return gradient;
  }

  /**
   * 更新动画状态
   * @param {string} animationId - 动画ID
   * @param {number} targetProgress - 目标进度
   * @param {Object} config - 配置对象
   */
  updateAnimation(animationId, targetProgress, config) {
    const now = Date.now();
    
    if (!this.animationCache.has(animationId)) {
      this.animationCache.set(animationId, {
        currentProgress: 0,
        targetProgress: targetProgress,
        startTime: now,
        startProgress: 0
      });
      return;
    }
    
    const animation = this.animationCache.get(animationId);
    
    // 检查是否需要开始新的动画
    if (Math.abs(animation.targetProgress - targetProgress) > 0.001) {
      animation.startProgress = animation.currentProgress;
      animation.targetProgress = targetProgress;
      animation.startTime = now;
    }
    
    // 计算动画进度
    const elapsed = now - animation.startTime;
    const duration = config.animationDuration;
    
    if (elapsed >= duration) {
      animation.currentProgress = animation.targetProgress;
    } else {
      const t = elapsed / duration;
      const easedT = this.applyEasing(t, config.animationEasing);
      animation.currentProgress = animation.startProgress + 
        (animation.targetProgress - animation.startProgress) * easedT;
    }
  }

  /**
   * 获取动画后的进度值
   * @param {string} animationId - 动画ID
   * @returns {number} 当前进度值
   */
  getAnimatedProgress(animationId) {
    const animation = this.animationCache.get(animationId);
    return animation ? animation.currentProgress : 0;
  }

  /**
   * 应用缓动函数
   * @param {number} t - 时间进度 (0-1)
   * @param {string} easing - 缓动类型
   * @returns {number} 缓动后的值
   */
  applyEasing(t, easing) {
    switch (easing) {
      case 'easeOutCubic':
        return 1 - Math.pow(1 - t, 3);
      case 'easeInOutCubic':
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      case 'easeOutBounce':
        const n1 = 7.5625;
        const d1 = 2.75;
        if (t < 1 / d1) {
          return n1 * t * t;
        } else if (t < 2 / d1) {
          return n1 * (t -= 1.5 / d1) * t + 0.75;
        } else if (t < 2.5 / d1) {
          return n1 * (t -= 2.25 / d1) * t + 0.9375;
        } else {
          return n1 * (t -= 2.625 / d1) * t + 0.984375;
        }
      default:
        return t; // 线性
    }
  }

  /**
   * 解析颜色并添加透明度
   * @param {string} color - 颜色字符串
   * @param {number} alpha - 透明度 (0-1)
   * @returns {string} RGBA 颜色字符串
   */
  parseColorWithAlpha(color, alpha) {
    if (color.startsWith('#')) {
      const hex = color.slice(1);
      const r = parseInt(hex.substr(0, 2), 16);
      const g = parseInt(hex.substr(2, 2), 16);
      const b = parseInt(hex.substr(4, 2), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    } else if (color.startsWith('rgb')) {
      return color.replace('rgb', 'rgba').replace(')', `, ${alpha})`);
    }
    return color;
  }

  /**
   * 清除动画缓存
   * @param {string} animationId - 动画ID（可选，不传则清除所有）
   */
  clearAnimationCache(animationId) {
    if (animationId) {
      this.animationCache.delete(animationId);
    } else {
      this.animationCache.clear();
    }
  }
}

// 导出 ProgressBarDesigner 类
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ProgressBarDesigner;
} else if (typeof window !== 'undefined') {
  window.ProgressBarDesigner = ProgressBarDesigner;
}