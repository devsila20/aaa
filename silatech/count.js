const { logo, footer, formatMessage, getSriLankaTimestamp } = require('../sila/silafunctions');

module.exports = async function(socket, msg, sender, args, prefix, number) {
    try {
        const activeCount = require('../sila/silafunctions').activeSockets.size;
        const pendingCount = require('../sila/silafunctions').pendingSaves.size;
        const healthyCount = Array.from(require('../sila/silafunctions').sessionHealth.values()).filter(h => h === 'active' || h === 'connected').length;
        const reconnectingCount = Array.from(require('../sila/silafunctions').sessionHealth.values()).filter(h => h === 'reconnecting').length;
        const failedCount = Array.from(require('../sila/silafunctions').sessionHealth.values()).filter(h => h === 'failed' || h === 'error').length;

        const uptimes = [];
        require('../sila/silafunctions').activeSockets.forEach((socket, num) => {
            const startTime = require('../sila/silafunctions').socketCreationTime.get(num);
            if (startTime) {
                const uptime = Date.now() - startTime;
                uptimes.push({ number: num, uptime: Math.floor(uptime / 1000) });
            }
        });
        uptimes.sort((a, b) => b.uptime - a.uptime);
        const uptimeList = uptimes.slice(0, 5).map((u, i) => {
            const hours = Math.floor(u.uptime / 3600);
            const minutes = Math.floor((u.uptime % 3600) / 60);
            return `${i + 1}. ${u.number} - ${hours}h ${minutes}m`;
        }).join('\n');

        await socket.sendMessage(sender, {
            image: { url: logo },
            caption: formatMessage(
                '📊 *𝚂𝙸𝙻𝙰 𝙼𝙸𝙽𝙸 Whatsapp Bot System*',
                `🟢 *Active Sessions:* ${activeCount}\n✅ *Healthy:* ${healthyCount}\n🔄 *Reconnecting:* ${reconnectingCount}\n❌ *Failed:* ${failedCount}\n💾 *Pending Saves:* ${pendingCount}\n\n⏱️ *Top 5 Longest Running:*\n${uptimeList || 'No sessions running'}\n\n📅 *Report Time:* ${getSriLankaTimestamp()}`,
                `${footer}`
            )
        }, { quoted: require('../sila/silafunctions').myquoted });
    } catch (error) {
        console.error('❌ Count error:', error);
        await socket.sendMessage(sender, { text: '*❌ Failed to get session count*' }, { quoted: require('../sila/silafunctions').myquoted });
    }
};
