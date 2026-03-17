/**
 * LevelTransitionAnimator - 关卡过渡动画系统
 * 实现淡入淡出效果、粒子庆祝效果和鼓励文字动画
 * 需求: 15.6 - 添加装饰性元素
 */

class LevelTransitionAnimator {
  constructor(themeSystem, animationEngine) {
    this.themeSystem = themeSystem;
    this.animationEngine = animationEngine;
    this.isActive = false;
    this.animations = [];
    this.currentTransition = null;
  }

  /**
   * 开始关卡过渡动画
   * @param {Object} transitionConfig - 过渡配置
   * @returns {Promise} 动画完成的 Promise
   */
  async startTransition(transitionConfig) {
    if (this.isActive) {
      await this.stopCurrentTransition();
    }

    this.isActive = true;
    this.currentTransition = this.createTransitionData(transitionConfig);
    
    return new Promise((resolve) => {
      this.currentTransition.onComplete = resolve;
      this.initializeTransitionAnimations();
    });
  }

  /**
   * 创建过渡数据
   * @param {Object} config - 配置对象
   * @returns {Object} 过渡数据
   */
  createTransitionData(config) {
    const theme = this.themeSystem.getThemeColors();
    
    return {
      type: config.type || 'levelComplete', // 'levelComplete' | 'levelStart' | 'gameComplete'
      fromLevel: config.fromLevel,
      toLevel: config.toLevel,
      duration: config.duration || 3000, // 3秒总时长
      startTime: Date.now(),
      
      // 阶段配置
      phases: {
        fadeIn: { start: 0, duration: 500 },      // 淡入阶段
        celebration: { start: 500, duration: 1500 }, // 庆祝阶段
        message: { start: 800, duration: 1200 },   // 消息显示阶段
        fadeOut: { start: 2500, duration: 500 }   // 淡出阶段
      },
      
      // 视觉元素
      overlay: {
        opacity: 0,
        maxOpacity: 0.85,
        color: 'rgba(0, 0, 0, 0.85)'
      },
      
      // 文字配置
      text: this.getTransitionText(config),
      textAnimations: {
        mainText: { scale: 0, opacity: 0, y: 0 },
        subText: { scale: 0, opacity: 0, y: 0 }
      },
      
      // 粒子效果
      particles: [],
      particleConfig: {
        count: 30,
        colors: theme.effects.particle,
        size: { min: 3, max: 8 },
        speed: { min: 2, max: 6 },
        life: { min: 1000, max: 2000 }
      },
      
      // 几何装饰
      decorations: [],
      decorationConfig: {
        count: 8,
        shapes: ['star', 'diamond', 'circle'],
        colors: [theme.accent, theme.secondary, theme.primary]
      },
      
      onComplete: null
    };
  }

  /**
   * 获取过渡文字内容
   * @param {Object} config - 配置对象
   * @returns {Object} 文字配置
   */
  getTransitionText(config) {
    const textConfigs = {
      levelComplete: {
        1: {
          main: '🎉 第一关完成！',
          sub: '准备好迎接挑战了吗？',
          encouragement: '难度飙升！！！'
        },
        2: {
          main: '🏆 恭喜通关！',
          sub: '你的专注力令人惊叹！',
          encouragement: '自选模式已解锁'
        }
      },
      levelStart: {
        1: {
          main: '🎯 第一关',
          sub: '找到 1-10 的数字',
          encouragement: '保持专注！'
        },
        2: {
          main: '🔥 第二关',
          sub: '挑战 1-100 的数字',
          encouragement: '你能做到的！'
        }
      },
      gameComplete: {
        main: '🌟 游戏完成！',
        sub: '感谢游玩！',
        encouragement: '再来一局？'
      }
    };

    const typeConfig = textConfigs[config.type];
    if (config.type === 'gameComplete') {
      return typeConfig;
    }
    
    return typeConfig[config.fromLevel] || typeConfig[1];
  }

  /**
   * 初始化过渡动画
   */
  initializeTransitionAnimations() {
    this.generateParticleEffects();
    this.generateDecorationEffects();
    this.startPhaseAnimations();
  }

