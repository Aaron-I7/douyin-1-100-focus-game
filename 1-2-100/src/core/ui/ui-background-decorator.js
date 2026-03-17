/**
 * BackgroundDecorator - 背景装饰系统
 * 为游戏背景添加装饰性元素：半透明圆点图案、动态效果等
 * 需求: 15.6 - 添加装饰性元素
 */

class BackgroundDecorator {
  constructor(themeSystem) {
    this.themeSystem = themeSystem;
    this.decorativeElements = [];
    this.animationTime = 0;
    this.initialized = false;
  }

  /**
   * 初始化装饰元素
   * @param {number} width - 画布宽度
   * @param {number} height - 画布高度
   */
  initialize(width, height) {
    this.width = width;
    this.height = height;
    this.generateDecorativeElements();
    this.initialized = true;
  }

  /**
   * 生成装饰性元素
   */
  generateDecorativeElements() {
    this.decorativeElements = [];
    
    // 生成半透明圆点图案
    this.generateDotPattern();
    
    // 生成几何装饰
    this.generateGeometricShapes();
    
    // 生成动态粒子（可选）
    this.generateFloatingParticles();
  }

  /**
   * 生成半透明圆点图案
   */
  generateDotPattern() {
    const theme = this.themeSystem.getThemeColors();
    const dotCount = Math.floor((this.width * this.height) / 15000); // 根据屏幕大小调整密度
    
    for (let i = 0; i < dotCount; i++) {
      const size = 2 + Math.random() * 8; // 2-10px 的圆点
      const opacity = 0.1 + Math.random() * 0.2; // 10%-30% 透明度
      
      // 使用主题色彩
      const colors = [
        theme.primary,
        theme.secondary,
        theme.accent,
        '#FFFFFF'
      ];
      
      this.decorativeElements.push({
        type: 'dot',
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        size: size,
        color: colors[Math.floor(Math.random() * colors.length)],
        opacity: opacity,
        baseOpacity: opacity,
        pulseSpeed: 0.5 + Math.random() * 1.5, // 脉冲速度
        pulsePhase: Math.random() * Math.PI * 2 // 脉冲相位
      });
    }
  }

  /**
   * 生成几何装饰形状
   */
  generateGeometricShapes() {
    const theme = this.themeSystem.getThemeColors();
    const shapeCount = 8 + Math.floor(Math.random() * 12); // 8-20个形状
    
    for (let i = 0; i < shapeCount; i++) {
      const shapeType = ['circle', 'triangle', 'diamond'][Math.floor(Math.random() * 3)];
      const size = 15 + Math.random() * 40; // 15-55px
      
      this.decorativeElements.push({
        type: 'shape',
        shapeType: shapeType,
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        size: size,
        color: theme.effects.particle[Math.floor(Math.random() * theme.effects.particle.length)],
        opacity: 0.05 + Math.random() * 0.15, // 5%-20% 透明度
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.02 // 缓慢旋转
      });
    }
  }

  /**
   * 生成浮动粒子（动态背景效果）
   */
  generateFloatingParticles() {
    const theme = this.themeSystem.getThemeColors();
    const particleCount = 15 + Math.floor(Math.random() * 10); // 15-25个粒子
    
    for (let i = 0; i < particleCount; i++) {
      this.decorativeElements.push({
        type: 'floatingParticle',
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        size: 1 + Math.random() * 3, // 1-4px
        color: theme.effects.particle[Math.floor(Math.random() * theme.effects.particle.length)],
        opacity: 0.3 + Math.random() * 0.4, // 30%-70% 透明度
        vx: (Math.random() - 0.5) * 0.5, // 水平速度
        vy: (Math.random() - 0.5) * 0.5, // 垂直速度
        life: 1.0, // 生命值
        maxLife: 5000 + Math.random() * 10000 // 5-15秒生命周期
      });
    }
  }

