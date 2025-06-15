const { Client, IntentsBitField } = require('discord.js');

const client = new Client({
    restRequestTimeout: 100000,
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent,
        IntentsBitField.Flags.GuildVoiceStates,
    ]
});

function initializeClient() {
    return new Promise((resolve, reject) => {
        client.once('ready', () => {
            console.log(`Logged in as ${client.user.tag}`);
            resolve(client);
        });

        client.login(process.env.TOKEN).catch(err => {
            console.error('Error logging in:', err);
            reject(err);
        });
    });
}

module.exports = initializeClient;


