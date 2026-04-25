const { Client, GatewayIntentBits } = require('discord.js');
const fetch = require('node-fetch');
require('dotenv').config({ path: '/www/wwwroot/www.raidzonemarket.com/backend/.env' });

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// Using a basic Discord Bot Token (Needs to be provided by user, but let's stub it out to explain)
client.on('ready', () => {
    console.log(`[Discord Bot] Logged in as ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
    // Ignore own messages or other bots
    if (message.author.bot) return;
    
    // We expect the bot to reply to a webhook message that has the threadId in the footer
    if (message.reference && message.reference.messageId) {
        try {
            const repliedTo = await message.channel.messages.fetch(message.reference.messageId);
            
            // Extract UUID from embed footer if it exists
            if (repliedTo.embeds.length > 0 && repliedTo.embeds[0].footer) {
                const footerText = repliedTo.embeds[0].footer.text;
                const match = footerText.match(/Thread ID: ([a-f0-9\-]+)/i);
                
                if (match && match[1]) {
                    const threadId = match[1];
                    const content = message.content;
                    
                    console.log(`[Discord Bot] Forwarding reply to thread ${threadId}: ${content}`);
                    
                    const response = await fetch('https://raidzonemarket.com/api/v1/chat/discord-reply', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            botSecret: process.env.DISCORD_BOT_SECRET,
                            threadId: threadId,
                            content: content
                        })
                    });
                    
                    if (response.ok) {
                        message.react('✅');
                    } else {
                        message.react('❌');
                        console.error('[Discord Bot] API returned', response.status);
                    }
                }
            }
        } catch (error) {
            console.error('[Discord Bot] Error handling reply:', error);
        }
    }
});

// Since the user might not have a full token ready yet, we will just log a helpful message
if (!process.env.DISCORD_BOT_TOKEN) {
    console.log('[Discord Bot] Notice: No DISCORD_BOT_TOKEN set in .env.');
    console.log('[Discord Bot] To enable two-way sync, add the token and run: node discord_bot.js');
} else {
    client.login(process.env.DISCORD_BOT_TOKEN);
}
