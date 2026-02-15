# Video Call Chat App Implementation Plan

## 1. Goals and Scope
1. Build a mobile app for 1:1 video calling and messaging between friends/family.
2. Support Android first, iOS second, web optional later.
3. Prioritize call reliability, low latency, and simple onboarding.
4. MVP features:
   - Account creation and login
   - Contact discovery/invite by username or phone
   - 1:1 video/audio calls (mute, camera toggle, speaker)
   - Real-time text chat (during and outside calls)
   - Push notifications for incoming calls/messages

## 2. Product Decisions (Lock Before Coding)
1. Identity: phone OTP or email/password (recommend phone OTP for family usage).
2. Call type for MVP: 1:1 only (defer group calls).
3. Message persistence: store in backend DB with basic delivery/read status.
4. Presence model: online/offline + last seen.
5. Abuse controls: block user + report user.

## 3. High-Level Architecture
1. Client: Expo React Native app (current repo).
2. Signaling server: Node.js + WebSocket (Socket.IO or ws).
3. Media transport: WebRTC peer-to-peer for 1:1.
4. NAT traversal:
   - STUN server for connectivity checks
   - TURN relay (required for real-world reliability)
5. API server:
   - Auth, profiles, contacts, chats, call metadata
   - PostgreSQL for persistent data
6. Notifications:
   - FCM for Android, APNs for iOS (through Expo Notifications or direct providers)

## 4. Repository and Environment Setup
1. Keep this repo as `mobile` app.
2. Create separate `server` repo/folder for backend (`api` + `signaling`) or a monorepo.
3. Define env files:
   - Mobile: `EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_SIGNALING_URL`
   - Server: DB URL, JWT secret, OTP provider keys, TURN credentials
4. Add CI baseline:
   - Mobile lint/type-check
   - Server lint/tests

## 5. Backend Implementation Steps
1. Bootstrap server stack (TypeScript + Fastify/Express + Socket.IO).
2. Implement auth module:
   - Signup/login
   - Token refresh + secure token invalidation
3. Implement user/profile module:
   - Basic profile fields + avatar URL
   - Search/add contacts
4. Implement chat module:
   - Conversation model (1:1)
   - Message create/list/read endpoints
   - WebSocket event for live message delivery
5. Implement signaling module:
   - Events: `call:invite`, `call:accept`, `call:reject`, `webrtc:offer`, `webrtc:answer`, `webrtc:ice`
   - Timeout and cleanup logic for abandoned calls
6. Add push notification triggers for offline recipients.
7. Add rate limiting and abuse-prevention middleware.

## 6. Mobile App Implementation Steps
1. Install core packages:
   - State/query: Zustand or Redux Toolkit + React Query
   - Networking: axios/fetch wrappers
   - Realtime: Socket.IO client
   - WebRTC: `react-native-webrtc` (+ Expo dev build requirements)
   - Notifications: Expo Notifications
2. Create app navigation structure:
   - Auth stack
   - Main tabs: Chats, Calls, Settings
3. Build auth screens and secure session handling.
4. Build contacts/user search and conversation list.
5. Build chat screen:
   - Message list
   - Send text
   - Read status + optimistic updates
6. Build calling UX:
   - Incoming call screen (accept/reject)
   - Outgoing ringing state
   - In-call UI with local/remote video
   - Controls: mute, camera swap, end call, speaker
7. Integrate WebRTC flow:
   - Get local media
   - Peer connection setup
   - Exchange SDP + ICE via signaling server
   - Handle reconnection and call end states
8. Hook push notifications to deep link into chat/call screens.

## 7. Data Model (Initial)
1. `users`: id, phone/email, display_name, avatar, created_at.
2. `contacts`: user_id, contact_user_id, status, created_at.
3. `conversations`: id, type(1:1), created_at.
4. `conversation_members`: conversation_id, user_id.
5. `messages`: id, conversation_id, sender_id, body, sent_at, delivered_at, read_at.
6. `calls`: id, caller_id, callee_id, started_at, ended_at, status, end_reason.
7. `devices`: user_id, push_token, platform, last_active_at.

## 8. Security and Privacy Checklist
1. TLS everywhere (API, signaling, TURN).
2. JWT best practices (short access token, refresh rotation).
3. Input validation on all API and socket events.
4. Encrypt sensitive data at rest where applicable.
5. Restrict media permissions and explain usage in-app.
6. Add privacy policy and terms before production release.

## 9. Testing Strategy
1. Unit tests for backend business logic.
2. API integration tests for auth/chat/call endpoints.
3. Socket flow tests for signaling events.
4. Mobile component tests for key screens.
5. End-to-end call tests across:
   - Same Wi-Fi
   - Different networks/carriers
   - Low bandwidth scenarios
6. Manual device matrix:
   - At least 2 Android versions + 1 iPhone for MVP validation.

## 10. Deployment Plan
1. Deploy backend to a managed platform (Render/Fly/Cloud Run).
2. Deploy PostgreSQL (managed DB).
3. Provision TURN service (self-hosted coturn or managed provider).
4. Configure monitoring:
   - API latency/error rate
   - Socket connection counts
   - Call success rate and average duration
5. Release mobile builds:
   - Internal testing track first
   - Staged rollout after stability checks

## 11. Milestones and Timeline (Suggested)
1. Week 1: Architecture + backend scaffold + auth endpoints.
2. Week 2: Contacts + chat APIs + real-time messaging.
3. Week 3: Signaling server + initial WebRTC call flow.
4. Week 4: Call UI polish + push notifications + reliability fixes.
5. Week 5: Security hardening + test pass + beta release.

## 12. Definition of Done for MVP
1. User can sign up and add at least one contact.
2. User can send/receive real-time messages.
3. User can place and receive a stable 1:1 video call.
4. Call connects in common NAT scenarios (TURN fallback works).
5. Notifications work when app is backgrounded.
6. Basic crash/error monitoring is active.

## 13. Post-MVP Backlog
1. Group calls.
2. End-to-end encryption for messages/call metadata.
3. File/image sharing in chat.
4. Message reactions and typing indicators.
5. Call history insights and quality analytics dashboard.
