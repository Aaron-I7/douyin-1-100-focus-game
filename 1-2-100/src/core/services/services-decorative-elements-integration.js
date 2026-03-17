/**
 * DecorativeElementsIntegration - 装饰性元素集成系统
 * 整合背景装饰、按钮阴影、进度条设计和关卡过渡动画
 * 需求: 15.6 - 添加装饰性元素
 */

class DecorativeElementsIntegration {
  constructor(themeSystem, animationEngine) {
    this.themeSystem = themeSystem;
    this.animationEngine = animationEngine;
    
    // 初始化各个装饰系统
    this.backgroundDecorator = null;
    this.buttonShadowEffects = null;
    this.progressBarDesigner = null;
    this.levelTransitionAnimator = null;
    
    this.initialized = false;
    this.enabled = true;
  }

  /**
   * 初始化装饰系统
   * @param {number} width - 画布宽度
   * @param {number} height - 画布高度
   */
  async initialize(width, height) {
    try {
      // 动态导入装饰系统类
      const BackgroundDecorator = await this.loadModule('BackgroundDecorator');
      const ButtonShadowEffects = await this.loadModule('ButtonShadowEffects');
      const ProgressBarDesigner = await this.loadModule('ProgressBarDesigner');
      const LevelTransitionAnimator = await this.loadModule('LevelTransitionAnimator');
      
      // 初始化各个系统
      this.backgroundDecorator = new BackgroundDecorator(this.themeSystem);
      this.buttonShadowEffects = new ButtonShadowEffects(this.themeSystem);
      this.progressBarDesigner = new ProgressBarDesigner(this.themeSystem);
      this.levelTransitionAnimator = new LevelTransitionAnimator(this.themeSystem, this.animationEngine);
      
      // 初始化背景装饰
      this.backgroundDecorator.initialize(width, height);
      
      this.initialized = true;
      console.log('Decorative elements integration initialized successfully');
      
    } catch (error) {
      console.error('Failed to initialize decorative elements:', error);
      this.initialized = false;
    }
  }

  /**
   * 动态加载模块
   * @param {string} moduleName - 模块名称
   * @returns {Promise<Function>} 模块构造函数
   */
  async loadModule(moduleName) {
    // 在实际环境中，这里会动态导入模块
    // 这里使用全局变量作为降级方案
    if (typeof window !== 'undefined' && window[moduleName]) {
      return window[moduleName];
    }
    
    if (typeof global !== 'undefined' && global[moduleName]) {
      return global[moduleName];
    }
    
    throw new Error(`Module ${moduleName} not found`);
  }

  /**
   * 更新装饰元素
   * @param {number} deltaTime - 时间增量
   */
  update(deltaTime) {
    if (!this.initialized || !this.enabled) return;
    
    try {
      // 更新背景装饰动画
      if (this.backgroundDecorator) {
        this.backgroundDecorator.update(deltaTime);
      }
      
      // 其他装饰系统的更新会在各自的渲染方法中处理
      
    } catch (error) {
      console.error('Error updating decorative elements:', error);
    }
  }

  /**
   * 渲染背景装饰
   * @param {CanvasRenderingContext2D} ctx - Canvas 2D 上下文
   */
  renderBackgroundDecorations(ctx) {
    if (!this.initialized || !this.enabled || !this.backgroundDecorator) return;
    
    try {
      this.backgroundDecorator.render(ctx);
    } catch (error) {
      console.error('Error rendering background decorations:', error);
    }
  }

  /**
   * 渲染按钮阴影
   * @param {CanvasRenderingContext2D} ctx - Canvas 2D 上下文
   * @param {number} x - 按钮 X 坐标
   * @param {number} y - 按钮 Y 坐标
   * @param {number} width - 按钮宽度
   * @param {number} height - 按钮高度
   * @param {number} borderRadius - 按钮圆角半径
   * @param {string} type - 按钮类型
   * @param {string} state - 按钮状态
   */
  renderButtonShadow(ctx, x, y, width, height, borderRadius, type = 'primary', state = 'normal') {
    if (!this.initialized || !this.enabled || !this.buttonShadowEffects) return;
    
    try {
      this.buttonShadowEffects.applyButtonShadow(ctx, x, y, width, height, borderRadius, type, state);
    } catch (error) {
      console.error('Error rendering button shadow:', error);
    }
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
    if (!this.initialized || !this.enabled || !this.progressBarDesigner) return;
    
    try {
      this.progressBarDesigner.renderProgressBar(ctx, x, y, width, height, progress, options);
    } catch (error) {
      console.error('Error rendering progress bar:', error);
    }
  }

