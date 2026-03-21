import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

// 管理后台密码和 JWT 密钥
// 生产环境请务必通过环境变量配置！
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD_HASH =
  process.env.ADMIN_PASSWORD_HASH ||
  bcrypt.hashSync("admin123", 10); // 默认密码: admin123
const JWT_SECRET = process.env.JWT_SECRET || "zeshawn-site-jwt-secret-change-me";

// 生产环境安全检测：使用默认凭证时打印醒目警告
if (process.env.NODE_ENV === "production") {
  const warnings: string[] = [];
  if (!process.env.ADMIN_USERNAME) warnings.push("ADMIN_USERNAME 未设置，使用默认值 'admin'");
  if (!process.env.ADMIN_PASSWORD_HASH) warnings.push("ADMIN_PASSWORD_HASH 未设置，使用默认密码 'admin123'");
  if (!process.env.JWT_SECRET) warnings.push("JWT_SECRET 未设置，使用默认值");
  if (warnings.length > 0) {
    console.warn("\n⚠️  [安全警告] 管理后台正在使用默认凭证，请通过环境变量配置：");
    warnings.forEach((w) => console.warn(`   - ${w}`));
    console.warn("   请参考 README 第 4.1 节或 ops/server-config/systemd/zeshawn-next.service.d/env.conf.example\n");
  }
}

export async function verifyCredentials(
  username: string,
  password: string
): Promise<boolean> {
  if (username !== ADMIN_USERNAME) return false;
  return bcrypt.compareSync(password, ADMIN_PASSWORD_HASH);
}

export function generateToken(): string {
  return jwt.sign({ role: "admin" }, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): boolean {
  try {
    jwt.verify(token, JWT_SECRET);
    return true;
  } catch {
    return false;
  }
}

export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  if (!token) return false;
  return verifyToken(token);
}
