import { useCallback, useEffect, useState } from "react";
import {
  getUiSoundEnabled,
  initializeUiSound,
  playUiSound,
  setUiSoundEnabled,
  subscribeToUiSound,
  type UiSoundCue,
} from "@/lib/ui-sound";

export function useUiSound() {
  const [enabled, setEnabledState] = useState(false);

  useEffect(() => {
    initializeUiSound();
    const sync = () => setEnabledState(getUiSoundEnabled());
    sync();
    return subscribeToUiSound(sync);
  }, []);

  const setEnabled = useCallback((next: boolean) => {
    setUiSoundEnabled(next);
  }, []);

  const play = useCallback((cue: UiSoundCue) => {
    playUiSound(cue);
  }, []);

  return { enabled, setEnabled, play };
}
