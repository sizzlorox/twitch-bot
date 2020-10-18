module.exports = {
  "!say": (ctx, parsedMsg, metadata) => ctx.sse.send(parsedMsg, 'tts'),
  // -------------------------------------------------------------------------------------------------------
  "!shoutout": (ctx, parsedMsg, metadata) => {
    const { channel, mod, isStreamer } = metadata;
    if (!mod && !isStreamer || !parsedMsg) return;

    const sanitizedUsername = parsedMsg.replace(/@/g, '').trim();
    ctx.sse.send('Hey Everyone!', 'tts');
    return ctx.say(
      channel,
      `Hey everyone! Check out ${sanitizedUsername}'s channel at https://twitch.tv/${sanitizedUsername.toLowerCase()}`,
    );
  },
  // -------------------------------------------------------------------------------------------------------
  // -------------------------------------------------------------------------------------------------------
};
