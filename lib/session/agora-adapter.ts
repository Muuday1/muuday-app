/**
 * Agora SDK adapter implementing the provider-agnostic SessionAdapter interface.
 *
 * All Agora-specific imports are isolated to this file.
 */

import type {
  IAgoraRTCClient,
  IAgoraRTCRemoteUser,
  IMicrophoneAudioTrack,
  ICameraVideoTrack,
} from 'agora-rtc-sdk-ng';
import type {
  SessionAdapter,
  SessionAdapterEvents,
  SessionJoinToken,
  SessionRoom,
} from './types';

export class AgoraSessionAdapter implements SessionAdapter {
  readonly provider = 'agora' as const;

  private client: IAgoraRTCClient | null = null;
  private localAudio: IMicrophoneAudioTrack | null = null;
  private localVideo: ICameraVideoTrack | null = null;
  private joined = false;
  private audioEnabled = true;
  private videoEnabled = true;
  private eventHandlers: Partial<
    Record<keyof SessionAdapterEvents, Set<SessionAdapterEvents[keyof SessionAdapterEvents]>>
  > = {};

  async join(room: SessionRoom, token: SessionJoinToken): Promise<void> {
    const appId = token.providerMeta.appId as string;
    if (!appId) throw new Error('Agora appId missing in providerMeta');

    const AgoraRTC = (await import('agora-rtc-sdk-ng')).default;
    this.client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
    this.bindClientEvents();

    await this.client.join(appId, room.roomReference, token.token, token.uid);

    // Create local tracks with camera-fallback: if camera fails, try audio-only
    let audioTrack: IMicrophoneAudioTrack | undefined;
    let videoTrack: ICameraVideoTrack | undefined;

    try {
      const tracks = await AgoraRTC.createMicrophoneAndCameraTracks();
      audioTrack = tracks[0];
      videoTrack = tracks[1];
    } catch (trackError) {
      const msg = String(trackError).toLowerCase();
      const isCameraError =
        msg.includes('camera') ||
        msg.includes('videoinput') ||
        msg.includes('device not found') ||
        msg.includes('could not start video');

      if (isCameraError) {
        try {
          audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
        } catch {
          throw trackError;
        }
      } else {
        throw trackError;
      }
    }

    this.localAudio = audioTrack || null;
    this.localVideo = videoTrack || null;
    this.audioEnabled = true;
    this.videoEnabled = true;

    const tracksToPublish: (IMicrophoneAudioTrack | ICameraVideoTrack)[] = [];
    if (audioTrack) tracksToPublish.push(audioTrack);
    if (videoTrack) tracksToPublish.push(videoTrack);

    if (tracksToPublish.length > 0) {
      await this.client.publish(tracksToPublish);
    }

    this.joined = true;
  }

  async leave(): Promise<void> {
    if (!this.client) return;

    if (this.localAudio) {
      try { this.localAudio.stop(); } catch { /* ignore */ }
      try { this.localAudio.close(); } catch { /* ignore */ }
      this.localAudio = null;
    }
    if (this.localVideo) {
      try { this.localVideo.stop(); } catch { /* ignore */ }
      try { this.localVideo.close(); } catch { /* ignore */ }
      this.localVideo = null;
    }

    if (this.joined) {
      try { await this.client.leave(); } catch { /* ignore */ }
      this.joined = false;
    }
    this.client.removeAllListeners();
    this.client = null;
  }

  async startPublishing(_tracks: MediaStreamTrack[]): Promise<void> {
    // Agora already publishes on join; this is a no-op unless we unpublish later.
    // TODO: implement unpublish/publish swap when camera/mic toggles are needed
  }

  async stopPublishing(): Promise<void> {
    if (!this.client || !this.joined) return;
    const toUnpublish: (IMicrophoneAudioTrack | ICameraVideoTrack)[] = [];
    if (this.localAudio) toUnpublish.push(this.localAudio);
    if (this.localVideo) toUnpublish.push(this.localVideo);
    if (toUnpublish.length) {
      await (this.client as any).unpublish(toUnpublish);
    }
  }

