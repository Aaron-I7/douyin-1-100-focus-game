class TouchHandler {
  constructor(canvas, cells, gameManager) {
    this.canvas = canvas;
    this.cells = cells;
    this.gameManager = gameManager;
    this.touchStartTime = 0;
    this.lastTouchPos = { x: 0, y: 0 };
    this.isEnabled = true;
    this.onCellClick = null;
    this.onMouseMove = null;
    this.touchStartPos = { x: 0, y: 0 };
    this.tapMaxDuration = 120;
    this.moveCancelThreshold = 12;
    this.touchMovedDistance = 0;
    this.setupEventListeners();
    this.onCanvasClick = null;
  }

  setupEventListeners() {
    tt.onTouchStart((event) => {
      this.touchStartTime = Date.now();
      const touch = event.touches[0];
      const pos = this.getTouchPosition(touch);
      this.lastTouchPos = pos;
      this.touchStartPos = pos;
      this.touchMovedDistance = 0;
      this.handleTouchStart(pos);
    });

    tt.onTouchMove((event) => {
      const touch = event.touches[0];
      const pos = this.getTouchPosition(touch);
      const dx = pos.x - this.touchStartPos.x;
      const dy = pos.y - this.touchStartPos.y;
      this.touchMovedDistance = Math.sqrt(dx * dx + dy * dy);
      this.lastTouchPos = pos;
      this.handleTouchMove(pos);
    });

    tt.onTouchEnd((event) => {
      const touchDuration = Date.now() - this.touchStartTime;
      if (touchDuration <= this.tapMaxDuration && this.touchMovedDistance <= this.moveCancelThreshold) {
        this.handleTap(this.lastTouchPos);
      }
    });
  }

  getTouchPosition(touch) {
    return { x: touch.clientX, y: touch.clientY };
  }

  handleTouchStart(pos) {}

  handleTouchMove(pos) {
    if (this.gameManager && this.gameManager.state === 'playing' && this.onMouseMove) {
      this.onMouseMove(pos);
    }
  }

  handleTap(pos) {
    try {
      if (this.gameManager && this.gameManager.state === 'menu') {
        const btn = this.gameManager.uiManager.handleClick(pos.x, pos.y);
        if (btn) {
          this.gameManager.handleUIClick(btn);
        }
        return;
      }
      if (this.gameManager && this.gameManager.state === 'playing' && this.isEnabled) {
        const clickedCell = this.findCellAtPosition(pos);
        if (clickedCell && this.onCellClick) {
          this.onCellClick(clickedCell);
          return;
        }
        if (!clickedCell && this.onCanvasClick) {
          this.onCanvasClick(pos);
        }
      }
    } catch (error) {
      console.error('Touch event handling error:', error);
    }
  }

  findCellAtPosition(pos) {
    for (const cell of this.cells) {
      if (this.pointInPolygon(pos, cell.polygon)) {
        return cell;
      }
    }
    return null;
  }

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

  updateCells(cells) {
    this.cells = cells;
  }

  setEnabled(enabled) {
    this.isEnabled = enabled;
  }

  vibrate(type = 'light') {
    return;
  }
}

module.exports = TouchHandler;
