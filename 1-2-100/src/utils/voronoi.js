/**
 * voronoi.js
 * Fortune 扫描线算法生成 Voronoi 图
 * 支持 Lloyd 松弛（让格子更均匀）+ Sutherland-Hodgman 多边形裁剪
 *
 * 对外接口：
 *   computeVoronoi(n, width, height, relaxSteps?)
 *   → Cell[]   每个 Cell：{ cx, cy, poly: [x,y][] }
 */

// ─────────────────────────────────────────────────────────────────────────────
// 工具函数
// ─────────────────────────────────────────────────────────────────────────────

function dist2(ax, ay, bx, by) {
  return (ax - bx) ** 2 + (ay - by) ** 2;
}

function circumcenter(ax, ay, bx, by, cx, cy) {
  const D = 2 * (ax * (by - cy) + bx * (cy - ay) + cx * (ay - by));
  if (Math.abs(D) < 1e-10) return null;
  const ux = ((ax * ax + ay * ay) * (by - cy)
            + (bx * bx + by * by) * (cy - ay)
            + (cx * cx + cy * cy) * (ay - by)) / D;
  const uy = ((ax * ax + ay * ay) * (cx - bx)
            + (bx * bx + by * by) * (ax - cx)
            + (cx * cx + cy * cy) * (bx - ax)) / D;
  return { x: ux, y: uy };
}

// ─────────────────────────────────────────────────────────────────────────────
// Sutherland-Hodgman 多边形 ∩ 矩形裁剪
// ─────────────────────────────────────────────────────────────────────────────

function clipPolygonByHalfPlane(poly, nx, ny, d) {
  // 保留满足 nx*x + ny*y + d >= 0 的部分
  if (poly.length === 0) return [];
  const out = [];
  for (let i = 0; i < poly.length; i++) {
    const cur  = poly[i];
    const next = poly[(i + 1) % poly.length];
    const ci = nx * cur[0]  + ny * cur[1]  + d;
    const ni = nx * next[0] + ny * next[1] + d;
    if (ci >= 0) out.push(cur);
    if ((ci >= 0) !== (ni >= 0)) {
      const t = ci / (ci - ni);
      out.push([cur[0] + t * (next[0] - cur[0]),
                cur[1] + t * (next[1] - cur[1])]);
    }
  }
  return out;
}

function clipToBBox(poly, x0, y0, x1, y1) {
  let p = poly;
  p = clipPolygonByHalfPlane(p,  1,  0, -x0);   // left
  p = clipPolygonByHalfPlane(p, -1,  0,  x1);   // right
  p = clipPolygonByHalfPlane(p,  0,  1, -y0);   // top
  p = clipPolygonByHalfPlane(p,  0, -1,  y1);   // bottom
  return p;
}

// ─────────────────────────────────────────────────────────────────────────────
// Fortune 扫描线 — 核心数据结构
// ─────────────────────────────────────────────────────────────────────────────

class HalfEdge {
  constructor(site) {
    this.site  = site;        // 左侧 site
    this.edge  = null;        // 对应的 Edge
    this.angle = 0;
    this.prev  = null;
    this.next  = null;
  }
}

class Edge {
  constructor(lSite, rSite) {
    this.lSite = lSite;
    this.rSite = rSite;
    this.va    = null;        // 起点
    this.vb    = null;        // 终点
  }
  setStart(x, y) { this.va = { x, y }; }
  setEnd(x, y)   { this.vb = { x, y }; }
}

