import type { CollectionEntry } from "astro:content";

export function getPublishedPosts(posts: CollectionEntry<"blog">[]) {
  return posts.filter((post) => post.data.isPub);
}

export function getPostDescription(post: CollectionEntry<"blog">) {
  const description = post.data.description?.trim();
  if (description) return description;

  const plainText = (post.body ?? "")
    .replace(/```[\s\S]*?```/gu, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/gu, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/gu, "$1")
    .replace(/<[^>]+>/gu, " ")
    .replace(/[#>*_`~|\-]+/gu, " ")
    .replace(/\s+/gu, " ")
    .trim();

  return plainText.length > 155
    ? `${plainText.slice(0, 154).trimEnd()}…`
    : plainText || `${post.data.title} — Feichuan 的技术与实践记录。`;
}
