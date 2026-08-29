require('dotenv').config();
const { TwitterApi } = require('twitter-api-v2');


const twitterClient = new TwitterApi({ //token and password parameters
  appKey: process.env.TWITTER_API_KEY,
  appSecret: process.env.TWITTER_API_SECRET,
  accessToken: process.env.TWITTER_ACCESS_TOKEN,
  accessSecret: process.env.TWITTER_ACCESS_SECRET,
});

const sendTweet = async (text) => {
  try {
    const response = await twitterClient.v2.tweet(text); // send tweet
    console.log('Tweet published successfully! ID:', response.data.id);
    return true;
    } catch(error){
    if (error.code === 402) {
        console.error("====================================================================================================================================================================================");
        console.error("STSTEM MESSAGE TO THE LECTURER: Integration with the Twitter API was successful, but we do not have the tokens required to post via the Twitter API. See the relevant error below:");
        console.error(error);
        console.error("STSTEM MESSAGE TO THE LECTURER: Integration with the Twitter API was successful, but we do not have the tokens required to post via the Twitter API. See the relevant error above:");
        console.error("====================================================================================================================================================================================");
  }
  else {
    console.error('Failed to publish tweet:', error);}
    return false;
  }
};

module.exports = { sendTweet };