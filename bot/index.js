require('dotenv').config();

for (const key in process.env) {
  if (typeof process.env[key] === 'string') {
    process.env[key] = process.env[key].trim();
  }
}

process.on('uncaughtException', (err) => console.error('Uncaught Exception:', err));
process.on('unhandledRejection', (reason, promise) => console.error('Unhandled Rejection at:', promise, 'reason:', reason));

const express = require('express');
const cors = require('cors');
const SSE = require('express-sse');
const fs = require('fs');
const path = require('path');
const compression = require('compression');
const TwitchClient = require('./TwitchClient');
const db = require('./data/db');
const { CLASS_DEFS, MONSTERS, BOSS_MONSTERS, runCombat, calcStatsForLevel } = require('./data/rpg');


const app = express();

const SETTINGS_PATH = path.join(__dirname, 'data', 'settings.json');

const SETTINGS_DEFAULTS = {
  streamMessage: process.env.STREAM_MESSAGE || 'Fail @ making games',
  chat: { width: 420, height: 480, x: 20, y: 20 },
  splash: null,
  theme: 'default',
};

function loadSettings() {
  try {
    const raw = fs.readFileSync(SETTINGS_PATH, 'utf8');
    const saved = JSON.parse(raw);
    return {
      streamMessage: saved.streamMessage ?? SETTINGS_DEFAULTS.streamMessage,
      chat: { ...SETTINGS_DEFAULTS.chat, ...saved.chat },
      splash: saved.splash ?? SETTINGS_DEFAULTS.splash,
      theme: saved.theme ?? SETTINGS_DEFAULTS.theme,
    };
  } catch {
    return { ...SETTINGS_DEFAULTS, chat: { ...SETTINGS_DEFAULTS.chat } };
  }
}

function saveSettings(settings) {
  try {
    fs.writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2));
  } catch (e) {
    console.error('[Settings] Failed to save settings:', e.message);
  }
}

const overlaySettings = loadSettings();

app.use((req, res, next) => {
  console.log(`[HTTP] ${req.method} ${req.url}`);
  next();
});
app.use(compression({
  filter: (req, res) => req.path === '/bot' ? false : compression.filter(req, res),
}));
app.use(cors({
  origin: '*',
  credentials: false,
}));
app.use(express.json());
app.use('/wow', express.static(path.join(__dirname, 'public', 'wow')));
app.use('/assets', express.static(path.join(__dirname, 'public', 'assets')));

const sse = new SSE();
const client = new TwitchClient({
  twitchApi: {
    clientId: process.env.TWITCH_CLIENT_ID,
    clientSecret: process.env.TWITCH_CLIENT_SECRET,
  },
  identity: {
    username: process.env.TWITCH_USERNAME,
    password: process.env.OAUTH_TOKEN,
  },
  channels: [process.env.CHANNEL_NAME],
  sse,
});

// OAuth Authorization Flow
app.get('/auth/twitch', (req, res) => {
  if (req.query.error) {
    return res.status(400).send(`
      <body style="background: #1e293b; color: #f8fafc; font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; text-align: center;">
        <h2 style="color: #ef4444;">Twitch OAuth Error</h2>
        <p><strong>Error:</strong> ${req.query.error}</p>
        <p><strong>Description:</strong> ${req.query.error_description || 'None'}</p>
        <div style="background: rgba(255,255,255,0.05); padding: 2rem; border-radius: 8px; margin-top: 2rem; max-width: 600px;">
          <h3>How to Fix:</h3>
          <p>Twitch says your Redirect URI does not match what you registered in your Twitch Developer Console.</p>
          <p>1. Go to <a style="color: #38bdf8;" href="https://dev.twitch.tv/console/apps" target="_blank">Twitch Developer Console</a></p>
          <p>2. Edit your Application</p>
          <p>3. Set your <strong>OAuth Redirect URLs</strong> to exactly: <br/><code style="background: #0f172a; padding: 0.5rem; display: inline-block; margin-top: 1rem;">${process.env.TWITCH_REDIRECT_URI}</code></p>
          <p>4. Save, then try logging in again.</p>
        </div>
      </body>
    `);
  }

  const scope = encodeURIComponent('chat:read chat:edit');
  const redirectUri = encodeURIComponent(process.env.TWITCH_REDIRECT_URI);
  const clientId = process.env.TWITCH_CLIENT_ID;
  const authUrl = `https://id.twitch.tv/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&force_verify=true`;
  res.redirect(authUrl);
});

