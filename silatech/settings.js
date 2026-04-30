const { logo, footer, formatMessage, config, loadUserConfig, updateUserConfig } = require('../sila/silafunctions');

module.exports = async function(socket, msg, sender, args, prefix, number) {
    const settingsText = `*⚙️ 𝐂𝐔𝐑𝐑𝐄𝐍𝐓 𝐒𝐄𝐓𝐓𝐈𝐍𝐆𝐒*

📌 *Prefix:* ${config.PREFIX}
👁️ *Auto View Status:* ${config.AUTO_VIEW_STATUS}
❤️ *Auto Like Status:* ${config.AUTO_LIKE_STATUS}
🎙️ *Auto Recording:* ${config.AUTO_RECORDING}
😊 *Auto Like Emojis:* ${config.AUTO_LIKE_EMOJI.join(', ')}

*Commands to change:*
• ${config.PREFIX}setprefix [new prefix]
• ${config.PREFIX}autoview [on/off]
• ${config.PREFIX}autolike [on/off]
• ${config.PREFIX}autorecording [on/off]
• ${config.PREFIX}setemojis [emoji1 emoji2...]`;

    await socket.sendMessage(sender, {
        image: { url: logo },
        caption: formatMessage('⚙️ 𝐁𝐎𝐓 𝐒𝐄𝐓𝐓𝐈𝐍𝐆𝐒', settingsText, '𝚂𝙸𝙻𝙰-𝙼𝙳 BOT SETTINGS')
    }, { quoted: require('../sila/silafunctions').myquoted });
};
