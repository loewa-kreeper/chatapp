import { useCallback, useEffect, useState } from "react";
import { AppLanguage } from "./i18n";

type AppSettings = {
  serverUrl: string;
  language: AppLanguage;
};

const fallbackHost = "192.168.2.229";
const fallbackPort = "3001";
const envHost = process.env.EXPO_PUBLIC_SIGNALING_HOST?.trim();
const envPort = process.env.EXPO_PUBLIC_SIGNALING_PORT?.trim();

export const DEFAULT_SIGNALING_HOST = envHost || fallbackHost;
export const DEFAULT_SIGNALING_PORT =
  envPort && /^\d+$/.test(envPort) ? envPort : fallbackPort;
export const DEFAULT_SIGNALING_URL = `ws://${DEFAULT_SIGNALING_HOST}:${DEFAULT_SIGNALING_PORT}`;

const defaultSettings: AppSettings = {
  serverUrl: DEFAULT_SIGNALING_URL,
  language: "system",
};

let currentSettings: AppSettings = defaultSettings;
const listeners = new Set<(settings: AppSettings) => void>();

function publish() {
  for (const listener of listeners) {
    listener(currentSettings);
  }
}

export function updateAppSettings(partial: Partial<AppSettings>) {
  currentSettings = { ...currentSettings, ...partial };
  publish();
}

export function useAppSettings() {
  const [settings, setSettings] = useState(currentSettings);

  useEffect(() => {
    listeners.add(setSettings);
    return () => {
      listeners.delete(setSettings);
    };
  }, []);

  const setAppSettings = useCallback((partial: Partial<AppSettings>) => {
    updateAppSettings(partial);
  }, []);

  return { settings, setAppSettings };
}
