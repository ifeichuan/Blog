import { useEffect, useRef, useState, useCallback } from "react";
import { SITE_TITLE, NavList } from "../consts";
import clsx from "clsx";
import debounce from "es-toolkit/compat/debounce";

const NavBar = () => {
  // 使用 'large' 作为初始状态，这在服务端和客户端是保持一致的
  const [size, setSize] = useState("large");

  // 使用 useRef 来追踪滚动，避免在 handleScroll 中依赖 state 或 props
  // 这样 useCallback 的依赖数组可以为空
  const lastScrollY = useRef(0);

  // 使用 useCallback 记忆 handleScroll 函数，防止在每次渲染时重新创建
  const handleScroll = useCallback(() => {
    const currentScrollY = window.scrollY;

    // 根据滚动位置和方向来决定导航栏大小
    if (currentScrollY <= 20) {
      setSize("large");
    } else if (currentScrollY > lastScrollY.current) {
      // 向下滚动
      setSize("small");
    }

    // 更新最后滚动位置
    lastScrollY.current = currentScrollY;
  }, []); // 空依赖数组，因为我们通过 useRef 访问了 scrollY

  useEffect(() => {
    // 使用 useRef 来持有 debounce 后的函数，确保它只被创建一次
    const debouncedHandleScroll = debounce(handleScroll, 50); // 建议给一个小的延迟值，如 50ms

    // 正确的方式是使用 addEventListener
    window.addEventListener("scroll", debouncedHandleScroll);

    // 组件卸载时，必须清理事件监听器
    return () => {
      window.removeEventListener("scroll", debouncedHandleScroll);
    };
  }, [handleScroll]); // 依赖于 memoized 的 handleScroll

  // clsx 的逻辑保持不变
  const className = clsx(
    "flex items-center left-0 right-0 justify-between p-8 h-8 sticky transition-all duration-150 ease-in top-0 mx-auto  ",
    {
      "w-full bg-blue-400": size === "large",
      "w-1/3 translate-y-6 rounded-[10000px] liquid @max-sm:w-full ":
        size === "small",
    }
  );

  return (
    // 注意：React 16.8+ 中 ref 可以直接用在函数组件上，但 header 是原生元素，没问题
    <header id="header" className={className}>
      <a href="/">{SITE_TITLE}</a>
      <nav className="flex gap-4">
        {NavList.map((item) => (
          // 为 map 中的元素添加 key 是必须的
          <a key={item.href} href={item.href} className="">
            {item.label}
          </a>
        ))}
      </nav>
      <div>
        <button>Sign In</button>
      </div>
    </header>
  );
};

export default NavBar;
