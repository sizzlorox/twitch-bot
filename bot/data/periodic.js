module.exports = {
  "discord": (ctx) => {
    if (!process.env.CHANNEL_NAME || !process.env.DISCORD_CHANNEL) return;

    return ctx.say(
      process.env.CHANNEL_NAME,
      `/me Check out ${process.env.CHANNEL_NAME}'s discord at https://discord.gg/${process.env.DISCORD_CHANNEL}`,
    );
  },
  // -------------------------------------------------------------------------------------------------------
  "ad": (ctx) => {
    if (!process.env.CHANNEL_NAME) return;

    return ctx.say(
      process.env.CHANNEL_NAME,
      '/me Welcome! I hope you\'re enjoying the stream! Dont forget to follow if you are!'
    )
  },
  // -------------------------------------------------------------------------------------------------------
  "hydrate": (ctx) => {
    if (!process.env.CHANNEL_NAME) return;

    return ctx.say(
      process.env.CHANNEL_NAME,
      '/me Don\'t forget to hydrate!'
    )
  },
  // -------------------------------------------------------------------------------------------------------
};
