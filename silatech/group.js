const { cmd, footer, getContextInfo } = require('../sila/silafunctions');

// ===== 1. ADD MEMBER =====
cmd({
    pattern: "add",
    alias: ["addmember"],
    react: "➕",
    desc: "Add member to group",
    category: "group",
    filename: __filename
}, async (sock, m, sender, args, prefix, number) => {
    try {
        if (!m.key.remoteJid.endsWith('@g.us')) {
            return await sock.sendMessage(sender, {
                text: `❌ *GROUP ONLY*\n◈━◈━◈◈━◈━◈━◈━◈━◈━\n◈🌸 This command works in groups only\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n${footer}`,
                contextInfo: getContextInfo(sender)
            }, { quoted: m });
        }
        
        const user = args[0]?.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
        if (!args[0]) {
            return await sock.sendMessage(sender, {
                text: `➕ *ADD MEMBER*\n◈━◈━◈◈━◈━◈━◈━◈━◈━\n◈🌸 Example: ${prefix}add 255xxx\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n${footer}`,
                contextInfo: getContextInfo(sender)
            }, { quoted: m });
        }
        
        await sock.groupParticipantsUpdate(m.key.remoteJid, [user], 'add');
        
        await sock.sendMessage(sender, {
            text: `✅ *ADDED*\n◈━◈━◈◈━◈━◈━◈━◈━◈━\n◈🌸 @${user.split('@')[0]} added\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n${footer}`,
            mentions: [user],
            contextInfo: getContextInfo(sender)
        }, { quoted: m });
        
    } catch (error) {
        await sock.sendMessage(sender, {
            text: `❌ *FAILED*\n◈━◈━◈◈━◈━◈━◈━◈━◈━\n◈🌸 Could not add member\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n${footer}`,
            contextInfo: getContextInfo(sender)
        }, { quoted: m });
    }
});

// ===== 2. KICK MEMBER =====
cmd({
    pattern: "kick",
    alias: ["remove"],
    react: "👢",
    desc: "Remove member from group",
    category: "group",
    filename: __filename
}, async (sock, m, sender, args, prefix, number) => {
    try {
        if (!m.key.remoteJid.endsWith('@g.us')) {
            return await sock.sendMessage(sender, {
                text: `❌ *GROUP ONLY*\n◈━◈━◈◈━◈━◈━◈━◈━◈━\n◈🌸 This command works in groups only\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n${footer}`,
                contextInfo: getContextInfo(sender)
            }, { quoted: m });
        }
        
        let target = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
        if (!target) {
            return await sock.sendMessage(sender, {
                text: `👢 *KICK MEMBER*\n◈━◈━◈◈━◈━◈━◈━◈━◈━\n◈🌸 Mention user to kick\n◈🌸 Example: ${prefix}kick @user\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n${footer}`,
                contextInfo: getContextInfo(sender)
            }, { quoted: m });
        }
        
        await sock.groupParticipantsUpdate(m.key.remoteJid, [target], 'remove');
        
        await sock.sendMessage(sender, {
            text: `✅ *REMOVED*\n◈━◈━◈◈━◈━◈━◈━◈━◈━\n◈🌸 @${target.split('@')[0]} removed\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n${footer}`,
            mentions: [target],
            contextInfo: getContextInfo(sender)
        }, { quoted: m });
        
    } catch (error) {
        await sock.sendMessage(sender, {
            text: `❌ *FAILED*\n◈━◈━◈◈━◈━◈━◈━◈━◈━\n◈🌸 Could not remove member\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n${footer}`,
            contextInfo: getContextInfo(sender)
        }, { quoted: m });
    }
});

