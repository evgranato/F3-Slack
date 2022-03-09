const { App } = require('@slack/bolt');
const channelId = 'C034SSKHQ30'
const Twit = require("twit");
const fs = require("fs")
const dotenv = require("dotenv").config({path: '/Users/evgranato/Documents/Coding/Slack Keys/keys.env'});
const http = require('http')
const https = require('https')
// const FB = require('fb')
// const facebookToken = process.env.FACEBOOK_ACCESS

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

//TWEET TEXT AND PHOTOS
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

//FACEBOOK CONNECTION
// FB.setAccessToken(facebookToken);
// FB.api(
//  '/sentifly/feed',
//  'POST',
//  { "message": "Testing with api" },
//  function (response) {
//   if (response.error) {
//    console.log('error occurred: ' + JSON.stringify(response.error))
//    return;
//   }
//   console.log('successfully posted to page!');
//  }
// );

//CONNECT SLACK AND MESSAGE
app.message(/PAX/, async ({message, say}) =>
{await say(`Thanks <@${message.user}>! I'll add that to today's social media content`)
if ("undefined" === typeof (message.files)) {
  let splitMsg = message.text.split("ao-")
  let tag = splitMsg.slice(-1)[0].slice(0,-1)
  let firstLine = message.text.split('<')[0]
  todaySocial.push(`${firstLine}#${tag}`)
  console.log(todaySocial)
} else {
    if(message.text.search('<#') === -1) {
        todaySocial.push(message.text)
        console.log(todaySocial)
        let url = message.files[0].url_private
        let filePath = 'pics/' + Math.random() + '.jpeg'
        pDownload(url, filePath)
        files.push(filePath)
        console.log(filePath)
        console.log(files)
    } else {
        let splitMsg = message.text.split("ao-")
        let tag = splitMsg.slice(-1)[0].slice(0,-1)
        let firstLine = message.text.split('<')[0]
        todaySocial.push(`${firstLine}#${tag}`)
        console.log(todaySocial)
        let url = message.files[0].url_private
        let filePath = 'pics/' + Math.random() + '.jpeg'
        pDownload(url, filePath)
        files.push(filePath)
        console.log(filePath)
        console.log(files)
    }
    
}});

//RESET DAILY AND TWEET
setTimeout(()=> {
    tweet(files, completeMessage());
    todaySocial = []
    post = ''
    deleteImageFiles(files)
    files = []
    console.log('Daily Reset')
}, 86400000);

//PUT A FULL DAILY TWEET TOGETHER
function completeMessage() {
    for(let i = 0; i < todaySocial.length; i++) {
        post = post + ", " + todaySocial[i]
    }
    let post1 = post.substring(2)
    if(post1.length < 245) {
        post1 = post1 + ' #F3NATION #AustinTx #Austin #atx #texas'
    } 
    console.log(post1) 
    return post1
};

//DOWNLOAD IMAGE

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

  //DELETE DOWNLOADED IMAGES
  function deleteImageFiles (imageFiles) {
      for(let i =0; i < imageFiles.length; i++) {
        fs.unlink(imageFiles[i], function (err) {            
            if (err) {                                                 
                console.error(err);                                    
            }                                                          
           console.log('File has been Deleted');                           
        });                        
      }
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