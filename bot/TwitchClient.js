const tmi = require('tmi.js');
const commands = require('./data/commands');
const periodic = require('./data/periodic');
const sanitizeHtml = require('sanitize-html');
const db = require('./data/db');
const { RPGEngine } = require('./data/rpg');


function countWordSyl(word) {
  word = word.toLowerCase();
  if(word.length <= 3) { return 1; }
    word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
    word = word.replace(/^y/, '');
    const matches = word.match(/[aeiouy]{1,2}/g);
    return matches ? matches.length : 0;
}

function genHaiku(sentence) {
  let totalSylCount = 0;
  const list5 = [];
  const list7 = [];
  const list5_2 = [];
  sentence.split(' ').forEach(word => {
    const sylCount = countWordSyl(word);
    totalSylCount += sylCount;
    if (totalSylCount <= 5) {
      list5.push(word);
    }
    if (totalSylCount > 5 && totalSylCount <= 12) {
      list7.push(word);
    }
    if (totalSylCount > 12 && totalSylCount <= 17) {
      list5_2.push(word);
    }
  });

  console.log(`Syllable Count: ${totalSylCount} - Is Haiku: ${totalSylCount === 17}`);
  if (totalSylCount === 17) {
    const haiku = list5.join(' ').trim() + '... ' + list7.join(' ').trim() + '... ' + list5_2.join(' ').trim() + '.';
    console.log('haiku:', haiku);
    return haiku;
  }
}

class TwitchClient {
  constructor(opts) {
    this.badges = { badge_sets: {} };
    // this.twitchApi = {};
    // request.post(`https://id.twitch.tv/oauth2/token?client_id=${opts.twitchApi.clientId}&client_secret=${opts.twitchApi.clientSecret}&grant_type=client_credentials&scope=viewing_activity_read`,
    //   (err, res, body) => {
    //     if (err || res.statusCode !== 200) {
    //       return;
    //     }
    //     // access_token, expires_in, scope, token_type
    //     this.twitchApi.auth = JSON.parse(body);
    //   });

    // request.post('https://api.twitch.tv/helix/webhooks/hub', {
    //   callback: '',
    //   mode: 'subscribe',
    //   topic: 'https://api.twitch.tv/helix/users/follows',
    //   lease_seconds: '864000',
    //   secret: 'some secret here',
    // })

    this.client = new tmi.client(opts);
    this.client.on("message", this.onMessageHandler);
    this.client.on("connected", this.onConnectedHandler);
    this.client.on("subscription", this.onSubHandler);
    this.client.on("submysterygift", this.onRandomGiftSubHandler);
    this.client.on("subgift", this.onGiftSubHandler);
    this.client.on("resub", this.onResubHandler);
    this.client.on("raided", this.onRaidHandler);
    this.client.on("cheer", this.onCheerHandler);
    this.client.on("join", (channel, username, self) => { if (!self) this.viewers.add(username.toLowerCase()); });
    this.client.on("part", (channel, username, self) => { if (!self) this.viewers.delete(username.toLowerCase()); });
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
    this.client.db = db;
    this.commandCooldowns = {};
    this.lastSeen = new Map();
    this.client.lastSeen = this.lastSeen;
    this.viewers = new Set();
    this.client.viewers = this.viewers;

    // Prune stale cooldown entries every 5 minutes
    setInterval(() => {
      const cutoff = Date.now() - 60000;
      for (const key of Object.keys(this.commandCooldowns)) {
        if (this.commandCooldowns[key] < cutoff) delete this.commandCooldowns[key];
      }
    }, 300000);

    // Passive points: award POINTS_PER_TICK every 60s to viewers active in last 30 min
    const pointsPerTick = Number(process.env.POINTS_PER_TICK) || 5;
    setInterval(() => {
      if (this.client.readyState() !== 'OPEN') return;
      const now = Date.now();
      const window = 30 * 60 * 1000;
      for (const [username, ts] of this.lastSeen) {
        if (now - ts <= window) {
          db.upsertViewer(username);
          db.addPoints(username, pointsPerTick);
        }
      }
      const leaderboard = db.getLeaderboard(10);
      this.client.sse.send(leaderboard, 'leaderboard');
    }, 60000);

    if (process.env.PERIODIC_DELAY) {
      this.periodicInterval = setInterval(() => this.onPeriodicHandler(), 60000 * Number(process.env.PERIODIC_DELAY));
    }

    this.rpgEngine = new RPGEngine(this.client, db);
    this.rpgEngine.start();
  }

  setCredentials = (username, password) => {
    this.client.opts.identity.username = username;
    this.client.opts.identity.password = password;
  };

  connect = () => {
    if (!this.client.opts.identity.username || !this.client.opts.identity.password) {
      console.error('[Bot Engine] Missing Twitch credentials. Please authenticate via /auth/twitch first!');
      return;
    }
    console.debug("Twitch Bot Connecting as", this.client.opts.identity.username);
    this.client.connect();
    this.fetchBadges();
  };

