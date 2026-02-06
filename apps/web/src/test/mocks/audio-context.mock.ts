/**
 * Audio Context Mock
 *
 * Mock Web Audio API for testing audio processing functionality.
 */

import { vi } from 'vitest';

// =============================================================================
// Mock Audio Nodes
// =============================================================================

export class MockAudioNode {
  readonly context: MockAudioContext;
  readonly numberOfInputs: number;
  readonly numberOfOutputs: number;
  readonly channelCount: number = 2;
  channelCountMode: ChannelCountMode = 'max';
  channelInterpretation: ChannelInterpretation = 'speakers';

  protected _connectedTo: (AudioNode | AudioParam)[] = [];

  constructor(context: MockAudioContext, inputs = 1, outputs = 1) {
    this.context = context;
    this.numberOfInputs = inputs;
    this.numberOfOutputs = outputs;
  }

  connect(
    destination: AudioNode | AudioParam,
    _outputIndex?: number,
    _inputIndex?: number
  ): AudioNode {
    this._connectedTo.push(destination);
    return destination instanceof MockAudioNode
      ? destination
      : (this as unknown as AudioNode);
  }

  disconnect(output?: number | AudioNode | AudioParam): void {
    if (output === undefined) {
      this._connectedTo = [];
    } else if (typeof output === 'number') {
      // Disconnect by index - just clear all for simplicity
      this._connectedTo = [];
    } else {
      const index = this._connectedTo.indexOf(output);
      if (index !== -1) {
        this._connectedTo.splice(index, 1);
      }
    }
  }

  addEventListener(_type: string, _listener: EventListener): void {}
  removeEventListener(_type: string, _listener: EventListener): void {}
  dispatchEvent(_event: Event): boolean {
    return true;
  }

  // Test helper
  getConnections(): (AudioNode | AudioParam)[] {
    return [...this._connectedTo];
  }
}

// =============================================================================
// Specific Audio Nodes
// =============================================================================

export class MockGainNode extends MockAudioNode implements GainNode {
  readonly gain: AudioParam;

  constructor(context: MockAudioContext) {
    super(context, 1, 1);
    this.gain = createMockAudioParam(context, 1);
  }
}

export class MockMediaStreamAudioSourceNode
  extends MockAudioNode
  implements MediaStreamAudioSourceNode
{
  readonly mediaStream: MediaStream;

  constructor(context: MockAudioContext, options: MediaStreamAudioSourceOptions) {
    super(context, 0, 1);
    this.mediaStream = options.mediaStream;
  }
}

export class MockMediaStreamAudioDestinationNode
  extends MockAudioNode
  implements MediaStreamAudioDestinationNode
{
  readonly stream: MediaStream;

  constructor(context: MockAudioContext) {
    super(context, 1, 0);
    // Create a mock stream
    this.stream = {
      id: `dest-stream-${Date.now()}`,
      active: true,
      getTracks: () => [],
      getAudioTracks: () => [],
      getVideoTracks: () => [],
      getTrackById: () => null,
      addTrack: vi.fn(),
      removeTrack: vi.fn(),
      clone: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn().mockReturnValue(true),
      onaddtrack: null,
      onremovetrack: null,
    } as unknown as MediaStream;
  }
}

export class MockAnalyserNode extends MockAudioNode implements AnalyserNode {
  fftSize: number = 2048;
  readonly frequencyBinCount: number = 1024;
  minDecibels: number = -100;
  maxDecibels: number = -30;
  smoothingTimeConstant: number = 0.8;

  constructor(context: MockAudioContext) {
    super(context, 1, 1);
  }

  getFloatFrequencyData(array: Float32Array): void {
    array.fill(-50); // Fill with some default value
  }

  getByteFrequencyData(array: Uint8Array): void {
    array.fill(128);
  }

  getFloatTimeDomainData(array: Float32Array): void {
    array.fill(0);
  }

  getByteTimeDomainData(array: Uint8Array): void {
    array.fill(128);
  }
}

export class MockAudioWorkletNode extends MockAudioNode implements AudioWorkletNode {
  readonly parameters: AudioParamMap;
  readonly port: MessagePort;
  onprocessorerror: ((this: AudioWorkletNode, ev: Event) => void) | null = null;

  private _portListeners: Map<string, Set<(event: MessageEvent) => void>> = new Map();

