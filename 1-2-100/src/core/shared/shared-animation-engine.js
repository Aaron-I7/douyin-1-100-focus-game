/**
 * AnimationEngine - 创意动画效果引擎
 * 管理游戏中的各种动画效果，包括浮动文字、粒子效果、波纹效果等
 */
class AnimationEngine {
  constructor() {
    this.animations = [];
    this.maxAnimations = 50; // 限制最大动画数量以优化性能
  }

  /**
   * 添加浮动文字动画（赛博朋克风格）
   * @param {number} x - X坐标
   * @param {number} y - Y坐标
   * @param {string} text - 显示文字
   * @param {string} color - 文字颜色
   * @param {number} size - 字体大小
   * @param {number} duration - 动画持续时间（毫秒）
   */
  addFloatingText(x, y, text, color = '#00D4FF', size = 16, duration = 900) {
    this.addAnimation({
      type: 'floatingText',
      x,
      y,
      text,
      color,
      size,
      duration,
      startTime: Date.now(),
      // 动画参数
      velocity: -60, // 向上移动速度（像素/秒）
      fadeStart: 0.3 // 开始淡出的时间点（0-1）
    });
  }

  /**
   * 添加粒子效果（赛博朋克风格）
   * @param {number} x - 中心X坐标
   * @param {number} y - 中心Y坐标
   * @param {number} count - 粒子数量
   * @param {Object} options - 可选参数
   */
  addParticleEffect(x, y, count = 10, options = {}) {
    const {
      colors = ['#00D4FF', '#39FF14', '#FF0080', '#8000FF', '#00FFFF'], // 赛博朋克配色
      minSize = 2,
      maxSize = 6,
      minSpeed = 50,
      maxSpeed = 150,
      duration = 800,
      spread = Math.PI * 2 // 扩散角度
    } = options;

    for (let i = 0; i < count; i++) {
      const angle = (spread * i) / count + Math.random() * 0.5;
      const speed = minSpeed + Math.random() * (maxSpeed - minSpeed);
      const size = minSize + Math.random() * (maxSize - minSize);
      const color = colors[Math.floor(Math.random() * colors.length)];

      this.addAnimation({
        type: 'particle',
        x,
        y,
        color,
        size,
        duration,
        startTime: Date.now(),
        // 运动参数
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        gravity: 200, // 重力加速度
        friction: 0.98 // 摩擦系数
      });
    }
  }

  /**
   * 添加波纹效果（赛博朋克风格）
   * @param {number} x - 中心X坐标
   * @param {number} y - 中心Y坐标
   * @param {number} maxRadius - 最大半径
   * @param {Object} options - 可选参数
   */
  addRippleEffect(x, y, maxRadius = 100, options = {}) {
    const {
      color = '#00D4FF', // 霓虹蓝
      lineWidth = 3,
      duration = 500,
      pulseCount = 1 // 脉冲次数
    } = options;

    for (let i = 0; i < pulseCount; i++) {
      this.addAnimation({
        type: 'ripple',
        x,
        y,
        maxRadius,
        color,
        lineWidth,
        duration,
        startTime: Date.now() + i * (duration / pulseCount * 0.3), // 错开时间
        // 动画参数
        startRadius: 0,
        fadeStart: 0.7 // 开始淡出的时间点
      });
    }
  }

  /**
   * 添加弹跳动画
   * @param {number} x - 中心X坐标
   * @param {number} y - 中心Y坐标
   * @param {number} size - 元素大小
   * @param {Object} options - 可选参数
   */
  addBounceEffect(x, y, size, options = {}) {
    const {
      color = '#FF6B6B',
      maxScale = 1.3,
      duration = 300,
      bounceType = 'elastic' // 'elastic' | 'simple'
    } = options;

    this.addAnimation({
      type: 'bounce',
      x,
      y,
      size,
      color,
      maxScale,
      duration,
      bounceType,
      startTime: Date.now(),
      // 动画参数
      originalScale: 1
    });
  }

  /**
   * 添加霓虹拖尾效果（赛博朋克风格）
   * @param {number} x - 起始X坐标
   * @param {number} y - 起始Y坐标
   * @param {number} targetX - 目标X坐标
   * @param {number} targetY - 目标Y坐标
   * @param {Object} options - 可选参数
   */
  addNeonTrail(x, y, targetX, targetY, options = {}) {
    const {
      color = '#00D4FF',
      segments = 8,
      duration = 600,
      thickness = 3
    } = options;

    this.addAnimation({
      type: 'neonTrail',
      startX: x,
      startY: y,
      targetX,
      targetY,
      color,
      segments,
      thickness,
      duration,
      startTime: Date.now(),
      // 动画参数
      trailPoints: []
    });
  }

