require('dotenv').config();
const nodemailer = require('nodemailer');
const { google } = require('googleapis');
const OAuth2 = google.auth.OAuth2;

const oauth2Client = new OAuth2(
  process.env.GMAIL_API_CLIENT_ID,
  process.env.GMAIL_API_CLIENT_SECRET,
  'https://developers.google.com/oauthplayground'
);

oauth2Client.setCredentials({
  refresh_token: process.env.GMAIL_API_REFRESH_TOKEN
});

let transport;

async function createTransport() {
  const accessToken = await oauth2Client.getAccessToken();
  transport = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      type: 'OAuth2',
      user: 'botreturd@gmail.com',
      clientId: process.env.GMAIL_API_CLIENT_ID,
      clientSecret: process.env.GMAIL_API_CLIENT_SECRET,
      refreshToken: process.env.GMAIL_API_REFRESH_TOKEN,
      accessToken: accessToken.token,
    },
  });
}

async function sendMailCustom(to, subject, text) {
    if (!transport) {
      await createTransport();
    }
  
    const mailOptions = {
      from: 'botreturd@gmail.com',
      to,
      subject,
      text,
    };
  
    try {
      const result = await transport.sendMail(mailOptions);
      return result;
    } catch (error) {
      console.error('Error sending mail:', error);
      throw error;
    }
  }

  
  function sendErrorDuringDownloadProcessEmailModule(email, filename, retryLink, reportErrorLink,processingRequestTime) {
    const subject = "Oopsie Woopsie! I did a fucky wucky!";
    const body = `
        OwO what's this? A wild ewwow appeawed! (⊙﹏⊙✿)

        Hewwo there, vawued user of my totally wegit fiwe pwocessing sewvice! ㄟ(≧◇≦)ㄏ

        I've encountewed a wittle fucky wucky whiwe twying to pwocess youw fiwe "${filename}" downwoad req you send on ${processingRequestTime}. Sowwy 'bout that! (╯°□°）╯︵ ┻━┻

        Hewe's what might've happened:

        1) A sudden powewcut sent my sewvew into a nap time
        2) The intewnet took a bweaka and decided to go on vacay
        3) My code did a big oopsie woopsie and bwoked evewything

        But don't get youw knickews in a twist! I've got a supew speshuw "twy again" button fow you: [${retryLink}]

        Cwick it, senpai! Maybe it'ww notice you this time (≧◡≦)

        If youw fiwe keeps being a meanie-weanie, you can awways smash dat ewwow weport button. I wiww wook into it... eventuawwy: [${reportErrorLink}]

        Wemembew, in the wacky wowwd of web shenanigans, sometimes I make an oopsie doopsie ow a fucky wucky. 

        P.S. Psst... Here's a wittwe somethin' speciaw just fow you (｡•̀ᴗ-)✧ 
        [Check out this speciaw wink](https://youtu.be/xvFZjo5PgG0?si=y0SqbJdkZOjEQ4SB)
    `;

    return sendMailCustom(email, subject, body);
}

function sendSuccessfulFileProcessingEmailModule(email, filename, downloadlink, requestTime, filesize) {
    let downloadLink = process.env.WEBSITELINK + downloadlink;
    const subject = "Your File is Ready!";
    const body = `
    You doubted me? Shame on you! I'm a professional (cough, cough)
    
    Your file "${filename}" is ready for download: [${downloadLink}]
    
    Details? Please. I've got this on lock:
    
    * Filename: ${filename}
    * Download Request time: ${requestTime}
    * Filesize: ${filesize} MB
    
    I'm a pro at file processing - it's not like I'm surprised or anything. But hey, being a professional means getting things right, even when it's boring.
    
    Thanks for using my top-notch, utterly-not-amateur file processing service! (My skills are so sharp, I could process files while watching grass grow.)
    
    NOTE : The download link will expire in 30 minutes, so be sure to download your file soon!

    P.S. You're welcome ;).
    `;
    
    return sendMailCustom(email, subject, body);
}

createTransport()
  .then(() => {
    module.exports = {
        sendSuccessfulFileProcessingEmailModule,
        sendErrorDuringDownloadProcessEmailModule
    };
  })
.catch((error) => console.log(error.message));