// 站点配置：所有个人信息、社交链接等集中在此管理
// 也可以通过管理后台在线修改

export const siteConfig = {
  name: "Your Name",
  title: "Your Name",
  description: "个人网站 - 项目、博客与技术分享",
  url: "https://example.com",

  // 个人信息
  author: {
    name: "Your Name",
    bio: "在这里写一段简短的个人介绍。",
    avatar: "/avatar.jpg",
    location: "Your Location",
    email: "your-email@example.com",
  },

  // Hero 区域
  hero: {
    greeting: "你好，我是",
    name: "Your Name",
    tagline: "开发者 / 开源爱好者 / 技术写作者",
    description:
      "热衷于用代码解决实际问题，构建简洁高效的数字产品。",
  },

  // 社交链接
  social: {
    github: "https://github.com/your-github",
    twitter: "https://x.com/your-handle",
    email: "mailto:your-email@example.com",
  },

  // 导航
  nav: [
    { href: "/", label: "首页" },
    { href: "/projects", label: "项目" },
    { href: "/blog", label: "博客" },
    { href: "/about", label: "关于" },
  ],
};

export type SiteConfig = typeof siteConfig;