  constructor(context: MockAudioContext, _name: string, _options?: AudioWorkletNodeOptions) {
    super(context, 1, 1);
    this.parameters = new Map() as AudioParamMap;

    // Create a mock MessagePort
    this.port = {
      postMessage: vi.fn(),
      onmessage: null,
      onmessageerror: null,
      start: vi.fn(),
      close: vi.fn(),
      addEventListener: (type: string, listener: (event: MessageEvent) => void) => {
        if (!this._portListeners.has(type)) {
          this._portListeners.set(type, new Set());
        }
        this._portListeners.get(type)!.add(listener);
      },
      removeEventListener: (type: string, listener: (event: MessageEvent) => void) => {
        this._portListeners.get(type)?.delete(listener);
      },
      dispatchEvent: vi.fn().mockReturnValue(true),
    } as unknown as MessagePort;
  }

  // Test helper: simulate message from worklet
  simulateMessage(data: unknown): void {
    const event = new MessageEvent('message', { data });
    (this.port.onmessage as ((event: MessageEvent) => void) | null)?.(event);
    this._portListeners.get('message')?.forEach((listener) => listener(event));
  }
}

// =============================================================================
// Mock AudioParam
// =============================================================================

function createMockAudioParam(
  _context: MockAudioContext,
  defaultValue: number = 0
): AudioParam {
  let currentValue = defaultValue;

  return {
    get value() {
      return currentValue;
    },
    set value(v: number) {
      currentValue = v;
    },
    defaultValue,
    minValue: -3.4028235e38,
    maxValue: 3.4028235e38,
    automationRate: 'a-rate',
    setValueAtTime: vi.fn().mockReturnThis(),
    linearRampToValueAtTime: vi.fn().mockReturnThis(),
    exponentialRampToValueAtTime: vi.fn().mockReturnThis(),
    setTargetAtTime: vi.fn().mockReturnThis(),
    setValueCurveAtTime: vi.fn().mockReturnThis(),
    cancelScheduledValues: vi.fn().mockReturnThis(),
    cancelAndHoldAtTime: vi.fn().mockReturnThis(),
  } as unknown as AudioParam;
}

// =============================================================================
// Mock AudioContext
// =============================================================================

export class MockAudioContext implements BaseAudioContext {
  readonly destination: AudioDestinationNode;
  readonly sampleRate: number;
  readonly currentTime: number = 0;
  readonly baseLatency: number = 0;
  readonly outputLatency: number = 0;
  readonly listener: AudioListener;
  state: AudioContextState = 'running';
  readonly audioWorklet: AudioWorklet;

  onstatechange: ((this: BaseAudioContext, ev: Event) => void) | null = null;

  private _nodes: MockAudioNode[] = [];

  constructor(options?: AudioContextOptions) {
    this.sampleRate = options?.sampleRate ?? 44100;

    // Mock destination
    this.destination = {
      context: this,
      numberOfInputs: 1,
      numberOfOutputs: 0,
      channelCount: 2,
      channelCountMode: 'explicit',
      channelInterpretation: 'speakers',
      maxChannelCount: 2,
      connect: vi.fn(),
      disconnect: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn().mockReturnValue(true),
    } as unknown as AudioDestinationNode;

    // Mock listener
    this.listener = {
      positionX: createMockAudioParam(this),
      positionY: createMockAudioParam(this),
      positionZ: createMockAudioParam(this),
      forwardX: createMockAudioParam(this),
      forwardY: createMockAudioParam(this),
      forwardZ: createMockAudioParam(this, -1),
      upX: createMockAudioParam(this),
      upY: createMockAudioParam(this, 1),
      upZ: createMockAudioParam(this),
      setPosition: vi.fn(),
      setOrientation: vi.fn(),
    } as unknown as AudioListener;

    // Mock AudioWorklet
    this.audioWorklet = {
      addModule: vi.fn().mockResolvedValue(undefined),
    } as unknown as AudioWorklet;
  }

  // Factory methods
  createGain(): GainNode {
    const node = new MockGainNode(this);
    this._nodes.push(node);
    return node as unknown as GainNode;
  }

  createMediaStreamSource(
    mediaStream: MediaStream
  ): MediaStreamAudioSourceNode {
    const node = new MockMediaStreamAudioSourceNode(this, { mediaStream });
    this._nodes.push(node);
    return node as unknown as MediaStreamAudioSourceNode;
  }

  createMediaStreamDestination(): MediaStreamAudioDestinationNode {
    const node = new MockMediaStreamAudioDestinationNode(this);
    this._nodes.push(node);
    return node as unknown as MediaStreamAudioDestinationNode;
  }

  createAnalyser(): AnalyserNode {
    const node = new MockAnalyserNode(this);
    this._nodes.push(node);
    return node as unknown as AnalyserNode;
  }

  createBiquadFilter(): BiquadFilterNode {
    return {} as BiquadFilterNode;
  }

  createBuffer(
    numberOfChannels: number,
    length: number,
    sampleRate: number
  ): AudioBuffer {
    return {
      length,
      duration: length / sampleRate,
      sampleRate,
      numberOfChannels,
      getChannelData: () => new Float32Array(length),
      copyFromChannel: vi.fn(),
      copyToChannel: vi.fn(),
    } as unknown as AudioBuffer;
  }

