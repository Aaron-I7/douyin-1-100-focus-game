/**
 * 抖音小游戏 - 1-100 专注力训练游戏
 * 所有代码合并版本
 */

console.log('1-100 专注力训练游戏启动中...');
const TransitionManager = require('./src/core/state/state-transition-manager-legacy');
const ScreenAdapter = require('./src/core/ui/ui-screen-adapter-legacy');
const { gameUIFlowMethods } = require('./src/core/services/services-game-manager-ui-flow-legacy');
const { gameRuntimeMethods } = require('./src/core/services/services-game-manager-runtime-legacy');
const { gameInitFlowMethods } = require('./src/core/services/services-game-manager-init-flow-legacy');
const { createGameBootstrap } = require('./src/core/services/services-game-bootstrap-legacy');

class GameManager {
  constructor(canvas, ctx, screenAdapter) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.screenAdapter = screenAdapter;
    this.state = 'menu';
    this.mode = 'bright'; // 始终使用明亮模式
    this.difficulty = 180;
    this.currentNumber = 1;
    this.errors = 0;
    this.elapsedTime = 0;
    this.timeLeft = 0;
    this.cells = [];
    this.timer = null;
    this.animationFrameId = null;
    this.voronoiGenerator = null;
    this.gridGenerator = null;
    this.renderEngine = null;
    this.touchHandler = null;
    this.uiManager = null;
    this.levelManager = null;
    this.transitionManager = null;
    this.currentScreen = 'start';
    this.selectedCustomMode = null; // 存储选择的自选模式 (10 或 100)
    
    // 新增：抖音云服务
    this.authService = null;
    this.cloudStorageService = null;
    this.userProfileManager = null;
    this.shareManager = null; // 分享管理器
    this.isUserDataLoaded = false;
    this.startupPromptDisabled = false;
    this.pendingContinueLevel = 1;
  }

}

Object.assign(GameManager.prototype, gameUIFlowMethods);
Object.assign(GameManager.prototype, gameRuntimeMethods);
Object.assign(GameManager.prototype, gameInitFlowMethods);

const bootstrap = createGameBootstrap({
  tt,
  ScreenAdapter,
  GameManager
});

// Export classes for testing
if (typeof global !== 'undefined') {
  global.TransitionManager = TransitionManager;
}

bootstrap.start();
