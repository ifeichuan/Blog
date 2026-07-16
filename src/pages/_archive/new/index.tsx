import { useRef } from "react"


export const ShowcaseIndex = () => {
    const containerRef = useRef<HTMLDivElement | null>(null)

    return (
        <div className="showcase-index">
            <div ref={containerRef} className="main relative z-1 flex h-screen w-full items-center justify-center bg-red-300">
            </div>
            <div className="footer sticky bottom-0 left-0 right-0 z-0 w-screen bg-sky-400 h-40">Halo</div>
        </div>
    )
}
