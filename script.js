const fs = require('fs')
const util = require('util')

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

function main() {
  /*
  check rate limit
  const { data } = await axios.get(
    'https://api.twitter.com/1.1/application/rate_limit_status.json', 
     {
  })
  */
  getTwitterData()
  /*
  const witResponses = getTwitterData().then (async function getWitSentiment(results){
    console.log(results)
    const res = await Promise.all(results.map(result => {
      return new Promise( (resolve, reject) => {
        client.message(result.text).then(({ entities }) => resolve({...result, sentiment: entities.sentiment ? entities.sentiment[0].value : 'mixed', confidence: entities.sentiment ? entities.sentiment[0].confidence : null })).catch(err => resolve({...result, sentiment: null, confidence: null }) )
      })
    })
    )
    return res
    
  })

  console.log(witResponses)
  //const csv = new Parser().parse(witResponses)
  //fs.writeFileSync('melissa.csv', csv)
  */
}



async function getTwitterData(nextToken=undefined, reply=false, source_id = undefined, name = undefined){
  //TODO: find out how to allow multiple hashtags with OR relations #wfh2020 #workfromhome #workingfromhome #remoteworking #remotework 
  para = {
    "query":reply? "@" + id + " lang:en" : "#wfh lang:en",
    "maxResults": "500",
    "fromDate":"202005230000", // start of covid: 201912010000 
    "toDate":"202005230010", // somewhen now: 202005222359
  }
  if(nextToken != undefined) {
    para= {
      ...para,
      "next": nextToken
    }
  }
  try {
    const { data } = await axios.post(
      'https://api.twitter.com/1.1/tweets/search/fullarchive/circuitBreaker.json', 
      para
    )
  } catch(err){
    console.log(err)
  }

  var temp = []

  var results
  
  // to get the replies to the specific tweet from the user in query 
  if (reply == true){
    results = data.results.filter(res => res.in_reply_to_status_id == source_id)
  }
  results = data.results.map(({ id, text, created_at, truncated, extended_tweet, entities, user, retweet_count, favorite_count, reply_count }) => {
    
    //save to get comments for the tweet later
    if (reply_count>0){
      temp.push({
        id: id,
        name: user.screen_name
      })
    }

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
      reply_count, // number of comments
      source_tweet_id: reply? source_id: null
    }
  })
  

  if (temp.length>0) {
    //one tweet returns multiple reply tweets
    var arr = temp.map((val) => {
      return getTwitterData(nextToken, true, id, name)
    })
    results.push(arr)
  }

  //pagination
  var results_chain =[]
  if (data.next != null){
    results_chain = getTwitterData(data.next)
    results.push(results_chain)
  }
  
  //console.log(results)
  return results
}

function isLocation(str){
  //unable to implement since we would need to pay Google/Mapbox with this amount of large requests
}

main()
