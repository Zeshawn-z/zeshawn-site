// 站点配置：所有个人信息、社交链接等集中在此管理
// 也可以通过管理后台在线修改

export const siteConfig = {
  name: "Zeshawn",
  title: "Zeshawn",
  description: "Zeshawn 的个人网站 - 项目、博客与技术分享",
  url: "https://zeshawn.com",

  // 个人信息
  author: {
    name: "Zeshawn",
    bio: "一名热爱技术的开发者。我喜欢构建优雅的产品，探索新技术，并通过写作分享我的思考和经验。",
    avatar: "/avatar.jpg",
    location: "中国",
    email: "hello@zeshawn.com",
  },

  // Hero 区域
  hero: {
    greeting: "你好，我是",
    name: "Zeshawn",
    tagline: "全栈开发者 / 开源爱好者 / 技术写作者",
    description:
      "热衷于用代码解决实际问题，构建优雅、高效的数字产品。擅长 React 生态和现代 Web 开发，同时对后端架构和系统设计充满热情。",
  },

  // 社交链接
  social: {
    github: "https://github.com/zeshawn",
    twitter: "https://twitter.com/zeshawn",
    email: "mailto:hello@zeshawn.com",
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
