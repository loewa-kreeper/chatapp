import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  KeyboardAvoidingView,
  PermissionsAndroid,
  PanResponder,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import {
  mediaDevices,
  MediaStream,
  RTCIceCandidate,
  RTCPeerConnection,
  RTCSessionDescription,
  RTCView,
} from "react-native-webrtc";
import { useAppSettings } from "../../lib/appSettings";
import { t } from "../../lib/i18n";
import { APP_GRADIENT_COLORS, APP_GRADIENT_END, APP_GRADIENT_START } from "../../lib/theme";

type SignalMessage =
  | { type: "joined"; isHost: boolean; clients: number }
  | { type: "peer-joined" }
  | { type: "offer"; sdp: RTCSessionDescriptionInit }
  | { type: "answer"; sdp: RTCSessionDescriptionInit }
  | { type: "ice"; candidate: RTCIceCandidateInit }
  | { type: "peer-left" }
  | { type: "room-full" }
  | { type: "error"; message: string };

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

export default function HomeScreen() {
  const { settings } = useAppSettings();
  const tr = useCallback(
    (key: Parameters<typeof t>[1], vars?: Record<string, string>) => t(settings.language, key, vars),
    [settings.language]
  );

  const [roomId, setRoomId] = useState("family-room");
  const [status, setStatus] = useState(tr("status.ready"));
  const [connected, setConnected] = useState(false);
  const [micEnabled, setMicEnabled] = useState(true);
  const [camEnabled, setCamEnabled] = useState(true);

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const isHostRef = useRef(false);
  const pendingIceRef = useRef<RTCIceCandidateInit[]>([]);
  const pipPan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;

  const pipPanResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          pipPan.extractOffset();
        },
        onPanResponderMove: Animated.event([null, { dx: pipPan.x, dy: pipPan.y }], {
          useNativeDriver: false,
        }),
        onPanResponderRelease: () => {
          pipPan.flattenOffset();
        },
      }),
    [pipPan]
  );

  const localStreamUrl = useMemo(() => localStream?.toURL() ?? "", [localStream]);
  const remoteStreamUrl = useMemo(() => remoteStream?.toURL() ?? "", [remoteStream]);

  const requestMediaPermissions = useCallback(async () => {
    if (Platform.OS !== "android") return true;

    const camera = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CAMERA);
    const mic = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);

    return camera === PermissionsAndroid.RESULTS.GRANTED && mic === PermissionsAndroid.RESULTS.GRANTED;
  }, []);

  const sendSignal = useCallback((payload: Record<string, unknown>) => {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) return;
    socket.send(JSON.stringify(payload));
  }, []);

  const closePeerConnection = useCallback(() => {
    if (pcRef.current) {
      pcRef.current.onicecandidate = null;
      pcRef.current.ontrack = null;
      pcRef.current.onconnectionstatechange = null;
      pcRef.current.close();
      pcRef.current = null;
    }
    pendingIceRef.current = [];
    setRemoteStream(null);
  }, []);

  const stopLocalMedia = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    setLocalStream(null);
  }, []);

  const createPeerConnection = useCallback(() => {
    if (pcRef.current) return pcRef.current;

    const pc = new RTCPeerConnection(ICE_SERVERS);

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current as MediaStream);
      });
    }

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendSignal({ type: "ice", candidate: event.candidate.toJSON() });
      }
    };

    pc.ontrack = (event) => {
      if (event.streams[0]) {
        setRemoteStream(event.streams[0]);
      }
    };

    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      if (state === "connected") setStatus(tr("status.callConnected"));
      if (["disconnected", "failed", "closed"].includes(state)) {
        setStatus(tr("status.connectionState", { state }));
      }
    };

    pcRef.current = pc;
    return pc;
  }, [sendSignal, tr]);

  const flushPendingIce = useCallback(async () => {
    const pc = pcRef.current;
    if (!pc || !pc.remoteDescription || pendingIceRef.current.length === 0) return;

    const queue = [...pendingIceRef.current];
    pendingIceRef.current = [];

    for (const candidate of queue) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch {
        setStatus(tr("status.failedApplyQueuedIce"));
      }
    }
  }, [tr]);

  const createAndSendOffer = useCallback(async () => {
    try {
      const pc = createPeerConnection();
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      sendSignal({ type: "offer", sdp: offer });
      setStatus(tr("status.offerSent"));
    } catch {
      setStatus(tr("status.failedCreateOffer"));
    }
  }, [createPeerConnection, sendSignal, tr]);

  const handleOffer = useCallback(
    async (sdp: RTCSessionDescriptionInit) => {
      try {
        const pc = createPeerConnection();
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        await flushPendingIce();
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        sendSignal({ type: "answer", sdp: answer });
        setStatus(tr("status.answerSent"));
      } catch {
        setStatus(tr("status.failedHandleOffer"));
      }
    },
    [createPeerConnection, flushPendingIce, sendSignal, tr]
  );

  const handleAnswer = useCallback(
    async (sdp: RTCSessionDescriptionInit) => {
      try {
        const pc = createPeerConnection();
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        await flushPendingIce();
        setStatus(tr("status.answerReceived"));
      } catch {
        setStatus(tr("status.failedApplyAnswer"));
      }
    },
    [createPeerConnection, flushPendingIce, tr]
  );

  const handleIce = useCallback(async (candidate: RTCIceCandidateInit) => {
    const pc = pcRef.current;
    if (!pc || !pc.remoteDescription) {
      pendingIceRef.current.push(candidate);
      return;
    }

    try {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    } catch {
      setStatus(tr("status.failedAddIce"));
    }
  }, [tr]);

  const disconnect = useCallback(() => {
    sendSignal({ type: "leave" });

    const socket = socketRef.current;
    if (socket) {
      socket.onmessage = null;
      socket.onopen = null;
      socket.onerror = null;
      socket.onclose = null;
      socket.close();
      socketRef.current = null;
    }

    closePeerConnection();
    stopLocalMedia();
    isHostRef.current = false;
    setConnected(false);
    setStatus(tr("status.disconnected"));
  }, [closePeerConnection, sendSignal, stopLocalMedia, tr]);

  const connect = useCallback(async () => {
    const serverUrl = settings.serverUrl.trim();

    if (!serverUrl) {
      Alert.alert(tr("alert.setServerTitle"), tr("alert.setServerMessage"));
      return;
    }

    if (!roomId.trim()) {
      Alert.alert(tr("alert.missingRoomTitle"), tr("alert.missingRoomMessage"));
      return;
    }

    const hasPermissions = await requestMediaPermissions();
    if (!hasPermissions) {
      Alert.alert(tr("alert.permissionsTitle"), tr("alert.permissionsMessage"));
      return;
    }

    try {
      const stream = await mediaDevices.getUserMedia({
        audio: true,
        video: {
          facingMode: "user",
          width: 640,
          height: 480,
          frameRate: 24,
        },
      });

      localStreamRef.current = stream;
      setLocalStream(stream);
      setStatus(tr("status.openingSocket"));

      const socket = new WebSocket(serverUrl);
      socketRef.current = socket;

      socket.onopen = () => {
        socket.send(JSON.stringify({ type: "join", roomId: roomId.trim() }));
        setStatus(tr("status.joinedWaitingPeer"));
      };

      socket.onmessage = async (event) => {
        let message: SignalMessage;
        try {
          message = JSON.parse(event.data as string) as SignalMessage;
        } catch {
          return;
        }

        if (message.type === "joined") {
          isHostRef.current = message.isHost;
          setConnected(true);
          setStatus(message.isHost ? tr("status.waitingSecondPerson") : tr("status.connectedToRoom"));
          return;
        }

        if (message.type === "peer-joined") {
          setStatus(tr("status.peerJoinedStarting"));
          if (isHostRef.current) await createAndSendOffer();
          return;
        }

        if (message.type === "offer") {
          await handleOffer(message.sdp);
          return;
        }

        if (message.type === "answer") {
          await handleAnswer(message.sdp);
          return;
        }

        if (message.type === "ice") {
          await handleIce(message.candidate);
          return;
        }

        if (message.type === "peer-left") {
          closePeerConnection();
          setStatus(tr("status.peerLeftRoom"));
          return;
        }

        if (message.type === "room-full") {
          Alert.alert(tr("alert.roomFullTitle"), tr("alert.roomFullMessage"));
          disconnect();
          return;
        }

        if (message.type === "error") {
          setStatus(message.message);
        }
      };

      socket.onerror = () => {
        setStatus(tr("status.socketError"));
        setConnected(false);
      };

      socket.onclose = () => {
        setStatus(tr("status.socketClosed"));
        setConnected(false);
        closePeerConnection();
      };
    } catch {
      setStatus(tr("status.failedInitMediaSocket"));
      stopLocalMedia();
    }
  }, [
    closePeerConnection,
    createAndSendOffer,
    disconnect,
    handleAnswer,
    handleIce,
    handleOffer,
    requestMediaPermissions,
    roomId,
    settings.serverUrl,
    stopLocalMedia,
    tr,
  ]);

  const toggleMic = useCallback((value: boolean) => {
    setMicEnabled(value);
    localStreamRef.current?.getAudioTracks().forEach((track) => {
      track.enabled = value;
    });
  }, []);

  const toggleCam = useCallback((value: boolean) => {
    setCamEnabled(value);
    localStreamRef.current?.getVideoTracks().forEach((track) => {
      track.enabled = value;
    });
  }, []);

  const switchCamera = useCallback(() => {
    const videoTrack = localStreamRef.current?.getVideoTracks()[0] as
      | ({ _switchCamera?: () => void } & MediaStreamTrack)
      | undefined;
    videoTrack?._switchCamera?.();
  }, []);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  useEffect(() => {
    if (!connected) {
      pipPan.setValue({ x: 0, y: 0 });
    }
  }, [connected, pipPan]);

  if (connected) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.callScreen}>
          {remoteStreamUrl ? (
            <RTCView streamURL={remoteStreamUrl} style={styles.fullscreenVideo} objectFit="cover" zOrder={0} />
          ) : (
            <LinearGradient
              colors={APP_GRADIENT_COLORS}
              start={APP_GRADIENT_START}
              end={APP_GRADIENT_END}
              style={styles.videoFallback}
            >
              <Text style={styles.placeholderText}>{tr("call.waitingRemoteVideo")}</Text>
            </LinearGradient>
          )}

          <LinearGradient
            colors={["rgba(2,6,23,0.75)", "rgba(2,6,23,0)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.topOverlay}
          >
            <Text style={styles.statusBadge}>{status}</Text>
          </LinearGradient>

          {localStreamUrl ? (
            <Animated.View
              style={[styles.pipWrap, { transform: pipPan.getTranslateTransform() }]}
              {...pipPanResponder.panHandlers}
            >
              <RTCView streamURL={localStreamUrl} style={styles.pipVideo} objectFit="cover" mirror zOrder={2} />
            </Animated.View>
          ) : null}

          <LinearGradient
            colors={["rgba(2,6,23,0)", "rgba(2,6,23,0.85)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.bottomOverlay}
          >
            <View style={styles.controlsRow}>
              <TouchableOpacity
                style={[styles.iconButton, micEnabled ? styles.iconEnabled : styles.iconDisabled]}
                onPress={() => toggleMic(!micEnabled)}
              >
                <Ionicons name={micEnabled ? "mic" : "mic-off"} size={20} color="#e2e8f0" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.iconButton, camEnabled ? styles.iconEnabled : styles.iconDisabled]}
                onPress={() => toggleCam(!camEnabled)}
              >
                <Ionicons name={camEnabled ? "videocam" : "videocam-off"} size={20} color="#e2e8f0" />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.iconButton, styles.iconNeutral]} onPress={switchCamera}>
                <Ionicons name="camera-reverse" size={20} color="#e2e8f0" />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.iconButton, styles.endButton]} onPress={disconnect}>
                <Ionicons name="call" size={20} color="#e2e8f0" />
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient
        colors={APP_GRADIENT_COLORS}
        start={APP_GRADIENT_START}
        end={APP_GRADIENT_END}
        style={StyleSheet.absoluteFill}
      />
      <KeyboardAvoidingView
        style={styles.setupWrap}
        behavior={Platform.select({ ios: "padding", android: undefined })}
      >
        <View style={styles.heroBlock}>
          <Text style={styles.title}>{tr("home.title")}</Text>
          <Text style={styles.subtitle}>{status}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.inputLabel}>{tr("home.room")}</Text>
          <TextInput
            style={styles.input}
            value={roomId}
            onChangeText={setRoomId}
            placeholder="family-room"
            placeholderTextColor="#64748b"
            autoCapitalize="none"
          />
          <TouchableOpacity style={[styles.button, styles.connect]} onPress={connect}>
            <Text style={styles.buttonText}>{tr("home.joinCall")}</Text>
          </TouchableOpacity>
          <Text style={styles.note}>{tr("home.note")}</Text>
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
  setupWrap: {
    flex: 1,
    justifyContent: "center",
    padding: 18,
    gap: 16,
  },
  heroBlock: {
    gap: 8,
  },
  title: {
    color: "#e2e8f0",
    fontSize: 34,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  subtitle: {
    color: "#7dd3fc",
    fontSize: 15,
  },
  card: {
    backgroundColor: "rgba(2,6,23,0.72)",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(125,211,252,0.25)",
    padding: 16,
    gap: 12,
  },
  inputLabel: {
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
  note: {
    color: "#94a3b8",
    fontSize: 12,
  },
  button: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  connect: {
    backgroundColor: "#0891b2",
  },
  buttonText: {
    color: "#e2e8f0",
    fontWeight: "700",
  },
  callScreen: {
    flex: 1,
    backgroundColor: "#020617",
  },
  fullscreenVideo: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#020617",
  },
  videoFallback: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  topOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 36,
  },
  statusBadge: {
    color: "#dbeafe",
    backgroundColor: "rgba(15,23,42,0.7)",
    borderWidth: 1,
    borderColor: "rgba(45,212,191,0.5)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    fontSize: 12,
    alignSelf: "flex-start",
  },
  pipWrap: {
    position: "absolute",
    top: 72,
    right: 16,
    width: 110,
    height: 170,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "rgba(45,212,191,0.8)",
    backgroundColor: "#0b1120",
    zIndex: 30,
    elevation: 30,
  },
  pipVideo: {
    width: "100%",
    height: "100%",
    borderRadius: 14,
  },
  bottomOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 12,
    paddingTop: 48,
    paddingBottom: 16,
  },
  controlsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-evenly",
    gap: 8,
    backgroundColor: "rgba(15,23,42,0.85)",
    borderRadius: 28,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(125,211,252,0.28)",
  },
  iconButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
  },
  iconEnabled: {
    backgroundColor: "#0f766e",
  },
  iconDisabled: {
    backgroundColor: "#334155",
  },
  iconNeutral: {
    backgroundColor: "#1e293b",
  },
  endButton: {
    backgroundColor: "#dc2626",
  },
  placeholderText: {
    color: "#e2e8f0",
    fontSize: 15,
    fontWeight: "600",
  },
});
