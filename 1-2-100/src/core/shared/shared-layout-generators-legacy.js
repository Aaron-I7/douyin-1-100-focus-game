const { computeVoronoi } = require('../../utils/voronoi');

class Point {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  distanceTo(other) {
    const dx = this.x - other.x;
    const dy = this.y - other.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  clone() {
    return new Point(this.x, this.y);
  }
}

class Edge {
  constructor(start, end, leftSite, rightSite) {
    this.start = start;
    this.end = end;
    this.leftSite = leftSite;
    this.rightSite = rightSite;
  }
}

class Cell {
  constructor(site, number) {
    this.site = site;
    this.number = number;
    this.edges = [];
    this.polygon = [];
    this.done = false;
  }

  getArea() {
    if (this.polygon.length < 3) return 0;
    let area = 0;
    for (let i = 0; i < this.polygon.length; i++) {
      const j = (i + 1) % this.polygon.length;
      area += this.polygon[i].x * this.polygon[j].y;
      area -= this.polygon[j].x * this.polygon[i].y;
    }
    return Math.abs(area) / 2;
  }

  containsPoint(point) {
    let inside = false;
    const polygon = this.polygon;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].x, yi = polygon[i].y;
      const xj = polygon[j].x, yj = polygon[j].y;
      const intersect = ((yi > point.y) !== (yj > point.y))
        && (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  }
}

class VoronoiGenerator {
  constructor(width, height, numSites) {
    this.width = width;
    this.height = height;
    this.numSites = numSites;
    this.sites = [];
    this.cells = [];
    this.randomSeed = Date.now();
  }

  generateSites() {
    const sites = [];
    const gridSize = Math.ceil(Math.sqrt(this.numSites));
    const cellW = this.width / gridSize;
    const cellH = this.height / gridSize;
    for (let i = 0; i < this.numSites; i++) {
      const row = Math.floor(i / gridSize);
      const col = i % gridSize;
      const x = (col + 0.5 + (Math.random() - 0.5) * 0.8) * cellW;
      const y = (row + 0.5 + (Math.random() - 0.5) * 0.8) * cellH;
      const clampedX = Math.max(10, Math.min(this.width - 10, x));
      const clampedY = Math.max(10, Math.min(this.height - 10, y));
      sites.push(new Point(clampedX, clampedY));
    }
    return sites;
  }

  generateVoronoiCells() {
    const cells = this.sites.map((site, i) => new Cell(site, i + 1));
    for (let i = 0; i < cells.length; i++) {
      const cell = cells[i];
      const polygon = this.buildCellPolygon(cell.site, i);
      cell.polygon = polygon;
    }
    return cells;
  }

  buildCellPolygon(site, siteIndex) {
    const numAngles = 36;
    const maxRadius = Math.max(this.width, this.height);
    const points = [];
    for (let i = 0; i < numAngles; i++) {
      const angle = (i / numAngles) * Math.PI * 2;
      const dx = Math.cos(angle);
      const dy = Math.sin(angle);
      let minR = 0;
      let maxR = maxRadius;
      let boundaryPoint = null;
      for (let iter = 0; iter < 20; iter++) {
        const r = (minR + maxR) / 2;
        const testX = site.x + dx * r;
        const testY = site.y + dy * r;
        if (testX < 0 || testX > this.width || testY < 0 || testY > this.height) {
          maxR = r;
          continue;
        }
        const nearestIndex = this.findNearestSite(testX, testY);
        if (nearestIndex === siteIndex) {
          minR = r;
          boundaryPoint = new Point(testX, testY);
        } else {
          maxR = r;
        }
      }
      if (boundaryPoint) {
        points.push(boundaryPoint);
      }
    }
    return this.clipPolygonToBounds(points);
  }

  findNearestSite(x, y) {
    let minDist = Infinity;
    let nearestIndex = 0;
    for (let i = 0; i < this.sites.length; i++) {
      const site = this.sites[i];
      const dx = x - site.x;
      const dy = y - site.y;
      const dist = dx * dx + dy * dy;
      if (dist < minDist) {
        minDist = dist;
        nearestIndex = i;
      }
    }
    return nearestIndex;
  }

  clipPolygonToBounds(points) {
    if (points.length === 0) return [];
    const clipped = [];
    for (const point of points) {
      const x = Math.max(0, Math.min(this.width, point.x));
      const y = Math.max(0, Math.min(this.height, point.y));
      clipped.push(new Point(x, y));
    }
    return clipped;
  }

  assignNumbers(cells) {
    const numbers = Array.from({ length: this.numSites }, (_, i) => i + 1);
    for (let i = numbers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
    }
    cells.forEach((cell, i) => {
      cell.number = numbers[i];
    });
  }

  validateCells(cells) {
    const minArea = (this.width * this.height) * 0.005;
    for (const cell of cells) {
      const area = cell.getArea();
      if (area < minArea) {
        console.warn(`Cell ${cell.number} area too small: ${area}`);
        return false;
      }
    }
    const numbers = cells.map((c) => c.number).sort((a, b) => a - b);
    for (let i = 0; i < numbers.length - 1; i++) {
      if (numbers[i] === numbers[i + 1]) {
        console.error('Duplicate numbers found');
        return false;
      }
    }
    return true;
  }

  generate() {
    console.log('Generating Voronoi diagram...');
    const startTime = Date.now();
    const polygons = computeVoronoi(this.numSites, this.width, this.height, 2);
    this.cells = polygons.map((item, index) => {
      const site = new Point(item.cx, item.cy);
      const cell = new Cell(site, index + 1);
      cell.polygon = item.poly.map((p) => new Point(p[0], p[1]));
      return cell;
    });
    this.sites = this.cells.map((cell) => cell.site.clone());
    console.log(`Generated ${this.cells.length} cells`);
    this.assignNumbers(this.cells);
    const valid = this.validateCells(this.cells);
    if (!valid) {
      throw new Error('Voronoi generation validation failed');
    }
    const endTime = Date.now();
    console.log(`Voronoi generation completed in ${endTime - startTime}ms`);
    return this.cells;
  }
}

class GridLayoutGenerator {
  constructor(width, height, numCells) {
    this.width = width;
    this.height = height;
    this.numCells = numCells;
  }

  generate() {
    console.log('Using grid layout fallback...');
    const cells = [];
    const gridSize = Math.ceil(Math.sqrt(this.numCells));
    const cellWidth = this.width / gridSize;
    const cellHeight = this.height / gridSize;
    const numbers = Array.from({ length: this.numCells }, (_, i) => i + 1);
    this.shuffle(numbers);
    for (let i = 0; i < this.numCells; i++) {
      const row = Math.floor(i / gridSize);
      const col = i % gridSize;
      const centerX = (col + 0.5) * cellWidth;
      const centerY = (row + 0.5) * cellHeight;
      const site = new Point(centerX, centerY);
      const cell = new Cell(site, numbers[i]);
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

  shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
}

module.exports = {
  Point,
  Edge,
  Cell,
  VoronoiGenerator,
  GridLayoutGenerator
};