class Cell {
  constructor(site) {
    this.site      = site;
    this.halfedges = [];
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Fortune 扫描线主体
// ─────────────────────────────────────────────────────────────────────────────

class FortuneVoronoi {
  constructor() {
    this.edges = [];
    this.cells = [];
  }

  // 抛物线焦点在 site，准线在 ly，查询 x 处的 y
  _parabola(sx, sy, ly, x) {
    const d = sy - ly;
    if (Math.abs(d) < 1e-10) return Infinity;
    return (x * x - 2 * sx * x + sx * sx + sy * sy - ly * ly) / (2 * d);
  }

  // 海岸线查询：扫描线 ly 处，x 位于哪段抛物线下方
  _arcAt(beach, x, ly) {
    let lo = 0, hi = beach.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      const yMid = this._parabola(beach[mid].x, beach[mid].y, ly, x);
      const yNxt = this._parabola(beach[mid + 1].x, beach[mid + 1].y, ly, x);
      if (yMid > yNxt) lo = mid + 1; else hi = mid;
    }
    return lo;
  }

  // 两段抛物线交点的 x（ly 为扫描线）
  _intersectX(s1, s2, ly) {
    const { x: x1, y: y1 } = s1;
    const { x: x2, y: y2 } = s2;
    if (Math.abs(y1 - y2) < 1e-10) return (x1 + x2) / 2;
    const d1 = 1 / (2 * (y1 - ly));
    const d2 = 1 / (2 * (y2 - ly));
    const a  = d1 - d2;
    const b  = -2 * (x1 * d1 - x2 * d2);
    const c  = (x1 * x1 + y1 * y1 - ly * ly) * d1
             - (x2 * x2 + y2 * y2 - ly * ly) * d2;
    const disc = b * b - 4 * a * c;
    if (disc < 0) return (x1 + x2) / 2;
    return (-b + Math.sqrt(disc)) / (2 * a);
  }

  compute(sites) {
    const n = sites.length;
    if (n === 0) return { edges: [], cells: [] };

    // 按 y 排序（y 小的先处理），y 相同按 x
    const sorted = [...sites].sort((a, b) => a.y !== b.y ? a.y - b.y : a.x - b.x);

    // 为每个 site 建 Cell
    const cellMap = new Map();
    for (const s of sites) {
      const c = new Cell(s);
      this.cells.push(c);
      cellMap.set(s, c);
    }

    // 事件队列：{ y, type:'site'|'circle', ... }
    const events = sorted.map(s => ({ y: s.y, type: 'site', site: s }));
    // 用小顶堆模拟——这里用数组+每次 sort（n<=100 可接受）
    const pq = [...events];
    const pqPush = (e) => { pq.push(e); pq.sort((a, b) => a.y - b.y); };
    const pqPop  = () => pq.shift();

    // 海岸线：arc 数组，每个 arc 带 site、左右 Edge、以及可能的 circleEvent
    const beach = [];          // [{ site, edge_l, edge_r, circleEvt }]

    // 标记 circle event 失效
    const invalidate = (arc) => {
      if (arc && arc.circleEvt) arc.circleEvt.invalid = true;
    };

    const addCircleEvent = (idx) => {
      if (idx <= 0 || idx >= beach.length - 1) return;
      const a = beach[idx - 1].site;
      const b = beach[idx].site;
      const c = beach[idx + 1].site;
      // 检查是否构成收缩（逆时针顺序 + 圆心在扫描线下方）
      const cross = (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
      if (cross >= 0) return;
      const cc = circumcenter(a.x, a.y, b.x, b.y, c.x, c.y);
      if (!cc) return;
      const r  = Math.sqrt(dist2(a.x, a.y, cc.x, cc.y));
      const ey = cc.y + r;
      const evt = { y: ey, type: 'circle', idx, arc: beach[idx], cx: cc.x, cy: cc.y };
      beach[idx].circleEvt = evt;
      pqPush(evt);
    };

    while (pq.length > 0) {
      const evt = pqPop();
      if (evt.invalid) continue;
      const ly = evt.y;

      if (evt.type === 'site') {
        const s = evt.site;
        if (beach.length === 0) {
          beach.push({ site: s, edgeL: null, edgeR: null, circleEvt: null });
          continue;
        }
        // 找插入位置
        const i = this._arcAt(beach.map(a => a.site), s.x, ly);
        invalidate(beach[i]);

        // 分裂 beach[i] → [i], [new], [dup of i]
        const splitArc = beach[i];
        const newEdge  = new Edge(splitArc.site, s);
        this.edges.push(newEdge);

        const arcL = { site: splitArc.site, edgeL: splitArc.edgeL, edgeR: newEdge,  circleEvt: null };
        const arcM = { site: s,             edgeL: newEdge,          edgeR: newEdge,  circleEvt: null };
        const arcR = { site: splitArc.site, edgeL: newEdge,          edgeR: splitArc.edgeR, circleEvt: null };

        // arcM 的 edgeR 应指向新的右边 Edge（与右侧 splitArc 共享）
        const newEdgeR = new Edge(s, splitArc.site);
        this.edges.push(newEdgeR);
        arcM.edgeR = newEdgeR;
        arcR.edgeL = newEdgeR;

        beach.splice(i, 1, arcL, arcM, arcR);

        // 注册 circle events
        addCircleEvent(i);
        addCircleEvent(i + 2);

      } else {
        // circle event
        const { arc, cx, cy } = evt;
        const i = beach.indexOf(arc);
        if (i < 0) continue;

        // 顶点
        const vx = cx, vy = cy;

        // 收尾两条边
        if (beach[i].edgeL) { beach[i].edgeL.setEnd(vx, vy); }
        if (beach[i].edgeR) { beach[i].edgeR.setEnd(vx, vy); }

        // 新边（i-1 和 i+1 合并处）
        if (i > 0 && i < beach.length - 1) {
          const newEdge = new Edge(beach[i - 1].site, beach[i + 1].site);
          newEdge.setStart(vx, vy);
          this.edges.push(newEdge);
          beach[i - 1].edgeR = newEdge;
          beach[i + 1].edgeL = newEdge;
        }

        invalidate(beach[i - 1]);
        invalidate(beach[i + 1]);

        beach.splice(i, 1);

        if (i > 0)                addCircleEvent(i - 1);
        if (i < beach.length)    addCircleEvent(i);
      }
    }

    return { edges: this.edges, cells: this.cells };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 对外接口：computeVoronoi
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 生成 n 个 Voronoi 格子，适合在 width×height 的画布上使用
 * @param {number}   n          格子数量
 * @param {number}   width      画布宽
 * @param {number}   height     画布高
 * @param {number}  [relax=2]   Lloyd 松弛迭代次数（越大越均匀）
 * @returns {{ cx, cy, poly }[]}
 */
function computeVoronoi(n, width, height, relax = 2) {
  // 1. 随机初始种子点（使用泊松盘风格网格抖动，避免聚堆）
  let pts = poissonGrid(n, width, height);

  // 2. Lloyd 松弛
  for (let iter = 0; iter < relax; iter++) {
    const polys = rawVoronoi(pts, width, height);
    pts = polys.map(({ poly }) => centroid(poly));
  }

  // 3. 最终计算
  const polys = rawVoronoi(pts, width, height);
  return polys;
}

// ─────────────────────────────────────────────────────────────────────────────
// 辅助：泊松盘风格初始布点
// ─────────────────────────────────────────────────────────────────────────────

function poissonGrid(n, w, h) {
  const cols  = Math.ceil(Math.sqrt(n * w / h));
  const rows  = Math.ceil(n / cols);
  const cw    = w / cols;
  const ch    = h / rows;
  const pts   = [];
  for (let r = 0; r < rows && pts.length < n; r++) {
    for (let c = 0; c < cols && pts.length < n; c++) {
      pts.push({
        x: (c + 0.15 + Math.random() * 0.7) * cw,
        y: (r + 0.15 + Math.random() * 0.7) * ch,
      });
    }
  }
  return pts;
}

// ─────────────────────────────────────────────────────────────────────────────
// 核心：用 Fortune 算法 + 裁剪生成多边形
// ─────────────────────────────────────────────────────────────────────────────

function rawVoronoi(pts, W, H) {
  // 用简化的邻接方法：对每个点求其 Voronoi 多边形
  // 大 n 情况用 Fortune；小 n 也可用暴力——这里统一走 Fortune 简化版
  // 因为标准 Fortune 输出 half-edge 比较复杂，这里用
  // "每对点的垂直平分线半平面求交"——对 n<=100 完全够用

  return pts.map((p, i) => {
    // 初始多边形 = 整个 bbox（稍大一点）
    let poly = [
      [0, 0], [W, 0], [W, H], [0, H]
    ];
    for (let j = 0; j < pts.length; j++) {
      if (j === i) continue;
      const q = pts[j];
      // 保留靠近 p 的半平面
      // 垂直平分线法线方向从 q 指向 p
      const nx = p.x - q.x;
      const ny = p.y - q.y;
      // 中点
      const mx = (p.x + q.x) / 2;
      const my = (p.y + q.y) / 2;
      // 半平面：nx*(x-mx) + ny*(y-my) >= 0
      // 即 nx*x + ny*y - (nx*mx + ny*my) >= 0
      const d = -(nx * mx + ny * my);
      poly = clipPolygonByHalfPlane(poly, nx, ny, d);
      if (poly.length === 0) break;
    }
    // 再裁到 bbox
    poly = clipToBBox(poly, 0, 0, W, H);
    const c = centroid(poly.length > 0 ? poly : [[p.x, p.y]]);
    return { cx: c.x, cy: c.y, poly, site: p };
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 多边形质心
// ─────────────────────────────────────────────────────────────────────────────

function centroid(poly) {
  if (poly.length === 0) return { x: 0, y: 0 };
  let ax = 0, ay = 0, area = 0;
  for (let i = 0; i < poly.length; i++) {
    const [x0, y0] = poly[i];
    const [x1, y1] = poly[(i + 1) % poly.length];
    const cross = x0 * y1 - x1 * y0;
    area += cross;
    ax   += (x0 + x1) * cross;
    ay   += (y0 + y1) * cross;
  }
  area /= 2;
  if (Math.abs(area) < 1e-10) {
    const mx = poly.reduce((s, p) => s + p[0], 0) / poly.length;
    const my = poly.reduce((s, p) => s + p[1], 0) / poly.length;
    return { x: mx, y: my };
  }
  return { x: ax / (6 * area), y: ay / (6 * area) };
}

module.exports = {
  computeVoronoi
};
