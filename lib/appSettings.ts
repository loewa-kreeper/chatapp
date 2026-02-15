import { useCallback, useEffect, useState } from "react";
import { AppLanguage } from "./i18n";

type AppSettings = {
  serverUrl: string;
  language: AppLanguage;
};

const fallbackProtocol = "ws";
const fallbackHost = "localhost";
const fallbackPort = "3001";
const fallbackPath = "/ws";
const envUrl = process.env.EXPO_PUBLIC_SIGNALING_URL?.trim();
const envProtocol = process.env.EXPO_PUBLIC_SIGNALING_PROTOCOL?.trim().toLowerCase();
const envHost = process.env.EXPO_PUBLIC_SIGNALING_HOST?.trim();
const envPort = process.env.EXPO_PUBLIC_SIGNALING_PORT?.trim();
const envPath = process.env.EXPO_PUBLIC_SIGNALING_PATH?.trim();

function normalizePath(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return fallbackPath;
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

function normalizeProtocol(value: string | undefined) {
  if (value === "ws" || value === "wss") {
    return value;
  }
  return fallbackProtocol;
}

function toWebSocketProtocol(protocol: string) {
  if (protocol === "ws:" || protocol === "wss:") return protocol;
  if (protocol === "http:") return "ws:";
  if (protocol === "https:") return "wss:";
  return null;
}

export function normalizeSignalingUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const hasScheme = /^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(trimmed);
  const candidate = hasScheme ? trimmed : `wss://${trimmed}`;

  try {
    const parsed = new URL(candidate);
    const wsProtocol = toWebSocketProtocol(parsed.protocol);
    if (!wsProtocol) return null;
    parsed.protocol = wsProtocol;
    return parsed.toString();
  } catch {
    return null;
  }
}

export const DEFAULT_SIGNALING_PROTOCOL = normalizeProtocol(envProtocol);
export const DEFAULT_SIGNALING_HOST = envHost || fallbackHost;
export const DEFAULT_SIGNALING_PORT =
  envPort && /^\d+$/.test(envPort) ? envPort : fallbackPort;
export const DEFAULT_SIGNALING_PATH = normalizePath(envPath || fallbackPath);
const defaultBuiltUrl = `${DEFAULT_SIGNALING_PROTOCOL}://${DEFAULT_SIGNALING_HOST}:${DEFAULT_SIGNALING_PORT}${DEFAULT_SIGNALING_PATH}`;
export const DEFAULT_SIGNALING_URL = normalizeSignalingUrl(envUrl || "") || defaultBuiltUrl;

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