  /**
   * 添加电光效果（随机闪电）
   * @param {number} x - 中心X坐标
   * @param {number} y - 中心Y坐标
   * @param {Object} options - 可选参数
   */
  addElectricEffect(x, y, options = {}) {
    const {
      color = '#39FF14',
      branches = 5,
      maxLength = 80,
      duration = 200,
      intensity = 1.0
    } = options;

    this.addAnimation({
      type: 'electric',
      x,
      y,
      color,
      branches,
      maxLength,
      duration,
      intensity,
      startTime: Date.now(),
      // 动画参数
      lightningPaths: this.generateLightningPaths(x, y, branches, maxLength)
    });
  }

  /**
   * 添加数据流效果（矩阵风格）
   * @param {number} x - X坐标
   * @param {number} y - Y坐标
   * @param {Object} options - 可选参数
   */
  addDataStream(x, y, options = {}) {
    const {
      color = '#00D4FF',
      characters = '01',
      count = 10,
      speed = 100,
      duration = 2000
    } = options;

    for (let i = 0; i < count; i++) {
      this.addAnimation({
        type: 'dataStream',
        x: x + (Math.random() - 0.5) * 40,
        y,
        color,
        character: characters[Math.floor(Math.random() * characters.length)],
        speed,
        duration,
        startTime: Date.now() + i * 50, // 错开时间
        // 动画参数
        opacity: Math.random() * 0.8 + 0.2
      });
    }
  }

  /**
   * 添加全息扫描效果
   * @param {number} x - 中心X坐标
   * @param {number} y - 中心Y坐标
   * @param {number} width - 扫描宽度
   * @param {number} height - 扫描高度
   * @param {Object} options - 可选参数
   */
  addHologramScan(x, y, width, height, options = {}) {
    const {
      color = '#00FFFF',
      lineCount = 3,
      duration = 1500,
      direction = 'vertical' // 'vertical' | 'horizontal'
    } = options;

    this.addAnimation({
      type: 'hologramScan',
      x,
      y,
      width,
      height,
      color,
      lineCount,
      duration,
      direction,
      startTime: Date.now(),
      // 动画参数
      scanPosition: 0
    });
  }

  /**
   * 添加动画到队列
   * @param {Object} animation - 动画对象
   */
  addAnimation(animation) {
    // 限制动画数量以优化性能
    if (this.animations.length >= this.maxAnimations) {
      this.animations.shift(); // 移除最旧的动画
    }

    this.animations.push(animation);
  }

  /**
   * 更新所有动画
   * @param {CanvasRenderingContext2D} ctx - Canvas 上下文
   */
  update(ctx) {
    const now = Date.now();
    
    // 过滤并更新动画
    this.animations = this.animations.filter(animation => {
      const elapsed = now - animation.startTime;
      
      // 检查动画是否已结束
      if (elapsed > animation.duration && !animation.repeat) {
        return false;
      }

      // 计算动画进度
      let progress = Math.min(elapsed / animation.duration, 1);
      
      // 对于重复动画，重置进度
      if (animation.repeat && progress >= 1) {
        animation.startTime = now;
        progress = 0;
      }

      // 渲染动画
      this.renderAnimation(ctx, animation, progress, elapsed);
      
      return true;
    });
  }

  /**
   * 渲染单个动画
   * @param {CanvasRenderingContext2D} ctx - Canvas 上下文
   * @param {Object} animation - 动画对象
   * @param {number} progress - 动画进度 (0-1)
   * @param {number} elapsed - 已过时间（毫秒）
   */
  renderAnimation(ctx, animation, progress, elapsed) {
    ctx.save();

    switch (animation.type) {
      case 'floatingText':
        this.renderFloatingText(ctx, animation, progress);
        break;
      case 'particle':
        this.renderParticle(ctx, animation, progress, elapsed);
        break;
      case 'ripple':
        this.renderRipple(ctx, animation, progress);
        break;
      case 'bounce':
        this.renderBounce(ctx, animation, progress);
        break;
      case 'pulse':
        this.renderPulse(ctx, animation, progress);
        break;
      case 'neonTrail':
        this.renderNeonTrail(ctx, animation, progress);
        break;
      case 'electric':
        this.renderElectric(ctx, animation, progress);
        break;
      case 'dataStream':
        this.renderDataStream(ctx, animation, progress, elapsed);
        break;
      case 'hologramScan':
        this.renderHologramScan(ctx, animation, progress);
        break;
    }

    ctx.restore();
  }

