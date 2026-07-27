import { getCollection } from "astro:content";
import rss from "@astrojs/rss";
import { SITE_DESCRIPTION, SITE_TITLE } from "../consts";
import { getPostDescription, getPublishedPosts } from "../lib/blog";

export async function GET(context) {
  const posts = getPublishedPosts(await getCollection("blog")).sort(
    (a, b) => b.data.dateCreated.valueOf() - a.data.dateCreated.valueOf(),
  );

  return rss({
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    site: context.site,
    customData: "<language>zh-CN</language>",
    items: posts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.dateCreated,
      description: getPostDescription(post),
      link: `/blogs/${post.id}/`,
      categories: post.data.tags,
      content: post.rendered?.html ?? getPostDescription(post),
    })),
  });
}
