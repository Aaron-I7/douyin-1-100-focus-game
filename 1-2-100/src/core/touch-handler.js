/**
 * 触摸处理器
 * 负责处理所有触摸事件和手势识别
 */

class TouchHandler {
  constructor(canvas, cells) {
    this.canvas = canvas;
    this.cells = cells;
    this.touchStartTime = 0;
    this.lastTouchPos = { x: 0, y: 0 };
    this.isEnabled = true;
    
    // 回调函数
    this.onCellClick = null;
    this.onMouseMove = null;
    
    this.setupEventListeners();
  }

  /**
   * 设置事件监听器
   */
  setupEventListeners() {
    tt.onTouchStart((event) => {
      if (!this.isEnabled) return;
      
      this.touchStartTime = Date.now();
      const touch = event.touches[0];
      const pos = this.getTouchPosition(touch);
      this.lastTouchPos = pos;
      this.handleTouchStart(pos);
    });

    tt.onTouchMove((event) => {
      if (!this.isEnabled) return;
      
      const touch = event.touches[0];
      const pos = this.getTouchPosition(touch);
      this.lastTouchPos = pos;
      this.handleTouchMove(pos);
    });

    tt.onTouchEnd((event) => {
      if (!this.isEnabled) return;
      
      const touchDuration = Date.now() - this.touchStartTime;
      if (touchDuration < 300) {  // 判定为点击
        this.handleTap(this.lastTouchPos);
      }
    });
  }

  /**
   * 将触摸坐标转换为 Canvas 坐标
   */
  getTouchPosition(touch) {
    // 抖音小游戏中，touch 坐标已经是相对于 Canvas 的
    return {
      x: touch.clientX,
      y: touch.clientY
    };
  }

  /**
   * 处理触摸开始
   */
  handleTouchStart(pos) {
    // 可以在这里添加触摸开始的处理逻辑
  }

  /**
   * 处理触摸移动
   */
  handleTouchMove(pos) {
    // 更新鼠标位置（用于黑暗模式光照）
    if (this.onMouseMove) {
      this.onMouseMove(pos);
    }
  }

  /**
   * 处理点击
   */
  handleTap(pos) {
    try {
      // 检测点击了哪个 Cell
      const clickedCell = this.findCellAtPosition(pos);
      
      if (clickedCell && this.onCellClick) {
        this.onCellClick(clickedCell);
      }
    } catch (error) {
      console.error('Touch event handling error:', error);
    }
  }

  /**
   * 查找触摸点所在的 Cell
   */
  findCellAtPosition(pos) {
    for (const cell of this.cells) {
      if (this.pointInPolygon(pos, cell.polygon)) {
        return cell;
      }
    }
    return null;
  }

  /**
   * 点在多边形内检测（Ray Casting Algorithm）
   */
  pointInPolygon(point, polygon) {
    if (polygon.length < 3) return false;
    
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].x, yi = polygon[i].y;
      const xj = polygon[j].x, yj = polygon[j].y;
      
      const intersect = ((yi > point.y) !== (yj > point.y))
        && (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  }

  /**
   * 更新 Cell 列表
   */
  updateCells(cells) {
    this.cells = cells;
  }

  /**
   * 启用/禁用触摸处理
   */
  setEnabled(enabled) {
    this.isEnabled = enabled;
  }

  /**
   * 触发震动反馈
   */
  vibrate(type = 'light') {
    try {
      if (type === 'heavy') {
        tt.vibrateShort({ type: 'heavy' });
      } else {
        tt.vibrateShort({ type: 'light' });
      }
    } catch (error) {
      console.warn('Vibration not supported:', error);
    }
  }
}

// 导出
if (typeof global !== 'undefined') {
  global.TouchHandler = TouchHandler;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = TouchHandler;
}
