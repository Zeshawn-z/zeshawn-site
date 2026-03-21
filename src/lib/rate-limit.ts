/**
 * 简易内存级速率限制器
 * 基于 IP 的滑动窗口计数，用于防止留言/评论接口被刷
 * 注意：仅适用于单实例部署，多实例需使用 Redis 等外部存储
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// 定期清理过期条目，防止内存泄漏
const CLEANUP_INTERVAL = 60 * 1000; // 1 分钟
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now > entry.resetAt) store.delete(key);
  }
}, CLEANUP_INTERVAL);

/**
 * 检查是否超过速率限制
 * @param key - 限流键（通常为 IP + 接口标识）
 * @param maxRequests - 窗口内最大请求数
 * @param windowMs - 时间窗口（毫秒）
 * @returns { allowed: boolean; remaining: number; retryAfterMs: number }
 */
export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; remaining: number; retryAfterMs: number } {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    // 新窗口
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1, retryAfterMs: 0 };
  }

  if (entry.count < maxRequests) {
    entry.count++;
    return { allowed: true, remaining: maxRequests - entry.count, retryAfterMs: 0 };
  }

  // 超限
  return { allowed: false, remaining: 0, retryAfterMs: entry.resetAt - now };
}

/** 从 NextRequest 中提取客户端 IP */
export function getClientIp(request: Request): string {
  const headers = request.headers;
  // 常见反代头，优先级从高到低
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const realIp = headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "unknown";
}