  /**
   * 渲染浮动文字动画（赛博朋克风格）
   */
  renderFloatingText(ctx, animation, progress) {
    const { x, y, text, color, size, velocity, fadeStart } = animation;
    
    // 计算当前位置
    const currentY = y + velocity * progress;
    
    // 计算透明度
    let opacity = 1;
    if (progress > fadeStart) {
      opacity = 1 - (progress - fadeStart) / (1 - fadeStart);
    }

    ctx.globalAlpha = opacity;
    ctx.fillStyle = color;
    ctx.font = `bold ${size}px "Courier New", monospace`; // 使用等宽字体
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // 添加霓虹发光效果
    ctx.shadowColor = color;
    ctx.shadowBlur = 15;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    
    ctx.fillText(text, x, currentY);
    
    // 添加内层高亮
    ctx.shadowBlur = 5;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(text, x, currentY);
  }

  /**
   * 渲染粒子动画
   */
  renderParticle(ctx, animation, progress, elapsed) {
    const { x, y, color, size, vx, vy, gravity, friction } = animation;
    
    // 计算当前位置（考虑重力和摩擦）
    const t = elapsed / 1000; // 转换为秒
    const currentX = x + vx * t * Math.pow(friction, t);
    const currentY = y + vy * t * Math.pow(friction, t) + 0.5 * gravity * t * t;
    
    // 计算透明度
    const opacity = 1 - progress;
    
    // 计算大小（随时间缩小）
    const currentSize = size * (1 - progress * 0.3);

    ctx.globalAlpha = opacity;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(currentX, currentY, currentSize, 0, Math.PI * 2);
    ctx.fill();
  }

  /**
   * 渲染波纹动画
   */
  renderRipple(ctx, animation, progress) {
    const { x, y, maxRadius, color, lineWidth, fadeStart } = animation;
    
    // 计算当前半径
    const currentRadius = maxRadius * progress;
    
    // 计算透明度
    let opacity = 1;
    if (progress > fadeStart) {
      opacity = 1 - (progress - fadeStart) / (1 - fadeStart);
    }

    ctx.globalAlpha = opacity;
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    ctx.arc(x, y, currentRadius, 0, Math.PI * 2);
    ctx.stroke();
  }

  /**
   * 渲染弹跳动画
   */
  renderBounce(ctx, animation, progress) {
    const { x, y, size, color, maxScale, bounceType } = animation;
    
    // 计算缩放比例
    let scale;
    if (bounceType === 'elastic') {
      // 弹性效果
      scale = 1 + (maxScale - 1) * Math.sin(progress * Math.PI) * (1 - progress * 0.3);
    } else {
      // 简单效果
      scale = 1 + (maxScale - 1) * (1 - Math.abs(2 * progress - 1));
    }

    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(0, 0, size, 0, Math.PI * 2);
    ctx.fill();
  }

  /**
   * 渲染脉冲动画
   */
  renderPulse(ctx, animation, progress) {
    const { x, y, radius, color, lineWidth } = animation;
    
    // 计算脉冲效果
    const pulseScale = 0.8 + 0.4 * Math.sin(progress * Math.PI * 2);
    const currentRadius = radius * pulseScale;
    
    // 计算透明度
    const opacity = 0.6 + 0.4 * Math.sin(progress * Math.PI * 2);

    ctx.globalAlpha = opacity;
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    ctx.arc(x, y, currentRadius, 0, Math.PI * 2);
    ctx.stroke();
  }

  /**
   * 渲染霓虹拖尾效果
   */
  renderNeonTrail(ctx, animation, progress) {
    const { startX, startY, targetX, targetY, color, segments, thickness } = animation;
    
    // 计算当前拖尾长度
    const trailLength = progress;
    
    ctx.strokeStyle = color;
    ctx.lineWidth = thickness;
    ctx.shadowColor = color;
    ctx.shadowBlur = 15;
    
    // 绘制主拖尾
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    
    const deltaX = targetX - startX;
    const deltaY = targetY - startY;
    
    for (let i = 1; i <= segments; i++) {
      const segmentProgress = (i / segments) * trailLength;
      const x = startX + deltaX * segmentProgress;
      const y = startY + deltaY * segmentProgress;
      
      // 添加一些随机波动
      const waveX = x + Math.sin(segmentProgress * Math.PI * 4) * 2;
      const waveY = y + Math.cos(segmentProgress * Math.PI * 4) * 2;
      
      ctx.lineTo(waveX, waveY);
    }
    
    ctx.stroke();
    
    // 绘制发光核心
    ctx.shadowBlur = 5;
    ctx.lineWidth = thickness * 0.3;
    ctx.strokeStyle = '#FFFFFF';
    ctx.stroke();
  }

