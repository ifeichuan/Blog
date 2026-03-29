// import { getClient } from "@umami/api-client";
// const webSiteId =
//   import.meta.env.UMAMI_WEBSITE_ID || "00000000-0000-0000-0000-000000000000";

// const client = getClient({
//   apiKey:
//     import.meta.env.UMAMI_API_KEY || "00000000-0000-0000-0000-000000000000",
//   apiEndpoint:
//     import.meta.env.UMAMI_API_CLIENT_ENDPOINT || "http://localhost:3000",
// });
export const umami = {
  async getVisitors(title?: string): Promise<{
    totalPageviews: number;
    totalSessions: number;
  }> {
    // console.log("Fetching visitors for title:", title);
    // const { ok, data, status } = await client.getWebsitePageviews(webSiteId, {
    //   startAt: new Date("2024-01-01").valueOf(),
    //   endAt: new Date().valueOf(),
    //   path: title,
    //   timezone: "Asia/Shanghai",
    //   unit: "month",
    // });

    // if (!ok || !data) {
    //   console.error("Failed to fetch pageviews:", data);
    //   return {
    //     totalPageviews: 0,
    //     totalSessions: 0,
    //   };
    // }

    // console.log("Fetched pageviews data:", data);

    // const totalPageviews =
    //   data.pageviews?.reduce((sum, item) => sum + item.y, 0) || 0;
    // const totalSessions =
    //   data.sessions?.reduce((sum, item) => sum + item.y, 0) || 0;

    void title;

    return {
      totalPageviews: 0,
      totalSessions: 0,
    };
  },
};
