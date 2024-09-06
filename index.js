const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const { token } = require('./config.json'); 

const { google } = require('googleapis');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const drive = google.drive({ version: 'v3', auth: new google.auth.GoogleAuth({
  keyFile: './googlecredentials.json',
  scopes: ['https://www.googleapis.com/auth/drive.readonly'],
}) });

const FOLDER_ID = '1pWOmUQTJDCjGepEgB5x3TUD9BmcDtuVB';
const CHANNEL_ID = '1281020282261213216';

client.once('ready', () => {
  console.log('Bot is ready!');
  checkForNewVideos();
});

let lastSentFileIds = new Set();

/**
 * Checks for new video uploads in the specified Google Drive folder and sends a notification to the specified Discord channel.
 *
 * @return {Promise<void>} Resolves when the function has completed checking for new videos and sending notifications.
 */
async function checkForNewVideos() {
    try {
      const response = await drive.files.list({
        q: `'${FOLDER_ID}' in parents and mimeType contains 'video/mp4' and trashed=false`,
        fields: `nextPageToken, files(id, name, webViewLink, createdTime)`,
        orderBy: 'createdTime desc',
        pageSize: 1
      });
  
      if (response.data.files.length > 0) {
        const latestFile = response.data.files[0];
        if (!lastSentFileIds.has(latestFile.id)) {
          lastSentFileIds.add(latestFile.id);
          const channel = await client.channels.fetch(CHANNEL_ID);
        
          const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('New Home Vid Uploaded!')
            .addFields(
              { name: 'File Name', value: latestFile.name },
              { name: 'Download Link', value: latestFile.webViewLink }
            )
            .setTimestamp();
  
          await channel.send({ embeds: [embed] });
        } else {
          console.log('No new or updated videos to send.');
        }
      } else {
        console.log('No new videos found.');
      }
    } catch (error) {
      console.error('Error checking for new videos:', error);
    }
  
    // Check again after 5 minutes
    setTimeout(checkForNewVideos, 5 * 60 * 1000);
}

client.login(token);