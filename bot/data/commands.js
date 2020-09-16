// export default {
module.exports = {
  "!say": (ctx, parsedMsg, metadata) => {
    const { channel } = metadata;
    return ctx.say(channel, `You said ${parsedMsg}`);
  },
};
