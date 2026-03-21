/**
 * IP 归属地查询服务
 * 使用免费 API 查询 IP 的省份/城市信息
 * 返回格式如 "广东广州"、"北京"、"美国"
 */

// 简单缓存，避免重复查询
const cache = new Map<string, { location: string; expireAt: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 小时

/**
 * 查询 IP 归属地
 * 优先使用 ip-api.com（免费、无需 key、支持中文）
 */
export async function getIpLocation(ip: string): Promise<string> {
  // 内网 / 无效 IP 直接返回空
  if (!ip || ip === "unknown" || ip === "127.0.0.1" || ip === "::1" || ip.startsWith("192.168.") || ip.startsWith("10.")) {
    return "";
  }

  // 检查缓存
  const cached = cache.get(ip);
  if (cached && Date.now() < cached.expireAt) {
    return cached.location;
  }

  try {
    // ip-api.com 免费版，支持中文返回，无需 API key
    // 注意：免费版限制 45 次/分钟，对个人网站足够
    const res = await fetch(
      `http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,country,regionName,city&lang=zh-CN`,
      { signal: AbortSignal.timeout(3000) }
    );

    if (!res.ok) return "";

    const data = await res.json();
    if (data.status !== "success") return "";

    let location = "";
    if (data.country === "中国") {
      // 国内：显示 "省份城市"，如果省份=城市（直辖市）只显示一个
      const region = data.regionName || "";
      const city = data.city || "";
      if (region && city && region !== city) {
        location = `${region}${city}`;
      } else {
        location = region || city;
      }
    } else {
      // 海外：显示国家名
      location = data.country || "";
    }

    // 写入缓存
    if (location) {
      cache.set(ip, { location, expireAt: Date.now() + CACHE_TTL });
    }

    // 定期清理过期缓存
    if (cache.size > 1000) {
      const now = Date.now();
      for (const [key, val] of cache) {
        if (now > val.expireAt) cache.delete(key);
      }
    }

    return location;
  } catch {
    // 查询失败不影响主流程，返回空
    return "";
  }
}
