import Speech from 'speak-tts';

class TextToSpeech {
  constructor() {
    this.speech = new Speech();
    if (!this.speech.hasBrowserSupport()) {
      console.error('This browser does not support text to speech! This feature is disabled!');
      this.speech = undefined;
      this.voices = undefined;
      return;
    }
    this.speech.init()
      .then(voices => {
        this.voices = voices;
      })
      .catch(e => console.error('An error occured while initializing : ', e));
  }

  handleTTS = (msg, speed = 1) => {
    if (!this.speech) return;

    this.speech.setRate(speed);

    return this.speech.speak({
      text: msg,
      queue: false,
      listeners: {
        onstart: () => console.debug('Start utterance'),
        onend: () => console.debug('End utterance'),
        onresume: () => console.debug('Resume utterance'),
        onboundary: (event) => console.debug(event.name + ' boundary reached after ' + event.elapsedTime + ' milliseconds.')
      }
    }).then(() => console.debug('Success !'))
      .catch(e => console.error('An error occurred :', e));
  }

}
export default TextToSpeech;
