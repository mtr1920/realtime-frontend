/**
 * Audio Processor Worklet
 *
 * Runs in a separate thread for low-latency audio processing.
 * Converts Float32 audio input to Int16 PCM for AI consumption.
 *
 * Features:
 * - Buffer accumulation (4096 samples = ~256ms at 16kHz)
 * - Float32 to Int16 conversion with proper clamping
 * - Mute control via message port
 * - Audio level calculation for VU meter
 */

// Buffer size: 4096 samples at 16kHz = ~256ms
// This balances latency vs network efficiency
const TARGET_BUFFER_SIZE = 4096;

// Level calculation smoothing factor
const LEVEL_SMOOTHING = 0.95;

class AudioCaptureProcessor extends AudioWorkletProcessor {
  constructor() {
    super();

    // Accumulated samples buffer
    this._buffer = new Float32Array(TARGET_BUFFER_SIZE);
    this._bufferIndex = 0;

    // Mute state
    this._isMuted = false;

    // Smoothed audio level for VU meter
    this._smoothedLevel = 0;

    // Last level report timestamp
    this._lastLevelReport = 0;

    // Handle messages from main thread
    this.port.onmessage = (event) => {
      const { type, muted, size } = event.data;

      switch (type) {
        case 'mute':
          this._isMuted = muted;
          break;
        case 'set-buffer-size':
          // Allow buffer size adjustment if needed
          if (size > 0 && size <= 16384) {
            this._buffer = new Float32Array(size);
            this._bufferIndex = 0;
          }
          break;
      }
    };
  }

  /**
   * Convert Float32 samples to Int16 PCM.
   * Float32 range: -1.0 to 1.0
   * Int16 range: -32768 to 32767
   */
  float32ToInt16(float32Array) {
    const int16Array = new Int16Array(float32Array.length);

    for (let i = 0; i < float32Array.length; i++) {
      // Clamp to valid range
      const sample = Math.max(-1, Math.min(1, float32Array[i]));
      // Scale to Int16 range
      int16Array[i] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
    }

    return int16Array;
  }

  /**
   * Calculate RMS (root mean square) level of audio samples.
   * Returns a value between 0 and 1.
   */
  calculateLevel(samples) {
    let sumSquares = 0;

    for (let i = 0; i < samples.length; i++) {
      sumSquares += samples[i] * samples[i];
    }

    const rms = Math.sqrt(sumSquares / samples.length);

    // Apply smoothing for stable VU meter display
    this._smoothedLevel =
      LEVEL_SMOOTHING * this._smoothedLevel + (1 - LEVEL_SMOOTHING) * rms;

    return this._smoothedLevel;
  }

  /**
   * Process audio input frames.
   * Called by the audio rendering thread.
   *
   * @param {Float32Array[][]} inputs - Input audio buffers [input][channel][sample]
   * @returns {boolean} - Return true to keep processor alive
   */
  process(inputs) {
    const input = inputs[0];

    // No input connected
    if (!input || !input.length || !input[0]) {
      return true;
    }

    // Get mono channel (first channel)
    const channelData = input[0];

    // Calculate level for VU meter (even when muted, for visual feedback)
    const level = this.calculateLevel(channelData);

    // Report level approximately every 50ms
    const now = currentTime * 1000;
    if (now - this._lastLevelReport > 50) {
      this.port.postMessage({
        type: 'level',
        level: level,
      });
      this._lastLevelReport = now;
    }

    // Don't accumulate samples when muted
    if (this._isMuted) {
      return true;
    }

    // Accumulate samples into buffer
    for (let i = 0; i < channelData.length; i++) {
      this._buffer[this._bufferIndex++] = channelData[i];

      // Buffer is full, send it
      if (this._bufferIndex >= this._buffer.length) {
        // Convert to Int16 PCM
        const int16Data = this.float32ToInt16(this._buffer);

        // Send as transferable ArrayBuffer for zero-copy
        this.port.postMessage(
          {
            type: 'audio',
            buffer: int16Data.buffer,
            timestamp: currentTime * 1000,
          },
          [int16Data.buffer]
        );

        // Reset buffer
        this._bufferIndex = 0;
      }
    }

    return true;
  }
}

registerProcessor('audio-capture-processor', AudioCaptureProcessor);
