function createGameBootstrap({ tt, ScreenAdapter, GameManager }) {
  let gameManager = null;
  let screenAdapter = null;

  async function init() {
    try {
      console.log('初始化游戏...');
      screenAdapter = new ScreenAdapter();
      const success = screenAdapter.init();
      if (!success) {
        console.warn('屏幕适配器初始化失败，使用默认配置');
      }
      if (!screenAdapter.isPortrait()) {
        showOrientationWarning();
        return;
      }
      const canvas = tt.createCanvas();
      const ctx = canvas.getContext('2d');
      if (!canvas || !ctx) {
        throw new Error('Canvas 创建失败');
      }
      canvas.width = screenAdapter.screenWidth;
      canvas.height = screenAdapter.screenHeight;
      console.log('Canvas 创建成功:', { width: canvas.width, height: canvas.height });
      gameManager = new GameManager(canvas, ctx, screenAdapter);
      const initSuccess = await gameManager.init();
      if (!initSuccess) {
        throw new Error('游戏管理器初始化失败');
      }
      gameManager.determineStartupFlow();
    } catch (error) {
      console.error('游戏初始化失败:', error);
      showErrorScreen('无法初始化游戏，请重启应用');
    }
  }

  function showMainMenu() {
    console.log('显示主菜单');
    if (gameManager && gameManager.uiManager) {
      gameManager.showMenu();
    }
  }

  function showOrientationWarning() {
    const canvas = tt.createCanvas();
    const ctx = canvas.getContext('2d');
    if (!canvas || !ctx) return;
    const systemInfo = tt.getSystemInfoSync();
    canvas.width = systemInfo.windowWidth;
    canvas.height = systemInfo.windowHeight;
    ctx.fillStyle = '#333333';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';
    ctx.font = `${Math.floor(canvas.height * 0.05)}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('请将设备旋转至竖屏', canvas.width / 2, canvas.height / 2);
    ctx.fillText('🔄', canvas.width / 2, canvas.height / 2 + 60);
  }

  function showErrorScreen(message) {
    try {
      const canvas = tt.createCanvas();
      const ctx = canvas.getContext('2d');
      if (!canvas || !ctx) {
        console.error('无法创建错误提示界面');
        return;
      }
      const systemInfo = tt.getSystemInfoSync();
      canvas.width = systemInfo.windowWidth || 375;
      canvas.height = systemInfo.windowHeight || 667;
      ctx.fillStyle = '#f8f9fa';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#D85A30';
      ctx.font = `${Math.floor(canvas.width * 0.05)}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('⚠️', canvas.width / 2, canvas.height / 2 - 40);
      ctx.fillStyle = '#333333';
      ctx.font = `${Math.floor(canvas.width * 0.04)}px Arial`;
      ctx.fillText(message, canvas.width / 2, canvas.height / 2 + 20);
    } catch (error) {
      console.error('显示错误界面失败:', error);
    }
  }

  function registerGlobalErrorHandler() {
    tt.onError((error) => {
      console.error('全局错误:', error);
      showErrorScreen('游戏遇到错误');
    });
  }

  function start() {
    registerGlobalErrorHandler();
    init();
  }

  return {
    start,
    init,
    showMainMenu,
    showOrientationWarning,
    showErrorScreen
  };
}

module.exports = { createGameBootstrap };
