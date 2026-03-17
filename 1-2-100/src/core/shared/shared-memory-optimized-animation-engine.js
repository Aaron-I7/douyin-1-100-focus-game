/**
 * 内存优化的动画引擎
 * 集成内存管理器，自动清理过期动画，限制动画队列长度
 */

class MemoryOptimizedAnimationEngine {
  constructor(memoryManager = null) {
    this.memoryManager = memoryManager;
    
    // 动画队列
    this.animations = [];
    this.maxAnimations = 30;
    
    // 对象池
    this.animationPool = [];
    this.poolSize = 50;
    
    // 性能监控
    this.performanceMetrics = {
      activeAnimations: 0,
      pooledAnimations: 0,
      totalCreated: 0,
      totalRecycled: 0,
      memoryUsage: 0
    };
    
    // 清理配置
    this.cleanupConfig = {
      maxAge: 10000,        // 最大动画生存时间（毫秒）
      cleanupInterval: 1000, // 清理间隔
      batchSize: 10         // 批量处理大小
    };
    
    // 初始化对象池
    this.initializePool();
    
    // 注册到内存管理器
    if (this.memoryManager) {
      this.memoryManager.registerAnimationQueue('main', this.animations);
      this.memoryManager.registerManagedObject(this);
    }
    
    // 定期清理
    this.startCleanupTimer();
  }
  
  /**
   * 初始化对象池
   */
  initializePool() {
    for (let i = 0; i < this.poolSize; i++) {
      this.animationPool.push(this.createEmptyAnimation());
    }
  }
  
  /**
   * 创建空动画对象
   */
  createEmptyAnimation() {
    return {
      type: null,
      x: 0,
      y: 0,
      startTime: 0,
      duration: 0,
      progress: 0,
      active: false,
      // 可重用的属性
      text: '',
      color: '',
      size: 0,
      vx: 0,
      vy: 0,
      maxRadius: 0,
      // 清理方法
      reset: function() {
        this.type = null;
        this.x = 0;
        this.y = 0;
        this.startTime = 0;
        this.duration = 0;
        this.progress = 0;
        this.active = false;
        this.text = '';
        this.color = '';
        this.size = 0;
        this.vx = 0;
        this.vy = 0;
        this.maxRadius = 0;
      }
    };
  }
  
  /**
   * 从对象池获取动画对象
   */
  getAnimationFromPool() {
    if (this.animationPool.length > 0) {
      const animation = this.animationPool.pop();
      animation.reset();
      this.performanceMetrics.totalRecycled++;
      return animation;
    }
    
    // 池中没有可用对象，创建新的
    this.performanceMetrics.totalCreated++;
    return this.createEmptyAnimation();
  }
  
  /**
   * 将动画对象返回到池中
   */
  returnAnimationToPool(animation) {
    if (this.animationPool.length < this.poolSize) {
      animation.reset();
      this.animationPool.push(animation);
    }
    // 如果池已满，让对象被垃圾回收
  }
  
  /**
   * 添加浮动文字动画（内存优化版本）
   */
  addFloatingText(x, y, text, color = '#4ECDC4', size = 16, duration = 900) {
    // 检查动画数量限制
    if (this.animations.length >= this.maxAnimations) {
      this.forceCleanupOldAnimations();
    }
    
    const animation = this.getAnimationFromPool();
    animation.type = 'floatingText';
    animation.x = x;
    animation.y = y;
    animation.text = text;
    animation.color = color;
    animation.size = size;
    animation.startTime = Date.now();
    animation.duration = duration;
    animation.active = true;
    
    this.animations.push(animation);
    this.performanceMetrics.activeAnimations = this.animations.length;
  }
  
