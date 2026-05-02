// ===== ANTILINK MODULE =====
const { config, isOwner } = require('./silafunctions');

// Store warnings per group/user
const warnStore = new Map();

// URL Detection Patterns
const URL_PATTERNS = [
    /https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&\/=]*)/gi,
    /[-a-zA-Z0-9@:%._\+~#=]{1,256}\.(com|net|org|io|xyz|me|co|uk|tk|ml|ga|cf|gq|info|online|site|tech|store|blog|app|dev|cloud|live|pro|digital|world|life|today|run|click|link|pw|top|bid|trade|date|download|review|racing|accountant|science|party|webcam|cricket|faith|review|win|men|stream|loan|country|bid|trade|webcam|party|science|review|date|download|accountant|racing|faith|cricket|win|men|stream|loan)\b/gi,
    /wa\.me\/[-a-zA-Z0-9@:%._\+~#=]{1,256}/gi,
    /chat\.whatsapp\.com\/[-a-zA-Z0-9@:%._\+~#=]{1,256}/gi,
];

// Whitelist domains that are allowed
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
    ...config.ANTILINK_WHITELIST || []
];

/**
 * Check if a string contains URLs
 * @param {string} text - Message text to check
 * @returns {object} - { hasUrl: boolean, urls: array, isWhitelisted: boolean }
 */
function detectUrls(text) {
    if (!text) return { hasUrl: false, urls: [], isWhitelisted: false };
    
    let foundUrls = [];
    
    // Check all patterns
    for (const pattern of URL_PATTERNS) {
        const matches = text.match(pattern);
        if (matches) {
            foundUrls = foundUrls.concat(matches);
        }
    }
    
    if (foundUrls.length === 0) {
        return { hasUrl: false, urls: [], isWhitelisted: false };
    }
    
    // Check if all URLs are from whitelisted domains
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
 * Get warning key for a user in a group
 * @param {string} groupJid 
 * @param {string} userJid 
 * @returns {string}
 */
function getWarningKey(groupJid, userJid) {
    return `${groupJid}_${userJid}`;
}

/**
 * Get current warnings for a user in a group
 * @param {string} groupJid 
 * @param {string} userJid 
 * @returns {number}
 */
function getWarnings(groupJid, userJid) {
    const key = getWarningKey(groupJid, userJid);
    return warnStore.get(key) || 0;
}

/**
 * Add warning to a user in a group
 * @param {string} groupJid 
 * @param {string} userJid 
 * @returns {number} - New warning count
 */
function addWarning(groupJid, userJid) {
    const key = getWarningKey(groupJid, userJid);
    const current = warnStore.get(key) || 0;
    const newCount = current + 1;
    warnStore.set(key, newCount);
    
    // Auto-clear warnings after 1 hour
    setTimeout(() => {
        if (warnStore.get(key) === newCount) {
            warnStore.delete(key);
        }
    }, 3600000);
    
    return newCount;
}

/**
 * Clear warnings for a user
 * @param {string} groupJid 
 * @param {string} userJid 
 */
function clearWarnings(groupJid, userJid) {
    const key = getWarningKey(groupJid, userJid);
    warnStore.delete(key);
}

/**
 * Get all warnings in a group
 * @param {string} groupJid 
 * @returns {array}
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
 * Main antilink handler - called for every message
 * @param {object} socket - WhatsApp socket
 * @param {object} msg - Message object
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
        if (config.ANTILINK_ALLOWED_GROUPS && config.ANTILINK_ALLOWED_GROUPS.includes(groupJid)) return;
        
        // Skip if sender is owner
        const senderNumber = userJid.replace('@s.whatsapp.net', '');
        if (isOwner(`${senderNumber}@s.whatsapp.net`)) return;
        
        // Skip if sender is group admin
        try {
            const groupMetadata = await socket.groupMetadata(groupJid);
            const participant = groupMetadata.participants.find(p => p.id === userJid);
            if (participant && (participant.admin === 'admin' || participant.admin === 'superadmin')) {
                return;
            }
        } catch (err) {
            // Can't check admin status, proceed anyway
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
        
        // Detect URLs
        const detection = detectUrls(messageText);
        
        if (!detection.hasUrl || detection.isWhitelisted) return;
        
        // URL detected! Take action
        console.log(`🔗 Antilink: Detected URLs from ${userJid} in ${groupJid}:`, detection.urls);
        
        // Delete the message first
        try {
            await socket.sendMessage(groupJid, {
                delete: msg.key
            });
        } catch (err) {
            console.error('❌ Failed to delete message:', err.message);
        }
        
        const action = config.ANTILINK_ACTION || 'delete';
        
        switch (action) {
            case 'delete':
                // Just delete and warn
                await socket.sendMessage(groupJid, {
                    text: `⚠️ *Antilink Warning*\n\n@${userJid.split('@')[0]} link zinaruhusiwa kwenye group hili!\n\n_Message deleted_`,
                    mentions: [userJid]
                });
                break;
                
            case 'kick':
                // Kick immediately
                try {
                    await socket.groupParticipantsUpdate(groupJid, [userJid], 'remove');
                    await socket.sendMessage(groupJid, {
                        text: `🚫 @${userJid.split('@')[0]} ameondolewa kwenye group kwa kutuma link\n\n_Antilink Protection_`,
                        mentions: [userJid]
                    });
                } catch (err) {
                    await socket.sendMessage(groupJid, {
                        text: `❌ Failed to remove user. Make sure bot is admin.`
                    });
                }
                break;
                
            case 'warn':
                // Warning system
                const warningCount = addWarning(groupJid, userJid);
                const warnLimit = config.ANTILINK_WARN_LIMIT || 3;
                
                if (warningCount >= warnLimit) {
                    // Kick after reaching warn limit
                    try {
                        await socket.groupParticipantsUpdate(groupJid, [userJid], 'remove');
                        clearWarnings(groupJid, userJid);
                        await socket.sendMessage(groupJid, {
                            text: `🚫 *Antilink Action*\n\n@${userJid.split('@')[0]} ameondolewa baada ya warnings ${warningCount}/${warnLimit}\n\n_Antilink Protection_`,
                            mentions: [userJid]
                        });
                    } catch (err) {
                        await socket.sendMessage(groupJid, {
                            text: `❌ Failed to remove user. Make sure bot is admin.`
                        });
                    }
                } else {
                    // Send warning message
                    await socket.sendMessage(groupJid, {
                        text: `⚠️ *Antilink Warning ${warningCount}/${warnLimit}*\n\n@${userJid.split('@')[0]} link haziruhusiwi!\nUkituma tena utaondolewa.\n\n_Messages with links will be deleted_`,
                        mentions: [userJid]
                    });
                }
                break;
        }
        
    } catch (error) {
        console.error('❌ Antilink handler error:', error);
    }
}

/**
 * Setup antilink listener on socket
 * @param {object} socket - WhatsApp socket
 */
function setupAntilink(socket) {
    socket.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg?.message) return;
        
        await handleAntilink(socket, msg);
    });
    
    console.log('🛡️ Antilink protection activated');
}

/**
 * Get antilink status
 * @returns {object}
 */
function getAntilinkStatus() {
    return {
        enabled: config.ANTILINK_ENABLED === 'true',
        action: config.ANTILINK_ACTION,
        warnLimit: config.ANTILINK_WARN_LIMIT,
        whitelistDomains: WHITELIST_DOMAINS,
        exemptedGroups: config.ANTILINK_ALLOWED_GROUPS || [],
        totalWarnedUsers: warnStore.size
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