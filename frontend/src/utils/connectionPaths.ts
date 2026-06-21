/**
 * 动态连线路径生成
 * 根据节点实际 DOM 位置计算 SVG path
 */

export interface NodeRect {
  cx: number; // center x
  cy: number; // center y
  top: number;
  bottom: number;
  left: number;
  right: number;
}

/** 创建从 topNode 底部到 bottomNode 顶部的垂直连线 */
export function verticalLine(top: NodeRect, bottom: NodeRect): string {
  const x1 = top.cx;
  const y1 = top.bottom;
  const x2 = bottom.cx;
  const y2 = bottom.top;
  return `M${x1},${y1} L${x2},${y2}`;
}

/** 创建从 parent 底部到 children 顶部的分叉连线 */
export function fanLines(
  parent: NodeRect,
  children: NodeRect[],
): string[] {
  return children.map((child) => {
    const cp1y = parent.bottom + (child.top - parent.bottom) * 0.4;
    const cp2y = parent.bottom + (child.top - parent.bottom) * 0.6;
    return `M${parent.cx},${parent.bottom} C${parent.cx},${cp1y} ${child.cx},${cp2y} ${child.cx},${child.top}`;
  });
}

/** 通过 class 选择器获取节点矩形 */
export function getNodeRect(selector: string): NodeRect | null {
  const el = document.querySelector(selector);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  const canvas = document.querySelector('[data-canvas]');
  const canvasRect = canvas?.getBoundingClientRect() ?? { left: 0, top: 0 };
  return {
    cx: r.left + r.width / 2 - canvasRect.left,
    cy: r.top + r.height / 2 - canvasRect.top,
    top: r.top - canvasRect.top,
    bottom: r.bottom - canvasRect.top,
    left: r.left - canvasRect.left,
    right: r.right - canvasRect.left,
  };
}

/** 默认静态连线（用作 fallback，与 v4-brand viewBox 百分比一致） */
export function defaultPaths(): string[] {
  return [
    // 总裁 → 执行总裁
    'M50,8 L50,29',
    // 执行总裁 → 4 个角色
    'M50,29 C50,36 30,40 28,56',
    'M50,29 C50,37 42,40 41,56',
    'M50,29 C50,37 58,40 59,56',
    'M50,29 C50,36 70,40 72,56',
  ];
}