  createBufferSource(): AudioBufferSourceNode {
    return {
      buffer: null,
      playbackRate: createMockAudioParam(this, 1),
      detune: createMockAudioParam(this),
      loop: false,
      loopStart: 0,
      loopEnd: 0,
      onended: null,
      start: vi.fn(),
      stop: vi.fn(),
      connect: vi.fn(),
      disconnect: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn().mockReturnValue(true),
      context: this,
      numberOfInputs: 0,
      numberOfOutputs: 1,
      channelCount: 2,
      channelCountMode: 'max',
      channelInterpretation: 'speakers',
    } as unknown as AudioBufferSourceNode;
  }

  createChannelMerger(_numberOfInputs?: number): ChannelMergerNode {
    return {} as ChannelMergerNode;
  }

  createChannelSplitter(_numberOfOutputs?: number): ChannelSplitterNode {
    return {} as ChannelSplitterNode;
  }

  createConstantSource(): ConstantSourceNode {
    return {} as ConstantSourceNode;
  }

  createConvolver(): ConvolverNode {
    return {} as ConvolverNode;
  }

  createDelay(_maxDelayTime?: number): DelayNode {
    return {} as DelayNode;
  }

  createDynamicsCompressor(): DynamicsCompressorNode {
    return {} as DynamicsCompressorNode;
  }

  createIIRFilter(
    _feedforward: number[],
    _feedback: number[]
  ): IIRFilterNode {
    return {} as IIRFilterNode;
  }

  createOscillator(): OscillatorNode {
    return {} as OscillatorNode;
  }

  createPanner(): PannerNode {
    return {} as PannerNode;
  }

  createPeriodicWave(
    _real: number[] | Float32Array,
    _imag: number[] | Float32Array,
    _constraints?: PeriodicWaveConstraints
  ): PeriodicWave {
    return {} as PeriodicWave;
  }

  createScriptProcessor(
    _bufferSize?: number,
    _numberOfInputChannels?: number,
    _numberOfOutputChannels?: number
  ): ScriptProcessorNode {
    return {} as ScriptProcessorNode;
  }

  createStereoPanner(): StereoPannerNode {
    return {} as StereoPannerNode;
  }

  createWaveShaper(): WaveShaperNode {
    return {} as WaveShaperNode;
  }

  decodeAudioData(
    _audioData: ArrayBuffer,
    _successCallback?: DecodeSuccessCallback,
    _errorCallback?: DecodeErrorCallback
  ): Promise<AudioBuffer> {
    return Promise.resolve(this.createBuffer(2, 44100, 44100));
  }

  // Lifecycle methods
  async resume(): Promise<void> {
    this.state = 'running';
    return Promise.resolve();
  }

  async suspend(): Promise<void> {
    this.state = 'suspended';
    return Promise.resolve();
  }

  async close(): Promise<void> {
    this.state = 'closed';
    return Promise.resolve();
  }

  addEventListener(_type: string, _listener: EventListener): void {}
  removeEventListener(_type: string, _listener: EventListener): void {}
  dispatchEvent(_event: Event): boolean {
    return true;
  }

  // Test helpers
  getCreatedNodes(): MockAudioNode[] {
    return [...this._nodes];
  }
}

// =============================================================================
// AudioWorkletNode Factory
// =============================================================================

export function createMockAudioWorkletNode(
  context: MockAudioContext,
  name: string,
  options?: AudioWorkletNodeOptions
): MockAudioWorkletNode {
  return new MockAudioWorkletNode(context, name, options);
}

// =============================================================================
// Installation Helper
// =============================================================================

let originalAudioContext: typeof AudioContext | undefined;
let originalAudioWorkletNode: typeof AudioWorkletNode | undefined;

export function installMockAudioContext(): void {
  originalAudioContext = globalThis.AudioContext;
  originalAudioWorkletNode = globalThis.AudioWorkletNode;

  // @ts-expect-error - Mock has test helper methods not on real type
  globalThis.AudioContext = MockAudioContext;
  // @ts-expect-error - Mock has test helper methods not on real type
  globalThis.AudioWorkletNode = MockAudioWorkletNode;
}

export function uninstallMockAudioContext(): void {
  if (originalAudioContext) {
    (globalThis as unknown as { AudioContext: typeof AudioContext }).AudioContext =
      originalAudioContext;
    originalAudioContext = undefined;
  }
  if (originalAudioWorkletNode) {
    (globalThis as unknown as { AudioWorkletNode: typeof AudioWorkletNode }).AudioWorkletNode =
      originalAudioWorkletNode;
    originalAudioWorkletNode = undefined;
  }
}
