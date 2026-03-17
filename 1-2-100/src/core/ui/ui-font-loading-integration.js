/**
 * FontLoadingIntegration - 字体加载集成模块
 * 负责将字体加载集成到游戏启动流程中
 */

import FontManager from './ui-font-manager';
import { FONT_CONFIG, FONT_LOADING_PRIORITY } from '../assets/fonts/font-config.js';

class FontLoadingIntegration {
  constructor() {
    this.fontManager = new FontManager();
    this.loadingCallbacks = [];
    this.isLoading = false;
    this.loadingStartTime = 0;
    this.loadingResults = {};
  }

  /**
   * 初始化字体加载
   * @param {Object} options - 加载选项
   * @returns {Promise<Object>} 加载结果
   */
  async initializeFonts(options = {}) {
    const {
      showProgress = true,
      timeout = 5000,
      onProgress = null,
      onComplete = null,
      onError = null
    } = options;

    if (this.isLoading) {
      console.warn('Font loading already in progress');
      return this.loadingResults;
    }

    this.isLoading = true;
    this.loadingStartTime = Date.now();
    this.loadingResults = {};

    try {
      // 设置字体 URL（在实际项目中，这些 URL 应该指向实际的字体文件）
      this._setupFontUrls();

      // 显示加载界面
      if (showProgress) {
        this._showLoadingScreen();
      }

      // 按优先级加载字体
      const results = await this._loadFontsWithPriority(timeout, onProgress);
      
      this.loadingResults = results;
      
      // 隐藏加载界面
      if (showProgress) {
        this._hideLoadingScreen();
      }

      // 调用完成回调
      if (onComplete) {
        onComplete(results);
      }

      return results;

    } catch (error) {
      console.error('Font loading failed:', error);
      
      if (onError) {
        onError(error);
      }
      
      // 返回降级结果
      return this._getFallbackResults();
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * 设置字体 URL
   * @private
   */
  _setupFontUrls() {
    // 在实际项目中，这里应该设置真实的字体文件路径
    // 目前使用示例 URL，实际部署时需要替换
    
    // 标题字体 - 使用 Google Fonts 的 Orbitron 作为示例
    this.fontManager.setFontUrl('title', 
      'https://fonts.gstatic.com/s/orbitron/v29/yMJMMIlzdpvBhQQL_SC_X9Ht_H5V_glS.woff2'
    );
    
    // 数字和 UI 字体使用系统字体，无需设置 URL
  }

  /**
   * 按优先级加载字体
   * @private
   * @param {number} timeout - 超时时间
   * @param {Function} onProgress - 进度回调
   * @returns {Promise<Object>} 加载结果
   */
  async _loadFontsWithPriority(timeout, onProgress) {
    const results = {};
    const totalFonts = FONT_LOADING_PRIORITY.length;
    let loadedCount = 0;

    for (const fontType of FONT_LOADING_PRIORITY) {
      try {
        const startTime = Date.now();
        
        // 加载字体（带超时）
        const success = await Promise.race([
          this.fontManager.loadFont(fontType),
          this._createTimeoutPromise(timeout)
        ]);

        const loadTime = Date.now() - startTime;
        
        results[fontType] = {
          success,
          loadTime,
          fallback: !success
        };

        loadedCount++;

        // 调用进度回调
        if (onProgress) {
          onProgress({
            fontType,
            success,
            loadTime,
            progress: loadedCount / totalFonts,
            completed: loadedCount,
            total: totalFonts
          });
        }

        // 更新加载界面
        this._updateLoadingProgress(loadedCount / totalFonts, fontType);

      } catch (error) {
        console.warn(`Failed to load font ${fontType}:`, error);
        
        results[fontType] = {
          success: false,
          loadTime: 0,
          fallback: true,
          error: error.message
        };
        
        loadedCount++;
      }
    }

    return results;
  }

  /**
   * 创建超时 Promise
   * @private
   * @param {number} timeout - 超时时间
   * @returns {Promise<boolean>}
   */
  _createTimeoutPromise(timeout) {
    return new Promise((resolve) => {
      setTimeout(() => resolve(false), timeout);
    });
  }

  /**
   * 显示加载界面
   * @private
   */
  _showLoadingScreen() {
    // 创建加载界面元素
    const loadingScreen = document.createElement('div');
    loadingScreen.id = 'font-loading-screen';
    loadingScreen.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      z-index: 9999;
      color: white;
      font-family: "PingFang SC", "Helvetica Neue", Arial, sans-serif;
    `;

    // 标题
    const title = document.createElement('h2');
    title.textContent = '1-100 专注力挑战';
    title.style.cssText = `
      font-size: 32px;
      font-weight: bold;
      margin-bottom: 20px;
      text-align: center;
    `;

    // 加载文字
    const loadingText = document.createElement('p');
    loadingText.id = 'loading-text';
    loadingText.textContent = '正在加载字体资源...';
    loadingText.style.cssText = `
      font-size: 16px;
      margin-bottom: 20px;
      text-align: center;
    `;

    // 进度条容器
    const progressContainer = document.createElement('div');
    progressContainer.style.cssText = `
      width: 200px;
      height: 4px;
      background: rgba(255, 255, 255, 0.3);
      border-radius: 2px;
      overflow: hidden;
    `;

    // 进度条
    const progressBar = document.createElement('div');
    progressBar.id = 'loading-progress';
    progressBar.style.cssText = `
      width: 0%;
      height: 100%;
      background: #4ECDC4;
      border-radius: 2px;
      transition: width 0.3s ease;
    `;

    progressContainer.appendChild(progressBar);
    loadingScreen.appendChild(title);
    loadingScreen.appendChild(loadingText);
    loadingScreen.appendChild(progressContainer);
    
    document.body.appendChild(loadingScreen);
  }

  /**
   * 更新加载进度
   * @private
   * @param {number} progress - 进度 (0-1)
   * @param {string} currentFont - 当前加载的字体
   */
  _updateLoadingProgress(progress, currentFont) {
    const progressBar = document.getElementById('loading-progress');
    const loadingText = document.getElementById('loading-text');
    
    if (progressBar) {
      progressBar.style.width = `${progress * 100}%`;
    }
    
    if (loadingText) {
      const fontNames = {
        ui: 'UI 字体',
        number: '数字字体',
        title: '标题字体'
      };
      
      const fontName = fontNames[currentFont] || currentFont;
      loadingText.textContent = `正在加载 ${fontName}... ${Math.round(progress * 100)}%`;
    }
  }

  /**
   * 隐藏加载界面
   * @private
   */
  _hideLoadingScreen() {
    const loadingScreen = document.getElementById('font-loading-screen');
    if (loadingScreen) {
      // 添加淡出动画
      loadingScreen.style.transition = 'opacity 0.5s ease';
      loadingScreen.style.opacity = '0';
      
      setTimeout(() => {
        if (loadingScreen.parentNode) {
          loadingScreen.parentNode.removeChild(loadingScreen);
        }
      }, 500);
    }
  }

  /**
   * 获取降级结果
   * @private
   * @returns {Object} 降级结果
   */
  _getFallbackResults() {
    const results = {};
    
    for (const fontType of FONT_LOADING_PRIORITY) {
      results[fontType] = {
        success: false,
        loadTime: 0,
        fallback: true,
        error: 'Loading failed, using system font'
      };
    }
    
    return results;
  }

  /**
   * 获取字体管理器实例
   * @returns {FontManager} 字体管理器
   */
  getFontManager() {
    return this.fontManager;
  }

  /**
   * 检查字体加载状态
   * @returns {Object} 加载状态
   */
  getLoadingStatus() {
    return {
      isLoading: this.isLoading,
      startTime: this.loadingStartTime,
      results: this.loadingResults,
      progress: this.fontManager.getLoadingProgress()
    };
  }

  /**
   * 预热字体（在游戏启动前调用）
   * @returns {Promise<void>}
   */
  async warmupFonts() {
    // 创建隐藏的测试元素来预热字体渲染
    const testElement = document.createElement('div');
    testElement.style.cssText = `
      position: absolute;
      left: -9999px;
      top: -9999px;
      visibility: hidden;
      font-size: 12px;
    `;

    // 测试各种字体
    const testTexts = [
      { font: this.fontManager.getFontFamily('title'), text: '1-100 专注力挑战' },
      { font: this.fontManager.getFontFamily('number'), text: '0123456789' },
      { font: this.fontManager.getFontFamily('ui'), text: '开始游戏 返回菜单' }
    ];

    for (const { font, text } of testTexts) {
      testElement.style.fontFamily = font;
      testElement.textContent = text;
      document.body.appendChild(testElement);
      
      // 强制浏览器计算样式
      testElement.offsetWidth;
      
      document.body.removeChild(testElement);
    }
  }
}

export default FontLoadingIntegration;