  /**
   * 添加粒子效果（内存优化版本）
   */
  addParticleEffect(x, y, count = 10, options = {}) {
    const maxParticles = Math.min(count, this.maxAnimations - this.animations.length);
    
    for (let i = 0; i < maxParticles; i++) {
      const animation = this.getAnimationFromPool();
      const angle = (Math.PI * 2 * i) / maxParticles;
      const speed = 2 + Math.random() * 2;
      
      animation.type = 'particle';
      animation.x = x;
      animation.y = y;
      animation.vx = Math.cos(angle) * speed;
      animation.vy = Math.sin(angle) * speed;
      animation.color = options.color || `hsl(${Math.random() * 360}, 70%, 60%)`;
      animation.size = 3 + Math.random() * 3;
      animation.startTime = Date.now();
      animation.duration = options.duration || 600;
      animation.active = true;
      
      this.animations.push(animation);
    }
    
    this.performanceMetrics.activeAnimations = this.animations.length;
  }
  
  /**
   * 添加波纹效果（内存优化版本）
   */
  addRippleEffect(x, y, maxRadius = 100, options = {}) {
    if (this.animations.length >= this.maxAnimations) {
      this.forceCleanupOldAnimations();
    }
    
    const animation = this.getAnimationFromPool();
    animation.type = 'ripple';
    animation.x = x;
    animation.y = y;
    animation.maxRadius = maxRadius;
    animation.color = options.color || '#4ECDC4';
    animation.startTime = Date.now();
    animation.duration = options.duration || 500;
    animation.active = true;
    
    this.animations.push(animation);
    this.performanceMetrics.activeAnimations = this.animations.length;
  }
  
  /**
   * 更新动画（批量处理优化）
   */
  update(ctx, deltaTime = 16) {
    if (this.animations.length === 0) return;
    
    const now = Date.now();
    const activeAnimations = [];
    const expiredAnimations = [];
    
    // 批量处理动画
    for (let i = 0; i < this.animations.length; i++) {
      const animation = this.animations[i];
      
      if (!animation.active) {
        expiredAnimations.push(animation);
        continue;
      }
      
      const elapsed = now - animation.startTime;
      
      if (elapsed > animation.duration) {
        expiredAnimations.push(animation);
        continue;
      }
      
      animation.progress = elapsed / animation.duration;
      this.renderAnimation(ctx, animation);
      activeAnimations.push(animation);
    }
    
    // 批量回收过期动画
    this.batchRecycleAnimations(expiredAnimations);
    
    // 更新动画数组
    this.animations = activeAnimations;
    this.performanceMetrics.activeAnimations = this.animations.length;
    this.performanceMetrics.pooledAnimations = this.animationPool.length;
  }
  
  /**
   * 批量回收动画对象
   */
  batchRecycleAnimations(animations) {
    for (const animation of animations) {
      this.returnAnimationToPool(animation);
    }
  }
  
  /**
   * 渲染单个动画
   */
  renderAnimation(ctx, animation) {
    ctx.save();
    
    switch (animation.type) {
      case 'floatingText':
        this.renderFloatingText(ctx, animation);
        break;
      case 'particle':
        this.renderParticle(ctx, animation);
        break;
      case 'ripple':
        this.renderRipple(ctx, animation);
        break;
    }
    
    ctx.restore();
  }
  
