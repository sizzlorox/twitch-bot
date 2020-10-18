require('dotenv').config();

const express = require('express');
const cors = require('cors');
const SSE = require('express-sse');
const TwitchClient = require('./TwitchClient');


const app = express();
const sse = new SSE();
const client = new TwitchClient({
  identity: {
    username: process.env.USERNAME,
    password: process.env.OAUTH_TOKEN,
  },
  channels: [process.env.CHANNEL_NAME],
  sse,
});

app.use(cors({
  origin: '*',
  credentials: false,
}));

app.get('/bot', sse.init);

app.listen(process.env.BOT_PORT, () => {
  console.log(`Bot API listening at http://localhost:${process.env.BOT_PORT}`)
  client.connect();
});
