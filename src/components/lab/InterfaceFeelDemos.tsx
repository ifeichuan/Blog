import { useState, useEffect, type ReactNode, type CSSProperties } from "react";

const wrapperStyle: CSSProperties = {
  margin: "24px 0",
  padding: "20px",
  borderRadius: "var(--radius, 10px)",
  background: "var(--reader-surface, var(--secondary, #f8fafc))",
  border: "1px solid var(--reader-border, var(--border, #e5e7eb))",
  color: "var(--reader-text, var(--foreground, #1e293b))",
};

const labelStyle: CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  marginBottom: 12,
  opacity: 0.5,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

function DemoBox({ children, title }: { children: ReactNode; title?: string }) {
  return (
    <div style={wrapperStyle}>
      {title && <div style={labelStyle}>{title}</div>}
      {children}
    </div>
  );
}

function Toggle({
  options,
  active,
  onChange,
}: {
  options: { value: string; label: string }[];
  active: string;
  onChange: (v: string) => void;
}) {
  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          style={{
            padding: "5px 12px",
            borderRadius: "var(--radius, 8px)",
            border: "none",
            background:
              active === opt.value
                ? "var(--reader-link, var(--primary, #3b82f6))"
                : "var(--reader-border, var(--border, #e5e7eb))",
            color:
              active === opt.value
                ? "#fff"
                : "var(--reader-text, var(--foreground, #374151))",
            cursor: "pointer",
            fontSize: 12,
            fontWeight: 500,
            transition: "background 200ms, color 200ms",
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export function BorderRadiusDemo() {
  const [mode, setMode] = useState("correct");
  const concentric = mode === "correct";
  const padding = 12;
  const innerRadius = 12;
  const outerRadius = concentric ? innerRadius + padding : innerRadius;

  return (
    <DemoBox title="交互演示 — 同心圆角">
      <Toggle
        options={[
          { value: "correct", label: "同心圆角 (正确)" },
          { value: "wrong", label: "相同圆角 (错误)" },
        ]}
        active={mode}
        onChange={setMode}
      />
      <div style={{ display: "flex", gap: 24, alignItems: "center", flexWrap: "wrap" }}>
        <div
          style={{
            padding,
            borderRadius: outerRadius,
            background: "var(--reader-text, var(--foreground, #1e293b))",
            transition: "border-radius 300ms cubic-bezier(0.2, 0, 0, 1)",
          }}
        >
          <div
            style={{
              width: 160,
              height: 80,
              borderRadius: innerRadius,
              background: "var(--reader-link, var(--primary, #3b82f6))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            内部元素
          </div>
        </div>
        <div style={{ fontSize: 12, lineHeight: 1.8, fontFamily: "monospace", opacity: 0.7 }}>
          <div>padding: {padding}px</div>
          <div>inner: {innerRadius}px</div>
          <div
            style={{
              color: concentric
                ? "var(--reader-link, #10b981)"
                : "var(--destructive, #ef4444)",
            }}
          >
            outer: {outerRadius}px{" "}
            {concentric ? `(${innerRadius} + ${padding})` : "(same — 看起来不对)"}
          </div>
        </div>
      </div>
    </DemoBox>
  );
}

export function ShadowVsBorderDemo() {
  const [mode, setMode] = useState("shadow");
  const [bg, setBg] = useState("theme");

  const backgrounds: Record<string, string> = {
    theme: "var(--reader-bg, #fff)",
    gray: "#f3f4f6",
    dark: "#1e293b",
    blue: "#dbeafe",
  };
  const bgLabels: Record<string, string> = {
    theme: "主题色",
    gray: "浅灰",
    dark: "深色",
    blue: "蓝色",
  };

  const cardStyle: CSSProperties =
    mode === "shadow"
      ? {
          boxShadow:
            "0px 0px 0px 1px rgba(0,0,0,0.06), 0px 1px 2px -1px rgba(0,0,0,0.06), 0px 2px 4px 0px rgba(0,0,0,0.04)",
          border: "none",
        }
      : { boxShadow: "none", border: "1px solid #e5e7eb" };

  return (
    <DemoBox title="交互演示 — 阴影 vs 边框">
      <Toggle
        options={[
          { value: "shadow", label: "多层阴影" },
          { value: "border", label: "实色边框" },
        ]}
        active={mode}
        onChange={setMode}
      />
      <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
        {Object.keys(backgrounds).map((key) => (
          <button
            key={key}
            onClick={() => setBg(key)}
            style={{
              padding: "4px 10px",
              borderRadius: 6,
              fontSize: 11,
              border:
                bg === key
                  ? "2px solid var(--reader-link, #3b82f6)"
                  : "2px solid var(--reader-border, #e5e7eb)",
              background: backgrounds[key],
              color: key === "dark" ? "#fff" : "inherit",
              cursor: "pointer",
            }}
          >
            {bgLabels[key]}
          </button>
        ))}
      </div>
      <div
        style={{
          padding: 24,
          borderRadius: 12,
          background: backgrounds[bg],
          transition: "background 300ms",
        }}
      >
        <div
          style={{
            ...cardStyle,
            padding: 16,
            borderRadius: 10,
            background: bg === "dark" ? "#334155" : "#fff",
            transition: "box-shadow 200ms, border 200ms",
          }}
        >
          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: bg === "dark" ? "#f1f5f9" : "#1e293b",
              marginBottom: 6,
            }}
          >
            卡片标题
          </div>
          <div
            style={{
              fontSize: 12,
              color: bg === "dark" ? "#94a3b8" : "#6b7280",
              lineHeight: 1.6,
            }}
          >
            切换背景颜色，观察哪种方式更自然地融入环境。
          </div>
        </div>
      </div>
    </DemoBox>
  );
}

export function ImageOutlineDemo() {
  const [outline, setOutline] = useState("on");

  return (
    <DemoBox title="交互演示 — 图片描边">
      <Toggle
        options={[
          { value: "on", label: "有描边" },
          { value: "off", label: "无描边" },
        ]}
        active={outline}
        onChange={setOutline}
      />
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        {[
          "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
          "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)",
        ].map((grad, i) => (
          <div
            key={i}
            style={{
              width: 100,
              height: 70,
              borderRadius: 8,
              background: grad,
              outline: outline === "on" ? "1px solid rgba(0,0,0,0.1)" : "none",
              outlineOffset: "-1px",
              transition: "outline 200ms",
            }}
          />
        ))}
      </div>
      <div style={{ fontSize: 11, opacity: 0.5, marginTop: 12 }}>
        {outline === "on"
          ? "1px rgba(0,0,0,0.1) 描边让图片边缘清晰可辨"
          : "没有描边时，浅色图片和背景融为一体"}
      </div>
    </DemoBox>
  );
}

export function TabularNumsDemo() {
  const [mode, setMode] = useState("tabular");
  const [count, setCount] = useState(8247);

  useEffect(() => {
    const id = setInterval(
      () => setCount((c) => c + Math.floor(Math.random() * 99) + 1),
      900,
    );
    return () => clearInterval(id);
  }, []);

  return (
    <DemoBox title="交互演示 — 等宽数字">
      <Toggle
        options={[
          { value: "tabular", label: "tabular-nums (稳定)" },
          { value: "normal", label: "默认数字 (抖动)" },
        ]}
        active={mode}
        onChange={setMode}
      />
      <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
        <span style={{ fontSize: 12, opacity: 0.6 }}>访问量</span>
        <span
          style={{
            fontSize: 32,
            fontWeight: 700,
            fontVariantNumeric: mode === "tabular" ? "tabular-nums" : "normal",
            minWidth: 140,
            textAlign: "right",
          }}
        >
          {count.toLocaleString()}
        </span>
        <span style={{ fontSize: 11, opacity: 0.5 }}>
          {mode === "tabular" ? "← 数字等宽，不抖" : "← 注意宽度跳动"}
        </span>
      </div>
    </DemoBox>
  );
}

export function StaggerDemo() {
  const [key, setKey] = useState(0);
  const [mode, setMode] = useState("stagger");
  const items = ["标题文字", "一段描述内容，解释功能用途", "操作按钮"];

  return (
    <DemoBox title="交互演示 — 错开入场">
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        <Toggle
          options={[
            { value: "stagger", label: "错开入场" },
            { value: "together", label: "同时入场" },
          ]}
          active={mode}
          onChange={(v) => {
            setMode(v);
            setKey((k) => k + 1);
          }}
        />
        <button
          onClick={() => setKey((k) => k + 1)}
          style={{
            padding: "5px 12px",
            borderRadius: "var(--radius, 8px)",
            border: "1px solid var(--reader-border, var(--border, #e5e7eb))",
            background: "transparent",
            cursor: "pointer",
            fontSize: 12,
            color: "var(--reader-text, inherit)",
          }}
        >
          重播
        </button>
      </div>
      <div key={key} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {items.map((item, i) => (
          <div
            key={`${key}-${i}`}
            style={{
              padding: "10px 14px",
              borderRadius: 8,
              background: "var(--reader-bg, #fff)",
              border: "1px solid var(--reader-border, var(--border, #e5e7eb))",
              fontSize: i === 0 ? 15 : 13,
              fontWeight: i === 0 ? 600 : 400,
              color:
                i === 2
                  ? "var(--reader-link, #3b82f6)"
                  : "var(--reader-text, inherit)",
              animation:
                "ifb-stagger-enter 500ms cubic-bezier(0.25, 0.46, 0.45, 0.94) both",
              animationDelay: mode === "stagger" ? `${i * 120}ms` : "0ms",
            }}
          >
            {item}
          </div>
        ))}
      </div>
      <style>{`
        @keyframes ifb-stagger-enter {
          from { opacity: 0; transform: translateY(8px); filter: blur(4px); }
          to { opacity: 1; transform: translateY(0); filter: blur(0); }
        }
      `}</style>
    </DemoBox>
  );
}

export function ScaleOnPressDemo() {
  const [mode, setMode] = useState("on");

  return (
    <DemoBox title="交互演示 — 点击按钮试试">
      <Toggle
        options={[
          { value: "on", label: "有按压反馈" },
          { value: "off", label: "无按压反馈" },
        ]}
        active={mode}
        onChange={setMode}
      />
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        {[
          { label: "主要按钮", bg: "var(--reader-link, #3b82f6)", color: "#fff" },
          {
            label: "次要按钮",
            bg: "var(--reader-border, #e5e7eb)",
            color: "var(--reader-text, #374151)",
          },
          { label: "危险操作", bg: "var(--destructive, #ef4444)", color: "#fff" },
        ].map((btn) => (
          <button
            key={btn.label}
            className={mode === "on" ? "ifb-scale-press" : ""}
            style={{
              padding: "10px 20px",
              borderRadius: 10,
              border: "none",
              background: btn.bg,
              color: btn.color,
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 500,
              userSelect: "none",
            }}
          >
            {btn.label}
          </button>
        ))}
      </div>
      <style>{`
        .ifb-scale-press { transition: transform 200ms cubic-bezier(0.2, 0, 0, 1); }
        .ifb-scale-press:active { transform: scale(0.96); }
      `}</style>
    </DemoBox>
  );
}

export function TextWrapDemo() {
  const [mode, setMode] = useState("balance");

  return (
    <DemoBox title="交互演示 — 文本换行">
      <Toggle
        options={[
          { value: "balance", label: "text-wrap: balance" },
          { value: "normal", label: "默认换行" },
        ]}
        active={mode}
        onChange={setMode}
      />
      <div style={{ maxWidth: 320 }}>
        <h3
          style={{
            fontSize: 18,
            fontWeight: 700,
            lineHeight: 1.4,
            marginBottom: 8,
            textWrap: mode === "balance" ? "balance" : "auto",
          }}
        >
          让界面有感觉的那些不起眼的小细节
        </h3>
        <p
          style={{
            fontSize: 13,
            lineHeight: 1.7,
            opacity: 0.7,
            textWrap: mode === "balance" ? "pretty" : "auto",
          }}
        >
          好的界面从来不是一个大招搞定的，而是一堆小细节叠加出来的效果。
        </p>
      </div>
      <div style={{ fontSize: 11, opacity: 0.5, marginTop: 12 }}>
        {mode === "balance"
          ? "balance 让文本在多行间均匀分布，避免孤字"
          : "默认换行可能导致最后一行只有一两个字"}
      </div>
    </DemoBox>
  );
}

export function TransitionAllDemo() {
  const [mode, setMode] = useState("specific");
  const [hovered, setHovered] = useState(false);

  return (
    <DemoBox title="交互演示 — hover 这个按钮">
      <Toggle
        options={[
          { value: "specific", label: "transition: transform, opacity" },
          { value: "all", label: "transition: all (问题)" },
        ]}
        active={mode}
        onChange={setMode}
      />
      <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
        <button
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          style={{
            padding: "12px 24px",
            borderRadius: 10,
            border: "none",
            background: hovered
              ? "var(--reader-link, #3b82f6)"
              : "var(--reader-border, #e5e7eb)",
            color: hovered ? "#fff" : "var(--reader-text, #374151)",
            cursor: "pointer",
            fontSize: 14,
            fontWeight: 500,
            transform: hovered ? "scale(1.02)" : "scale(1)",
            transition:
              mode === "all"
                ? "all 400ms ease"
                : "transform 200ms cubic-bezier(0.2,0,0,1)",
          }}
        >
          Hover me
        </button>
        <span style={{ fontSize: 11, opacity: 0.5 }}>
          {mode === "all"
            ? "← 颜色变化也被拖慢到 400ms"
            : "← 颜色瞬变，缩放平滑"}
        </span>
      </div>
    </DemoBox>
  );
}
