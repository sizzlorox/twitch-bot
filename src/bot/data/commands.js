const {
  SNOWPACK_PUBLIC_CHANNEL_NAME,
  SNOWPACK_PUBLIC_DISCORD_CHANNEL,
} = import.meta.env;

export default {
  "!say": (ctx, parsedMsg, metadata) => ctx.tts.handleTTS(parsedMsg),
  // -------------------------------------------------------------------------------------------------------
  "!shoutout": (ctx, parsedMsg, metadata) => {
    const { channel, mod, isStreamer } = metadata;
    if (!mod && !isStreamer || !parsedMsg) return;

    const sanitizedUsername = parsedMsg.replace(/@/g, '').trim();
    ctx.tts.handleTTS('Hey everyone!');
    return ctx.say(
      channel,
      `Hey everyone! Check out ${sanitizedUsername}'s channel at https://twitch.tv/${sanitizedUsername.toLowerCase()}`,
    );
  },
  // -------------------------------------------------------------------------------------------------------
  "!discord": (ctx, parsedMsg, metadata) => {
    const { channel } = metadata;
    if (!SNOWPACK_PUBLIC_CHANNEL_NAME || !SNOWPACK_PUBLIC_DISCORD_CHANNEL) return;

    return ctx.say(
      channel,
      `Check out ${SNOWPACK_PUBLIC_CHANNEL_NAME}'s discord at https://discord.gg/${SNOWPACK_PUBLIC_DISCORD_CHANNEL}`,
    );
  },
  // -------------------------------------------------------------------------------------------------------
};
