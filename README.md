# Sizzs Twitch-Bot
  You probably do not want to use this.

# TODO List
  * Add module for using twitch API (too lazy right now)
  * Dueling peoples
  * Bot Dashboard (working on it)
  * Bot Stream Interface (working on it)
  * Ban list for !say command
  * Move TTS to dashboard instead of stream route (OBS Browser plugin not picking up TTS)
  * Support BTTV Emotes (Will need twitch API first) https://api.betterttv.net/3/cached/users/twitch/
  * Get TTS working from within OBS (might not be possible as tts module we're using does not detect the browser plugin)
  * ^--- Move out of chat window and into stream dashboard, Add voice enabled status & state
  * Add ability to change TTS voice

# Techstack
  * Vite
  * VueJS 3 (Composition API)
  * tmi.js
  * Express (with Local OAuth flow)

# Requirements
  * NodeJS >= 18.0.0
  * NPM

# Setup & Authentication
  1. Go to the [Twitch Developer Console](https://dev.twitch.tv/console)
  2. Register a new Application.
  3. **CRITICAL**: Set the OAuth Redirect URL explicitly to: `http://localhost:3000/auth/twitch/callback`
  4. Copy the generated **Client ID** and **Client Secret**.
  5. Rename `.env.template` to `.env` and fill in `TWITCH_CLIENT_ID`, `TWITCH_CLIENT_SECRET`, and your actual `USERNAME` value.
  6. Run `npm install`
  
# Running the Bot
  1. Boot up the bot using `npm run bot`
  2. If you don't have an `OAUTH_TOKEN` set, open your browser to **`http://localhost:3000/auth/twitch`**
  3. Approve the Twitch Prompt. It will seamlessly redirect to your running bot and connect it automatically!
  4. Boot the Vue Dashboard using `npm run web` (runs on `localhost:5173`)
