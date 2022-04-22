const { App } = require('@slack/bolt');
const Twit = require("twit");
const fs = require("fs")
const dotenv = require("dotenv").config({path: './keys.env'});
const http = require('http')
const https = require('https')
//LOGGER FILE
const myConsole = new console.Console(fs.createWriteStream('./output.txt'));
// const FB = require('fb')
// const facebookToken = process.env.FACEBOOK_ACCESS

// INITIALIZES BOT APP
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
let endSpace = /\s$/
let files2 = []

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
        mymyConsole.log(`Error occured uploading content\t${err}`, new Date().toLocaleString());
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
            myConsole.log(`Error occured updating status\t${err}`, new Date().toLocaleString());
          }
        });
      } else {
        myConsole.log(`Error creating metadata\t${err}`, new Date().toLocaleString());
        process.exit(-1);
      }
    });
  }

app.message(/PAX/, async ({message, client, logger}) => {
  try {
    const response = await client.reactions.add({
      timestamp: message.ts,
      channel: message.channel,
      name: 'thumbsup'
    })
    if ("undefined" === typeof (message.files)) {
        if(message.text.search('<#') === -1) {
          todaySocial.push(message.text)
          myConsole.log(todaySocial, new Date().toLocaleString())
        } else {
          let splitMsg = message.text.split("ao-")
          if(endSpace.test(splitMsg) === true) {
            let tag = splitMsg.slice(-1)[0].slice(0,-2)
            let firstLine = message.text.split('<')[0]
            todaySocial.push(`${firstLine.replace('&amp;', '&')}#${tag}`)
            myConsole.log(todaySocial, new Date().toLocaleString())
          } else {
            let tag = splitMsg.slice(-1)[0].slice(0,-1)
            let firstLine = message.text.split('<')[0]
            todaySocial.push(`${firstLine.replace('&amp;', '&')}#${tag}`)
            myConsole.log(todaySocial, new Date().toLocaleString())
          }
          
        }
      } else {
          if(message.text.search('<#') === -1) {
              todaySocial.push(message.text.replace('&amp;', '&'))
              myConsole.log(todaySocial, new Date().toLocaleString())
              let url = message.files[0].url_private
              let filePath = 'pics/' + Math.random() + '.jpeg'
              pDownload(url, filePath)
              files.push(filePath)
              myConsole.log(filePath, new Date().toLocaleString())
              myConsole.log(files, new Date().toLocaleString())
          } else {
              let splitMsg = message.text.split("ao-")
              if(endSpace.test(splitMsg) === true) {
                let tag = splitMsg.slice(-1)[0].slice(0,-2)
                let firstLine = message.text.split('<')[0]
                todaySocial.push(`${firstLine.replace('&amp;', '&')}#${tag}`)
                myConsole.log(todaySocial, new Date().toLocaleString())
                let url = message.files[0].url_private
                let filePath = 'pics/' + Math.random() + '.jpeg'
                pDownload(url, filePath)
                files.push(filePath)
                myConsole.log(filePath, new Date().toLocaleString())
                myConsole.log(files, new Date().toLocaleString())
              } else {
                  let tag = splitMsg.slice(-1)[0].slice(0,-1)
                  let firstLine = message.text.split('<')[0]
                  todaySocial.push(`${firstLine.replace('&amp;', '&')}#${tag}`)
                  myConsole.log(todaySocial, new Date().toLocaleString())
                  let url = message.files[0].url_private
                  let filePath = 'pics/' + Math.random() + '.jpeg'
                  pDownload(url, filePath)
                  files.push(filePath)
                  myConsole.log(filePath, new Date().toLocaleString())
                  myConsole.log(files, new Date().toLocaleString())
              }
            }}}
  catch (error) {
    logger.error(error)
  }
})

//KEEP PHOTOS TO 4 FOR TWITTER POST SO IT WON'T CRASH
function limitMediaToFour(files) {
  for(let i = 0; i <= 3; i++) {
    files2.push(files[i])
  }
}

//RESET DAILY AND TWEET
setInterval(()=> {
    if(todaySocial && todaySocial.length !== 0){
      limitMediaToFour(files)
      tweet(files2, completeMessage());
      todaySocial = []
      post = ''
      deleteImageFiles(files)
      files = []
      myConsole.log('Daily Reset', new Date().toLocaleString())
    } else {
      myConsole.log('Nothing to tweet today', new Date().toLocaleString())
    }
  }, 86400000)
  

//PUT A FULL DAILY TWEET TOGETHER
function completeMessage() {
    for(let i = 0; i < todaySocial.length; i++) {
        post = post + ", " + todaySocial[i]
    }
    let post1 = post.substring(2)
    if(post1.length < 244) {
        post1 = post1 + '. #F3NATION #AustinTx #Austin #atx #texas'
    } 
    myConsole.log(post1, new Date().toLocaleString()) 
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
           myConsole.log('File has been Deleted', new Date().toLocaleString());                           
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

  myConsole.log('⚡️ Bolt app is running!', new Date().toLocaleString());
  console.log('⚡️ Bolt app is running!')
})();