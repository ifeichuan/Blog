import { CodexComposer } from "../codex-composer/CodexComposer";

export default function CodexComposerStandaloneDemo() {
  return (
    <div className="flex h-full items-end justify-center p-8 pb-12">
      <div className="w-full max-w-[680px]">
        <CodexComposer
          placeholder="Ask a follow-up…"
          onSubmit={(value) => console.log("submit:", value)}
        />
      </div>
    </div>
  );
}
