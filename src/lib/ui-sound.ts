import { tiks } from "@rexa-developer/tiks";

export type UiSoundCue =
  | "click"
  | "toggle-on"
  | "toggle-off"
  | "success"
  | "error";

const STORAGE_KEY = "feichuan.ui-sound.enabled";
const CHANGE_EVENT = "feichuan:ui-sound-change";

let initialized = false;
let enabled = false;

function readStoredPreference() {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function applyEnabled(next: boolean) {
  enabled = next;
  if (next) tiks.unmute();
  else tiks.mute();
}

export function initializeUiSound() {
  if (initialized || typeof window === "undefined") return;

  tiks.init({
    theme: "crisp",
    volume: 0.18,
    respectReducedMotion: true,
    hoverThrottleMs: 120,
  });
  initialized = true;
  applyEnabled(readStoredPreference());
}

export function getUiSoundEnabled() {
  return enabled;
}

export function setUiSoundEnabled(next: boolean) {
  if (typeof window === "undefined") return;
  initializeUiSound();

  if (next) {
    applyEnabled(true);
    tiks.toggle(true);
  } else {
    tiks.toggle(false);
    applyEnabled(false);
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
  } catch {
    // Sound remains available for the current page when storage is blocked.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function playUiSound(cue: UiSoundCue) {
  initializeUiSound();
  if (!enabled) return;

  switch (cue) {
    case "click":
      tiks.click();
      break;
    case "toggle-on":
      tiks.toggle(true);
      break;
    case "toggle-off":
      tiks.toggle(false);
      break;
    case "success":
      tiks.success();
      break;
    case "error":
      tiks.error();
      break;
  }
}

export function subscribeToUiSound(listener: () => void) {
  if (typeof window === "undefined") return () => {};

  const handleStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) return;
    initializeUiSound();
    applyEnabled(event.newValue === "1");
    listener();
  };

  window.addEventListener(CHANGE_EVENT, listener);
  window.addEventListener("storage", handleStorage);

  return () => {
    window.removeEventListener(CHANGE_EVENT, listener);
    window.removeEventListener("storage", handleStorage);
  };
}
