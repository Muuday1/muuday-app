/**
 * Provider-agnostic session abstraction.
 *
 * Part 5 spec (§2.3) requires the app to be provider-agnostic so that
 * switching from Agora to another provider is a config change, not a
 * rewrite.
 *
 * Rules:
 * - UI code never imports Agora SDK types directly.
 * - All Agora specifics live in adapter implementations.
 * - Session lifecycle is tracked in the DB (bookings table) for no-show
 *   evidence and dispute resolution.
 */

export type SessionProvider = 'agora';

export type SessionStatus =
  | 'not_ready'    // waiting for professional to open join window
  | 'join_open'    // professional clicked "entrar"; client can connect
  | 'in_progress'  // both parties have obtained tokens / connected
  | 'ended'        // session gracefully ended or window closed
  | 'failed';      // connection error, permission denied, etc.

export type SessionFailureReason =
  | 'token_error'
  | 'permission_denied'
  | 'provider_sdk_error'
  | 'browser_unsupported'
  | 'network_timeout'
  | 'user_cancelled'
  | 'window_expired'
  | string;        // extensible for future reasons

/**
 * Core session room metadata, independent of provider.
 */
export interface SessionRoom {
  bookingId: string;
  provider: SessionProvider;
  roomReference: string; // for Agora: channelName
  status: SessionStatus;
}

/**
 * Join token returned by the backend.  Provider-specific payload is
 * attached as an opaque record so that the adapter can consume it.
 */
export interface SessionJoinToken {
  token: string;
  roomReference: string;
  uid: string;
  expiresAtUtc: string;
  windowStartUtc: string;
  windowEndUtc: string;
  /** Opaque provider-specific extras (e.g. Agora appId). */
  providerMeta: Record<string, unknown>;
}

/**
 * Adapter interface.  Each provider implements this.
 */
export interface SessionAdapter {
  readonly provider: SessionProvider;

  /** Initialise the SDK / load scripts if necessary. */
  init?(): Promise<void>;

  /** Join a session room using the token returned by the backend. */
  join(room: SessionRoom, token: SessionJoinToken): Promise<void>;

  /** Leave the session and clean up tracks. */
  leave(): Promise<void>;

  /** Start publishing local audio/video. */
  startPublishing(tracks: MediaStreamTrack[]): Promise<void>;

  /** Stop publishing local audio/video. */
  stopPublishing(): Promise<void>;

  /** Subscribe to a remote user's media. */
  subscribe(remoteUid: string): Promise<MediaStream>;

  /** Unsubscribe from a remote user. */
  unsubscribe(remoteUid: string): Promise<void>;

  /** Current list of remote UIDs in the room. */
  getRemoteUsers(): string[];

  /** Register a callback for lifecycle events. */
  onEvent<K extends keyof SessionAdapterEvents>(
    event: K,
    handler: SessionAdapterEvents[K]
  ): () => void;
}

export interface SessionAdapterEvents {
  userJoined: (uid: string) => void;
  userLeft: (uid: string) => void;
  connectionStateChanged: (state: 'connecting' | 'connected' | 'disconnected' | 'failed', reason?: string) => void;
  trackPublished: (uid: string, kind: 'audio' | 'video') => void;
  trackUnpublished: (uid: string, kind: 'audio' | 'video') => void;
  error: (err: Error) => void;
}

/**
 * Telemetry event sent to the backend when session lifecycle changes.
 */
export interface SessionTelemetryEvent {
  bookingId: string;
  eventType: SessionTelemetryEventType;
  timestamp: string; // ISO 8601
  metadata?: Record<string, unknown>;
}

export type SessionTelemetryEventType =
  | 'session_join_attempted'
  | 'session_joined'
  | 'session_left'
  | 'session_started'
  | 'session_ended'
  | 'session_failed'
  | 'media_published'
  | 'media_subscribed';
