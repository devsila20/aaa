const { cmd, footer, logo, config } = require('../sila/silafunctions');

module.exports = cmd({
    pattern: "owner",
    alias: ["creator", "dev"],
    react: "👑",
    desc: "Show bot owner info",
    category: "system",
    filename: __filename
}, async (sock, m, sender, args, prefix, number) => {
    const ownerMsg = `👑 *OWNER INFO* 👑\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n◈🌸 *Name*: Sila Tech\n◈🌸 *Number*: ${config.OWNER_NUMBER}\n◈🌸 *Bot*: ${require('../sila/silafunctions').botName}\n◈🌸 *Version*: 2.0.0\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n${footer}`;
    
    await sock.sendMessage(sender, {
        image: { url: logo },
        caption: ownerMsg
    });
});