const say = require('say');

const VOICE = 'Cellos';

module.exports = {
  BibleThump: () => say.speak('awww', VOICE, 0.2),
  LUL: () => say.speak('ha ha ha ha', VOICE, 1),
  weSmart: () => say.speak('big brain', VOICE, 0.1),
  HeyGuys: () => say.speak('henlo', VOICE, 1),
  PogChamp: () => say.speak('poggers', VOICE, 1),
};