// ===== 3. PROMOTE TO ADMIN =====
cmd({
    pattern: "promote",
    alias: ["makeadmin"],
    react: "👑",
    desc: "Promote member to admin",
    category: "group",
    filename: __filename
}, async (sock, m, sender, args, prefix, number) => {
    try {
        if (!m.key.remoteJid.endsWith('@g.us')) {
            return await sock.sendMessage(sender, {
                text: `❌ *GROUP ONLY*\n◈━◈━◈◈━◈━◈━◈━◈━◈━\n◈🌸 This command works in groups only\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n${footer}`,
                contextInfo: getContextInfo(sender)
            }, { quoted: m });
        }
        
        let target = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
        if (!target) {
            return await sock.sendMessage(sender, {
                text: `👑 *PROMOTE*\n◈━◈━◈◈━◈━◈━◈━◈━◈━\n◈🌸 Mention user to promote\n◈🌸 Example: ${prefix}promote @user\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n${footer}`,
                contextInfo: getContextInfo(sender)
            }, { quoted: m });
        }
        
        await sock.groupParticipantsUpdate(m.key.remoteJid, [target], 'promote');
        
        await sock.sendMessage(sender, {
            text: `👑 *PROMOTED*\n◈━◈━◈◈━◈━◈━◈━◈━◈━\n◈🌸 @${target.split('@')[0]} is now admin\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n${footer}`,
            mentions: [target],
            contextInfo: getContextInfo(sender)
        }, { quoted: m });
        
    } catch (error) {
        await sock.sendMessage(sender, {
            text: `❌ *FAILED*\n◈━◈━◈◈━◈━◈━◈━◈━◈━\n◈🌸 Could not promote member\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n${footer}`,
            contextInfo: getContextInfo(sender)
        }, { quoted: m });
    }
});

// ===== 4. DEMOTE ADMIN =====
cmd({
    pattern: "demote",
    alias: ["removeadmin"],
    react: "⬇️",
    desc: "Demote admin to member",
    category: "group",
    filename: __filename
}, async (sock, m, sender, args, prefix, number) => {
    try {
        if (!m.key.remoteJid.endsWith('@g.us')) {
            return await sock.sendMessage(sender, {
                text: `❌ *GROUP ONLY*\n◈━◈━◈◈━◈━◈━◈━◈━◈━\n◈🌸 This command works in groups only\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n${footer}`,
                contextInfo: getContextInfo(sender)
            }, { quoted: m });
        }
        
        let target = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
        if (!target) {
            return await sock.sendMessage(sender, {
                text: `⬇️ *DEMOTE*\n◈━◈━◈◈━◈━◈━◈━◈━◈━\n◈🌸 Mention admin to demote\n◈🌸 Example: ${prefix}demote @user\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n${footer}`,
                contextInfo: getContextInfo(sender)
            }, { quoted: m });
        }
        
        await sock.groupParticipantsUpdate(m.key.remoteJid, [target], 'demote');
        
        await sock.sendMessage(sender, {
            text: `⬇️ *DEMOTED*\n◈━◈━◈◈━◈━◈━◈━◈━◈━\n◈🌸 @${target.split('@')[0]} is now member\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n${footer}`,
            mentions: [target],
            contextInfo: getContextInfo(sender)
        }, { quoted: m });
        
    } catch (error) {
        await sock.sendMessage(sender, {
            text: `❌ *FAILED*\n◈━◈━◈◈━◈━◈━◈━◈━◈━\n◈🌸 Could not demote admin\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n${footer}`,
            contextInfo: getContextInfo(sender)
        }, { quoted: m });
    }
});

// ===== 5. GROUP LINK =====
cmd({
    pattern: "grouplink",
    alias: ["link", "gclink"],
    react: "🔗",
    desc: "Get group invite link",
    category: "group",
    filename: __filename
}, async (sock, m, sender, args, prefix, number) => {
    try {
        if (!m.key.remoteJid.endsWith('@g.us')) {
            return await sock.sendMessage(sender, {
                text: `❌ *GROUP ONLY*\n◈━◈━◈◈━◈━◈━◈━◈━◈━\n◈🌸 This command works in groups only\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n${footer}`,
                contextInfo: getContextInfo(sender)
            }, { quoted: m });
        }
        
        const code = await sock.groupInviteCode(m.key.remoteJid);
        const link = `https://chat.whatsapp.com/${code}`;
        
        await sock.sendMessage(sender, {
            text: `🔗 *GROUP LINK*\n◈━◈━◈◈━◈━◈━◈━◈━◈━\n◈🌸 ${link}\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n${footer}`,
            contextInfo: getContextInfo(sender)
        }, { quoted: m });
        
    } catch (error) {
        await sock.sendMessage(sender, {
            text: `❌ *FAILED*\n◈━◈━◈◈━◈━◈━◈━◈━◈━\n◈🌸 Could not get group link\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n${footer}`,
            contextInfo: getContextInfo(sender)
        }, { quoted: m });
    }
});

