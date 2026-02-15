export type ResolvedLanguage = "en" | "de" | "ru";
export type AppLanguage = "system" | ResolvedLanguage;

type TranslationKey =
  | "tab.home"
  | "tab.settings"
  | "home.title"
  | "home.joinCall"
  | "home.room"
  | "home.note"
  | "call.waitingRemoteVideo"
  | "settings.title"
  | "settings.serverUrlLabel"
  | "settings.serverHelp"
  | "settings.save"
  | "settings.saved"
  | "settings.languageLabel"
  | "settings.language.system"
  | "settings.language.english"
  | "settings.language.german"
  | "settings.language.russian"
  | "alert.setServerTitle"
  | "alert.setServerMessage"
  | "alert.missingRoomTitle"
  | "alert.missingRoomMessage"
  | "alert.permissionsTitle"
  | "alert.permissionsMessage"
  | "alert.roomFullTitle"
  | "alert.roomFullMessage"
  | "status.ready"
  | "status.disconnected"
  | "status.openingSocket"
  | "status.joinedWaitingPeer"
  | "status.waitingSecondPerson"
  | "status.connectedToRoom"
  | "status.peerJoinedStarting"
  | "status.offerSent"
  | "status.answerSent"
  | "status.answerReceived"
  | "status.callConnected"
  | "status.peerLeftRoom"
  | "status.socketError"
  | "status.socketClosed"
  | "status.failedInitMediaSocket"
  | "status.failedApplyQueuedIce"
  | "status.failedCreateOffer"
  | "status.failedHandleOffer"
  | "status.failedApplyAnswer"
  | "status.failedAddIce"
  | "status.connectionState";

type TranslationMap = Record<TranslationKey, string>;

