import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  DEFAULT_SIGNALING_HOST,
  DEFAULT_SIGNALING_PORT,
  DEFAULT_SIGNALING_URL,
  useAppSettings,
} from "../../lib/appSettings";
import { AppLanguage, resolveLanguage, t } from "../../lib/i18n";
import { APP_GRADIENT_COLORS, APP_GRADIENT_END, APP_GRADIENT_START } from "../../lib/theme";

export default function SettingsScreen() {
  const { settings, setAppSettings } = useAppSettings();
  const [serverUrl, setServerUrl] = useState(settings.serverUrl);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setServerUrl(settings.serverUrl);
  }, [settings.serverUrl]);

  const save = () => {
    setAppSettings({ serverUrl: serverUrl.trim() });
    setSaved(true);
    setTimeout(() => setSaved(false), 1200);
  };

  const setLanguage = (language: AppLanguage) => {
    setAppSettings({ language });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient
        colors={APP_GRADIENT_COLORS}
        start={APP_GRADIENT_START}
        end={APP_GRADIENT_END}
        style={StyleSheet.absoluteFill}
      />
      <KeyboardAvoidingView
        style={styles.wrap}
        behavior={Platform.select({ ios: "padding", android: undefined })}
      >
        <Text style={styles.title}>{t(settings.language, "settings.title")}</Text>

        <View style={styles.card}>
          <Text style={styles.label}>{t(settings.language, "settings.serverUrlLabel")}</Text>
          <TextInput
            style={styles.input}
            value={serverUrl}
            onChangeText={setServerUrl}
            placeholder={DEFAULT_SIGNALING_URL}
            placeholderTextColor="#64748b"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Text style={styles.help}>
            {t(settings.language, "settings.serverHelp", {
              defaultUrl: `ws://${DEFAULT_SIGNALING_HOST}:${DEFAULT_SIGNALING_PORT}`,
            })}
          </Text>

          <Text style={styles.label}>{t(settings.language, "settings.languageLabel")}</Text>
          <View style={styles.languageRow}>
            <TouchableOpacity
              style={[styles.languagePill, settings.language === "system" && styles.languagePillActive]}
              onPress={() => setLanguage("system")}
            >
              <Text style={styles.languageText}>{t(settings.language, "settings.language.system")}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.languagePill, settings.language === "en" && styles.languagePillActive]}
              onPress={() => setLanguage("en")}
            >
              <Text style={styles.languageText}>{t(settings.language, "settings.language.english")}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.languagePill, settings.language === "de" && styles.languagePillActive]}
              onPress={() => setLanguage("de")}
            >
              <Text style={styles.languageText}>{t(settings.language, "settings.language.german")}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.languagePill, settings.language === "ru" && styles.languagePillActive]}
              onPress={() => setLanguage("ru")}
            >
              <Text style={styles.languageText}>{t(settings.language, "settings.language.russian")}</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.help}>
            {`${t(settings.language, "settings.language.system")}: ${resolveLanguage("system").toUpperCase()}`}
          </Text>

          <TouchableOpacity style={styles.button} onPress={save}>
            <Text style={styles.buttonText}>{t(settings.language, "settings.save")}</Text>
          </TouchableOpacity>

          <Text style={styles.saved}>{saved ? t(settings.language, "settings.saved") : ""}</Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#0b1220",
  },
  wrap: {
    flex: 1,
    padding: 18,
    gap: 14,
    justifyContent: "center",
  },
  title: {
    color: "#e2e8f0",
    fontSize: 32,
    fontWeight: "800",
  },
  card: {
    backgroundColor: "rgba(15,23,42,0.82)",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(125,211,252,0.25)",
    padding: 16,
    gap: 12,
  },
  label: {
    color: "#cbd5e1",
    fontSize: 13,
  },
  input: {
    backgroundColor: "#0f172a",
    color: "#f8fafc",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#1e293b",
  },
  help: {
    color: "#94a3b8",
    fontSize: 12,
  },
  languageRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  languagePill: {
    backgroundColor: "#0f172a",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#334155",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  languagePillActive: {
    borderColor: "#06b6d4",
    backgroundColor: "#0c2530",
  },
  languageText: {
    color: "#e2e8f0",
    fontSize: 12,
  },
  button: {
    backgroundColor: "#06b6d4",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  buttonText: {
    color: "#e2e8f0",
    fontWeight: "700",
  },
  saved: {
    color: "#67e8f9",
    fontSize: 12,
    minHeight: 16,
  },
});