  fetchBadges = async () => {
    try {
      let token = this.client.opts.identity.password;
      if (token.startsWith('oauth:')) {
        token = token.slice(6);
      }
      const headers = {
        'Client-ID': process.env.TWITCH_CLIENT_ID,
        'Authorization': `Bearer ${token}`
      };

      const [globalRes, channelRes] = await Promise.all([
        fetch('https://api.twitch.tv/helix/chat/badges/global', { headers }),
        this._fetchChannelId(token, headers).then(channelId =>
          channelId
            ? fetch(`https://api.twitch.tv/helix/chat/badges?broadcaster_id=${channelId}`, { headers })
            : null
        ),
      ]);

      if (!globalRes.ok) throw new Error(`Failed to fetch global badges, status: ${globalRes.status}`);
      const globalPayload = await globalRes.json();
      const channelPayload = channelRes && channelRes.ok ? await channelRes.json() : { data: [] };

      const badgeSets = {};
      for (const set of [...globalPayload.data, ...channelPayload.data]) {
        badgeSets[set.set_id] = { versions: {} };
        for (const version of set.versions) {
          badgeSets[set.set_id].versions[version.id] = {
            image_url_1x: version.image_url_1x,
            image_url_2x: version.image_url_2x,
            image_url_4x: version.image_url_4x
          };
        }
      }
      this.badges = { badge_sets: badgeSets };
      console.log('[Bot Engine] Successfully fetched global + channel chat badges.');
    } catch (err) {
      console.warn('[Bot Engine] Warning: Could not fetch Twitch badges.', err.message);
    }
  };

  _fetchChannelId = async (token, headers) => {
    try {
      const channelName = process.env.CHANNEL_NAME;
      if (!channelName) return null;
      const res = await fetch(`https://api.twitch.tv/helix/users?login=${channelName}`, { headers });
      if (!res.ok) return null;
      const data = await res.json();
      return data.data && data.data[0] ? data.data[0].id : null;
    } catch {
      return null;
    }
  };

  // Handlers
  onConnectedHandler = (addr, port) => {
    console.debug(`* Connected to ${addr}:${port}`);
  };

  _broadcastLeaderboard = () => {
    const leaderboard = db.getLeaderboard(10);
    this.client.sse.send(leaderboard, 'leaderboard');
  };

  onCheerHandler = (channel, context, msg) => {
    const username = context.username;
    const bits = Number(context.bits) || 0;
    if (!bits) return;
    db.upsertViewer(username);
    db.addPoints(username, bits);
    this.client.say(channel, `@${username} cheered ${bits} bits! +${bits} points!`);
    this._broadcastLeaderboard();
  };

  onRaidHandler = (channel, username, viewers) => {
    const pts = 1000 + (Number(viewers) || 0) * 50;
    db.upsertViewer(username);
    db.addPoints(username, pts);
    this.client.say(channel, `@${username} raided with ${viewers} viewers! +${pts} points!`);
    this._broadcastLeaderboard();
  };

  onResubHandler = (channel, username, months, message, context, methods) => {
    db.upsertViewer(username);
    db.addPoints(username, 300);
    this.client.say(channel, `@${username} resubbed for ${months} months! +300 points!`);
    this._broadcastLeaderboard();
  };

  onGiftSubHandler = (channel, username, streakMonths, recipient, methods, context) => {
    db.upsertViewer(username);
    db.upsertViewer(recipient);
    db.addPoints(username, 100);
    db.addPoints(recipient, 200);
    this.client.say(channel, `@${username} gifted a sub to @${recipient}! +100 pts to gifter, +200 to recipient!`);
    this._broadcastLeaderboard();
  };

  onRandomGiftSubHandler = (channel, username, numbOfSubs, methods, context) => {
    const pts = numbOfSubs * 100;
    db.upsertViewer(username);
    db.addPoints(username, pts);
    this.client.say(channel, `@${username} gifted ${numbOfSubs} subs! +${pts} points!`);
    this._broadcastLeaderboard();
  };

  onSubHandler = (channel, username, method, message, context) => {
    db.upsertViewer(username);
    db.addPoints(username, 500);
    this.client.say(channel, `@${username} subscribed! +500 points!`);
    this._broadcastLeaderboard();
  };

  onMessageHandler = (channel, context, msg, self) => {
    if (self) return;

    const username = context.username;
    db.upsertViewer(username);
    db.touchViewer(username);
    this.lastSeen.set(username, Date.now());

    const sanitizedMsg = sanitizeHtml(msg.trim()).replace(/<.+?>/g, '');
    const msgPayload = {
      channel,
      context,
      msg: msg.trim(),
    };

    // Always send all chat messages (including commands) to dashboard
    this.client.sse.send(
      {
        id: context.id,
        msg,
        author: context.username,
        authorColor: context.color,
        emotes: context.emotes,
        badges: context.badges && this.badges && this.badges['badge_sets']
          ? Object.entries(context.badges)
              .map(([badge, version]) => {
                const badgeSet = this.badges['badge_sets'][badge];
                return badgeSet && badgeSet.versions[version] ? badgeSet.versions[version]['image_url_1x'] : null;
              })
              .filter(Boolean)
          : [],
      },
      'msg'
    );

    if (!sanitizedMsg.startsWith("!")) {
      const haiku = genHaiku(sanitizedMsg);
      if (haiku) {
        this.client.sse.send(haiku, 'tts')
      }
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
    if (this.client.readyState() !== 'OPEN') return;
    
    const msgs = Object.keys(periodic);
    const rand = Math.floor(Math.random() * msgs.length);

    return periodic[msgs[rand]](this.client);
  };

  onCommandHandler = ({ channel, context, msg }) => {
    const split = msg.split(/ (.*)/g);
    const cmdKey = split[0];
    const cmd = commands[cmdKey];
    if (!cmd) return;

    const isMod = context && context.mod;
    const isStreamer = context && context.badges && Object.keys(context.badges).includes('broadcaster');

    // Per-user cooldown: 5s for mods/streamer, 10s for everyone else
    const cooldownMs = (isMod || isStreamer) ? 5000 : 10000;
    const cooldownKey = `${context.username}:${cmdKey}`;
    const lastUsed = this.commandCooldowns[cooldownKey] || 0;
    if (Date.now() - lastUsed < cooldownMs) return;
    this.commandCooldowns[cooldownKey] = Date.now();

    return cmd(this.client, split[1] && split[1].trim(), { channel, mod: isMod, isStreamer, username: context.username });
  };
}
module.exports = TwitchClient;
