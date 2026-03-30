# CSS 盒模型与 BFC

## 盒模型

每个元素都是一个矩形盒子，由四部分组成：

```
┌─────────── margin ────────────┐
│  ┌──────── padding ────────┐  │
│  │  ┌───── border ───────┐ │  │
│  │  │  ┌── content ────┐ │ │  │
│  │  │  │               │ │ │  │
│  │  │  └───────────────┘ │ │  │
│  │  └────────────────────┘ │  │
│  └──────────────────────────┘  │
└────────────────────────────────┘
```

### box-sizing

```css
/* 默认值：width 只包含 content */
box-sizing: content-box;

/* 推荐值：width 包含 content + padding + border */
box-sizing: border-box;
```

## BFC（Block Formatting Context）

BFC 是一个独立的渲染区域，内部元素的布局不会影响外部。

### 触发 BFC 的条件
- `overflow` 不为 `visible`（如 `auto`、`hidden`）
- `display` 为 `flow-root`（推荐）
- `float` 不为 `none`
- `position` 为 `absolute` 或 `fixed`

### BFC 的应用场景
1. **清除浮动**：父元素设置 `overflow: hidden` 或 `display: flow-root`
2. **防止 margin 塌陷**：两个相邻块的 margin 会合并，BFC 可阻止
3. **自适应两栏布局**：左侧浮动，右侧创建 BFC

```css
.container {
  display: flow-root; /* 现代方式创建 BFC */
}
```