  /**
   * 渲染电光效果
   */
  renderElectric(ctx, animation, progress) {
    const { x, y, color, lightningPaths, intensity } = animation;
    
    // 闪烁效果
    const flicker = Math.random() > 0.3 ? 1 : 0;
    if (!flicker) return;
    
    ctx.strokeStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 20 * intensity;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.8 + Math.random() * 0.2;
    
    // 绘制所有闪电路径
    lightningPaths.forEach(path => {
      ctx.beginPath();
      ctx.moveTo(path[0].x, path[0].y);
      
      for (let i = 1; i < path.length; i++) {
        ctx.lineTo(path[i].x, path[i].y);
      }
      
      ctx.stroke();
    });
  }

  /**
   * 渲染数据流效果
   */
  renderDataStream(ctx, animation, progress, elapsed) {
    const { x, y, color, character, speed, opacity } = animation;
    
    // 计算当前位置
    const currentY = y + speed * (elapsed / 1000);
    
    // 计算透明度（随时间淡出）
    const currentOpacity = opacity * (1 - progress);
    
    ctx.globalAlpha = currentOpacity;
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 8;
    ctx.font = `bold 14px "Courier New", monospace`;
    ctx.textAlign = 'center';
    ctx.fillText(character, x, currentY);
  }

  /**
   * 渲染全息扫描效果
   */
  renderHologramScan(ctx, animation, progress) {
    const { x, y, width, height, color, lineCount, direction } = animation;
    
    ctx.strokeStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.7;
    
    for (let i = 0; i < lineCount; i++) {
      const offset = (i / lineCount) * 0.2; // 错开扫描线
      const scanProgress = (progress + offset) % 1;
      
      if (direction === 'vertical') {
        const scanY = y + height * scanProgress;
        ctx.beginPath();
        ctx.moveTo(x, scanY);
        ctx.lineTo(x + width, scanY);
        ctx.stroke();
      } else {
        const scanX = x + width * scanProgress;
        ctx.beginPath();
        ctx.moveTo(scanX, y);
        ctx.lineTo(scanX, y + height);
        ctx.stroke();
      }
    }
  }

  /**
   * 生成闪电路径
   */
  generateLightningPaths(centerX, centerY, branches, maxLength) {
    const paths = [];
    
    for (let i = 0; i < branches; i++) {
      const angle = (Math.PI * 2 * i) / branches + Math.random() * 0.5;
      const path = [{ x: centerX, y: centerY }];
      
      let currentX = centerX;
      let currentY = centerY;
      const segments = 5 + Math.floor(Math.random() * 5);
      
      for (let j = 0; j < segments; j++) {
        const segmentLength = (maxLength / segments) * (0.5 + Math.random() * 0.5);
        const segmentAngle = angle + (Math.random() - 0.5) * 0.8;
        
        currentX += Math.cos(segmentAngle) * segmentLength;
        currentY += Math.sin(segmentAngle) * segmentLength;
        
        path.push({ x: currentX, y: currentY });
      }
      
      paths.push(path);
    }
    
    return paths;
  }

  /**
   * 清除所有动画
   */
  clearAll() {
    this.animations = [];
  }

  /**
   * 清除指定类型的动画
   * @param {string} type - 动画类型
   */
  clearByType(type) {
    this.animations = this.animations.filter(animation => animation.type !== type);
  }

  /**
   * 获取当前动画数量
   * @returns {number}
   */
  getAnimationCount() {
    return this.animations.length;
  }

  /**
   * 设置最大动画数量
   * @param {number} max - 最大数量
   */
  setMaxAnimations(max) {
    this.maxAnimations = Math.max(1, max);
    
    // 如果当前动画数量超过限制，移除多余的
    while (this.animations.length > this.maxAnimations) {
      this.animations.shift();
    }
  }
}

// 导出类
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AnimationEngine;
} else if (typeof window !== 'undefined') {
  window.AnimationEngine = AnimationEngine;
}