/**
 * 节点布局计算 —— 基于画布尺寸的百分比定位
 * 与 v4-brand.html 静态 SVG 坐标系一致
 */

export interface Point {
  x: number; // px from left
  y: number; // px from top
}

const DEFAULT_CANVAS = { width: 1200, height: 700 };

// 百分比坐标（与原 HTML 的 viewBox="0 0 100 100" 对齐）
const PRESIDENT_X_PCT = 50;  // left:50%
const PRESIDENT_Y_PCT = 8;   // top:8% of viewBox

const ROUTER_X_PCT = 50;     // left:50%
const ROUTER_Y_PCT = 29;     // top:29% of viewBox

const ROLE_ROW_Y_PCT = 56;   // top:56% of viewBox

// Role X positions in viewBox percent (for 4 roles)
const ROLE_X_PCTS = [28, 41, 59, 72];

export function getCanvasSize(): { width: number; height: number } {
  if (typeof window === 'undefined') return DEFAULT_CANVAS;
  const el = document.querySelector('[data-canvas]');
  if (!el) return DEFAULT_CANVAS;
  return { width: el.clientWidth, height: el.clientHeight };
}

/** 百分比 → 像素 */
function pctToPx(pct: number, total: number): number {
  return (pct / 100) * total;
}

export function getPresidentPosition(canvas?: { width: number; height: number }): Point {
  const c = canvas ?? getCanvasSize();
  return {
    x: pctToPx(PRESIDENT_X_PCT, c.width),
    y: pctToPx(PRESIDENT_Y_PCT, c.height),
  };
}

export function getRouterPosition(canvas?: { width: number; height: number }): Point {
  const c = canvas ?? getCanvasSize();
  return {
    x: pctToPx(ROUTER_X_PCT, c.width),
    y: pctToPx(ROUTER_Y_PCT, c.height),
  };
}

export function getRoleRowTop(canvas?: { width: number; height: number }): number {
  const c = canvas ?? getCanvasSize();
  return pctToPx(ROLE_ROW_Y_PCT, c.height);
}

export function getRolePositions(
  count: number,
  canvas?: { width: number; height: number },
): Point[] {
  const c = canvas ?? getCanvasSize();
  // Evenly distribute in the center area
  const startPct = 50 - (count - 1) * 7;
  return Array.from({ length: count }, (_, i) => ({
    x: pctToPx(startPct + i * 14, c.width),
    y: pctToPx(ROLE_ROW_Y_PCT, c.height),
  }));
}
