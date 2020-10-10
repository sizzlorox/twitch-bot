import Speech from 'speak-tts';

class TextToSpeech {
  constructor() {
    this.speech = undefined;
    this.voices = undefined;
    this.autoTTSTriggers = {
      'BibleThump': {
        msg: 'awww',
        speed: 0.2,
      },
      'LUL': {
        msg: 'ha ha ha a',
        speed: 1,
      },
      'weSmart': {
        msg: 'big brain',
        speed: 0.1,
      },
      'HeyGuys': {
        msg: 'henlo',
        speed: 1,
      },
      'PogChamp': {
        msg: 'poggers',
        speed: 1,
      },
      'PepegaAim': {
        msg: 'pew pew pew',
        speed: 1,
      },
    };
  }

  initialize = () => {
    if (this.speech) return this.speech;

    this.speech = new Speech() // will throw an exception if not browser supported
    if (!this.speech.hasBrowserSupport()) { // returns a boolean
      console.error('This browser does not support text to speech! This feature is disabled!');
      this.speech = undefined;
      this.voices = undefined;
    }
    this.speech.init()
      .then(voices => {
        console.log('Speech is ready, voices are available', voices)
        this.voices = voices;
      }).catch(e => {
        console.error('An error occured while initializing : ', e)
      });
  }

  handleTTS = (msg, speed = 1) => {
    if (!this.speech) return;

    this.speech.setRate(speed);
    const ttsIndex = Object.keys(this.autoTTSTriggers)
      .findIndex(ts => msg.includes(ts));
    if (ttsIndex !== -1) {
      const autoTTS = this.autoTTSTriggers[index];
      msg = autoTTS.msg;
      this.speech.setRate(autoTTS.speed);
    }

    return this.speech.speak({
      text: msg,
      queue: false,
      listeners: {
        onstart: () => {
          console.log('Start utterance')
        },
        onend: () => {
          console.log('End utterance')
        },
        onresume: () => {
          console.log('Resume utterance')
        },
        onboundary: (event) => {
          console.log(event.name + ' boundary reached after ' + event.elapsedTime + ' milliseconds.')
        }
      }
    }).then(() => {
      console.log('Success !')
    }).catch(e => {
      console.error('An error occurred :', e)
    });
  }

}
export default new TextToSpeech();
