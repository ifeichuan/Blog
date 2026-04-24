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
  integrations: [mdx(), sitemap(), vue(), react()],

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
