/**
 * 游戏管理器 - 原始版本备份
 * 包含黑暗模式和连击系统
 */

class GameManager {
  constructor(canvas, ctx, screenAdapter) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.screenAdapter = screenAdapter;
    
    // 游戏状态
    this.state = 'idle';  // idle | playing | paused | finished
    this.mode = 'bright'; // bright | dark
    this.difficulty = 180; // 0=自由, 60/120/180=限时（秒）
    
    // 游戏数据
    this.currentNumber = 1;
    this.errors = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.elapsedTime = 0;
    this.timeLeft = 0;
    
    // Cell 数据
    this.cells = [];
    
    // 定时器
    this.timer = null;
    this.animationFrameId = null;
    
    // 鼠标位置（用于黑暗模式）
    this.mousePos = { x: canvas.width / 2, y: canvas.height / 2 };
    
    // 模块
    this.voronoiGenerator = null;
    this.gridGenerator = null;
    this.renderEngine = null;
    this.touchHandler = null;
  }

  // ... 其他方法保持不变
}