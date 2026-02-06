/**
 * RTCPeerConnection Mock
 *
 * Mock WebRTC RTCPeerConnection for testing peer connection functionality.
 */

// vitest import not currently needed but kept for future use

// =============================================================================
// Types
// =============================================================================

export interface MockRTCSessionDescription {
  type: RTCSdpType;
  sdp: string;
}

// =============================================================================
// Mock RTCIceCandidate
// =============================================================================

export class MockRTCIceCandidate implements RTCIceCandidate {
  readonly candidate: string;
  readonly sdpMid: string | null;
  readonly sdpMLineIndex: number | null;
  readonly foundation: string | null = null;
  readonly component: RTCIceComponent | null = null;
  readonly priority: number | null = null;
  readonly address: string | null = null;
  readonly protocol: RTCIceProtocol | null = null;
  readonly port: number | null = null;
  readonly type: RTCIceCandidateType | null = null;
  readonly tcpType: RTCIceTcpCandidateType | null = null;
  readonly relatedAddress: string | null = null;
  readonly relatedPort: number | null = null;
  readonly usernameFragment: string | null = null;

  constructor(candidateInitDict?: RTCIceCandidateInit) {
    this.candidate = candidateInitDict?.candidate ?? '';
    this.sdpMid = candidateInitDict?.sdpMid ?? null;
    this.sdpMLineIndex = candidateInitDict?.sdpMLineIndex ?? null;
  }

  toJSON(): RTCIceCandidateInit {
    return {
      candidate: this.candidate,
      sdpMid: this.sdpMid,
      sdpMLineIndex: this.sdpMLineIndex,
    };
  }
}

// =============================================================================
// Mock RTCRtpSender
// =============================================================================

export class MockRTCRtpSender implements RTCRtpSender {
  track: MediaStreamTrack | null;
  readonly transport: RTCDtlsTransport | null = null;
  readonly dtmf: RTCDTMFSender | null = null;
  readonly transform: RTCRtpScriptTransform | null = null;

  constructor(track: MediaStreamTrack | null) {
    this.track = track;
  }

  async getStats(): Promise<RTCStatsReport> {
    return new Map() as RTCStatsReport;
  }

  async setParameters(_parameters: RTCRtpSendParameters): Promise<void> {
    return Promise.resolve();
  }

  getParameters(): RTCRtpSendParameters {
    return {
      transactionId: '',
      codecs: [],
      headerExtensions: [],
      rtcp: { cname: '', reducedSize: false },
      encodings: [],
    };
  }

  async replaceTrack(withTrack: MediaStreamTrack | null): Promise<void> {
    this.track = withTrack;
    return Promise.resolve();
  }

  setStreams(..._streams: MediaStream[]): void {}

  static getCapabilities(_kind: string): RTCRtpCapabilities | null {
    return null;
  }
}

// =============================================================================
// Mock RTCPeerConnection
// =============================================================================

let peerConnectionIdCounter = 0;

// Note: We don't strictly implement RTCPeerConnection to avoid complex overload issues
// This mock provides a compatible subset of RTCPeerConnection for testing
export class MockRTCPeerConnection {
  readonly id: string;

  // Connection state
  connectionState: RTCPeerConnectionState = 'new';
  iceConnectionState: RTCIceConnectionState = 'new';
  iceGatheringState: RTCIceGatheringState = 'new';
  signalingState: RTCSignalingState = 'stable';

  // Descriptions
  localDescription: RTCSessionDescription | null = null;
  remoteDescription: RTCSessionDescription | null = null;
  currentLocalDescription: RTCSessionDescription | null = null;
  currentRemoteDescription: RTCSessionDescription | null = null;
  pendingLocalDescription: RTCSessionDescription | null = null;
  pendingRemoteDescription: RTCSessionDescription | null = null;

  // Config
  readonly configuration: RTCConfiguration;
  readonly sctp: RTCSctpTransport | null = null;
  readonly canTrickleIceCandidates: boolean | null = true;

  // Event handlers (simplified types to avoid 'this' context issues)
  onconnectionstatechange: ((ev: Event) => void) | null = null;
  ondatachannel: ((ev: RTCDataChannelEvent) => void) | null = null;
  onicecandidate: ((ev: RTCPeerConnectionIceEvent) => void) | null = null;
  onicecandidateerror: ((ev: Event) => void) | null = null;
  oniceconnectionstatechange: ((ev: Event) => void) | null = null;
  onicegatheringstatechange: ((ev: Event) => void) | null = null;
  onnegotiationneeded: ((ev: Event) => void) | null = null;
  onsignalingstatechange: ((ev: Event) => void) | null = null;
  ontrack: ((ev: RTCTrackEvent) => void) | null = null;

