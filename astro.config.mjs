// @ts-check

import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import { defineConfig } from "astro/config";

import vue from "@astrojs/vue";
import react from "@astrojs/react";


import cloudflare from "@astrojs/cloudflare";
import remarkToc from "remark-toc";
import tailwindcss from "@tailwindcss/vite";
// https://astro.build/config
export default defineConfig({
  site: "https://feichuans.com",
  integrations: [mdx(), sitemap(), vue(), react()],

  vite: {
    plugins: [tailwindcss()],
  },
  prefetch: true,
  adapter: cloudflare(),
  markdown: {
    remarkPlugins: [[remarkToc, { heading: "Toc" }]],
  },
});