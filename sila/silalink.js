// ===== ANTILINK MODULE =====
const { config, isOwner, getContextInfo } = require('./silafunctions');

// Store warnings per group/user
const warnStore = new Map();

// URL Detection Patterns
const URL_PATTERNS = [
    /https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&\/=]*)/gi,
    /[-a-zA-Z0-9@:%._\+~#=]{1,256}\.(com|net|org|io|xyz|me|co|uk|tk|ml|ga|cf|gq|info|online|site|tech|store|blog|app|dev|cloud|live|pro|digital|world|life|today|run|click|link|pw|top|bid|trade|date|download|review|racing|accountant|science|party|webcam|cricket|faith|win|men|stream|loan|country)\b/gi,
    /wa\.me\/[-a-zA-Z0-9@:%._\+~#=]{1,256}/gi,
    /chat\.whatsapp\.com\/[-a-zA-Z0-9@:%._\+~#=]{1,256}/gi,
];

// Whitelist domains
const WHITELIST_DOMAINS = [
    'whatsapp.com',
    'youtube.com',
    'youtu.be',
    'google.com',
    'github.com',
    'facebook.com',
    'instagram.com',
    'twitter.com',
    'tiktok.com',
    ...(config.ANTILINK_WHITELIST || [])
];

/**
 * Detect URLs in text
 */
function detectUrls(text) {
    if (!text) return { hasUrl: false, urls: [], isWhitelisted: false };
    
    let foundUrls = [];
    
    for (const pattern of URL_PATTERNS) {
        const matches = text.match(pattern);
        if (matches) {
            foundUrls = foundUrls.concat(matches);
        }
    }
    
    if (foundUrls.length === 0) {
        return { hasUrl: false, urls: [], isWhitelisted: false };
    }
    
    // Check if all URLs are whitelisted
    const isWhitelisted = foundUrls.every(url => {
        return WHITELIST_DOMAINS.some(domain => 
            url.toLowerCase().includes(domain.toLowerCase())
        );
    });
    
    return {
        hasUrl: true,
        urls: [...new Set(foundUrls)],
        isWhitelisted
    };
}

/**
 * Get warning key
 */
function getWarningKey(groupJid, userJid) {
    return `${groupJid}_${userJid}`;
}

/**
 * Get warnings count
 */
function getWarnings(groupJid, userJid) {
    const key = getWarningKey(groupJid, userJid);
    return warnStore.get(key) || 0;
}

/**
 * Add warning
 */
function addWarning(groupJid, userJid) {
    const key = getWarningKey(groupJid, userJid);
    const current = warnStore.get(key) || 0;
    const newCount = current + 1;
    warnStore.set(key, newCount);
    
    // Auto-clear after 1 hour
    setTimeout(() => {
        if (warnStore.get(key) === newCount) {
            warnStore.delete(key);
        }
    }, 3600000);
    
    return newCount;
}

/**
 * Clear warnings
 */
function clearWarnings(groupJid, userJid) {
    const key = getWarningKey(groupJid, userJid);
    warnStore.delete(key);
}

/**
 * Get group warnings
 */
function getGroupWarnings(groupJid) {
    const warnings = [];
    for (const [key, count] of warnStore) {
        if (key.startsWith(groupJid)) {
            const [, userJid] = key.split('_');
            warnings.push({ userJid, count });
        }
    }
    return warnings;
}

/**
 * Check if user is group admin
 */
async function isGroupAdmin(socket, groupJid, userJid) {
    try {
        const groupMetadata = await socket.groupMetadata(groupJid);
        const participant = groupMetadata.participants.find(p => p.id === userJid);
        return participant && (participant.admin === 'admin' || participant.admin === 'superadmin');
    } catch (err) {
        return false;
    }
}

/**
 * MAIN ANTILINK HANDLER
 */
async function handleAntilink(socket, msg) {
    try {
        // Check if antilink is enabled
        if (config.ANTILINK_ENABLED !== 'true') return;
        
        // Only work in groups
        if (!msg.key.remoteJid || !msg.key.remoteJid.endsWith('@g.us')) return;
        
        const groupJid = msg.key.remoteJid;
        const userJid = msg.key.participant || msg.key.remoteJid;
        
        // Skip if group is exempted
        if (config.ANTILINK_ALLOWED_GROUPS?.includes(groupJid)) return;
        
        // ===== ADMIN BYPASS =====
        // Check if sender is bot owner
        const senderNumber = userJid.replace('@s.whatsapp.net', '').replace(/[^0-9]/g, '');
        const ownerNumber = config.OWNER_NUMBER.replace(/[^0-9]/g, '');
        
        if (senderNumber === ownerNumber) {
            console.log(`👑 Owner bypass: ${senderNumber}`);
            return; // Skip owner
        }
        
        // Check if sender is group admin
        const isAdmin = await isGroupAdmin(socket, groupJid, userJid);
        if (isAdmin) {
            console.log(`👮 Admin bypass: ${userJid.split('@')[0]}`);
            return; // Skip group admins
        }
        
        // Get message text
        let messageText = '';
        if (msg.message?.conversation) {
            messageText = msg.message.conversation;
        } else if (msg.message?.extendedTextMessage?.text) {
            messageText = msg.message.extendedTextMessage.text;
        } else if (msg.message?.imageMessage?.caption) {
            messageText = msg.message.imageMessage.caption;
        } else if (msg.message?.videoMessage?.caption) {
            messageText = msg.message.videoMessage.caption;
        }
        
        if (!messageText) return;
        
        // Detect URLs
        const detection = detectUrls(messageText);
        
        // Skip if no URLs or whitelisted
        if (!detection.hasUrl || detection.isWhitelisted) return;
        
        console.log(`🔗 Antilink: ${userJid.split('@')[0]} in ${groupJid.split('@')[0]}`);
        console.log(`🔗 URLs: ${detection.urls.join(', ')}`);
        
        // ===== DELETE MESSAGE =====
        try {
            await socket.sendMessage(groupJid, {
                delete: msg.key
            });
        } catch (err) {
            console.error('❌ Delete failed:', err.message);
        }
        
        const action = config.ANTILINK_ACTION || 'delete';
        const contextInfo = getContextInfo(userJid);
        
        switch (action) {
            case 'delete':
                // Just delete with warning
                await socket.sendMessage(groupJid, {
                    text: `⚠️ *ANTILINK WARNING*\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n◈🌸 @${userJid.split('@')[0]} links are not allowed in this group!\n◈🌸 Your message has been deleted.\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n> 𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐛𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡`,
                    mentions: [userJid],
                    contextInfo
                });
                break;
                
            case 'kick':
                // Remove user immediately
                try {
                    await socket.groupParticipantsUpdate(groupJid, [userJid], 'remove');
                    await socket.sendMessage(groupJid, {
                        text: `🚫 *ANTILINK ACTION*\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n◈🌸 @${userJid.split('@')[0]} has been removed for sending links\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n> 𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐛𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡`,
                        mentions: [userJid],
                        contextInfo
                    });
                } catch (err) {
                    await socket.sendMessage(groupJid, {
                        text: `❌ *FAILED TO REMOVE*\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n◈🌸 Unable to remove user. Make sure bot is admin.\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n> 𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐛𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡`,
                        contextInfo
                    });
                }
                break;
                
            case 'warn':
                // Warning system with limit
                const warningCount = addWarning(groupJid, userJid);
                const warnLimit = config.ANTILINK_WARN_LIMIT || 3;
                
                if (warningCount >= warnLimit) {
                    // Remove after reaching limit
                    try {
                        await socket.groupParticipantsUpdate(groupJid, [userJid], 'remove');
                        clearWarnings(groupJid, userJid);
                        await socket.sendMessage(groupJid, {
                            text: `🚫 *ANTILINK REMOVAL*\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n◈🌸 @${userJid.split('@')[0]} has been removed\n◈🌸 Reason: ${warningCount}/${warnLimit} link warnings\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n> 𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐛𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡`,
                            mentions: [userJid],
                            contextInfo
                        });
                    } catch (err) {
                        await socket.sendMessage(groupJid, {
                            text: `❌ *FAILED TO REMOVE*\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n◈🌸 Unable to remove user. Make sure bot is admin.\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n> 𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐛𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡`,
                            contextInfo
                        });
                    }
                } else {
                    // Send warning
                    await socket.sendMessage(groupJid, {
                        text: `⚠️ *ANTILINK WARNING ${warningCount}/${warnLimit}*\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n◈🌸 @${userJid.split('@')[0]} links are not allowed!\n◈🌸 Warning: ${warningCount} of ${warnLimit}\n◈🌸 You will be removed if you continue.\n◈🌸 Your message has been deleted.\n◈━◈━◈━◈━◈━◈━◈━◈━◈━\n> 𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐛𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡`,
                        mentions: [userJid],
                        contextInfo
                    });
                }
                break;
        }
        
    } catch (error) {
        console.error('❌ Antilink error:', error.message);
    }
}

/**
 * Setup antilink on socket
 */
function setupAntilink(socket) {
    socket.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg?.message) return;
        
        await handleAntilink(socket, msg);
    });
    
    console.log('🛡️ Antilink Active (Admin/Owner Bypass)');
}

/**
 * Get antilink status
 */
function getAntilinkStatus() {
    return {
        enabled: config.ANTILINK_ENABLED === 'true',
        action: config.ANTILINK_ACTION || 'delete',
        warnLimit: config.ANTILINK_WARN_LIMIT || 3,
        whitelistDomains: WHITELIST_DOMAINS,
        exemptedGroups: config.ANTILINK_ALLOWED_GROUPS || [],
        totalWarnedUsers: warnStore.size,
        adminBypass: true
    };
}

module.exports = {
    setupAntilink,
    handleAntilink,
    detectUrls,
    getWarnings,
    addWarning,
    clearWarnings,
    getGroupWarnings,
    getAntilinkStatus,
    WHITELIST_DOMAINS
};