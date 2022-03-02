const { App } = require('@slack/bolt');
const channelId = 'C034SSKHQ30'
const Twit = require("twit");
const fs = require("fs")
const dotenv = require("dotenv").config({path: '/Users/evgranato/Documents/Coding/Slack Keys/keys.env'});
const Stream = require('stream').Transform;
const http = require('http')
const https = require('https')
const request = require('request');
const WebClient = require('@slack/client').WebClient;

const web = new WebClient({
    token: process.env.SLACK_BOT_TOKEN,
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    appToken: process.env.SLACK_APP_TOKEN,
});

// Initializes your app with your bot token and signing secret
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN,
  port: process.env.PORT || 3000
});

//TWITTER Integration
const T = new Twit({
    consumer_key: process.env.API_KEY,
    consumer_secret: process.env.API_SECRET,
    access_token: process.env.ACCESS_TOKEN,
    access_token_secret: process.env.ACCESS_TOKEN_SECRET,
  });
//DECLARE DAILY VARIABLES
let todaySocial = []
let post = ''
let files = []

function tweet(files, todaySocial) {
    let mediaIds = new Array();
    files.forEach(function(file, index) { 
      uploadMedia(file, function(mediaId) {
        mediaIds.push(mediaId);
        if (mediaIds.length === files.length) {
          updateStatus(mediaIds, todaySocial);
        }
      });
    });
  };
  
  function uploadMedia(file, callback) {
    T.post('media/upload', { media: fs.readFileSync(file).toString("base64") }, function (err, data, response) {
      if (!err) {
        let mediaId = data.media_id_string;
        callback(mediaId);
      } else {
        console.log(`Error occured uploading content\t${err}`);
        process.exit(-1);
      }
    });
  }
  
  function updateStatus(mediaIds, todaySocial) {
    let meta_params = {media_id: mediaIds[0]};
    T.post('media/metadata/create', meta_params, function (err, data, response) {
      if (!err) {
        let params = { status: todaySocial, media_ids: mediaIds};
        T.post('statuses/update', params, function (err, data, response) {
          if (err) {
            console.log(`Error occured updating status\t${err}`);
          }
        });
      } else {
        console.log(`Error creating metadata\t${err}`);
        process.exit(-1);
      }
    });
  }

//CONNECT SLACK AND MESSAGE
app.message(/PAX/, async ({message, say}) =>
{await say(`Thanks <@${message.user}>! I'll add that to today's social media content`)
if ("undefined" === typeof (message.files)) {
    todaySocial.push(message.text)
    console.log(todaySocial)
} else {
    todaySocial.push(message.text)
    console.log(todaySocial)
    let url = message.files[0].url_private
    console.log(url)
    let filePath = 'pics/' + Math.random() + '.jpeg'
    pDownload(url, filePath)
    files.push(filePath)
    console.log(filePath)
    console.log(files)
}});

//RESET DAILY AND TWEET
setTimeout(()=> {
    tweet(files, completeMessage());
    todaySocial = []
    post = ''
    files = []
    console.log('Reset Variables')
}, 86400000);

//PUT A FULL DAILY TWEET TOGETHER
function completeMessage() {
for(let i = 0; i < todaySocial.length; i++) {
    post = post + ", " + todaySocial[i]
}
let post1 = post.substring(2)
post1 = post1 + ' #F3NATION #AustinTx #Austin #atx #texas'
console.log(post1) 
return post1
};

//DOWNLOAD IMAGE

//FIRST OPTION:
//Download Image Helper Function
// let downloadImageFromURL = (url, filename, callback) => {

//     let client = http;
//     if (url.toString().indexOf("https") === 0) {
//         client = https;
//     }
        
//     client.request(url, function(response) {
//         let data = new Stream();
        
//         response.on('data', function(chunk) {
//             data.push(chunk);
//         });

//         response.on('end', function() {
//             fs.writeFileSync(filename, data.read());
//         });
//     }).end();
// };

//SECOND OPTION:
function pDownload(url, dest){
let options = {
    "method": "GET",
    "hostname": "f3-austin.slack.com",
    "path": url,
    "rejectUnauthorized": "false",
    "headers": {
        "Authorization" : `Bearer ${process.env.SLACK_BOT_TOKEN}`
    }
  }
  
    let file = fs.createWriteStream(dest);
    return new Promise((resolve, reject) => {
      let responseSent = false; // flag to make sure that response is sent only once.
  
      https.get(options, response => {
        response.pipe(file);
        file.on('finish', () =>{
          file.close(() => {
            if(responseSent)  return;
            responseSent = true;
            resolve();
          });
        });
      }).on('error', err => {
          if(responseSent)  return;
          responseSent = true;
          reject(err);
      });
    });
  }


// //TWEET CONTENT RETURNED IN SLACK MESSAGE
// app.message('what', async({message, say}) => {
//     await say (completeMessage())
// });

//SERVER STARTUP
(async () => {
  // Start your app
  await app.start();

  console.log('⚡️ Bolt app is running!');
})();