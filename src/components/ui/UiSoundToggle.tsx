import { Volume2, VolumeX } from "lucide-react";
import { useUiSound } from "@/hooks/use-ui-sound";
import "./UiSoundToggle.css";

export function UiSoundToggle() {
  const { enabled, setEnabled } = useUiSound();
  const label = enabled ? "关闭界面音效" : "开启界面音效";

  return (
    <button
      type="button"
      className="ui-sound-toggle"
      aria-label={label}
      aria-pressed={enabled}
      title={label}
      onClick={() => setEnabled(!enabled)}
    >
      {enabled ? <Volume2 aria-hidden="true" /> : <VolumeX aria-hidden="true" />}
      <span>声音</span>
    </button>
  );
}
