// Place any global data in this file.
// You can import this data from anywhere in your site by using the `import` keyword.

const ENV = import.meta.env;

export const isDev = ENV.DEV;

export const SITE_TITLE = "Feichuan's Blog";
// 文章标题和站点标题的分隔符
export const Delimiter = " | ";
export const Banner_Title = "Feichuan";
export const Banner_Desc =
  "A newbie Frontend developer  who loves designing and coding.";
export const SITE_DESCRIPTION =
  "Frontend developer blog sharing tutorials on JavaScript, React, Astro, AI development, and web technologies. Learn about modern frontend development, streaming rendering, and more.";

export const NavList = [{ label: "Posts", href: "/posts", icon: "" }];
