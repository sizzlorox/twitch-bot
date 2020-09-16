require("dotenv").config();
import TC from "./bot/TwitchClient";

const opts = {
  identity: {
    username: process.env.BOT_USERNAME,
    password: process.env.OAUTH_TOKEN,
  },
  channels: [process.env.CHANNEL_NAME],
};
const client = new TC(opts);
client.connect();
