const say = require('say');

module.exports = {
  "!say": (ctx, parsedMsg, metadata) => say.speak(parsedMsg, process.env.TTS_VOICE, 1),
  // -------------------------------------------------------------------------------------------------------
  "!shoutout": (ctx, parsedMsg, metadata) => {
    const { channel, mod } = metadata;
    if (!mod) return;

    const sanitizedUsername = parsedMsg.replace(/@/g, '').trim();
    say.speak('Hey everyone!', process.env.TTS_VOICE, 1);
    return ctx.say(
      channel,
      `Hey everyone! Check out ${sanitizedUsername}'s channel at https://twitch.tv/${sanitizedUsername.toLowerCase()}`,
    );
  },
  // -------------------------------------------------------------------------------------------------------
};