// ===== 6. GROUP SETTINGS =====
cmd({
    pattern: "group",
    alias: ["gcinfo", "groupinfo"],
    react: "📋",
    desc: "Get group information",
    category: "group",
    filename: __filename
}, async (sock, m, sender, args, prefix, number) => {
    try {
        if (!m.key.remoteJid.endsWith('@g.us')) {
            return await sock.sendMessage(sender, {
                text: `❌ *GROUP ONLY*\n◈━◈━◈◈━◈━◈━◈━◈━◈━\n◈🌸 This command works in groups only\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n${footer}`,
                contextInfo: getContextInfo(sender)
            }, { quoted: m });
        }
        
        const metadata = await sock.groupMetadata(m.key.remoteJid);
        const admins = metadata.participants.filter(p => p.admin).length;
        const members = metadata.participants.length;
        
        await sock.sendMessage(sender, {
            text: `📋 *GROUP INFO*\n◈━◈━◈◈━◈━◈━◈━◈━◈━\n◈🌸 *Name:* ${metadata.subject}\n◈🌸 *Members:* ${members}\n◈🌸 *Admins:* ${admins}\n◈🌸 *Created:* ${new Date(metadata.creation * 1000).toDateString()}\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n${footer}`,
            contextInfo: getContextInfo(sender)
        }, { quoted: m });
        
    } catch (error) {
        await sock.sendMessage(sender, {
            text: `❌ *FAILED*\n◈━◈━◈◈━◈━◈━◈━◈━◈━\n◈🌸 Could not get group info\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n${footer}`,
            contextInfo: getContextInfo(sender)
        }, { quoted: m });
    }
});

// ===== 7. REVOKE LINK =====
cmd({
    pattern: "revoke",
    alias: ["resetlink", "newlink"],
    react: "🔄",
    desc: "Revoke and get new group link",
    category: "group",
    filename: __filename
}, async (sock, m, sender, args, prefix, number) => {
    try {
        if (!m.key.remoteJid.endsWith('@g.us')) {
            return await sock.sendMessage(sender, {
                text: `❌ *GROUP ONLY*\n◈━◈━◈◈━◈━◈━◈━◈━◈━\n◈🌸 This command works in groups only\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n${footer}`,
                contextInfo: getContextInfo(sender)
            }, { quoted: m });
        }
        
        await sock.groupRevokeInvite(m.key.remoteJid);
        const code = await sock.groupInviteCode(m.key.remoteJid);
        const link = `https://chat.whatsapp.com/${code}`;
        
        await sock.sendMessage(sender, {
            text: `🔄 *LINK RESET*\n◈━◈━◈◈━◈━◈━◈━◈━◈━\n◈🌸 New link: ${link}\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n${footer}`,
            contextInfo: getContextInfo(sender)
        }, { quoted: m });
        
    } catch (error) {
        await sock.sendMessage(sender, {
            text: `❌ *FAILED*\n◈━◈━◈◈━◈━◈━◈━◈━◈━\n◈🌸 Could not revoke link\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n${footer}`,
            contextInfo: getContextInfo(sender)
        }, { quoted: m });
    }
});

// ===== 8. TAG ALL =====
cmd({
    pattern: "tagall",
    alias: ["everyone", "all"],
    react: "📢",
    desc: "Tag all group members",
    category: "group",
    filename: __filename
}, async (sock, m, sender, args, prefix, number) => {
    try {
        if (!m.key.remoteJid.endsWith('@g.us')) {
            return await sock.sendMessage(sender, {
                text: `❌ *GROUP ONLY*\n◈━◈━◈◈━◈━◈━◈━◈━◈━\n◈🌸 This command works in groups only\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n${footer}`,
                contextInfo: getContextInfo(sender)
            }, { quoted: m });
        }
        
        const metadata = await sock.groupMetadata(m.key.remoteJid);
        const members = metadata.participants.map(p => p.id);
        const message = args.join(' ') || 'Attention everyone!';
        
        await sock.sendMessage(m.key.remoteJid, {
            text: `📢 *TAG ALL*\n◈━◈━◈◈━◈━◈━◈━◈━◈━\n${members.map(id => `◈🌸 @${id.split('@')[0]}`).join('\n')}\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n◈🌸 *Message:* ${message}\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n${footer}`,
            mentions: members,
            contextInfo: getContextInfo(sender)
        }, { quoted: m });
        
    } catch (error) {
        await sock.sendMessage(sender, {
            text: `❌ *FAILED*\n◈━◈━◈◈━◈━◈━◈━◈━◈━\n◈🌸 Could not tag members\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n${footer}`,
            contextInfo: getContextInfo(sender)
        }, { quoted: m });
    }
});

