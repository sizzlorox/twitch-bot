const say = require('say');

module.exports = {
  "!say": (ctx, parsedMsg, metadata) => {
    // const { channel } = metadata;
    return say.speak(parsedMsg, process.env.TTS_VOICE, 1)
    // return ctx.say(channel, `You said ${parsedMsg}`);
  },
};
