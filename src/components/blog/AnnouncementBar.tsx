import { Marquee } from "@townhall-gg/marquee-react";

interface AnnouncementItem {
  text: string;
  link?: string;
}

const items: AnnouncementItem[] = [
  { text: "🎨 新增阅读主题系统 — 支持 Light / Sepia / Dark / Night 四种主题" },
  { text: "⚡ 博客性能优化已上线" },
  { text: "📝 欢迎访问我的博客，分享前端开发、AI 和 Web 技术" },
];

export default function AnnouncementBar() {
  return (
    <div className="announcement-bar">
      <Marquee speed={60} direction={1} gap={48}>
        <span className="announcement-content">
          {items.map((item, i) => (
            <span key={i} className="announcement-item">
              {item.link ? (
                <a href={item.link} className="announcement-link">
                  {item.text}
                </a>
              ) : (
                item.text
              )}
              {i < items.length - 1 && (
                <span className="announcement-sep">✦</span>
              )}
            </span>
          ))}
        </span>
      </Marquee>

      <style>{`
        .announcement-bar {
          width: 100%;
          height: 28px;
          display: flex;
          align-items: center;
          overflow: hidden;
          font-size: 0.75rem;
          letter-spacing: 0.02em;
          color: rgba(255, 255, 255, 0.7);
          background: rgba(255, 255, 255, 0.04);
          position: relative;
        }
        .announcement-content {
          display: inline-flex;
          align-items: center;
          white-space: nowrap;
        }
        .announcement-item {
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .announcement-sep {
          opacity: 0.3;
          margin: 0 16px;
          font-size: 0.5rem;
        }
        .announcement-link {
          color: inherit;
          text-decoration: none;
          transition: color 0.2s;
        }
        .announcement-link:hover {
          color: rgba(255, 255, 255, 0.95);
        }
      `}</style>
    </div>
  );
}
