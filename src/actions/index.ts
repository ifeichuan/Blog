import { defineAction } from "astro:actions";
import { z } from "astro:content";
import { umami } from "./umami";

export const server = {
  getVisitors: defineAction({
    input: z.string().optional(),
    async handler(title): Promise<{
      totalPageviews: number;
      totalSessions: number;
    }> {
      return umami.getVisitors(title);
    },
  }),
};