  /**
   * 更新动画状态
   * @param {number} deltaTime - 时间增量（毫秒）
   */
  update(deltaTime) {
    if (!this.initialized) return;
    
    this.animationTime += deltaTime;
    
    this.decorativeElements.forEach(element => {
      switch (element.type) {
        case 'dot':
          // 脉冲动画
          const pulseValue = Math.sin(this.animationTime * 0.001 * element.pulseSpeed + element.pulsePhase);
          element.opacity = element.baseOpacity + pulseValue * 0.1;
          break;
          
        case 'shape':
          // 旋转动画
          element.rotation += element.rotationSpeed;
          break;
          
        case 'floatingParticle':
          // 浮动动画
          element.x += element.vx;
          element.y += element.vy;
          
          // 边界检测和反弹
          if (element.x < 0 || element.x > this.width) {
            element.vx *= -1;
            element.x = Math.max(0, Math.min(this.width, element.x));
          }
          if (element.y < 0 || element.y > this.height) {
            element.vy *= -1;
            element.y = Math.max(0, Math.min(this.height, element.y));
          }
          
          // 生命周期管理
          element.life -= deltaTime / element.maxLife;
          if (element.life <= 0) {
            // 重新生成粒子
            element.x = Math.random() * this.width;
            element.y = Math.random() * this.height;
            element.life = 1.0;
            element.vx = (Math.random() - 0.5) * 0.5;
            element.vy = (Math.random() - 0.5) * 0.5;
          }
          break;
      }
    });
  }

  /**
   * 渲染装饰元素
   * @param {CanvasRenderingContext2D} ctx - Canvas 2D 上下文
   */
  render(ctx) {
    if (!this.initialized) return;
    
    ctx.save();
    
    this.decorativeElements.forEach(element => {
      ctx.save();
      ctx.globalAlpha = element.opacity;
      
      switch (element.type) {
        case 'dot':
          this.renderDot(ctx, element);
          break;
          
        case 'shape':
          this.renderShape(ctx, element);
          break;
          
        case 'floatingParticle':
          this.renderFloatingParticle(ctx, element);
          break;
      }
      
      ctx.restore();
    });
    
    ctx.restore();
  }

  /**
   * 渲染圆点
   * @param {CanvasRenderingContext2D} ctx - Canvas 2D 上下文
   * @param {Object} dot - 圆点元素
   */
  renderDot(ctx, dot) {
    ctx.fillStyle = dot.color;
    ctx.beginPath();
    ctx.arc(dot.x, dot.y, dot.size, 0, Math.PI * 2);
    ctx.fill();
  }

  /**
   * 渲染几何形状
   * @param {CanvasRenderingContext2D} ctx - Canvas 2D 上下文
   * @param {Object} shape - 形状元素
   */
  renderShape(ctx, shape) {
    ctx.fillStyle = shape.color;
    ctx.translate(shape.x, shape.y);
    ctx.rotate(shape.rotation);
    
    ctx.beginPath();
    
    switch (shape.shapeType) {
      case 'circle':
        ctx.arc(0, 0, shape.size, 0, Math.PI * 2);
        break;
        
      case 'triangle':
        const h = shape.size * Math.sqrt(3) / 2;
        ctx.moveTo(0, -h / 2);
        ctx.lineTo(-shape.size / 2, h / 2);
        ctx.lineTo(shape.size / 2, h / 2);
        ctx.closePath();
        break;
        
      case 'diamond':
        ctx.moveTo(0, -shape.size);
        ctx.lineTo(shape.size, 0);
        ctx.lineTo(0, shape.size);
        ctx.lineTo(-shape.size, 0);
        ctx.closePath();
        break;
    }
    
    ctx.fill();
  }

  /**
   * 渲染浮动粒子
   * @param {CanvasRenderingContext2D} ctx - Canvas 2D 上下文
   * @param {Object} particle - 粒子元素
   */
  renderFloatingParticle(ctx, particle) {
    ctx.fillStyle = particle.color;
    ctx.globalAlpha = particle.opacity * particle.life; // 生命值影响透明度
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    ctx.fill();
  }

  /**
   * 重新初始化（屏幕尺寸变化时调用）
   * @param {number} width - 新的画布宽度
   * @param {number} height - 新的画布高度
   */
  resize(width, height) {
    this.width = width;
    this.height = height;
    this.generateDecorativeElements();
  }

  /**
   * 启用/禁用动态效果
   * @param {boolean} enabled - 是否启用
   */
  setDynamicEffectsEnabled(enabled) {
    if (!enabled) {
      // 移除浮动粒子
      this.decorativeElements = this.decorativeElements.filter(
        element => element.type !== 'floatingParticle'
      );
    } else if (!this.decorativeElements.some(element => element.type === 'floatingParticle')) {
      // 重新生成浮动粒子
      this.generateFloatingParticles();
    }
  }
}

// 导出 BackgroundDecorator 类
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BackgroundDecorator;
} else if (typeof window !== 'undefined') {
  window.BackgroundDecorator = BackgroundDecorator;
}