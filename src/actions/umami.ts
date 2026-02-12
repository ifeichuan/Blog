import { getClient } from "@umami/api-client";
const webSiteId = import.meta.env.UMAMI_WEBSITE_ID;

const client = getClient({
  apiKey: import.meta.env.UMAMI_API_KEY,
  apiEndpoint: import.meta.env.UMAMI_API_CLIENT_ENDPOINT,
});
export const umami = {
  async getVisitors(title?: string): Promise<{
    totalPageviews: number;
    totalSessions: number;
  }> {
    console.log("Fetching visitors for title:", title);
    const { ok, data, status } = await client.getWebsitePageviews(webSiteId, {
      startAt: new Date("2024-01-01").valueOf(),
      endAt: new Date().valueOf(),
      path: title, // URL 格式见下方说明
      timezone: "Asia/Shanghai",
      unit: "month",
    });

    if (!ok || !data) {
      console.error("Failed to fetch pageviews:", data);
      return {
        totalPageviews: 0,
        totalSessions: 0,
      };
    }

    console.log("Fetched pageviews data:", data);

    // 计算总浏览量和总会话数
    const totalPageviews =
      data.pageviews?.reduce((sum, item) => sum + item.y, 0) || 0;
    const totalSessions =
      data.sessions?.reduce((sum, item) => sum + item.y, 0) || 0;

    return {
      totalPageviews, // 总页面浏览量：857
      totalSessions, // 总访问会话数：108
    };
  },
};