  /**
   * 生成粒子效果
   */
  generateParticleEffects() {
    const config = this.currentTransition.particleConfig;
    const canvas = { width: window.innerWidth, height: window.innerHeight };
    
    this.currentTransition.particles = [];
    
    for (let i = 0; i < config.count; i++) {
      const angle = (Math.PI * 2 * i) / config.count + Math.random() * 0.5;
      const speed = config.speed.min + Math.random() * (config.speed.max - config.speed.min);
      const size = config.size.min + Math.random() * (config.size.max - config.size.min);
      const life = config.life.min + Math.random() * (config.life.max - config.life.min);
      
      this.currentTransition.particles.push({
        x: canvas.width / 2,
        y: canvas.height / 2,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: size,
        color: config.colors[Math.floor(Math.random() * config.colors.length)],
        life: life,
        maxLife: life,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.1,
        trail: [] // 粒子轨迹
      });
    }
  }

  /**
   * 生成装饰效果
   */
  generateDecorationEffects() {
    const config = this.currentTransition.decorationConfig;
    const canvas = { width: window.innerWidth, height: window.innerHeight };
    
    this.currentTransition.decorations = [];
    
    for (let i = 0; i < config.count; i++) {
      this.currentTransition.decorations.push({
        type: config.shapes[Math.floor(Math.random() * config.shapes.length)],
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: 20 + Math.random() * 30,
        color: config.colors[Math.floor(Math.random() * config.colors.length)],
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.05,
        scale: 0,
        targetScale: 0.8 + Math.random() * 0.4,
        opacity: 0,
        targetOpacity: 0.6 + Math.random() * 0.3,
        animationDelay: Math.random() * 1000
      });
    }
  }

  /**
   * 开始阶段动画
   */
  startPhaseAnimations() {
    const transition = this.currentTransition;
    const phases = transition.phases;
    
    // 淡入阶段
    setTimeout(() => {
      this.animateOverlayFadeIn();
    }, phases.fadeIn.start);
    
    // 庆祝阶段
    setTimeout(() => {
      this.animateCelebrationEffects();
    }, phases.celebration.start);
    
    // 消息阶段
    setTimeout(() => {
      this.animateTextMessages();
    }, phases.message.start);
    
    // 淡出阶段
    setTimeout(() => {
      this.animateOverlayFadeOut();
    }, phases.fadeOut.start);
    
    // 完成回调
    setTimeout(() => {
      this.completeTransition();
    }, transition.duration);
  }

  /**
   * 动画化覆盖层淡入
   */
  animateOverlayFadeIn() {
    const transition = this.currentTransition;
    const duration = transition.phases.fadeIn.duration;
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      transition.overlay.opacity = progress * transition.overlay.maxOpacity;
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    animate();
  }

  /**
   * 动画化庆祝效果
   */
  animateCelebrationEffects() {
    // 启动粒子动画
    this.startParticleAnimation();
    
    // 启动装饰动画
    this.startDecorationAnimation();
  }

  /**
   * 启动粒子动画
   */
  startParticleAnimation() {
    const particles = this.currentTransition.particles;
    const startTime = Date.now();
    
    const animate = () => {
      if (!this.isActive) return;
      
      const elapsed = Date.now() - startTime;
      
      particles.forEach(particle => {
        // 更新位置
        particle.x += particle.vx;
        particle.y += particle.vy;
        
        // 更新旋转
        particle.rotation += particle.rotationSpeed;
        
        // 更新生命值
        particle.life -= 16; // 假设 60fps
        
        // 添加轨迹点
        particle.trail.push({ x: particle.x, y: particle.y, opacity: particle.life / particle.maxLife });
        if (particle.trail.length > 10) {
          particle.trail.shift();
        }
        
        // 重力效果
        particle.vy += 0.1;
        
        // 空气阻力
        particle.vx *= 0.99;
        particle.vy *= 0.99;
      });
      
      // 移除死亡粒子
      this.currentTransition.particles = particles.filter(p => p.life > 0);
      
      if (this.currentTransition.particles.length > 0) {
        requestAnimationFrame(animate);
      }
    };
    
    animate();
  }

  /**
   * 启动装饰动画
   */
  startDecorationAnimation() {
    const decorations = this.currentTransition.decorations;
    const startTime = Date.now();
    
    const animate = () => {
      if (!this.isActive) return;
      
      const elapsed = Date.now() - startTime;
      
      decorations.forEach(decoration => {
        if (elapsed > decoration.animationDelay) {
          const animationTime = elapsed - decoration.animationDelay;
          const progress = Math.min(animationTime / 1000, 1); // 1秒动画
          
          // 缓动函数
          const easeOut = 1 - Math.pow(1 - progress, 3);
          
          decoration.scale = decoration.targetScale * easeOut;
          decoration.opacity = decoration.targetOpacity * easeOut;
          decoration.rotation += decoration.rotationSpeed;
        }
      });
      
      if (elapsed < 2000) { // 2秒装饰动画
        requestAnimationFrame(animate);
      }
    };
    
    animate();
  }

