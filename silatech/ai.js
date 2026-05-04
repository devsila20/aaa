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
    
    const query = args.join(' ');
    
    if (!query) {
        return await sock.sendMessage(sender, {
            text: `🤖 *AI CHAT*\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n◈🌸 Please ask a question\n◈🌸 Example: ${prefix}ai What is python?\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n${footer}`
        }, { quoted: m });
    }
    
    try {
        // Show typing
        await sock.sendPresenceUpdate('composing', sender);
        
        // Call AI API
        const response = await axios.get(`https://api.yupra.my.id/api/ai/gpt5?text=${encodeURIComponent(query)}`);
        
        if (!response.data) {
            throw new Error('No response from API');
        }
        
        let aiResponse = response.data.response || response.data.result || response.data.data || 'No response';
        
        // Truncate if too long
        if (aiResponse.length > 4000) {
            aiResponse = aiResponse.substring(0, 3990) + '...';
        }
        
        await sock.sendPresenceUpdate('paused', sender);
        
        await sock.sendMessage(sender, {
            text: `🤖 *AI RESPONSE*\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n◈🌸 *Question:* ${query}\n◈🌸 *Answer:*\n\n${aiResponse}\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n${footer}`,
            contextInfo: getContextInfo(sender)
        }, { quoted: m });
        
    } catch (error) {
        await sock.sendPresenceUpdate('paused', sender);
        
        let errorMsg = 'AI service unavailable';
        
        if (error.response?.status === 429) {
            errorMsg = 'Rate limited, try again later';
        } else if (error.response?.status === 500) {
            errorMsg = 'AI server error';
        } else if (error.code === 'ECONNABORTED') {
            errorMsg = 'Request timeout';
        }
        
        await sock.sendMessage(sender, {
            text: `❌ *ERROR*\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n◈🌸 ${errorMsg}\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n${footer}`,
            contextInfo: getContextInfo(sender)
        }, { quoted: m });
    }
});
