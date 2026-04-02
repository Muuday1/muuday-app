declare module 'agora-rtc-sdk-ng' {
  export type IAgoraRTCRemoteUser = {
    uid: string | number
    audioTrack?: { play(): void }
    videoTrack?: { play(element: HTMLElement): void }
  }

  export type IMicrophoneAudioTrack = {
    setEnabled(enabled: boolean): Promise<void>
    stop(): void
    close(): void
  }

  export type ICameraVideoTrack = {
    setEnabled(enabled: boolean): Promise<void>
    play(element: HTMLElement): void
    stop(): void
    close(): void
  }

  export type IAgoraRTCClient = {
    join(
      appId: string,
      channel: string,
      token: string,
      uid: string | number,
    ): Promise<void>
    publish(tracks: Array<IMicrophoneAudioTrack | ICameraVideoTrack>): Promise<void>
    subscribe(user: IAgoraRTCRemoteUser, mediaType: 'audio' | 'video'): Promise<void>
    leave(): Promise<void>
    removeAllListeners(): void
    on(
      event: 'user-published' | 'user-unpublished',
      listener: (user: IAgoraRTCRemoteUser, mediaType: 'audio' | 'video') => void | Promise<void>,
    ): void
  }

  const AgoraRTC: {
    createClient(config: { mode: 'rtc'; codec: 'vp8' | 'h264' }): IAgoraRTCClient
    createMicrophoneAndCameraTracks(): Promise<[IMicrophoneAudioTrack, ICameraVideoTrack]>
  }

  export default AgoraRTC
}
