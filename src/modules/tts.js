class TextToSpeech {
  constructor() {
    this.synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
    this.queue = [];
    this.speaking = false;

    if (!this.synth) {
      console.error('[TTS] Browser does not support SpeechSynthesis. TTS disabled.');
      this.synth = null;
    }
  }

  _clean(text) {
    return text
      .replace(/https?:\/\/\S+/gi, '')  // strip URLs
      .replace(/\s{2,}/g, ' ')          // collapse whitespace
      .trim()
      .slice(0, 200);                    // cap length
  }

  speak(text, speed = 1) {
    if (!this.synth) return;
    const cleaned = this._clean(String(text));
    if (!cleaned) return;

    this.queue.push({ text: cleaned, speed });
    if (!this.speaking) this._next();
  }

  _next() {
    if (!this.queue.length) {
      this.speaking = false;
      return;
    }
    this.speaking = true;
    const { text, speed } = this.queue.shift();
    const utt = new SpeechSynthesisUtterance(text);
    utt.rate = Math.max(0.1, Math.min(speed, 10));
    utt.onend = () => this._next();
    utt.onerror = () => this._next();
    this.synth.speak(utt);
  }

  skip() {
    this.queue = [];
    this.synth?.cancel();
    this.speaking = false;
  }
}

export default TextToSpeech;