  /**
   * 开始关卡过渡动画
   * @param {Object} transitionConfig - 过渡配置
   * @returns {Promise} 动画完成的 Promise
   */
  async startLevelTransition(transitionConfig) {
    if (!this.initialized || !this.enabled || !this.levelTransitionAnimator) {
      return Promise.resolve();
    }
    
    try {
      return await this.levelTransitionAnimator.startTransition(transitionConfig);
    } catch (error) {
      console.error('Error starting level transition:', error);
      return Promise.resolve();
    }
  }

  /**
   * 渲染关卡过渡效果
   * @param {CanvasRenderingContext2D} ctx - Canvas 2D 上下文
   * @param {number} width - 画布宽度
   * @param {number} height - 画布高度
   */
  renderLevelTransition(ctx, width, height) {
    if (!this.initialized || !this.enabled || !this.levelTransitionAnimator) return;
    
    try {
      this.levelTransitionAnimator.render(ctx, width, height);
    } catch (error) {
      console.error('Error rendering level transition:', error);
    }
  }

  /**
   * 检查是否正在过渡
   * @returns {boolean} 是否正在过渡
   */
  isTransitioning() {
    if (!this.initialized || !this.levelTransitionAnimator) return false;
    
    try {
      return this.levelTransitionAnimator.isTransitioning();
    } catch (error) {
      console.error('Error checking transition state:', error);
      return false;
    }
  }

  /**
   * 创建按钮阴影动画
   * @param {string} type - 按钮类型
   * @param {string} fromState - 起始状态
   * @param {string} toState - 目标状态
   * @param {number} progress - 动画进度 (0-1)
   * @returns {Object|null} 插值后的阴影配置
   */
  createButtonShadowAnimation(type, fromState, toState, progress) {
    if (!this.initialized || !this.enabled || !this.buttonShadowEffects) return null;
    
    try {
      return this.buttonShadowEffects.createShadowAnimation(type, fromState, toState, progress);
    } catch (error) {
      console.error('Error creating button shadow animation:', error);
      return null;
    }
  }

  /**
   * 清除进度条动画缓存
   * @param {string} animationId - 动画ID（可选）
   */
  clearProgressBarAnimationCache(animationId) {
    if (!this.initialized || !this.progressBarDesigner) return;
    
    try {
      this.progressBarDesigner.clearAnimationCache(animationId);
    } catch (error) {
      console.error('Error clearing progress bar animation cache:', error);
    }
  }

  /**
   * 设置动态背景效果启用状态
   * @param {boolean} enabled - 是否启用
   */
  setDynamicBackgroundEnabled(enabled) {
    if (!this.initialized || !this.backgroundDecorator) return;
    
    try {
      this.backgroundDecorator.setDynamicEffectsEnabled(enabled);
    } catch (error) {
      console.error('Error setting dynamic background state:', error);
    }
  }

  /**
   * 重新调整装饰元素尺寸
   * @param {number} width - 新的画布宽度
   * @param {number} height - 新的画布高度
   */
  resize(width, height) {
    if (!this.initialized) return;
    
    try {
      if (this.backgroundDecorator) {
        this.backgroundDecorator.resize(width, height);
      }
    } catch (error) {
      console.error('Error resizing decorative elements:', error);
    }
  }

  /**
   * 启用/禁用装饰效果
   * @param {boolean} enabled - 是否启用
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    console.log(`Decorative elements ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * 获取装饰系统状态
   * @returns {Object} 状态信息
   */
  getStatus() {
    return {
      initialized: this.initialized,
      enabled: this.enabled,
      backgroundDecorator: !!this.backgroundDecorator,
      buttonShadowEffects: !!this.buttonShadowEffects,
      progressBarDesigner: !!this.progressBarDesigner,
      levelTransitionAnimator: !!this.levelTransitionAnimator,
      isTransitioning: this.isTransitioning()
    };
  }

  /**
   * 清理资源
   */
  dispose() {
    try {
      // 停止所有动画
      if (this.levelTransitionAnimator) {
        this.levelTransitionAnimator.stopCurrentTransition();
      }
      
      // 清除缓存
      if (this.buttonShadowEffects) {
        this.buttonShadowEffects.clearCache();
      }
      
      if (this.progressBarDesigner) {
        this.progressBarDesigner.clearAnimationCache();
      }
      
      // 重置状态
      this.backgroundDecorator = null;
      this.buttonShadowEffects = null;
      this.progressBarDesigner = null;
      this.levelTransitionAnimator = null;
      this.initialized = false;
      
      console.log('Decorative elements integration disposed');
      
    } catch (error) {
      console.error('Error disposing decorative elements:', error);
    }
  }
}

// 导出 DecorativeElementsIntegration 类
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DecorativeElementsIntegration;
} else if (typeof window !== 'undefined') {
  window.DecorativeElementsIntegration = DecorativeElementsIntegration;
}