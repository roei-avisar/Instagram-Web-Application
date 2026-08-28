require('dotenv').config();
const { TwitterApi } = require('twitter-api-v2');


const twitterClient = new TwitterApi({
  appKey: process.env.TWITTER_API_KEY,
  appSecret: process.env.TWITTER_API_SECRET,
  accessToken: process.env.TWITTER_ACCESS_TOKEN,
  accessSecret: process.env.TWITTER_ACCESS_SECRET,
});

const sendTweet = async (text) => {
  try {
    const response = await twitterClient.v2.tweet(text);
    console.log('Tweet published successfully! ID:', response.data.id);
    return true;
  } catch (error) {
    console.error('Failed to publish tweet:', error);
    return false;
  }
};

module.exports = { sendTweet };