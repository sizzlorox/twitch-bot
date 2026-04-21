module.exports = {
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