  async subscribe(remoteUid: string): Promise<MediaStream> {
    if (!this.client) throw new Error('Not joined');
    const users = (this.client as any).remoteUsers as IAgoraRTCRemoteUser[];
    const user = users.find((u: IAgoraRTCRemoteUser) => String(u.uid) === remoteUid);
    if (!user) throw new Error(`Remote user ${remoteUid} not found`);

    await this.client.subscribe(user, 'video');
    await this.client.subscribe(user, 'audio');

    const stream = new MediaStream();
    if ((user.videoTrack as any)?.getMediaStreamTrack) {
      stream.addTrack((user.videoTrack as any).getMediaStreamTrack());
    }
    if ((user.audioTrack as any)?.getMediaStreamTrack) {
      stream.addTrack((user.audioTrack as any).getMediaStreamTrack());
    }
    return stream;
  }

  async unsubscribe(remoteUid: string): Promise<void> {
    if (!this.client) return;
    const users = (this.client as any).remoteUsers as IAgoraRTCRemoteUser[];
    const user = users.find((u: IAgoraRTCRemoteUser) => String(u.uid) === remoteUid);
    if (user) {
      await (this.client as any).unsubscribe(user);
    }
  }

  getRemoteUsers(): string[] {
    if (!this.client) return [];
    const users = (this.client as any).remoteUsers as IAgoraRTCRemoteUser[];
    return users.map((u) => String(u.uid));
  }

  async setAudioEnabled(enabled: boolean): Promise<void> {
    if (!this.localAudio) return;
    await this.localAudio.setEnabled(enabled);
    this.audioEnabled = enabled;
  }

  async setVideoEnabled(enabled: boolean): Promise<void> {
    if (!this.localVideo) return;
    await this.localVideo.setEnabled(enabled);
    this.videoEnabled = enabled;
  }

  isAudioEnabled(): boolean {
    return this.audioEnabled;
  }

  isVideoEnabled(): boolean {
    return this.videoEnabled;
  }

  getLocalStream(): MediaStream | null {
    if (!this.localAudio && !this.localVideo) return null;
    const stream = new MediaStream();
    if (this.localAudio) {
      try {
        stream.addTrack((this.localAudio as any).getMediaStreamTrack());
      } catch { /* ignore */ }
    }
    if (this.localVideo) {
      try {
        stream.addTrack((this.localVideo as any).getMediaStreamTrack());
      } catch { /* ignore */ }
    }
    return stream;
  }

  onEvent<K extends keyof SessionAdapterEvents>(
    event: K,
    handler: SessionAdapterEvents[K]
  ): () => void {
    if (!this.eventHandlers[event]) {
      this.eventHandlers[event] = new Set();
    }
    this.eventHandlers[event]!.add(handler as unknown as SessionAdapterEvents[keyof SessionAdapterEvents]);
    return () => {
      this.eventHandlers[event]!.delete(handler as unknown as SessionAdapterEvents[keyof SessionAdapterEvents]);
    };
  }

  private emit<K extends keyof SessionAdapterEvents>(
    event: K,
    ...args: Parameters<SessionAdapterEvents[K]>
  ): void {
    const set = this.eventHandlers[event];
    if (!set) return;
    set.forEach((h) => {
      (h as unknown as (...p: unknown[]) => void)(...args);
    });
  }

  private bindClientEvents(): void {
    if (!this.client) return;

    this.client.on('user-published', (user: IAgoraRTCRemoteUser, mediaType: 'audio' | 'video') => {
      this.emit('trackPublished', String(user.uid), mediaType);
    });

    this.client.on('user-unpublished', (user: IAgoraRTCRemoteUser, mediaType: 'audio' | 'video') => {
      this.emit('trackUnpublished', String(user.uid), mediaType);
    });

    const c = this.client as any;
    c.on('user-joined', (user: IAgoraRTCRemoteUser) => {
      this.emit('userJoined', String(user.uid));
    });

    c.on('user-left', (user: IAgoraRTCRemoteUser) => {
      this.emit('userLeft', String(user.uid));
    });

    c.on('connection-state-change', (cur: string, _prev: string, reason?: string) => {
      const state = cur as 'connecting' | 'connected' | 'disconnected' | 'failed';
      this.emit('connectionStateChanged', state, reason);
    });
  }
}
