const say = require('say');

module.exports = {
  BibleThump: () => say.speak('awww', process.env.TTS_VOICE, 0.2),
  LUL: () => say.speak('ha ha ha ha', process.env.TTS_VOICE, 1),
  weSmart: () => say.speak('big brain', process.env.TTS_VOICE, 0.1),
  HeyGuys: () => say.speak('henlo', process.env.TTS_VOICE, 1),
  PogChamp: () => say.speak('poggers', process.env.TTS_VOICE, 1),
};