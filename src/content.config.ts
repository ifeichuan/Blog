import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const blog = defineCollection({
  // Load Markdown and MDX files in the `src/content/blog/` directory.
  loader: glob({ base: "./src/content/blog", pattern: "**/*.{md,mdx}" }),
  // Type-check frontmatter using a schema
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string().optional(),
      // Transform string to Date object
      dateCreated: z.coerce.date().optional(),
      dateModified: z.coerce.date().optional(),
      tags: z.array(z.string()).optional(),
      image: image().optional(),
      isPub: z.boolean().default(true),
    }),
});

export const collections = { blog };
