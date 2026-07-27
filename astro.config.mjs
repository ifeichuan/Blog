// @ts-check

import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import { defineConfig, envField } from "astro/config";

import vue from "@astrojs/vue";
import react from "@astrojs/react";


import cloudflare from "@astrojs/cloudflare";
import remarkToc from "remark-toc";
import { remarkAlert } from "remark-github-blockquote-alert";
import tailwindcss from "@tailwindcss/vite";
// https://astro.build/config
export default defineConfig({
  site: "https://feichuans.com",
  env: {
    schema: {
      UMAMI_API_KEY: envField.string({
        context: "server",
        access: "secret",
        optional: true,
      }),
      UMAMI_DEBUG: envField.string({
        context: "server",
        access: "public",
        optional: true,
      }),
      UMAMI_WEBSITE_ID: envField.string({
        context: "server",
        access: "public",
        optional: true,
        default: "e68649b2-93c5-4ee5-abd9-78cca185ebed",
      }),
      UMAMI_API_CLIENT_ENDPOINT: envField.string({
        context: "server",
        access: "public",
        optional: true,
        default: "https://api.umami.is/v1",
      }),
    },
  },
  integrations: [
    mdx(),
    sitemap({
      filter: (page) =>
        !page.includes("/_archive/") && !page.endsWith("/home-v4/"),
    }),
    vue(),
    react(),
  ],
  redirects: {
    "/blogs/anthony-fu-的-vue3-开发规范完整解读":
      "/blogs/05-archive/anthony-fu-的-vue3-开发规范完整解读",
    "/blogs/lenis-与-gsap-scrolltrigger-深度解析":
      "/blogs/05-archive/lenis-与-gsap-scrolltrigger-深度解析",
    "/blogs/linux学习": "/blogs/05-archive/linux学习",
    "/blogs/openclaw-架构解析一个生产级-ai-agent-是如何设计的":
      "/blogs/03-areas/ai/openclaw-架构解析一个生产级-ai-agent-是如何设计的",
    "/blogs/01-inbox/openclaw-架构解析一个生产级-ai-agent-是如何设计的":
      "/blogs/03-areas/ai/openclaw-架构解析一个生产级-ai-agent-是如何设计的",
    "/blogs/04-resource/paseo-architecture-blog":
      "/blogs/02-projects/eyrie/paseo-architecture-blog",
    "/blogs/paseo-architecture-blog":
      "/blogs/02-projects/eyrie/paseo-architecture-blog",
    "/blogs/strapi踩坑指南": "/blogs/05-archive/strapi踩坑指南",
    "/blogs/tmux速记": "/blogs/05-archive/tmux速记",
    "/blogs/被-ai-逼疯的前端从手搓流式打字机到浏览器端跑-react":
      "/blogs/03-areas/frontend/被-ai-逼疯的前端从手搓流式打字机到浏览器端跑-react",
    "/blogs/计算机网络-谢希仁": "/blogs/05-archive/计算机网络-谢希仁",
    "/blogs/简历计划": "/blogs/03-areas/职业生涯/简历计划",
    "/blogs/03-areas/简历计划": "/blogs/03-areas/职业生涯/简历计划",
    "/blogs/拒绝临时性-生活": "/blogs/05-archive/拒绝临时性-生活",
    "/blogs/拒绝临时性-生活ai版":
      "/blogs/05-archive/拒绝临时性-生活ai版",
    "/blogs/面试题": "/blogs/03-areas/职业生涯/面试题",
    "/blogs/03-areas/面试题": "/blogs/03-areas/职业生涯/面试题",
  },

  vite: {
    plugins: [tailwindcss()],
  },
  prefetch: true,
  adapter: cloudflare(),
  markdown: {
    remarkPlugins: [
      [remarkToc, { heading: "Toc" }],
      remarkAlert,
    ],
  },
});
