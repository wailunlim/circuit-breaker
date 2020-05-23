const fs = require('fs')

// twitter
const twitterConfig = require('./twitterConfig')

const axios = require('axios')
axios.defaults.headers.common['authorization'] = 'Bearer ' + twitterConfig.auth_token;
axios.defaults.headers.post['Content-Type'] = 'application/json';

// wit
const { Wit } = require('node-wit');
const client = new Wit({
  accessToken: 'TMIKAMREQK45WFIA5FEMEBRXN3BHR5JM'
})

const { Parser } = require('json2csv');

async function main() {
  // todo (yiqiong): we need to know what kind of data we want from the api
  const { data } = await axios.post('https://api.twitter.com/1.1/tweets/search/fullarchive/circuitBreaker.json', {
    "query":"#wfh #wfh2020 #workfromhome #workingfromhome lang:en",
    "maxResults": "10",
    "fromDate":"201912010000", // start of covid
    "toDate":"202005222359", // somewhen now
  }, {
  })

  // console.log(data.next) // todo: continue calling it with next token to get more data
  // console.log(data.results)

  const results = data.results.map(({ id, text, created_at, truncated, extended_tweet, entities, user, retweet_count, favorite_count, reply_count }) => {
    return {
      tweet_id: id,
      created_at,
      text: truncated ? extended_tweet.full_text : text,
      word_count: text.split(' ').length,
      hashtags: truncated ? extended_tweet.entities.hashtags.map(hashtag => hashtag.text) : entities.hashtags.map(hashtag => hashtag.text),
      user_id: user.id,
      name: user.screen_name, // twitter handle
      location: user.location,
      retweet_count,
      favorite_count,
      reply_count // number of comments
    }
  })

  const witResponses = await Promise.all(results.map(result => {
    return new Promise( (resolve, reject) => {
      client.message(result.text).then(({ entities }) => resolve({...result, sentiment: entities.sentiment ? entities.sentiment[0].value : null, confidence: entities.sentiment ? entities.sentiment[0].confidence : null })).catch(err => resolve({...result, sentiment: null, confidence: null }) )
    })
  }))

  const csv = new Parser().parse(witResponses)

  fs.writeFileSync('melissa.csv', csv)
}

main()
