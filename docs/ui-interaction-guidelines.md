# UI 交互层规范（指针事件、加载态与触发器）

## 指针事件与层级（Pointer Events & Z-Index）
- 顶层容器（如 Toast Viewport、全局 Portal 容器、顶栏浮层）默认使用 `pointer-events-none`，仅在需要交互的子元素上启用 `pointer-events-auto`。
- 覆盖全屏的 Overlay/Backdrop 必须显式设置指针事件与 `z-index`，并在关闭时移除或隐藏（避免“透明挡板”残留）。
- 顶部导航使用 `sticky top-0 z-*` 时，需确认上层容器不会持续拦截点击；全屏固定层请比对 `z-index` 与 `pointer-events`。

## 触发器使用规范（Radix）
- Dropdown、Dialog、Menu 等触发器统一采用 `Trigger asChild` 包裹可交互元素（`Button`），内部再放 `Avatar/Icon`，保证事件稳定与可访问性。
- 为按钮添加必要的 `aria-label`，保持键盘与读屏可用。
- 需要跨平台稳定性的组件，优先使用按钮作为交互源，避免直接以纯装饰元素（如 Avatar）作为触发节点。

## 加载态与 Skeleton
- Skeleton 不应覆盖必须可交互的区域；若必须覆盖，提供“最小可点击”占位（如一个按钮样式的骨架），或将交互延后至数据就绪。
- 若存在可用的即时状态（如 `auth.currentUser`），在 `loading` 期间优先用该状态渲染核心交互，Skeleton 仅用于非交互内容。
- 在交互关键路径出现 Skeleton 时，需评估是否添加过渡占位交互或引导（如禁用态按钮+提示文案）。

## 登录交互建议
- 登录优先使用 `signInWithPopup`，被拦截或不支持时回退到 `signInWithRedirect`，并给出清晰提示。
- Provider 配置建议：添加 `profile` 与 `email` 作用域，并设置 `prompt: 'select_account'`，确保每次都能选择账号。
- 提示体系：登录成功、弹窗被拦截切换重定向、域名未授权三类提示必须完善（Toaster 或等效方案）。

## 调试与可观测性
- 调试日志需集中在关键流程（触发、打开、成功/失败），并通过开发环境开关启用（例如 `localStorage.getItem('debug-auth') === '1'`）。
- 全局捕获日志（`document.addEventListener('pointerdown', ..., true)`）仅作为排查手段，默认不启用、也不提交到生产分支。
- 需要定位覆盖层时，优先使用 `elementsFromPoint` 输出并核对 `z-index` 与类名。

## 验收清单（Checklists）
- 顶层容器是否默认 `pointer-events-none`，子元素是否按需 `pointer-events-auto`？
- 触发器是否采用 `asChild + Button` 包裹，具备可访问属性？
- 加载态是否不会吞掉关键交互？是否有合理的 fallback 或禁用态提示？
- 登录流是否具备弹窗→重定向回退与提示？Provider 是否配置了 `profile`/`email` 与 `select_account`？
- 交互是否在不同浏览器/平台验证过（含移动端 Safari/内置浏览器）？

