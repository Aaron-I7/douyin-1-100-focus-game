/**
 * 网格布局生成器
 * 作为 Voronoi 生成失败时的降级方案
 */

const { Point, Cell } = require('../types/types-data-structures');

/**
 * 网格布局生成器类
 */
class GridLayoutGenerator {
  constructor(width, height, numCells) {
    this.width = width;
    this.height = height;
    this.numCells = numCells;
  }

  /**
   * 生成网格布局的 Cell
   */
  generate() {
    console.log('Using grid layout fallback...');
    const cells = [];
    const gridSize = Math.ceil(Math.sqrt(this.numCells));
    const cellWidth = this.width / gridSize;
    const cellHeight = this.height / gridSize;
    
    // 创建 1-100 的数字数组并打乱
    const numbers = Array.from({ length: this.numCells }, (_, i) => i + 1);
    this.shuffle(numbers);
    
    for (let i = 0; i < this.numCells; i++) {
      const row = Math.floor(i / gridSize);
      const col = i % gridSize;
      
      // 计算中心点（添加随机偏移）
      const offsetX = (Math.random() - 0.5) * cellWidth * 0.3;
      const offsetY = (Math.random() - 0.5) * cellHeight * 0.3;
      const centerX = (col + 0.5) * cellWidth + offsetX;
      const centerY = (row + 0.5) * cellHeight + offsetY;
      
      const site = new Point(centerX, centerY);
      const cell = new Cell(site, numbers[i]);
      
      // 创建矩形多边形
      const x1 = col * cellWidth;
      const y1 = row * cellHeight;
      const x2 = (col + 1) * cellWidth;
      const y2 = (row + 1) * cellHeight;
      
      cell.polygon = [
        new Point(x1, y1),
        new Point(x2, y1),
        new Point(x2, y2),
        new Point(x1, y2)
      ];
      
      cells.push(cell);
    }
    
    console.log(`Generated ${cells.length} grid cells`);
    return cells;
  }

  /**
   * Fisher-Yates 洗牌算法
   */
  shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
}

// 导出
if (typeof global !== 'undefined') {
  global.GridLayoutGenerator = GridLayoutGenerator;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = GridLayoutGenerator;
}
