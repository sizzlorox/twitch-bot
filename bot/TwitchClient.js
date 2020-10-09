const tmi = require('tmi.js');
const commands = require('./data/commands');
const tts = require('./data/tts');
const periodic = require('./data/periodic');

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
    this.ttsTriggers = Object.keys(tts);
    if (process.env.PERIODIC_DELAY) {
      this.periodicInterval = setInterval(() => this.onPeriodicHandler(), 60000 * Number(process.env.PERIODIC_DELAY));
    }
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
    const msgPayload = {
      channel,
      context,
      msg: sanitizedMsg,
    };
    if (!sanitizedMsg.startsWith("!")) {
      this.onTTSHandler(msgPayload);
      return;
    }
    return this.onCommandHandler(msgPayload);
  };

  onTTSHandler = ({ channel, context, msg }) => {
    const ttsIndex = this.ttsTriggers.findIndex(key => msg.includes(key));
    if (ttsIndex === -1) return;
    tts[this.ttsTriggers[ttsIndex]]();
  };

  onPeriodicHandler = () => {
    const msgs = Object.keys(periodic);
    const rand = Math.floor(Math.random() * msgs.length);
    return periodic[msgs[rand]](this.client);
  };

  onCommandHandler = ({ channel, context, msg }) => {
    const split = msg.split(/ (.*)/g);
    const cmd = commands[split[0]];
    const isStreamer = Object.keys(context.badges).includes('broadcaster');
    return cmd && cmd(this.client, split[1] && split[1].trim(), { channel, mod: context.mod, isStreamer });
  };
}
export default TwitchClient;
