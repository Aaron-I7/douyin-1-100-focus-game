/**
 * GameStartupWithFonts - 包含字体加载的游戏启动模块
 * 集成字体加载到游戏初始化流程中
 */

import FontLoadingIntegration from './ui-font-loading-integration';

class GameStartupWithFonts {
  constructor() {
    this.fontLoader = new FontLoadingIntegration();
    this.startupCallbacks = [];
    this.isInitialized = false;
    this.initializationError = null;
  }

  /**
   * 初始化游戏（包含字体加载）
   * @param {Object} options - 初始化选项
   * @returns {Promise<Object>} 初始化结果
   */
  async initialize(options = {}) {
    const {
      skipFontLoading = false,
      fontLoadingTimeout = 5000,
      showLoadingScreen = true,
      onFontProgress = null,
      onFontComplete = null,
      onInitComplete = null
    } = options;

    if (this.isInitialized) {
      console.warn('Game already initialized');
      return { success: true, cached: true };
    }

    try {
      console.log('Starting game initialization...');
      
      const initStartTime = Date.now();
      const results = {
        fonts: null,
        canvas: null,
        systems: null,
        totalTime: 0
      };

      // 1. 字体加载阶段
      if (!skipFontLoading) {
        console.log('Phase 1: Loading fonts...');
        
        results.fonts = await this.fontLoader.initializeFonts({
          showProgress: showLoadingScreen,
          timeout: fontLoadingTimeout,
          onProgress: onFontProgress,
          onComplete: onFontComplete,
          onError: (error) => {
            console.warn('Font loading failed, continuing with system fonts:', error);
          }
        });

        console.log('Font loading completed:', results.fonts);
      }

      // 2. Canvas 初始化阶段
      console.log('Phase 2: Initializing canvas...');
      results.canvas = await this._initializeCanvas();

      // 3. 游戏系统初始化阶段
      console.log('Phase 3: Initializing game systems...');
      results.systems = await this._initializeGameSystems();

      // 4. 字体预热
      if (!skipFontLoading) {
        console.log('Phase 4: Warming up fonts...');
        await this.fontLoader.warmupFonts();
      }

      results.totalTime = Date.now() - initStartTime;
      
      this.isInitialized = true;
      
      console.log(`Game initialization completed in ${results.totalTime}ms`);

      // 调用完成回调
      if (onInitComplete) {
        onInitComplete(results);
      }

      return { success: true, results };

    } catch (error) {
      console.error('Game initialization failed:', error);
      this.initializationError = error;
      
      return { 
        success: false, 
        error: error.message,
        fallback: await this._initializeFallback()
      };
    }
  }

  /**
   * 初始化 Canvas
   * @private
   * @returns {Promise<Object>} Canvas 初始化结果
   */
  async _initializeCanvas() {
    try {
      // 获取系统信息
      const systemInfo = tt.getSystemInfoSync();
      
      // 创建 Canvas
      const canvas = tt.createCanvas();
      canvas.width = systemInfo.windowWidth;
      canvas.height = systemInfo.windowHeight;
      
      // 获取上下文
      const ctx = canvas.getContext('2d');
      
      // 设置高清屏适配
      const dpr = systemInfo.pixelRatio || 1;
      canvas.width = systemInfo.windowWidth * dpr;
      canvas.height = systemInfo.windowHeight * dpr;
      ctx.scale(dpr, dpr);
      
      return {
        canvas,
        ctx,
        width: systemInfo.windowWidth,
        height: systemInfo.windowHeight,
        dpr
      };
      
    } catch (error) {
      throw new Error(`Canvas initialization failed: ${error.message}`);
    }
  }

  /**
   * 初始化游戏系统
   * @private
   * @returns {Promise<Object>} 系统初始化结果
   */
  async _initializeGameSystems() {
    try {
      // 这里会初始化其他游戏系统
      // 例如：主题系统、动画引擎、UI 管理器等
      
      const systems = {
        fontManager: this.fontLoader.getFontManager(),
        initialized: true,
        timestamp: Date.now()
      };
      
      return systems;
      
    } catch (error) {
      throw new Error(`Game systems initialization failed: ${error.message}`);
    }
  }

  /**
   * 初始化降级方案
   * @private
   * @returns {Promise<Object>} 降级初始化结果
   */
  async _initializeFallback() {
    try {
      console.log('Initializing fallback mode...');
      
      // 最小化初始化，仅使用系统字体
      const canvas = await this._initializeCanvas();
      
      return {
        canvas,
        fonts: null,
        systems: { fallback: true },
        mode: 'fallback'
      };
      
    } catch (error) {
      console.error('Fallback initialization also failed:', error);
      return null;
    }
  }

  /**
   * 获取字体管理器
   * @returns {FontManager|null} 字体管理器实例
   */
  getFontManager() {
    return this.isInitialized ? this.fontLoader.getFontManager() : null;
  }

  /**
   * 检查初始化状态
   * @returns {Object} 初始化状态
   */
  getInitializationStatus() {
    return {
      isInitialized: this.isInitialized,
      error: this.initializationError,
      fontStatus: this.fontLoader.getLoadingStatus()
    };
  }

  /**
   * 添加启动完成回调
   * @param {Function} callback - 回调函数
   */
  onStartupComplete(callback) {
    if (typeof callback === 'function') {
      this.startupCallbacks.push(callback);
    }
  }

  /**
   * 重置初始化状态（用于重新初始化）
   */
  reset() {
    this.isInitialized = false;
    this.initializationError = null;
    this.fontLoader = new FontLoadingIntegration();
  }

  /**
   * 快速启动（跳过字体加载）
   * @returns {Promise<Object>} 启动结果
   */
  async quickStart() {
    return await this.initialize({
      skipFontLoading: true,
      showLoadingScreen: false
    });
  }

  /**
   * 完整启动（包含字体加载和进度显示）
   * @param {Object} progressCallbacks - 进度回调
   * @returns {Promise<Object>} 启动结果
   */
  async fullStart(progressCallbacks = {}) {
    const {
      onFontProgress = null,
      onFontComplete = null,
      onInitComplete = null
    } = progressCallbacks;

    return await this.initialize({
      skipFontLoading: false,
      showLoadingScreen: true,
      fontLoadingTimeout: 8000, // 更长的超时时间
      onFontProgress: (progress) => {
        console.log(`Font loading progress: ${Math.round(progress.progress * 100)}%`);
        if (onFontProgress) onFontProgress(progress);
      },
      onFontComplete: (results) => {
        console.log('Font loading completed:', results);
        if (onFontComplete) onFontComplete(results);
      },
      onInitComplete: (results) => {
        console.log('Game initialization completed:', results);
        if (onInitComplete) onInitComplete(results);
      }
    });
  }
}

// 创建全局实例
const gameStartup = new GameStartupWithFonts();

// 导出启动函数
export async function initializeGameWithFonts(options = {}) {
  return await gameStartup.fullStart(options);
}

export async function initializeGameQuick() {
  return await gameStartup.quickStart();
}

export function getGameStartup() {
  return gameStartup;
}

export default GameStartupWithFonts;