// ===== 9. GROUP ADMINS LIST =====
cmd({
    pattern: "admins",
    alias: ["adminlist", "staff"],
    react: "👥",
    desc: "List all group admins",
    category: "group",
    filename: __filename
}, async (sock, m, sender, args, prefix, number) => {
    try {
        if (!m.key.remoteJid.endsWith('@g.us')) {
            return await sock.sendMessage(sender, {
                text: `❌ *GROUP ONLY*\n◈━◈━◈◈━◈━◈━◈━◈━◈━\n◈🌸 This command works in groups only\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n${footer}`,
                contextInfo: getContextInfo(sender)
            }, { quoted: m });
        }
        
        const metadata = await sock.groupMetadata(m.key.remoteJid);
        const admins = metadata.participants.filter(p => p.admin);
        
        let text = `👥 *GROUP ADMINS*\n◈━◈━◈◈━◈━◈━◈━◈━◈━\n`;
        admins.forEach((admin, i) => {
            text += `◈🌸 @${admin.id.split('@')[0]} ${admin.admin === 'superadmin' ? '👑' : '🔹'}\n`;
        });
        text += `◈━◈━◈━◈━◈━◈━◈━◈━◈━\n${footer}`;
        
        await sock.sendMessage(sender, {
            text,
            mentions: admins.map(a => a.id),
            contextInfo: getContextInfo(sender)
        }, { quoted: m });
        
    } catch (error) {
        await sock.sendMessage(sender, {
            text: `❌ *FAILED*\n◈━◈━◈◈━◈━◈━◈━◈━◈━\n◈🌸 Could not get admins\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n${footer}`,
            contextInfo: getContextInfo(sender)
        }, { quoted: m });
    }
});

// ===== 10. HIDE TAG =====
cmd({
    pattern: "hidetag",
    alias: ["htag", "silent"],
    react: "🤫",
    desc: "Send hidden tag message",
    category: "group",
    filename: __filename
}, async (sock, m, sender, args, prefix, number) => {
    try {
        if (!m.key.remoteJid.endsWith('@g.us')) {
            return await sock.sendMessage(sender, {
                text: `❌ *GROUP ONLY*\n◈━◈━◈◈━◈━◈━◈━◈━◈━\n◈🌸 This command works in groups only\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n${footer}`,
                contextInfo: getContextInfo(sender)
            }, { quoted: m });
        }
        
        const metadata = await sock.groupMetadata(m.key.remoteJid);
        const members = metadata.participants.map(p => p.id);
        const message = args.join(' ') || '👋';
        
        await sock.sendMessage(m.key.remoteJid, {
            text: message,
            mentions: members,
            contextInfo: getContextInfo(sender)
        });
        
    } catch (error) {
        await sock.sendMessage(sender, {
            text: `❌ *FAILED*\n◈━◈━◈◈━◈━◈━◈━◈━◈━\n${footer}`,
            contextInfo: getContextInfo(sender)
        }, { quoted: m });
    }
});

// ===== 11. LOCK GROUP =====
cmd({
    pattern: "lock",
    alias: ["closegc", "lockgc"],
    react: "🔒",
    desc: "Close group - only admins can send messages",
    category: "group",
    filename: __filename
}, async (sock, m, sender, args, prefix, number) => {
    try {
        if (!m.key.remoteJid.endsWith('@g.us')) {
            return await sock.sendMessage(sender, {
                text: `❌ *GROUP ONLY*\n◈━◈━◈◈━◈━◈━◈━◈━◈━\n◈🌸 This command works in groups only\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n${footer}`,
                contextInfo: getContextInfo(sender)
            }, { quoted: m });
        }
        
        await sock.groupSettingUpdate(m.key.remoteJid, 'announcement');
        
        await sock.sendMessage(sender, {
            text: `🔒 *GROUP LOCKED*\n◈━◈━◈◈━◈━◈━◈━◈━◈━\n◈🌸 Only admins can send messages now\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n${footer}`,
            contextInfo: getContextInfo(sender)
        }, { quoted: m });
        
    } catch (error) {
        await sock.sendMessage(sender, {
            text: `❌ *FAILED*\n◈━◈━◈◈━◈━◈━◈━◈━◈━\n${footer}`,
            contextInfo: getContextInfo(sender)
        }, { quoted: m });
    }
});

