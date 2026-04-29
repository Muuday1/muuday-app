# Integration: Agora Video SDK

Last updated: 2026-04-29

## Purpose

Real-time audio/video sessions between clients and professionals via the Agora Web SDK.

## Architecture

The app uses a provider-agnostic `SessionAdapter` interface (`lib/session/types.ts`). The Agora implementation is isolated to:

- `lib/session/agora-adapter.ts` — SDK adapter implementing `SessionAdapter`
- `lib/session/types.ts` — shared types and interface
- `types/agora-access-token.d.ts` — type augmentation
- `types/agora-rtc-sdk-ng.d.ts` — type augmentation

## Configuration

| Env var | Required | Description |
|---------|----------|-------------|
| `AGORA_APP_ID` | Yes (for video) | Agora project app ID |
| `AGORA_APP_CERTIFICATE` | Yes (for token generation) | Agora app certificate (server-only) |

## Key behaviors

- **Camera fallback**: If camera access fails during join, the adapter falls back to audio-only mode instead of failing completely.
- **Dynamic import**: The Agora SDK is loaded lazily via `await import('agora-rtc-sdk-ng')` to reduce initial bundle size.
- **Codec**: VP8 (web-optimized).
- **Token generation**: Server-side tokens are generated using the Agora Access Token library with the app certificate.

## Usage flow

1. Client requests a session token from the server API (`/api/sessions/token`).
2. Server generates a timed token using `AGORA_APP_CERTIFICATE`.
3. Client creates `AgoraSessionAdapter` and calls `join(room, token)`.
4. On join, the adapter creates microphone and camera tracks, publishes them, and binds event handlers.
5. Remote user tracks are subscribed via `subscribe(remoteUid)`.

## Error handling

- Camera-not-found errors trigger audio-only fallback.
- All leave/unpublish operations are wrapped in try/catch to prevent crashes during cleanup.

## Security

- `AGORA_APP_CERTIFICATE` must never be exposed to the client.
- Tokens are short-lived and generated server-side.

## Risks

1. Agora SDK is a large dependency; lazy import mitigates but does not eliminate bundle impact.
2. Browser permission policies (microphone/camera) can block session start.
3. VP8 may not be hardware-accelerated on all devices.

## Next steps

1. Monitor connection-state-change events for retry logic.
2. Add screen-sharing support via `AgoraRTC.createScreenVideoTrack`.
