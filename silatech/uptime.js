const { socketCreationTime, footer, logo, botName, formatMessage } = require('../sila/silafunctions');

module.exports = async function(socket, msg, sender, args, prefix, number) {
    try {
        // React to command
        try { await socket.sendMessage(sender, { react: { text: "⏱️", key: msg.key } }); } catch(e){}

        const startTime = socketCreationTime.get(number) || Date.now();
        const uptimeMs = Date.now() - startTime;
        
        // Calculate time units
        const seconds = Math.floor((uptimeMs / 1000) % 60);
        const minutes = Math.floor((uptimeMs / (1000 * 60)) % 60);
        const hours = Math.floor((uptimeMs / (1000 * 60 * 60)) % 24);
        const days = Math.floor(uptimeMs / (1000 * 60 * 60 * 24));

        // Format uptime string
        let uptimeText = '';
        if (days > 0) uptimeText += `${days}d `;
        if (hours > 0 || days > 0) uptimeText += `${hours}h `;
        if (minutes > 0 || hours > 0 || days > 0) uptimeText += `${minutes}m `;
        uptimeText += `${seconds}s`;

        // Server uptime (Node.js process)
        const serverUptime = process.uptime();
        const serverDays = Math.floor(serverUptime / 86400);
        const serverHours = Math.floor((serverUptime % 86400) / 3600);
        const serverMinutes = Math.floor((serverUptime % 3600) / 60);
        const serverSeconds = Math.floor(serverUptime % 60);

        let serverUptimeText = '';
        if (serverDays > 0) serverUptimeText += `${serverDays}d `;
        if (serverHours > 0 || serverDays > 0) serverUptimeText += `${serverHours}h `;
        if (serverMinutes > 0 || serverHours > 0 || serverDays > 0) serverUptimeText += `${serverMinutes}m `;
        serverUptimeText += `${serverSeconds}s`;

        // Get start date
        const startDate = new Date(startTime);
        const formattedStartDate = startDate.toLocaleString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        const text = `
╭───❏ *𝚄𝙿𝚃𝙸𝙼𝙴 𝙸𝙽𝙵𝙾* ❏
│
│ 🤖 *Bot Name:* ${botName}
│ 🔢 *Session:* ${number}
│
│ ⏱️ *Bot Uptime:*
│    ${uptimeText}
│
│ 🖥️ *Server Uptime:*
│    ${serverUptimeText}
│
│ 📅 *Started:*
│    ${formattedStartDate}
│
│ 💾 *Memory Usage:*
│    ${(process.memoryUsage().rss / 1024 / 1024).toFixed(2)} MB
│
╰───────────────❏

> \`♱♱♱♱♱ 𝐏𝐨𝐰𝐞𝐝 𝐛𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡 ♱♱♱♱\`
`.trim();

        await socket.sendMessage(sender, {
            image: { url: logo },
            caption: text
        }, { quoted: msg });

    } catch (error) {
        console.error('❌ Uptime error:', error);
        await socket.sendMessage(sender, { 
            text: '*❌ Failed to get uptime information*' 
        }, { quoted: msg });
    }
};
