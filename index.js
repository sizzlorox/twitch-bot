require('dotenv').config();
const TC = require('./bot/TwitchClient');

const opts = {
  identity: {
    username: process.env.USERNAME,
    password: process.env.OAUTH_TOKEN,
  },
  channels: [process.env.CHANNEL_NAME],
};
const client = new TC(opts);
client.connect();
