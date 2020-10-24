const tmi = require('tmi.js');
const commands = require('./data/commands');
const periodic = require('./data/periodic');
const sanitizeHtml = require('sanitize-html');
const request = require('request');


class TwitchClient {
  constructor(opts) {
    this.badgesUrl = 'https://badges.twitch.tv/v1/badges/global/display?language=en';
    request(this.badgesUrl, (err, response, body) => {
      if (err || response.statusCode !== 200) {
        return;
      }
      this.badges = JSON.parse(body);
    });

    this.client = new tmi.client(opts);
    this.client.on("message", this.onMessageHandler);
    this.client.on("connected", this.onConnectedHandler);
    this.client.on("subscription", this.onSubHandler);
    this.client.on("submysterygift", this.onRandomGiftSubHandler);
    this.client.on("subgift", this.onGiftSubHandler);
    this.client.on("resub", this.onResubHandler);
    this.client.on("raided", this.onRaidHandler);
    this.client.on("cheer", this.onCheerHandler);
    this.ttsTriggers = {
      'BibleThump': {
        msg: 'awww',
        speed: 0.2,
      },
      'LUL': {
        msg: 'ha ha ha a',
        speed: 1,
      },
      'weSmart': {
        msg: 'big brain',
        speed: 0.1,
      },
      'HeyGuys': {
        msg: 'henlo',
        speed: 1,
      },
      'PogChamp': {
        msg: 'poggers',
        speed: 1,
      },
      'PepegaAim': {
        msg: 'pew pew pew',
        speed: 1,
      },
    };
    this.recentMessages = [];
    this.client.sse = opts.sse;

    if (process.env.PERIODIC_DELAY) {
      this.periodicInterval = setInterval(() => this.onPeriodicHandler(), 60000 * Number(process.env.PERIODIC_DELAY));
    }
  }

  connect = () => {
    console.debug("Twitch Bot Connecting");
    this.client.connect();
  };

  // Handlers
  onConnectedHandler = (addr, port) => {
    console.debug(`* Connected to ${addr}:${port}`);
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

    const sanitizedMsg = sanitizeHtml(msg.trim());
    const msgPayload = {
      channel,
      context,
      msg: sanitizedMsg,
    };
    if (!sanitizedMsg.startsWith("!")) {
      this.client.sse.send(
        {
          id: context.id,
          msg,
          author: context.username,
          authorColor: context.color,
          emotes: context.emotes,
          badges: Object.entries(context.badges)
            .map(([badge, version]) => this.badges['badge_sets'][badge].versions[version]['image_url_1x']),
        },
        'msg'
      );
      this.onTTSHandler(msgPayload);

      return;
    }

    return this.onCommandHandler(msgPayload);
  };

  onTTSHandler = ({ msg, context }) => {
    if (context.username === 'buttsbot') {
      return this.client.sse.send(msg, 'tts');
    }
    const ttsIndex = Object.keys(this.ttsTriggers)
      .findIndex(key => msg.includes(key));
    if (ttsIndex === -1) return;

    return this.client.sse.send(Object.values(this.ttsTriggers)[ttsIndex], 'tts');
  };

  onPeriodicHandler = () => {
    const msgs = Object.keys(periodic);
    const rand = Math.floor(Math.random() * msgs.length);

    return periodic[msgs[rand]](this.client);
  };

  onCommandHandler = ({ channel, context, msg }) => {
    const split = msg.split(/ (.*)/g);
    const cmd = commands[split[0]];
    const isMod = context && context.mod;
    const isStreamer = context && context.badges && Object.keys(context.badges).includes('broadcaster');

    return cmd && cmd(this.client, split[1] && split[1].trim(), { channel, mod: isMod, isStreamer });
  };
}
module.exports = TwitchClient;