// ===== 12. UNLOCK GROUP =====
cmd({
    pattern: "unlock",
    alias: ["opengc", "unlockgc"],
    react: "🔓",
    desc: "Open group - all members can send messages",
    category: "group",
    filename: __filename
}, async (sock, m, sender, args, prefix, number) => {
    try {
        if (!m.key.remoteJid.endsWith('@g.us')) {
            return await sock.sendMessage(sender, {
                text: `❌ *GROUP ONLY*\n◈━◈━◈◈━◈━◈━◈━◈━◈━\n◈🌸 This command works in groups only\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n${footer}`,
                contextInfo: getContextInfo(sender)
            }, { quoted: m });
        }
        
        await sock.groupSettingUpdate(m.key.remoteJid, 'not_announcement');
        
        await sock.sendMessage(sender, {
            text: `🔓 *GROUP OPENED*\n◈━◈━◈◈━◈━◈━◈━◈━◈━\n◈🌸 All members can send messages now\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n${footer}`,
            contextInfo: getContextInfo(sender)
        }, { quoted: m });
        
    } catch (error) {
        await sock.sendMessage(sender, {
            text: `❌ *FAILED*\n◈━◈━◈◈━◈━◈━◈━◈━◈━\n${footer}`,
            contextInfo: getContextInfo(sender)
        }, { quoted: m });
    }
});

// ===== 13. SET GROUP NAME =====
cmd({
    pattern: "setname",
    alias: ["gcname", "groupname"],
    react: "✏️",
    desc: "Change group name",
    category: "group",
    filename: __filename
}, async (sock, m, sender, args, prefix, number) => {
    try {
        if (!m.key.remoteJid.endsWith('@g.us')) {
            return await sock.sendMessage(sender, {
                text: `❌ *GROUP ONLY*\n◈━◈━◈◈━◈━◈━◈━◈━◈━\n◈🌸 This command works in groups only\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n${footer}`,
                contextInfo: getContextInfo(sender)
            }, { quoted: m });
        }
        
        const newName = args.join(' ');
        if (!newName) {
            return await sock.sendMessage(sender, {
                text: `✏️ *SET NAME*\n◈━◈━◈◈━◈━◈━◈━◈━◈━\n◈🌸 Example: ${prefix}setname My Group\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n${footer}`,
                contextInfo: getContextInfo(sender)
            }, { quoted: m });
        }
        
        await sock.groupUpdateSubject(m.key.remoteJid, newName);
        
        await sock.sendMessage(sender, {
            text: `✅ *NAME CHANGED*\n◈━◈━◈◈━◈━◈━◈━◈━◈━\n◈🌸 Group name: ${newName}\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n${footer}`,
            contextInfo: getContextInfo(sender)
        }, { quoted: m });
        
    } catch (error) {
        await sock.sendMessage(sender, {
            text: `❌ *FAILED*\n◈━◈━◈◈━◈━◈━◈━◈━◈━\n${footer}`,
            contextInfo: getContextInfo(sender)
        }, { quoted: m });
    }
});

// ===== 14. SET GROUP DESCRIPTION =====
cmd({
    pattern: "setdesc",
    alias: ["gcdesc", "about"],
    react: "📝",
    desc: "Change group description",
    category: "group",
    filename: __filename
}, async (sock, m, sender, args, prefix, number) => {
    try {
        if (!m.key.remoteJid.endsWith('@g.us')) {
            return await sock.sendMessage(sender, {
                text: `❌ *GROUP ONLY*\n◈━◈━◈◈━◈━◈━◈━◈━◈━\n${footer}`,
                contextInfo: getContextInfo(sender)
            }, { quoted: m });
        }
        
        const desc = args.join(' ');
        if (!desc) {
            return await sock.sendMessage(sender, {
                text: `📝 *SET DESCRIPTION*\n◈━◈━◈◈━◈━◈━◈━◈━◈━\n◈🌸 Example: ${prefix}setdesc Welcome!\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n${footer}`,
                contextInfo: getContextInfo(sender)
            }, { quoted: m });
        }
        
        await sock.groupUpdateDescription(m.key.remoteJid, desc);
        
        await sock.sendMessage(sender, {
            text: `✅ *DESCRIPTION SET*\n◈━◈━◈◈━◈━◈━◈━◈━◈━\n${footer}`,
            contextInfo: getContextInfo(sender)
        }, { quoted: m });
        
    } catch (error) {
        await sock.sendMessage(sender, {
            text: `❌ *FAILED*\n◈━◈━◈◈━◈━◈━◈━◈━◈━\n${footer}`,
            contextInfo: getContextInfo(sender)
        }, { quoted: m });
    }
});

