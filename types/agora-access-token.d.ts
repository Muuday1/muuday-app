declare module 'agora-access-token' {
  export const RtcRole: {
    PUBLISHER: number
    SUBSCRIBER: number
  }

  export const RtcTokenBuilder: {
    buildTokenWithAccount(
      appId: string,
      appCertificate: string,
      channelName: string,
      account: string,
      role: number,
      privilegeExpiredTs: number,
    ): string
  }
}
