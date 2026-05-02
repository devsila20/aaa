const { cmd, footer, config } = require('../sila/silafunctions');
const { getAntilinkStatus, getGroupWarnings, clearWarnings } = require('../sila/silalink');

module.exports = cmd({
    pattern: "antilink",
    alias: ["antilinkon", "antilinkoff", "antilinkstatus", "antilinkwarn", "antilinkclear"],
    react: "🛡️",
    desc: "Manage antilink protection",
    category: "group",
    filename: __filename
}, async (sock, m, sender, args, prefix, number) => {
    const command = args[0]?.toLowerCase();
    const userConfig = require('../sila/silafunctions').config;
    
    if (!command || command === 'status') {
        const status = getAntilinkStatus();
        let statusMsg = `🛡️ *ANTILINK STATUS*\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n◈🌸 *Status*: ${status.enabled ? 'ON ✅' : 'OFF ❌'}\n◈🌸 *Action*: ${status.action}\n◈🌸 *Warn Limit*: ${status.warnLimit}\n◈🌸 *Warned Users*: ${status.totalWarnedUsers}\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n${footer}`;
        return await sock.sendMessage(sender, { text: statusMsg });
    }
    
    if (command === 'on') {
        config.ANTILINK_ENABLED = 'true';
        await sock.sendMessage(sender, {
            text: `🛡️ *ANTILINK ACTIVATED*\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n◈🌸 Link protection is now ON\n◈🌸 Action: ${config.ANTILINK_ACTION}\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n${footer}`
        });
    } else if (command === 'off') {
        config.ANTILINK_ENABLED = 'false';
        await sock.sendMessage(sender, {
            text: `⚠️ *ANTILINK DEACTIVATED*\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n◈🌸 Link protection is now OFF\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n${footer}`
        });
    } else if (command === 'warn') {
        if (!m.key.remoteJid.endsWith('@g.us')) {
            return await sock.sendMessage(sender, { text: '❌ This command only works in groups!' });
        }
        const warnings = getGroupWarnings(m.key.remoteJid);
        if (warnings.length === 0) {
            return await sock.sendMessage(sender, {
                text: `📊 *NO WARNINGS*\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n◈🌸 No warnings in this group\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n${footer}`
            });
        }
        let warnMsg = `📊 *GROUP WARNINGS*\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n`;
        warnings.forEach(w => {
            warnMsg += `◈⚠️ @${w.userJid.split('@')[0]}: ${w.count}/${config.ANTILINK_WARN_LIMIT}\n`;
        });
        warnMsg += `◈━◈━◈━◈━◈━◈━◈━◈━◈━\n${footer}`;
        await sock.sendMessage(sender, { text: warnMsg, mentions: warnings.map(w => w.userJid) });
    } else if (command === 'clear') {
        if (!m.key.remoteJid.endsWith('@g.us')) {
            return await sock.sendMessage(sender, { text: '❌ This command only works in groups!' });
        }
        const mentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid;
        if (mentioned && mentioned.length > 0) {
            mentioned.forEach(user => clearWarnings(m.key.remoteJid, user));
            await sock.sendMessage(sender, {
                text: `✅ *WARNINGS CLEARED*\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n◈🌸 Cleared warnings for mentioned users\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n${footer}`
            });
        } else {
            await sock.sendMessage(sender, {
                text: `❌ Please mention user(s) to clear warnings!\n\nUsage: ${prefix}antilink clear @user`
            });
        }
    }
});