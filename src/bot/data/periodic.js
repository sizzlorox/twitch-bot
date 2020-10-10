
const {
  SNOWPACK_PUBLIC_CHANNEL_NAME,
  SNOWPACK_PUBLIC_DISCORD_CHANNEL,
} = import.meta.env;

export default {
  "discord": (ctx) => {
    if (!SNOWPACK_PUBLIC_CHANNEL_NAME || !SNOWPACK_PUBLIC_DISCORD_CHANNEL) return;

    return ctx.say(
      SNOWPACK_PUBLIC_CHANNEL_NAME,
      `/me Check out ${SNOWPACK_PUBLIC_CHANNEL_NAME}'s discord at https://discord.gg/${SNOWPACK_PUBLIC_DISCORD_CHANNEL}`,
    );
  },
  // -------------------------------------------------------------------------------------------------------
  "ad": (ctx) => {
    if (!SNOWPACK_PUBLIC_CHANNEL_NAME) return;

    return ctx.say(
      SNOWPACK_PUBLIC_CHANNEL_NAME,
      '/me Welcome! I hope you\'re enjoying the stream! Dont forget to follow if you are!'
    )
  },
  // -------------------------------------------------------------------------------------------------------
  "hydrate": (ctx) => {
    if (!SNOWPACK_PUBLIC_CHANNEL_NAME) return;

    return ctx.say(
      SNOWPACK_PUBLIC_CHANNEL_NAME,
      '/me Don\'t forget to hydrate!'
    )
  },
  // -------------------------------------------------------------------------------------------------------
};