  /**
   * 渲染浮动文字
   */
  renderFloatingText(ctx, animation) {
    const y = animation.y - animation.progress * 60;
    const opacity = 1 - animation.progress;
    
    ctx.globalAlpha = opacity;
    ctx.fillStyle = animation.color;
    ctx.font = `bold ${animation.size}px "Courier New", monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(animation.text, animation.x, y);
  }
  
  /**
   * 渲染粒子
   */
  renderParticle(ctx, animation) {
    const x = animation.x + animation.vx * animation.progress * 100;
    const y = animation.y + animation.vy * animation.progress * 100;
    const opacity = 1 - animation.progress;
    const size = animation.size * (1 - animation.progress * 0.5);
    
    ctx.globalAlpha = opacity;
    ctx.fillStyle = animation.color;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }
  
  /**
   * 渲染波纹
   */
  renderRipple(ctx, animation) {
    const radius = animation.maxRadius * animation.progress;
    const opacity = (1 - animation.progress) * 0.8;
    
    ctx.globalAlpha = opacity;
    ctx.strokeStyle = animation.color;
    ctx.lineWidth = 3 * (1 - animation.progress);
    ctx.beginPath();
    ctx.arc(animation.x, animation.y, radius, 0, Math.PI * 2);
    ctx.stroke();
  }
  
  /**
   * 强制清理旧动画
   */
  forceCleanupOldAnimations() {
    const now = Date.now();
    const keepAnimations = [];
    const removeAnimations = [];
    
    // 按年龄排序，保留最新的动画
    this.animations.sort((a, b) => b.startTime - a.startTime);
    
    for (let i = 0; i < this.animations.length; i++) {
      const animation = this.animations[i];
      
      if (i < this.maxAnimations * 0.7) { // 保留70%的最新动画
        keepAnimations.push(animation);
      } else {
        removeAnimations.push(animation);
      }
    }
    
    // 回收被移除的动画
    this.batchRecycleAnimations(removeAnimations);
    
    this.animations = keepAnimations;
    console.log(`Force cleaned ${removeAnimations.length} animations`);
  }
  
  /**
   * 定期清理
   */
  startCleanupTimer() {
    setInterval(() => {
      this.performPeriodicCleanup();
    }, this.cleanupConfig.cleanupInterval);
  }
  
  /**
   * 执行定期清理
   */
  performPeriodicCleanup() {
    const now = Date.now();
    const activeAnimations = [];
    const expiredAnimations = [];
    
    for (const animation of this.animations) {
      const age = now - animation.startTime;
      
      if (age > this.cleanupConfig.maxAge || !animation.active) {
        expiredAnimations.push(animation);
      } else {
        activeAnimations.push(animation);
      }
    }
    
    if (expiredAnimations.length > 0) {
      this.batchRecycleAnimations(expiredAnimations);
      this.animations = activeAnimations;
      console.log(`Periodic cleanup: removed ${expiredAnimations.length} expired animations`);
    }
    
    // 更新内存使用指标
    this.updateMemoryMetrics();
  }
  
  /**
   * 更新内存指标
   */
  updateMemoryMetrics() {
    this.performanceMetrics.activeAnimations = this.animations.length;
    this.performanceMetrics.pooledAnimations = this.animationPool.length;
    
    // 估算内存使用（粗略计算）
    const animationSize = 200; // 每个动画对象大约200字节
    this.performanceMetrics.memoryUsage = 
      (this.animations.length + this.animationPool.length) * animationSize;
  }
  
  /**
   * 获取性能指标
   */
  getPerformanceMetrics() {
    this.updateMemoryMetrics();
    return { ...this.performanceMetrics };
  }
  
  /**
   * 设置最大动画数量
   */
  setMaxAnimations(max) {
    this.maxAnimations = Math.max(10, Math.min(100, max));
    
    // 如果当前动画数量超过新限制，进行清理
    if (this.animations.length > this.maxAnimations) {
      this.forceCleanupOldAnimations();
    }
  }
  
  /**
   * 清空所有动画
   */
  clearAllAnimations() {
    this.batchRecycleAnimations(this.animations);
    this.animations = [];
    this.performanceMetrics.activeAnimations = 0;
  }
  
  /**
   * 暂停所有动画
   */
  pauseAnimations() {
    for (const animation of this.animations) {
      animation.active = false;
    }
  }
  
  /**
   * 恢复所有动画
   */
  resumeAnimations() {
    const now = Date.now();
    for (const animation of this.animations) {
      // 调整开始时间以补偿暂停时间
      const elapsed = animation.progress * animation.duration;
      animation.startTime = now - elapsed;
      animation.active = true;
    }
  }
  
  /**
   * 内存管理器接口：清理方法
   */
  cleanup() {
    this.clearAllAnimations();
    
    // 清理对象池
    this.animationPool = [];
    this.initializePool();
    
    console.log('Animation engine cleaned up');
  }
  
  /**
   * 销毁动画引擎
   */
  destroy() {
    this.clearAllAnimations();
    this.animationPool = [];
    
    if (this.memoryManager) {
      this.memoryManager.unregisterManagedObject(this);
    }
  }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MemoryOptimizedAnimationEngine;
}

if (typeof global !== 'undefined') {
  global.MemoryOptimizedAnimationEngine = MemoryOptimizedAnimationEngine;
}