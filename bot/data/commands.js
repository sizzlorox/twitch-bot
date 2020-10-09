const say = require('say');

let CAN_TTS = true;

module.exports = {
  "!say": (ctx, parsedMsg, metadata) => {
    if (!CAN_TTS) return;

    CAN_TTS = false;
    return say.speak(parsedMsg, process.env.TTS_VOICE, 1, () => CAN_TTS = true);
  },
  // -------------------------------------------------------------------------------------------------------
  "!shoutout": (ctx, parsedMsg, metadata) => {
    const { channel, mod, isStreamer } = metadata;
    if (!mod && !isStreamer || !parsedMsg) return;

    const sanitizedUsername = parsedMsg.replace(/@/g, '').trim();
    say.speak('Hey everyone!', process.env.TTS_VOICE, 1);
    return ctx.say(
      channel,
      `Hey everyone! Check out ${sanitizedUsername}'s channel at https://twitch.tv/${sanitizedUsername.toLowerCase()}`,
    );
  },
  // -------------------------------------------------------------------------------------------------------
  "!discord": (ctx, parsedMsg, metadata) => {
    const { channel } = metadata;
    if (!process.env.DISCORD_CHANNEL) return;

    return ctx.say(
      channel,
      `Check out our discord at https://discord.gg/${process.env.DISCORD_CHANNEL}`,
    )
  },
  // -------------------------------------------------------------------------------------------------------
};
