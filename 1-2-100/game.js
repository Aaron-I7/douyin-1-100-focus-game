const { getSidebarRewardSystem } = require('./src/core/services/services-sidebar-reward-system');
const sidebarRewardSystem = getSidebarRewardSystem();
console.log('[Game] Sidebar reward system initialized');

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
    this.mode = 'bright';
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
    this.gameplayModes = {
      SIMPLE: 'simple',
      HARD: 'hard',
      HELL: 'hell'
    };
    this.gameplayMode = this.gameplayModes.SIMPLE;
    this.gameplayModeStorageKey = 'gameplay_mode_100';
    this.pending100ModeStart = null;
    
    // 本地与云端挑战状态
    this.userId = null;
    this.shareManager = null;
    this.isUserDataLoaded = false;
    this.openId = null;
    this.activeDailySession = null;
    this.dailyChallengeState = {
      freeTotal: 3,
      freeUsed: 0,
      freeLeft: 3,
      passedToday: false,
      canStart: true
    };
    this.homeStats = {
      challengeCount: 12543,
      todayPassCount: 842,
      freePlayLeft: 3
    };
    this.remoteLeaderboardByMode = null;
    this.isRefreshingHomeData = false;
    this.reviveAdUnitId = 'adunit-revive-placeholder';
    this.cloudServiceId = '1lvp8d2ttobac';
    this.cloudEnvId = 'env-0htS8jdpdB';
    this.startupPromptDisabled = false;
    this.reducedMotionEnabled = false;
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