app.get('/auth/twitch/callback', async (req, res) => {
  const code = req.query.code;
  if (!code) {
    return res.status(400).send('Authorization code missing from Twitch response.');
  }

  try {
    const tokenResponse = await fetch('https://id.twitch.tv/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.TWITCH_CLIENT_ID,
        client_secret: process.env.TWITCH_CLIENT_SECRET,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: process.env.TWITCH_REDIRECT_URI,
      }),
    });

    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok) {
      console.error("Twitch Token Exchange Error", tokenData);
      return res.status(500).send(`Failed to exchange token: ${JSON.stringify(tokenData)}`);
    }

    // Successfully retrieved token. tmi.js requires 'oauth:' prefix.
    const accessToken = `oauth:${tokenData.access_token}`;
    console.log('[Auth] Successfully generated new Twitch access token.');
    
    // Inject the token into the existing client identity and connect
    client.setCredentials(process.env.TWITCH_USERNAME, accessToken);
    client.connect();

    // Save token to .env
    try {
      const envPath = path.join(__dirname, '..', '.env');
      let envData = fs.readFileSync(envPath, 'utf8');
      if (envData.includes('OAUTH_TOKEN=')) {
        envData = envData.replace(/OAUTH_TOKEN=.*/g, `OAUTH_TOKEN=${tokenData.access_token}`);
      } else {
        envData += `\nOAUTH_TOKEN=${tokenData.access_token}\n`;
      }
      fs.writeFileSync(envPath, envData);
      console.log('[Auth] Saved new token to .env file.');
    } catch (e) {
      console.error('[Auth] Could not save token to .env file:', e.message);
    }

    res.send(`
      <html>
        <body style="background: #1e293b; color: #f8fafc; font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh;">
          <h1>Authentication Successful!</h1>
          <p>Your local twitch bot has successfully connected to chat.</p>
          <p>You can close this window and return to your dashboard.</p>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('OAuth Callback Error:', error);
    res.status(500).send('Internal Server Error while verifying Twitch token');
  }
});

app.get('/bot', sse.init);

app.get('/rpg/test', (req, res) => {
  const type = req.query.type || 'monster';
  const classes = ['warrior', 'mage', 'rogue', 'ranger'];
  const rarities = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
  const slots = ['weapon', 'chest', 'helmet', 'boots'];

  const mockParty = classes.map((cls, i) => ({
    username: [`Sizzlorox`, `Viewer42`, `PixelKnight`, `MysticArrow`][i],
    class: cls,
    level: Math.floor(Math.random() * 10) + 1,
    result: 'won', // overwritten after simulation below
    avatarUrl: `/assets/avatars/${cls}.png`,
    equipment: {
      weapon: null,
      chest:  null,
      helmet: i === 0 ? { name: 'Iron Cap', rarity: 'common', spriteUrl: '/assets/items/overlay_helmet_chromakey_test.png' } : null,
      boots:  null,
    },
    loot: Math.random() > 0.6 ? { name: 'Iron Sword', rarity: rarities[Math.floor(Math.random() * rarities.length)], slot: slots[i % slots.length], spriteUrl: `/assets/items/overlay_weapon_common.png` } : null,
  }));

  const randomMonster = MONSTERS[Math.floor(Math.random() * MONSTERS.length)];
  const randomBoss    = BOSS_MONSTERS[Math.floor(Math.random() * BOSS_MONSTERS.length)];

  const toMonsterPayload = (m) => ({ ...m, maxHp: m.hp, avatarUrl: `/assets/avatars/${m.type}.png` });

  const monsters = {
    monster:  toMonsterPayload(randomMonster),
    boss:     toMonsterPayload(randomBoss),
    treasure: null,
    training: null,
  };

  const summaries = {
    monster:  `⚔️ A ${randomMonster.name} appeared!`,
    boss:     `🐉 BOSS RAID: ${randomBoss.name}!`,
    treasure: '💰 Treasure chest found!',
    training: '📚 Training complete!',
  };

  // Build effective player stats from class definitions (level 1-10)
  const effectivePlayers = mockParty.map((p, i) => {
    const level = p.level;
    const stats = calcStatsForLevel(p.class, level) || { max_hp: 100, attack: 10, defense: 5 };
    return { username: p.username, class: p.class, level, hp: stats.max_hp, max_hp: stats.max_hp, attack: stats.attack, defense: stats.defense };
  });

  const activeMonster = monsters[type] || monsters.monster;
  let mockRoundsData = [];
  if (activeMonster) {
    const simMonster = { ...activeMonster, hp: activeMonster.hp * mockParty.length, attack: activeMonster.attack * mockParty.length };
    mockRoundsData = runCombat(effectivePlayers, simMonster);
  }

  // Derive actual results from simulation
  const lastRound = mockRoundsData[mockRoundsData.length - 1];
  const monsterDead = lastRound ? lastRound.monsterHpPct === 0 : false;
  mockParty.forEach((p, i) => {
    const hpPct = lastRound ? lastRound.playerHpPcts[i] ?? 100 : 100;
    p.result = (hpPct > 0 && monsterDead) ? 'won' : 'lost';
  });

  const payload = {
    id: Date.now(),
    type,
    summary: summaries[type] || summaries.monster,
    detail: {},
    monster: activeMonster,
    party: mockParty,
    rounds: mockRoundsData,
    timestamp: Date.now(),
  };

  sse.send(payload, 'rpg_event');
  res.json({ ok: true, ...payload });
});

app.get('/leaderboard', (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 10, 50);
  res.json(db.getLeaderboard(limit));
});

app.get('/rpg/events', (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  const events = db.getRecentEvents(limit).map(ev => ({
    ...ev,
    detail: (() => { try { return JSON.parse(ev.detail); } catch { return ev.detail; } })(),
  }));
  res.json(events);
});

app.get('/settings', (req, res) => {
  res.json(overlaySettings);
});

app.post('/settings', (req, res) => {
  const { streamMessage, chat, splash } = req.body;
  if (streamMessage !== undefined) {
    overlaySettings.streamMessage = String(streamMessage).slice(0, 200);
  }
  if (chat && typeof chat === 'object') {
    const clamp = (val, min, max) => Math.max(min, Math.min(Number(val), max));
    if (chat.width  !== undefined) overlaySettings.chat.width  = clamp(chat.width,  100, 1920);
    if (chat.height !== undefined) overlaySettings.chat.height = clamp(chat.height, 100, 1080);
    if (chat.x      !== undefined) overlaySettings.chat.x      = clamp(chat.x,      0,   1920);
    if (chat.y      !== undefined) overlaySettings.chat.y      = clamp(chat.y,      0,   1080);
  }
  if ('splash' in req.body) {
    const valid = [null, 'starting', 'brb', 'ending'];
    overlaySettings.splash = valid.includes(splash) ? splash : null;
  }
  if ('theme' in req.body) {
    const validThemes = ['default', 'wow-classic'];
    overlaySettings.theme = validThemes.includes(req.body.theme) ? req.body.theme : 'default';
  }
  saveSettings(overlaySettings);
  sse.send(overlaySettings, 'settings');
  res.json(overlaySettings);
});

app.listen(process.env.BOT_PORT, () => {
  console.log(`Bot API listening at http://localhost:${process.env.BOT_PORT}`);
  console.log(`OAuth Login URL: http://localhost:${process.env.BOT_PORT}/auth/twitch`);
  
  // Try connecting immediately if we already happen to have a token,
  // Otherwise the bot will wait for the OAuth redirect to happen.
  if (process.env.OAUTH_TOKEN) {
    let token = process.env.OAUTH_TOKEN;
    if (!token.startsWith('oauth:')) {
      token = `oauth:${token}`;
    }
    client.setCredentials(process.env.TWITCH_USERNAME, token);
    client.connect();
  } else {
    console.log('[Auth] No static OAUTH_TOKEN found in .env. Waiting for user action on /auth/twitch ...');
  }
});