  /**
   * 动画化文字消息
   */
  animateTextMessages() {
    const transition = this.currentTransition;
    const duration = transition.phases.message.duration;
    
    // 主文字动画
    this.animateText('mainText', 0, duration * 0.6);
    
    // 副文字动画（延迟启动）
    setTimeout(() => {
      this.animateText('subText', 0, duration * 0.4);
    }, 300);
  }

  /**
   * 动画化单个文字
   * @param {string} textType - 文字类型
   * @param {number} delay - 延迟时间
   * @param {number} duration - 动画时长
   */
  animateText(textType, delay, duration) {
    const textAnim = this.currentTransition.textAnimations[textType];
    const startTime = Date.now() + delay;
    
    const animate = () => {
      if (!this.isActive) return;
      
      const elapsed = Date.now() - startTime;
      if (elapsed < 0) {
        requestAnimationFrame(animate);
        return;
      }
      
      const progress = Math.min(elapsed / duration, 1);
      
      // 弹性缓动
      const elasticOut = progress === 1 ? 1 : 
        1 - Math.pow(2, -10 * progress) * Math.sin((progress * 10 - 0.75) * (2 * Math.PI) / 3);
      
      textAnim.scale = elasticOut;
      textAnim.opacity = progress;
      textAnim.y = (1 - progress) * -50; // 从上方滑入
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    animate();
  }

  /**
   * 动画化覆盖层淡出
   */
  animateOverlayFadeOut() {
    const transition = this.currentTransition;
    const duration = transition.phases.fadeOut.duration;
    const startTime = Date.now();
    const startOpacity = transition.overlay.opacity;
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      transition.overlay.opacity = startOpacity * (1 - progress);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    animate();
  }

  /**
   * 完成过渡
   */
  completeTransition() {
    this.isActive = false;
    
    if (this.currentTransition && this.currentTransition.onComplete) {
      this.currentTransition.onComplete();
    }
    
    this.currentTransition = null;
  }

  /**
   * 停止当前过渡
   * @returns {Promise} 停止完成的 Promise
   */
  async stopCurrentTransition() {
    return new Promise((resolve) => {
      if (!this.isActive) {
        resolve();
        return;
      }
      
      this.isActive = false;
      this.currentTransition = null;
      
      // 给一个短暂的延迟确保动画停止
      setTimeout(resolve, 100);
    });
  }

  /**
   * 渲染过渡效果
   * @param {CanvasRenderingContext2D} ctx - Canvas 2D 上下文
   * @param {number} width - 画布宽度
   * @param {number} height - 画布高度
   */
  render(ctx, width, height) {
    if (!this.isActive || !this.currentTransition) return;
    
    ctx.save();
    
    // 1. 渲染覆盖层
    this.renderOverlay(ctx, width, height);
    
    // 2. 渲染装饰效果
    this.renderDecorations(ctx);
    
    // 3. 渲染粒子效果
    this.renderParticles(ctx);
    
    // 4. 渲染文字
    this.renderText(ctx, width, height);
    
    ctx.restore();
  }

  /**
   * 渲染覆盖层
   * @param {CanvasRenderingContext2D} ctx - Canvas 2D 上下文
   * @param {number} width - 画布宽度
   * @param {number} height - 画布高度
   */
  renderOverlay(ctx, width, height) {
    const overlay = this.currentTransition.overlay;
    
    ctx.save();
    ctx.globalAlpha = overlay.opacity / overlay.maxOpacity;
    ctx.fillStyle = overlay.color;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }

  /**
   * 渲染装饰效果
   * @param {CanvasRenderingContext2D} ctx - Canvas 2D 上下文
   */
  renderDecorations(ctx) {
    const decorations = this.currentTransition.decorations;
    
    decorations.forEach(decoration => {
      if (decoration.scale <= 0 || decoration.opacity <= 0) return;
      
      ctx.save();
      ctx.globalAlpha = decoration.opacity;
      ctx.translate(decoration.x, decoration.y);
      ctx.rotate(decoration.rotation);
      ctx.scale(decoration.scale, decoration.scale);
      
      ctx.fillStyle = decoration.color;
      
      switch (decoration.type) {
        case 'star':
          this.drawStar(ctx, 0, 0, decoration.size);
          break;
        case 'diamond':
          this.drawDiamond(ctx, 0, 0, decoration.size);
          break;
        case 'circle':
          ctx.beginPath();
          ctx.arc(0, 0, decoration.size, 0, Math.PI * 2);
          ctx.fill();
          break;
      }
      
      ctx.restore();
    });
  }

  /**
   * 渲染粒子效果
   * @param {CanvasRenderingContext2D} ctx - Canvas 2D 上下文
   */
  renderParticles(ctx) {
    const particles = this.currentTransition.particles;
    
    particles.forEach(particle => {
      const opacity = particle.life / particle.maxLife;
      
      // 渲染轨迹
      if (particle.trail.length > 1) {
        ctx.save();
        ctx.strokeStyle = particle.color;
        ctx.lineWidth = particle.size * 0.5;
        ctx.globalAlpha = opacity * 0.3;
        
        ctx.beginPath();
        ctx.moveTo(particle.trail[0].x, particle.trail[0].y);
        for (let i = 1; i < particle.trail.length; i++) {
          ctx.lineTo(particle.trail[i].x, particle.trail[i].y);
        }
        ctx.stroke();
        ctx.restore();
      }
      
      // 渲染粒子
      ctx.save();
      ctx.globalAlpha = opacity;
      ctx.translate(particle.x, particle.y);
      ctx.rotate(particle.rotation);
      
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(0, 0, particle.size, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.restore();
    });
  }

  /**
   * 渲染文字
   * @param {CanvasRenderingContext2D} ctx - Canvas 2D 上下文
   * @param {number} width - 画布宽度
   * @param {number} height - 画布高度
   */
  renderText(ctx, width, height) {
    const text = this.currentTransition.text;
    const textAnims = this.currentTransition.textAnimations;
    const centerX = width / 2;
    const centerY = height / 2;
    
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // 渲染主文字
    if (textAnims.mainText.opacity > 0) {
      ctx.save();
      ctx.globalAlpha = textAnims.mainText.opacity;
      ctx.translate(centerX, centerY - 40 + textAnims.mainText.y);
      ctx.scale(textAnims.mainText.scale, textAnims.mainText.scale);
      
      ctx.fillStyle = this.themeSystem.getThemeColors().accent;
      ctx.font = `bold ${Math.floor(width * 0.08)}px "PingFang SC", sans-serif`;
      ctx.fillText(text.main, 0, 0);
      
      ctx.restore();
    }
    
    // 渲染副文字
    if (textAnims.subText.opacity > 0) {
      ctx.save();
      ctx.globalAlpha = textAnims.subText.opacity;
      ctx.translate(centerX, centerY + 20 + textAnims.subText.y);
      ctx.scale(textAnims.subText.scale, textAnims.subText.scale);
      
      ctx.fillStyle = '#FFFFFF';
      ctx.font = `${Math.floor(width * 0.05)}px "PingFang SC", sans-serif`;
      ctx.fillText(text.sub, 0, 0);
      
      ctx.restore();
    }
    
    ctx.restore();
  }

  /**
   * 绘制星形
   * @param {CanvasRenderingContext2D} ctx - Canvas 2D 上下文
   * @param {number} x - X 坐标
   * @param {number} y - Y 坐标
   * @param {number} size - 尺寸
   */
  drawStar(ctx, x, y, size) {
    const spikes = 5;
    const outerRadius = size;
    const innerRadius = size * 0.4;
    
    ctx.beginPath();
    for (let i = 0; i < spikes * 2; i++) {
      const angle = (i * Math.PI) / spikes;
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const px = x + Math.cos(angle) * radius;
      const py = y + Math.sin(angle) * radius;
      
      if (i === 0) {
        ctx.moveTo(px, py);
      } else {
        ctx.lineTo(px, py);
      }
    }
    ctx.closePath();
    ctx.fill();
  }

  /**
   * 绘制菱形
   * @param {CanvasRenderingContext2D} ctx - Canvas 2D 上下文
   * @param {number} x - X 坐标
   * @param {number} y - Y 坐标
   * @param {number} size - 尺寸
   */
  drawDiamond(ctx, x, y, size) {
    ctx.beginPath();
    ctx.moveTo(x, y - size);
    ctx.lineTo(x + size, y);
    ctx.lineTo(x, y + size);
    ctx.lineTo(x - size, y);
    ctx.closePath();
    ctx.fill();
  }

  /**
   * 检查是否正在过渡
   * @returns {boolean} 是否正在过渡
   */
  isTransitioning() {
    return this.isActive;
  }
}

// 导出 LevelTransitionAnimator 类
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LevelTransitionAnimator;
} else if (typeof window !== 'undefined') {
  window.LevelTransitionAnimator = LevelTransitionAnimator;
}