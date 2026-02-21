# logger 使用说明

## 目标
- 本地开发：方便打印调试信息
- 生产环境：默认不输出任何日志；如需临时排查，可通过本地开关开启
- 禁止在项目中直接使用 `console.*`，统一走 `logger`

## 文件位置
- 源码位置：[logger.ts](file:///d:/Codes_ai_assistant/Trae/planPal/src/lib/logger.ts)
- 生产移除 console 配置：[next.config.ts](file:///d:/Codes_ai_assistant/Trae/planPal/next.config.ts#L3-L14)
- ESLint 规则（禁止 console）：[.eslintrc.json](file:///d:/Codes_ai_assistant/Trae/planPal/.eslintrc.json)

## 行为
- 开发环境（`NODE_ENV !== 'production'`）：`logger.*` 会输出
- 生产环境（`NODE_ENV === 'production'`）：`logger.*` 默认不输出
- 临时开启生产日志（仅本机浏览器）：
  - 开启：`localStorage.setItem('debug','1'); location.reload()`
  - 仅认证相关：`localStorage.setItem('debug-auth','1'); location.reload()`
  - 关闭：`localStorage.removeItem('debug'); localStorage.removeItem('debug-auth'); location.reload()`

注：生产构建同时启用了 Next 的 `compiler.removeConsole`，会剔除代码中直接出现的 `console.*` 调用；`logger` 内部使用了受控输出（而非直接 `console.log` 调用在源码处），因此可在必要时通过本地开关临时查看日志。

## API
- `logger.log(...args: unknown[])`
- `logger.info(...args: unknown[])`
- `logger.warn(...args: unknown[])`
- `logger.error(...args: unknown[])`

推荐为日志打上域名标识（如 `[Auth]`、`[Profile]`），并尽量输出结构化对象便于检索。

## 使用示例

### 事件处理
```ts
import { logger } from '@/lib/logger'

function onClickAvatar() {
  logger.log('[Auth] Avatar button click')
}
```

### 异步流程
```ts
import { logger } from '@/lib/logger'

async function signIn() {
  try {
    logger.log('[Auth] Attempt popup sign-in')
    const result = await doLogin()
    logger.info('[Auth] Popup success', { uid: result.user.uid })
  } catch (e) {
    const err = e as { code?: string; message?: string }
    logger.error('[Auth] Popup error', { code: err?.code, message: err?.message })
  }
}
```

### UI 状态变化
```ts
import { logger } from '@/lib/logger'

function onMenuOpenChange(open: boolean) {
  logger.log('[Auth] Menu open change', open)
}
```

### 数据请求
```ts
import { logger } from '@/lib/logger'

async function loadProfile() {
  logger.log('[Profile] fetch start')
  const res = await fetch('/api/profile')
  if (!res.ok) {
    logger.error('[Profile] fetch failed', { status: res.status })
    return
  }
  const data = await res.json()
  logger.info('[Profile] fetch ok', { size: JSON.stringify(data).length })
}
```

## 迁移指南（从 console 到 logger）
- 将 `console.log(...)` 替换为 `logger.log(...)`（其他同理）
- 为日志添加域名前缀（如 `[PlanForm]`、`[Toast]`），并尽量输出对象：`logger.error('[PlanForm] load failed', { storageKey, error: String(e) })`
- 禁止直接使用 `console.*`：已通过 ESLint 强制（logger.ts 内部除外）

## 注意事项
- `logger` 仅用于客户端代码（文件头部 `use client`）；服务端如需日志，请按后端方案实现
- 避免大体量数据直接打印；建议输出关键信息（id/状态码/计数等）
- 调试结束后无需清理日志：生产默认不输出；需要线上排查时可临时开启

