# 侧边栏功能语法错误修复

## 问题
编译错误：方法被添加到了类定义之外（在 module.exports 之后）

## 修复
将以下方法移到 UIManager 类内部（在类结束的 `}` 之前）：
- `drawSidebarRewardEntry(ctx)`
- `showSidebarRewardDialog()`
- `handleNavigateToSidebar()`
- `handleSidebarRewardClaim()`

## 状态
✅ 已修复，代码现在应该可以正常编译