const translations: Record<ResolvedLanguage, TranslationMap> = {
  en: {
    "tab.home": "Home",
    "tab.settings": "Settings",
    "home.title": "Video Call",
    "home.joinCall": "Join Call",
    "home.room": "Room",
    "home.note": "Set signaling URL in Settings. Use the same room on both phones.",
    "call.waitingRemoteVideo": "Waiting for remote video...",
    "settings.title": "Settings",
    "settings.serverUrlLabel": "Signaling Server URL",
    "settings.serverHelp": "Use ws:// for local Wi-Fi or wss:// for hosted server. Default: {defaultUrl}",
    "settings.save": "Save",
    "settings.saved": "Saved",
    "settings.languageLabel": "Language",
    "settings.language.system": "System",
    "settings.language.english": "English",
    "settings.language.german": "Deutsch",
    "settings.language.russian": "Русский",
    "alert.setServerTitle": "Set server URL",
    "alert.setServerMessage": "Open Settings tab and enter your signaling server URL.",
    "alert.missingRoomTitle": "Missing room",
    "alert.missingRoomMessage": "Enter a room ID.",
    "alert.permissionsTitle": "Permissions needed",
    "alert.permissionsMessage": "Camera and microphone permissions are required.",
    "alert.roomFullTitle": "Room full",
    "alert.roomFullMessage": "This room already has 2 people.",
    "status.ready": "Ready",
    "status.disconnected": "Disconnected",
    "status.openingSocket": "Opening socket...",
    "status.joinedWaitingPeer": "Joined room. Waiting for peer...",
    "status.waitingSecondPerson": "Waiting for second person",
    "status.connectedToRoom": "Connected to room",
    "status.peerJoinedStarting": "Peer joined, starting call...",
    "status.offerSent": "Offer sent",
    "status.answerSent": "Answer sent",
    "status.answerReceived": "Answer received",
    "status.callConnected": "Call connected",
    "status.peerLeftRoom": "Peer left room",
    "status.socketError": "Socket error",
    "status.socketClosed": "Socket closed",
    "status.failedInitMediaSocket": "Failed to initialize media/socket",
    "status.failedApplyQueuedIce": "Failed to apply queued ICE",
    "status.failedCreateOffer": "Failed to create offer",
    "status.failedHandleOffer": "Failed to handle offer",
    "status.failedApplyAnswer": "Failed to apply answer",
    "status.failedAddIce": "Failed to add ICE candidate",
    "status.connectionState": "Connection {state}",
  },
  de: {
    "tab.home": "Start",
    "tab.settings": "Einstellungen",
    "home.title": "Videoanruf",
    "home.joinCall": "Anruf starten",
    "home.room": "Raum",
    "home.note": "Server-URL im Einstellungs-Tab setzen. Auf beiden Handys denselben Raum verwenden.",
    "call.waitingRemoteVideo": "Warte auf Remote-Video...",
    "settings.title": "Einstellungen",
    "settings.serverUrlLabel": "Signalisierungsserver-URL",
    "settings.serverHelp": "Nutze ws:// im WLAN oder wss:// auf einem Server. Standard: {defaultUrl}",
    "settings.save": "Speichern",
    "settings.saved": "Gespeichert",
    "settings.languageLabel": "Sprache",
    "settings.language.system": "System",
    "settings.language.english": "English",
    "settings.language.german": "Deutsch",
    "settings.language.russian": "Русский",
    "alert.setServerTitle": "Server-URL setzen",
    "alert.setServerMessage": "Öffne den Einstellungs-Tab und trage die Server-URL ein.",
    "alert.missingRoomTitle": "Raum fehlt",
    "alert.missingRoomMessage": "Bitte eine Raum-ID eingeben.",
    "alert.permissionsTitle": "Berechtigungen benötigt",
    "alert.permissionsMessage": "Kamera- und Mikrofonberechtigungen sind erforderlich.",
    "alert.roomFullTitle": "Raum voll",
    "alert.roomFullMessage": "Dieser Raum hat bereits 2 Personen.",
    "status.ready": "Bereit",
    "status.disconnected": "Getrennt",
    "status.openingSocket": "Socket wird geöffnet...",
    "status.joinedWaitingPeer": "Raum betreten. Warte auf Gegenstelle...",
    "status.waitingSecondPerson": "Warte auf zweite Person",
    "status.connectedToRoom": "Mit Raum verbunden",
    "status.peerJoinedStarting": "Gegenstelle beigetreten, starte Anruf...",
    "status.offerSent": "Angebot gesendet",
    "status.answerSent": "Antwort gesendet",
    "status.answerReceived": "Antwort empfangen",
    "status.callConnected": "Anruf verbunden",
    "status.peerLeftRoom": "Gegenstelle hat den Raum verlassen",
    "status.socketError": "Socket-Fehler",
    "status.socketClosed": "Socket geschlossen",
    "status.failedInitMediaSocket": "Medien/Socket konnten nicht initialisiert werden",
    "status.failedApplyQueuedIce": "Zwischengespeichertes ICE konnte nicht angewendet werden",
    "status.failedCreateOffer": "Angebot konnte nicht erstellt werden",
    "status.failedHandleOffer": "Angebot konnte nicht verarbeitet werden",
    "status.failedApplyAnswer": "Antwort konnte nicht angewendet werden",
    "status.failedAddIce": "ICE-Kandidat konnte nicht hinzugefügt werden",
    "status.connectionState": "Verbindung {state}",
  },
  ru: {
    "tab.home": "Главная",
    "tab.settings": "Настройки",
    "home.title": "Видеозвонок",
    "home.joinCall": "Подключиться",
    "home.room": "Комната",
    "home.note": "Укажите URL сервера на вкладке настроек. На обоих телефонах должна быть одинаковая комната.",
    "call.waitingRemoteVideo": "Ожидание удаленного видео...",
    "settings.title": "Настройки",
    "settings.serverUrlLabel": "URL сигнального сервера",
    "settings.serverHelp": "Используйте ws:// в локальной сети или wss:// на сервере. По умолчанию: {defaultUrl}",
    "settings.save": "Сохранить",
    "settings.saved": "Сохранено",
    "settings.languageLabel": "Язык",
    "settings.language.system": "Системный",
    "settings.language.english": "English",
    "settings.language.german": "Deutsch",
    "settings.language.russian": "Русский",
    "alert.setServerTitle": "Укажите URL сервера",
    "alert.setServerMessage": "Откройте вкладку настроек и введите URL сигнального сервера.",
    "alert.missingRoomTitle": "Не указана комната",
    "alert.missingRoomMessage": "Введите ID комнаты.",
    "alert.permissionsTitle": "Нужны разрешения",
    "alert.permissionsMessage": "Требуются разрешения на камеру и микрофон.",
    "alert.roomFullTitle": "Комната заполнена",
    "alert.roomFullMessage": "В этой комнате уже 2 человека.",
    "status.ready": "Готово",
    "status.disconnected": "Отключено",
    "status.openingSocket": "Открываем socket...",
    "status.joinedWaitingPeer": "Вошли в комнату. Ждем собеседника...",
    "status.waitingSecondPerson": "Ожидание второго участника",
    "status.connectedToRoom": "Подключено к комнате",
    "status.peerJoinedStarting": "Собеседник подключился, запускаем звонок...",
    "status.offerSent": "Offer отправлен",
    "status.answerSent": "Answer отправлен",
    "status.answerReceived": "Answer получен",
    "status.callConnected": "Звонок подключен",
    "status.peerLeftRoom": "Собеседник покинул комнату",
    "status.socketError": "Ошибка socket",
    "status.socketClosed": "Socket закрыт",
    "status.failedInitMediaSocket": "Не удалось инициализировать media/socket",
    "status.failedApplyQueuedIce": "Не удалось применить queued ICE",
    "status.failedCreateOffer": "Не удалось создать offer",
    "status.failedHandleOffer": "Не удалось обработать offer",
    "status.failedApplyAnswer": "Не удалось применить answer",
    "status.failedAddIce": "Не удалось добавить ICE candidate",
    "status.connectionState": "Соединение {state}",
  },
};

function interpolate(template: string, vars?: Record<string, string>) {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, key: string) => vars[key] ?? `{${key}}`);
}

export function detectSystemLanguage(): ResolvedLanguage {
  const locale = Intl.DateTimeFormat().resolvedOptions().locale.toLowerCase();
  if (locale.startsWith("de")) return "de";
  if (locale.startsWith("ru")) return "ru";
  return "en";
}

export function resolveLanguage(language: AppLanguage): ResolvedLanguage {
  if (language === "system") {
    return detectSystemLanguage();
  }
  return language;
}

export function t(language: AppLanguage, key: TranslationKey, vars?: Record<string, string>) {
  const resolved = resolveLanguage(language);
  const template = translations[resolved][key];
  return interpolate(template, vars);
}
