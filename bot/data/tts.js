import say from 'say';

let CAN_TTS = true;

const ttsCallback = () => CAN_TTS = true;

const handleTTS = (msg, speed) => {
  if (!CAN_TTS) return;
  CAN_TTS = false;

  return say.speak(msg, process.env.TTS_VOICE, speed, ttsCallback);
}

export default {
  BibleThump: () => handleTTS('awww', 0.2),
  LUL: () => handleTTS('ha ha ha a', 1),
  weSmart: () => handleTTS('big brain', 0.1),
  HeyGuys: () => handleTTS('henlo', 1),
  PogChamp: () => handleTTS('poggers', 1),
  PepegaAim: () => handleTTS('pew pew pew', 1),
};