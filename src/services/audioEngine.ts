export const EQ_PRESETS: Record<string, number[]> = {
  Flat: [0, 0, 0, 0, 0],
  'Bass Boost': [7, 5, 1, 0, 0],
  'Vocal Boost': [-2, 1, 5, 3, 1],
  'Treble Boost': [-1, 0, 1, 4, 6],
  Electronic: [6, 4, 0, 2, 5],
  Rock: [5, 3, -1, 3, 5],
  Acoustic: [3, 2, 2, 3, 4],
  'Deep Focus': [4, 2, -1, 1, 3],
};

export const EQ_FREQUENCIES = [60, 230, 910, 3600, 14000];
export const EQ_LABELS = ['60Hz', '230Hz', '910Hz', '3.6kHz', '14kHz'];

class AudioEngine {
  private ctx: AudioContext | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private filters: BiquadFilterNode[] = [];
  private analyser: AnalyserNode | null = null;
  private connectedElement: HTMLAudioElement | null = null;
  private isInitialized = false;

  public init(audioElement: HTMLAudioElement) {
    if (this.connectedElement === audioElement && this.isInitialized) {
      return;
    }

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      this.ctx = new AudioCtx();
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 128;
      this.analyser.smoothingTimeConstant = 0.8;

      // Create 5-band EQ
      this.filters = EQ_FREQUENCIES.map((freq, index) => {
        const filter = this.ctx!.createBiquadFilter();
        if (index === 0) {
          filter.type = 'lowshelf';
        } else if (index === EQ_FREQUENCIES.length - 1) {
          filter.type = 'highshelf';
        } else {
          filter.type = 'peaking';
          filter.Q.value = 1.0;
        }
        filter.frequency.value = freq;
        filter.gain.value = 0;
        return filter;
      });

      // Connect filters in series
      for (let i = 0; i < this.filters.length - 1; i++) {
        this.filters[i].connect(this.filters[i + 1]);
      }

      // Connect audio element source
      this.sourceNode = this.ctx.createMediaElementSource(audioElement);
      this.sourceNode.connect(this.filters[0]);
      this.filters[this.filters.length - 1].connect(this.analyser);
      this.analyser.connect(this.ctx.destination);

      this.connectedElement = audioElement;
      this.isInitialized = true;
    } catch (e) {
      console.warn('Web Audio initialization error (could already be connected):', e);
    }
  }

  public resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setEqGains(gains: number[]) {
    if (!this.filters || this.filters.length === 0) return;
    gains.forEach((gain, index) => {
      if (this.filters[index]) {
        this.filters[index].gain.setValueAtTime(gain, this.ctx?.currentTime || 0);
      }
    });
  }

  public getVisualizerData(): Uint8Array {
    if (!this.analyser) {
      return new Uint8Array(32);
    }
    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this.analyser.getByteFrequencyData(dataArray);
    return dataArray;
  }
}

export const audioEngine = new AudioEngine();
