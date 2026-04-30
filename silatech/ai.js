const { cmd, footer, getContextInfo } = require('../sila/silafunctions');
const axios = require('axios');

module.exports = cmd({
    pattern: "ai",
    alias: ["gpt", "ask", "think", "silai", "brainy", "chat"],
    react: "🤖",
    desc: "Ask AI anything",
    category: "ai",
    filename: __filename
}, async (sock, m, sender, args, prefix, number) => {
    try {
        if (!args[0]) {
            return await sock.sendMessage(sender, {
                text: '*❌ Please provide a message*\n*Usage:* .ai Hello, how are you?'
            }, { quoted: require('../sila/silafunctions').myquoted });
        }

        const query = args.join(' ');
        await sock.sendMessage(sender, { react: { text: '🤖', key: m.key } });

        const response = await axios.get(`https://apis.davidcyriltech.my.id/ai/chatbot?query=${encodeURIComponent(query)}`);
        
        if (response.data.status !== 200 || !response.data.success) {
            throw new Error('AI service unavailable');
        }

        await sock.sendMessage(sender, {
            text: `🌸 *AI Response* 🌸\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n\n${response.data.result}\n\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n> 𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐛𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡`,
            contextInfo: getContextInfo(sender)
        }, { quoted: require('../sila/silafunctions').myquoted });

    } catch (error) {
        console.error('❌ AI error:', error);
        await sock.sendMessage(sender, {
            text: `*❌ AI Error*\n\nFailed to get response. Please try again.`
        }, { quoted: require('../sila/silafunctions').myquoted });
    }
});