  private _listeners: Map<string, Set<EventListener>> = new Map();
  private _senders: MockRTCRtpSender[] = [];
  private _receivers: RTCRtpReceiver[] = [];
  private _transceivers: RTCRtpTransceiver[] = [];
  private _localIceCandidates: RTCIceCandidate[] = [];
  private _remoteIceCandidates: RTCIceCandidate[] = [];
  private _isClosed = false;
  private _offerSdp = 'mock-offer-sdp';
  private _answerSdp = 'mock-answer-sdp';

  constructor(configuration?: RTCConfiguration) {
    peerConnectionIdCounter++;
    this.id = `pc-${peerConnectionIdCounter}`;
    this.configuration = configuration ?? {};
  }

  // ===========================================================================
  // Track Management
  // ===========================================================================

  addTrack(track: MediaStreamTrack, ..._streams: MediaStream[]): RTCRtpSender {
    const sender = new MockRTCRtpSender(track);
    this._senders.push(sender);

    // Trigger negotiation needed
    setTimeout(() => {
      this.onnegotiationneeded?.(new Event('negotiationneeded'));
      this._dispatchEvent('negotiationneeded', new Event('negotiationneeded'));
    }, 0);

    return sender;
  }

  removeTrack(sender: RTCRtpSender): void {
    const index = this._senders.indexOf(sender as MockRTCRtpSender);
    if (index !== -1) {
      this._senders.splice(index, 1);
    }
  }

  addTransceiver(
    _trackOrKind: MediaStreamTrack | string,
    _init?: RTCRtpTransceiverInit
  ): RTCRtpTransceiver {
    const transceiver = {} as RTCRtpTransceiver;
    this._transceivers.push(transceiver);
    return transceiver;
  }

  getSenders(): RTCRtpSender[] {
    return [...this._senders];
  }

  getReceivers(): RTCRtpReceiver[] {
    return [...this._receivers];
  }

  getTransceivers(): RTCRtpTransceiver[] {
    return [...this._transceivers];
  }

  // ===========================================================================
  // SDP Negotiation
  // ===========================================================================

  async createOffer(options?: RTCOfferOptions): Promise<RTCSessionDescriptionInit> {
    this.signalingState = 'have-local-offer';
    const sdp = options?.iceRestart ? `${this._offerSdp}-restart` : this._offerSdp;
    return {
      type: 'offer',
      sdp,
    };
  }

  async createAnswer(_options?: RTCAnswerOptions): Promise<RTCSessionDescriptionInit> {
    return {
      type: 'answer',
      sdp: this._answerSdp,
    };
  }

  async setLocalDescription(description?: RTCSessionDescriptionInit): Promise<void> {
    if (description) {
      this.localDescription = description as RTCSessionDescription;
      this.currentLocalDescription = description as RTCSessionDescription;

      // Generate ICE candidates after setting local description
      setTimeout(() => {
        this._generateIceCandidates();
      }, 0);
    }
  }

  async setRemoteDescription(description: RTCSessionDescriptionInit): Promise<void> {
    this.remoteDescription = description as RTCSessionDescription;
    this.currentRemoteDescription = description as RTCSessionDescription;

    if (description.type === 'offer') {
      this.signalingState = 'have-remote-offer';
    } else if (description.type === 'answer') {
      this.signalingState = 'stable';
    }
  }

  async addIceCandidate(candidate?: RTCIceCandidateInit | null): Promise<void> {
    if (candidate) {
      const iceCandidate = new MockRTCIceCandidate(candidate);
      this._remoteIceCandidates.push(iceCandidate);
    }
  }

  // ===========================================================================
  // Connection Management
  // ===========================================================================

  restartIce(): void {
    // ICE restart is handled in createOffer with iceRestart option
  }

  close(): void {
    this._isClosed = true;
    this.connectionState = 'closed';
    this.iceConnectionState = 'closed';
    this.signalingState = 'closed';
  }

  get isClosed(): boolean {
    return this._isClosed;
  }

  getConfiguration(): RTCConfiguration {
    return this.configuration;
  }

  setConfiguration(_configuration: RTCConfiguration): void {}

  // ===========================================================================
  // Data Channels
  // ===========================================================================

  createDataChannel(
    _label: string,
    _dataChannelDict?: RTCDataChannelInit
  ): RTCDataChannel {
    return {} as RTCDataChannel;
  }

  // ===========================================================================
  // Statistics
  // ===========================================================================

  async getStats(_selector?: MediaStreamTrack | null): Promise<RTCStatsReport> {
    return new Map() as RTCStatsReport;
  }

  // ===========================================================================
  // Event Handling
  // ===========================================================================

  addEventListener(type: string, listener: EventListener): void {
    if (!this._listeners.has(type)) {
      this._listeners.set(type, new Set());
    }
    this._listeners.get(type)!.add(listener);
  }

