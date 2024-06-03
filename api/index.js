/*!
 * © [2024] Malith-Rukshan. All rights reserved.
 * Repository: https://github.com/Malith-Rukshan/Auto-Reaction-Bot
 */

import express from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import TelegramBotAPI from './TelegramBotAPI.js';
import { htmlContent, startMessage } from './constants.js';
import { splitEmojis, getRandomPositiveReaction, getChatIds } from './helper.js';

dotenv.config();

const app = express();
app.use(bodyParser.json());

const botToken = process.env.BOT_TOKEN;
const botUsername = process.env.BOT_USERNAME;
const Reactions = splitEmojis(process.env.EMOJI_LIST);
const RestrictedChats = getChatIds(process.env.RESTRICTED_CHATS);

const botApi = new TelegramBotAPI(botToken);

app.post('/', async (req, res) => {
    console.log('Received POST request:', req.body); // Debugging line
    const data = req.body;
    try {
        await onUpdate(data, botApi, Reactions, RestrictedChats, botUsername);
        res.status(200).send('Ok');
    } catch (error) {
        console.error('Error in onUpdate:', error);
        res.status(200).send('Ok');
    }
});

app.get('/', (req, res) => {
    res.send(htmlContent);
});

async function onUpdate(data, botApi, Reactions, RestrictedChats, botUsername) {
    let chatId, message_id, text;

    if (data.message || data.channel_post) {
        const content = data.message || data.channel_post;
        chatId = content.chat.id;
        message_id = content.message_id;
        text = content.text;

        if (data.message && (text === '/start' || text === '/start@' + botUsername)) {
            await botApi.sendMessage(chatId, startMessage.replace('UserName', content.chat.type === "private" ? content.from.first_name : content.chat.title), [
                [
                    { "text": "➕ Add to Channel ➕", "url": `https://t.me/${botUsername}?startchannel=botstart` },
                    { "text": "➕ Add to Group ➕", "url": `https://t.me/${botUsername}?startgroup=botstart` },
                ],
                [
                    { "text": "support 📥", "url": "https://t.me/omg_info" },
                ]
            ]);
        } else if (data.message && text === '/reactions') {
            const reactions = Reactions.join(", ");
            await botApi.sendMessage(chatId, "✅ Enabled Reactions : \n\n" + reactions);
        } else {
            if (!RestrictedChats.includes(chatId) && data.message.is_bot == false) {
                await botApi.setMessageReaction(chatId, message_id, getRandomPositiveReaction(Reactions));
            }
        }
    }
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
