/**
 * Tutorial Integration - 教程系统集成
 * 
 * 功能：
 * - 集成教程系统到游戏主循环
 * - 处理教程相关的用户交互
 * - 管理教程状态转换
 * 
 * 需求: 20.1, 20.2, 20.3, 20.4, 20.5
 */

class TutorialIntegration {
  constructor() {
    this.tutorialSystem = null;
    this.gameManager = null;
    this.uiManager = null;
    this.initialized = false;
  }
  
  /**
   * 初始化教程集成
   */
  initialize(options = {}) {
    const {
      tutorialSystem,
      gameManager,
      uiManager,
      screenAdapter,
      themeSystem
    } = options;
    
    if (!tutorialSystem || !gameManager || !uiManager) {
      throw new Error('TutorialIntegration requires tutorialSystem, gameManager, and uiManager');
    }
    
    this.tutorialSystem = tutorialSystem;
    this.gameManager = gameManager;
    this.uiManager = uiManager;
    this.screenAdapter = screenAdapter;
    this.themeSystem = themeSystem;
    
    // 扩展UI Manager以支持帮助按钮
    this.extendUIManager();
    
    this.initialized = true;
    console.log('Tutorial integration initialized');
  }
  
  /**
   * 扩展UI Manager以支持帮助按钮
   */
  extendUIManager() {
    const originalDrawMainMenuButtons = this.uiManager.drawMainMenuButtons.bind(this.uiManager);
    const originalHandleClick = this.uiManager.handleClick.bind(this.uiManager);
    
    // 扩展主菜单按钮绘制
    this.uiManager.drawMainMenuButtons = (ctx, isCustomModeUnlocked, hasProgress = false) => {
      // 调用原始方法
      const result = originalDrawMainMenuButtons(ctx, isCustomModeUnlocked, hasProgress);
      
      // 添加帮助按钮
      this.drawHelpButton(ctx);
      
      return result;
    };
    
    // 扩展点击处理
    this.uiManager.handleClick = (x, y) => {
      // 先检查是否点击了帮助按钮
      const helpResult = this.handleHelpButtonClick(x, y);
      if (helpResult) {
        return helpResult;
      }
      
      // 检查教程系统的点击处理
      if (this.tutorialSystem) {
        const tutorialResult = this.tutorialSystem.handleClick(x, y);
        if (tutorialResult) {
          return this.handleTutorialEvent(tutorialResult);
        }
      }
      
      // 调用原始点击处理
      return originalHandleClick(x, y);
    };
  }
  
  /**
   * 绘制帮助按钮
   */
  drawHelpButton(ctx) {
    const canvas = ctx.canvas;
    const width = canvas.width;
    const height = canvas.height;
    const dims = this.screenAdapter.calculateDimensions();
    
    // 帮助按钮位置（右上角）
    const buttonSize = dims.fontSize * 1.5;
    const margin = dims.fontSize * 0.5;
    const buttonX = width - buttonSize - margin;
    const buttonY = margin;
    
    ctx.save();
    
    // 按钮背景
    ctx.fillStyle = this.themeSystem.getThemeColors().secondary;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(buttonX + buttonSize / 2, buttonY + buttonSize / 2, buttonSize / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    
    // 帮助图标 "?"
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `bold ${dims.fontSize}px "PingFang SC"`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('?', buttonX + buttonSize / 2, buttonY + buttonSize / 2);
    
    ctx.restore();
    
    // 存储按钮位置供点击检测使用
    this.helpButtonBounds = {
      x: buttonX,
      y: buttonY,
      width: buttonSize,
      height: buttonSize
    };
  }
  
  /**
   * 处理帮助按钮点击
   */
  handleHelpButtonClick(x, y) {
    if (!this.helpButtonBounds) return null;
    
    const bounds = this.helpButtonBounds;
    if (x >= bounds.x && x <= bounds.x + bounds.width &&
        y >= bounds.y && y <= bounds.y + bounds.height) {
      
      const isShowing = this.tutorialSystem.toggleHelp();
      return {
        type: 'help_toggled',
        showing: isShowing
      };
    }
    
    return null;
  }
  
  /**
   * 处理教程事件
   */
  handleTutorialEvent(event) {
    switch (event.type) {
      case 'tutorial_complete':
      case 'tutorial_skipped':
        console.log(`Tutorial ${event.type} for step ${event.step}`);
        // 通知游戏管理器开始游戏
        if (this.gameManager.startLevel) {
          this.gameManager.startLevel(event.step);
        }
        break;
        
      case 'explanation_complete':
      case 'explanation_skipped':
        console.log(`Level explanation ${event.type}`);
        // 继续游戏流程
        break;
        
      case 'help_closed':
        console.log('Help screen closed');
        break;
        
      case 'help_toggled':
        console.log(`Help screen ${event.showing ? 'opened' : 'closed'}`);
        break;
    }
    
    return event;
  }
  
  /**
   * 开始游戏时的教程检查
   */
  onGameStart(level) {
    if (!this.initialized || !this.tutorialSystem) return false;
    
    // 检查是否需要显示首次引导
    if (this.tutorialSystem.isFirstTime) {
      return this.tutorialSystem.startFirstTimeGuide(level);
    }
    
    return false;
  }
  
  /**
   * 关卡完成时的教程处理
   */
  onLevelComplete(fromLevel, toLevel) {
    if (!this.initialized || !this.tutorialSystem) return;
    
    // 显示关卡过渡说明
    if (fromLevel === 1 && toLevel === 2) {
      this.tutorialSystem.showLevelExplanation(fromLevel, toLevel);
    }
  }
  
  /**
   * 进入自选模式时的教程处理
   */
  onEnterCustomMode() {
    if (!this.initialized || !this.tutorialSystem) return false;
    
    return this.tutorialSystem.showCustomModeExplanation();
  }
  
  /**
   * 玩家点击时的教程处理
   */
  onPlayerClick() {
    if (!this.initialized || !this.tutorialSystem) return;
    
    this.tutorialSystem.onPlayerClick();
  }
  
  /**
   * 更新教程状态
   */
  update() {
    if (!this.initialized || !this.tutorialSystem) return null;
    
    return this.tutorialSystem.update();
  }
  
  /**
   * 渲染教程界面
   */
  render(ctx, gameState = null) {
    if (!this.initialized || !this.tutorialSystem) return;
    
    this.tutorialSystem.render(ctx, gameState);
  }
  
  /**
   * 获取教程状态
   */
  getTutorialState() {
    if (!this.initialized || !this.tutorialSystem) {
      return {
        isFirstTime: false,
        showingTutorial: false,
        showingHint: false,
        showingLevelExplanation: false,
        showingHelp: false
      };
    }
    
    return this.tutorialSystem.getState();
  }
  
  /**
   * 检查是否有活跃的教程界面
   */
  hasActiveTutorial() {
    const state = this.getTutorialState();
    return state.showingTutorial || 
           state.showingLevelExplanation || 
           state.showingHelp;
  }
  
  /**
   * 强制关闭所有教程界面
   */
  closeAllTutorials() {
    if (!this.initialized || !this.tutorialSystem) return;
    
    this.tutorialSystem.showingTutorial = false;
    this.tutorialSystem.showingLevelExplanation = false;
    this.tutorialSystem.showingHelp = false;
    this.tutorialSystem.showingHint = false;
  }
}

module.exports = TutorialIntegration;