  removeEventListener(type: string, listener: EventListener): void {
    this._listeners.get(type)?.delete(listener);
  }

  dispatchEvent(event: Event): boolean {
    return this._dispatchEvent(event.type, event);
  }

  private _dispatchEvent(type: string, event: Event): boolean {
    const listeners = this._listeners.get(type);
    if (listeners) {
      listeners.forEach((listener) => {
        if (typeof listener === 'function') {
          listener(event);
        }
      });
    }
    return true;
  }

  // ===========================================================================
  // Test Helpers
  // ===========================================================================

  /**
   * Simulate connection state change
   */
  simulateConnectionStateChange(state: RTCPeerConnectionState): void {
    this.connectionState = state;
    const event = new Event('connectionstatechange');
    this.onconnectionstatechange?.(event);
    this._dispatchEvent('connectionstatechange', event);
  }

  /**
   * Simulate ICE connection state change
   */
  simulateIceConnectionStateChange(state: RTCIceConnectionState): void {
    this.iceConnectionState = state;
    const event = new Event('iceconnectionstatechange');
    this.oniceconnectionstatechange?.(event);
    this._dispatchEvent('iceconnectionstatechange', event);
  }

  /**
   * Simulate receiving a remote track
   */
  simulateTrack(track: MediaStreamTrack, stream: MediaStream): void {
    const event = new Event('track') as unknown as RTCTrackEvent;
    Object.defineProperties(event, {
      track: { value: track },
      streams: { value: [stream] },
      receiver: { value: { track } as RTCRtpReceiver },
      transceiver: { value: {} as RTCRtpTransceiver },
    });

    this.ontrack?.(event);
    this._dispatchEvent('track', event as unknown as Event);
  }

  /**
   * Simulate negotiation needed
   */
  simulateNegotiationNeeded(): void {
    const event = new Event('negotiationneeded');
    this.onnegotiationneeded?.(event);
    this._dispatchEvent('negotiationneeded', event);
  }

  /**
   * Get sent senders
   */
  getMockSenders(): MockRTCRtpSender[] {
    return [...this._senders];
  }

  /**
   * Set the mock SDP for offers
   */
  setMockOfferSdp(sdp: string): void {
    this._offerSdp = sdp;
  }

  /**
   * Set the mock SDP for answers
   */
  setMockAnswerSdp(sdp: string): void {
    this._answerSdp = sdp;
  }

  private _generateIceCandidates(): void {
    // Generate mock ICE candidates
    const candidate = new MockRTCIceCandidate({
      candidate: 'candidate:mock-candidate',
      sdpMid: '0',
      sdpMLineIndex: 0,
    });

    this._localIceCandidates.push(candidate);

    const event = new Event('icecandidate') as unknown as RTCPeerConnectionIceEvent;
    Object.defineProperty(event, 'candidate', { value: candidate });

    this.onicecandidate?.(event);
    this._dispatchEvent('icecandidate', event as unknown as Event);

    // Also emit a null candidate to signal end of candidates
    setTimeout(() => {
      const endEvent = new Event('icecandidate') as unknown as RTCPeerConnectionIceEvent;
      Object.defineProperty(endEvent, 'candidate', { value: null });
      this.onicecandidate?.(endEvent);
      this._dispatchEvent('icecandidate', endEvent as unknown as Event);
    }, 10);
  }

  // Static method
  static generateCertificate(
    _keygenAlgorithm: AlgorithmIdentifier
  ): Promise<RTCCertificate> {
    return Promise.resolve({} as RTCCertificate);
  }
}

// =============================================================================
// Installation Helper
// =============================================================================

let originalRTCPeerConnection: typeof RTCPeerConnection | undefined;
let originalRTCIceCandidate: typeof RTCIceCandidate | undefined;

export function installMockRTCPeerConnection(): void {
  originalRTCPeerConnection = globalThis.RTCPeerConnection;
  originalRTCIceCandidate = globalThis.RTCIceCandidate;

  // @ts-expect-error - Mock has test helper methods not on real type
  globalThis.RTCPeerConnection = MockRTCPeerConnection;
  globalThis.RTCIceCandidate = MockRTCIceCandidate as typeof RTCIceCandidate;
}

export function uninstallMockRTCPeerConnection(): void {
  if (originalRTCPeerConnection) {
    (globalThis as unknown as { RTCPeerConnection: typeof RTCPeerConnection }).RTCPeerConnection =
      originalRTCPeerConnection;
    originalRTCPeerConnection = undefined;
  }
  if (originalRTCIceCandidate) {
    (globalThis as unknown as { RTCIceCandidate: typeof RTCIceCandidate }).RTCIceCandidate =
      originalRTCIceCandidate;
    originalRTCIceCandidate = undefined;
  }
}

export function resetPeerConnectionIdCounter(): void {
  peerConnectionIdCounter = 0;
}