// ===== 15. MUTE GROUP =====
cmd({
    pattern: "mute",
    alias: ["silence", "mutechat"],
    react: "🔇",
    desc: "Mute group notifications for bot",
    category: "group",
    filename: __filename
}, async (sock, m, sender, args, prefix, number) => {
    try {
        if (!m.key.remoteJid.endsWith('@g.us')) {
            return await sock.sendMessage(sender, {
                text: `❌ *GROUP ONLY*\n◈━◈━◈◈━◈━◈━◈━◈━◈━\n${footer}`,
                contextInfo: getContextInfo(sender)
            }, { quoted: m });
        }
        
        await sock.chatModify({ mute: 8 * 60 * 60 * 1000 }, m.key.remoteJid);
        
        await sock.sendMessage(sender, {
            text: `🔇 *MUTED*\n◈━◈━◈◈━◈━◈━◈━◈━◈━\n◈🌸 Group muted for 8 hours\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n${footer}`,
            contextInfo: getContextInfo(sender)
        }, { quoted: m });
        
    } catch (error) {
        await sock.sendMessage(sender, {
            text: `❌ *FAILED*\n◈━◈━◈◈━◈━◈━◈━◈━◈━\n${footer}`,
            contextInfo: getContextInfo(sender)
        }, { quoted: m });
    }
});

// ===== 16. UNMUTE GROUP =====
cmd({
    pattern: "unmute",
    alias: ["unsilence"],
    react: "🔊",
    desc: "Unmute group notifications",
    category: "group",
    filename: __filename
}, async (sock, m, sender, args, prefix, number) => {
    try {
        if (!m.key.remoteJid.endsWith('@g.us')) {
            return await sock.sendMessage(sender, {
                text: `❌ *GROUP ONLY*\n◈━◈━◈◈━◈━◈━◈━◈━◈━\n${footer}`,
                contextInfo: getContextInfo(sender)
            }, { quoted: m });
        }
        
        await sock.chatModify({ mute: null }, m.key.remoteJid);
        
        await sock.sendMessage(sender, {
            text: `🔊 *UNMUTED*\n◈━◈━◈◈━◈━◈━◈━◈━◈━\n◈🌸 Group notifications on\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n${footer}`,
            contextInfo: getContextInfo(sender)
        }, { quoted: m });
        
    } catch (error) {
        await sock.sendMessage(sender, {
            text: `❌ *FAILED*\n◈━◈━◈◈━◈━◈━◈━◈━◈━\n${footer}`,
            contextInfo: getContextInfo(sender)
        }, { quoted: m });
    }
});

// ===== 17. DELETE MESSAGE =====
cmd({
    pattern: "delete",
    alias: ["del", "d"],
    react: "🗑️",
    desc: "Delete replied message",
    category: "group",
    filename: __filename
}, async (sock, m, sender, args, prefix, number) => {
    try {
        const replied = m.message?.extendedTextMessage?.contextInfo?.stanzaId;
        const participant = m.message?.extendedTextMessage?.contextInfo?.participant;
        
        if (!replied || !participant) {
            return await sock.sendMessage(sender, {
                text: `🗑️ *DELETE*\n◈━◈━◈◈━◈━◈━◈━◈━◈━\n◈🌸 Reply to message to delete\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n${footer}`,
                contextInfo: getContextInfo(sender)
            }, { quoted: m });
        }
        
        await sock.sendMessage(m.key.remoteJid, {
            delete: { remoteJid: m.key.remoteJid, fromMe: false, id: replied, participant }
        });
        
    } catch (error) {
        await sock.sendMessage(sender, {
            text: `❌ *FAILED*\n◈━◈━◈◈━◈━◈━◈━◈━◈━\n${footer}`,
            contextInfo: getContextInfo(sender)
        }, { quoted: m });
    }
});

