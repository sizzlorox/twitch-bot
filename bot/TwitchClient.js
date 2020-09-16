import tmi from "tmi.js";
import commands from "./data/commands";

class TwitchClient {
  constructor(opts) {
    this.client = new tmi.client(opts);
    this.client.on("message", this.onMessageHandler);
    this.client.on("connected", this.onConnectedHandler);
    this.client.on("subscription", this.onSubHandler);
    this.client.on("submysterygift", this.onRandomGiftSubHandler);
    this.client.on("subgift", this.onGiftSubHandler);
    this.client.on("resub", this.onResubHandler);
    this.client.on("raided", this.onRaidHandler);
    this.client.on("cheer", this.onCheerHandler);
  }

  connect = () => {
    console.log("Twitch Bot Connecting");
    this.client.connect();
  };

  // Handlers
  onConnectedHandler = (addr, port) => {
    console.log(`* Connected to ${addr}:${port}`);
  };

  onCheerHandler = (channel, context, msg) => {};

  onRaidHandler = (channel, username, viewers) => {};

  onResubHandler = (channel, username, months, message, context, methods) => {};

  onGiftSubHandler = (
    channel,
    username,
    streakMonths,
    recipient,
    methods,
    context
  ) => {};

  onRandomGiftSubHandler = (
    channel,
    username,
    numbOfSubs,
    methods,
    context
  ) => {};

  onSubHandler = (channel, username, method, message, context) => {};

  onMessageHandler = (channel, context, msg, self) => {
    if (self) return;

    // TODO: Sanitize
    const sanitizedMsg = msg.trim();
    if (!sanitizedMsg.startsWith("!")) {
      return;
    }
    return this.onCommandHandler({
      channel,
      context,
      msg: sanitizedMsg,
    });
  };

  onCommandHandler = ({ channel, context, msg }) => {
    const split = msg.split(/ (.*)/g);
    const cmd = split[0];
    return commands[cmd](this.client, split[1].trim(), { channel });
  };
}
module.exports = TwitchClient;