// ===== 18. WARN MEMBER =====
cmd({
    pattern: "warn",
    alias: ["warning"],
    react: "⚠️",
    desc: "Warn a group member",
    category: "group",
    filename: __filename
}, async (sock, m, sender, args, prefix, number) => {
    try {
        if (!m.key.remoteJid.endsWith('@g.us')) {
            return await sock.sendMessage(sender, {
                text: `❌ *GROUP ONLY*\n◈━◈━◈◈━◈━◈━◈━◈━◈━\n${footer}`,
                contextInfo: getContextInfo(sender)
            }, { quoted: m });
        }
        
        const target = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
        const reason = args.join(' ') || 'No reason';
        
        if (!target) {
            return await sock.sendMessage(sender, {
                text: `⚠️ *WARN*\n◈━◈━◈◈━◈━◈━◈━◈━◈━\n◈🌸 Example: ${prefix}warn @user reason\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n${footer}`,
                contextInfo: getContextInfo(sender)
            }, { quoted: m });
        }
        
        await sock.sendMessage(m.key.remoteJid, {
            text: `⚠️ *WARNING*\n◈━◈━◈◈━◈━◈━◈━◈━◈━\n◈🌸 @${target.split('@')[0]} you have been warned\n◈🌸 *Reason:* ${reason}\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n${footer}`,
            mentions: [target],
            contextInfo: getContextInfo(sender)
        }, { quoted: m });
        
    } catch (error) {
        await sock.sendMessage(sender, {
            text: `❌ *FAILED*\n◈━◈━◈◈━◈━◈━◈━◈━◈━\n${footer}`,
            contextInfo: getContextInfo(sender)
        }, { quoted: m });
    }
});

// ===== 19. POLL =====
cmd({
    pattern: "poll",
    alias: ["vote", "question"],
    react: "📊",
    desc: "Create a poll",
    category: "group",
    filename: __filename
}, async (sock, m, sender, args, prefix, number) => {
    try {
        const text = args.join(' ');
        if (!text.includes('|')) {
            return await sock.sendMessage(sender, {
                text: `📊 *POLL*\n◈━◈━◈◈━◈━◈━◈━◈━◈━\n◈🌸 Example: ${prefix}poll Question | Option1 | Option2\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n${footer}`,
                contextInfo: getContextInfo(sender)
            }, { quoted: m });
        }
        
        const [question, ...options] = text.split('|').map(s => s.trim());
        
        await sock.sendMessage(m.key.remoteJid, {
            poll: {
                name: question,
                values: options,
                selectableCount: 1
            }
        }, { quoted: m });
        
    } catch (error) {
        await sock.sendMessage(sender, {
            text: `❌ *FAILED*\n◈━◈━◈◈━◈━◈━◈━◈━◈━\n${footer}`,
            contextInfo: getContextInfo(sender)
        }, { quoted: m });
    }
});

// ===== 20. RULES =====
cmd({
    pattern: "rules",
    alias: ["gcrules"],
    react: "📜",
    desc: "Set or view group rules",
    category: "group",
    filename: __filename
}, async (sock, m, sender, args, prefix, number) => {
    try {
        if (!m.key.remoteJid.endsWith('@g.us')) {
            return await sock.sendMessage(sender, {
                text: `❌ *GROUP ONLY*\n◈━◈━◈◈━◈━◈━◈━◈━◈━\n${footer}`,
                contextInfo: getContextInfo(sender)
            }, { quoted: m });
        }
        
        const rules = args.join(' ');
        
        if (!rules) {
            return await sock.sendMessage(sender, {
                text: `📜 *GROUP RULES*\n◈━◈━◈◈━◈━◈━◈━◈━◈━\n◈🌸 Respect all members\n◈🌸 No spam\n◈🌸 No links without permission\n◈🌸 Follow admin instructions\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n${footer}`,
                contextInfo: getContextInfo(sender)
            }, { quoted: m });
        }
        
        await sock.sendMessage(m.key.remoteJid, {
            text: `📜 *GROUP RULES*\n◈━◈━◈◈━◈━◈━◈━◈━◈━\n${rules}\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n${footer}`,
            contextInfo: getContextInfo(sender)
        });
        
    } catch (error) {
        await sock.sendMessage(sender, {
            text: `❌ *FAILED*\n◈━◈━◈◈━◈━◈━◈━◈━◈━\n${footer}`,
            contextInfo: getContextInfo(sender)
        }, { quoted: m });
    }
});
