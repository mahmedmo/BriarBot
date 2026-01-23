const cron = require('node-cron');

// 5PM MST (Mountain Standard Time) = 00:00 UTC (midnight)
const ANNOUNCEMENT_HOUR_UTC = 0;

// Attack announcement variations (Mon/Wed/Fri - Guild war ends in 3 hours)
const ATTACK_ANNOUNCEMENTS = [
    '⚔️ @everyone **Guild war ends in 3 hours.** The battlefield grows quiet. 🌑',
    '⚔️ @everyone **Guild war ends in 3 hours.** Time slips away like smoke. ☾',
    '⚔️ @everyone **Guild war ends in 3 hours.** The forest watches in silence. 🕸️',
    '⚔️ @everyone **Guild war ends in 3 hours.** Three hours, then nothing remains. 🕯',
    '⚔️ @everyone **Guild war ends in 3 hours.** The witch stirs her cauldron absently. 🧵',
    '⚔️ @everyone **Guild war ends in 3 hours.** Shadows lengthen across the stones. 🌑',
    '⚔️ @everyone **Guild war ends in 3 hours.** The spirits grow restless. ☾',
    '⚔️ @everyone **Guild war ends in 3 hours.** The gates will soon close. 🕸️',
    '⚔️ @everyone **Guild war ends in 3 hours.** The hourglass bleeds sand. 🕯',
    '⚔️ @everyone **Guild war ends in 3 hours.** War drums fade in the distance. 🧵',
    '⚔️ @everyone **Guild war ends in 3 hours.** The cursed moon watches. 🌑',
    '⚔️ @everyone **Guild war ends in 3 hours.** Battle cries echo and die. ☾',
    '⚔️ @everyone **Guild war ends in 3 hours.** The briars hunger still. 🕸️',
    '⚔️ @everyone **Guild war ends in 3 hours.** Fate weaves its final threads. 🕯',
    '⚔️ @everyone **Guild war ends in 3 hours.** Darkness creeps closer. 🧵',
    '⚔️ @everyone **Guild war ends in 3 hours.** The war horns will soon fall silent. 🌑',
    '⚔️ @everyone **Guild war ends in 3 hours.** Blood cools on the battlefield. ☾',
    '⚔️ @everyone **Guild war ends in 3 hours.** The forest remembers everything. 🕸️',
    '⚔️ @everyone **Guild war ends in 3 hours.** Time bleeds away slowly. 🕯',
    '⚔️ @everyone **Guild war ends in 3 hours.** The witch hums an old tune. 🧵',
];

// Defense announcement variations (Sun/Tue/Thu - Guild war begins in 3 hours)
const DEFENSE_ANNOUNCEMENTS = [
    '🛡️ @everyone **War begins in 3 hours.** The gates creak in anticipation. 🌑',
    '🛡️ @everyone **War begins in 3 hours.** Shadows gather at the treeline. ☾',
    '🛡️ @everyone **War begins in 3 hours.** Three hours until steel rings. 🕸️',
    '🛡️ @everyone **War begins in 3 hours.** The witch senses their approach. 🕯',
    '🛡️ @everyone **War begins in 3 hours.** The walls whisper warnings. 🧵',
    '🛡️ @everyone **War begins in 3 hours.** Darkness stirs beyond the veil. 🌑',
    '🛡️ @everyone **War begins in 3 hours.** The cursed winds carry whispers. ☾',
    '🛡️ @everyone **War begins in 3 hours.** Our walls will soon be tested. 🕸️',
    '🛡️ @everyone **War begins in 3 hours.** The forest stirs uneasily. 🕯',
    '🛡️ @everyone **War begins in 3 hours.** Watchful eyes gaze from afar. 🧵',
    '🛡️ @everyone **War begins in 3 hours.** The spirits grow restless. 🌑',
    '🛡️ @everyone **War begins in 3 hours.** Time thins like morning fog. ☾',
    '🛡️ @everyone **War begins in 3 hours.** The witch\'s ravens circle overhead. 🕸️',
    '🛡️ @everyone **War begins in 3 hours.** Distant blades sing against stone. 🕯',
    '🛡️ @everyone **War begins in 3 hours.** The hour of reckoning draws near. 🧵',
    '🛡️ @everyone **War begins in 3 hours.** The barrier grows thin. 🌑',
    '🛡️ @everyone **War begins in 3 hours.** The shadows grow restless. ☾',
    '🛡️ @everyone **War begins in 3 hours.** War drums echo through the mist. 🕸️',
    '🛡️ @everyone **War begins in 3 hours.** The briars coil tighter. 🕯',
    '🛡️ @everyone **War begins in 3 hours.** Steel whispers promises of blood. 🧵',
];

// Get random message from array
function getRandomAnnouncement(messages)
{
    return messages[Math.floor(Math.random() * messages.length)];
}

// Parse channel IDs from environment variable
function getAnnouncementChannels()
{
    const channelIds = process.env.GUILD_WAR_ANNOUNCEMENT_CHANNELS?.split(',') || [];
    return channelIds.map(id => id.trim()).filter(id => id);
}

// Check if feature is enabled
function isEnabled()
{
    return process.env.GUILD_WAR_ANNOUNCEMENTS_ENABLED !== 'false';
}

// Post announcement to all configured channels
async function postAnnouncement(client, message)
{
    const channelIds = getAnnouncementChannels();

    for (const channelId of channelIds)
    {
        try
        {
            const channel = await client.channels.fetch(channelId);
            if (channel && channel.isTextBased())
            {
                await channel.send(message);
                console.log(`[Guild War] Announcement sent to ${channelId}`);
            }
        }
        catch (error)
        {
            console.error(`[Guild War] Failed to send to ${channelId}:`, error.message);
        }
    }
}

// Schedule attack announcements (Mon/Wed/Fri at midnight UTC)
function scheduleAttackAnnouncements(client)
{
    const cronExpression = `0 ${ANNOUNCEMENT_HOUR_UTC} * * 1,3,5`;

    cron.schedule(cronExpression, async () =>
    {
        const message = getRandomAnnouncement(ATTACK_ANNOUNCEMENTS);
        await postAnnouncement(client, message);
    },
    {
        timezone: 'UTC'
    });

    console.log(`[Guild War] Attack announcements scheduled: ${cronExpression} UTC`);
}

// Schedule defense announcements (Sun/Tue/Thu at midnight UTC)
function scheduleDefenseAnnouncements(client)
{
    const cronExpression = `0 ${ANNOUNCEMENT_HOUR_UTC} * * 0,2,4`;

    cron.schedule(cronExpression, async () =>
    {
        const message = getRandomAnnouncement(DEFENSE_ANNOUNCEMENTS);
        await postAnnouncement(client, message);
    },
    {
        timezone: 'UTC'
    });

    console.log(`[Guild War] Defense announcements scheduled: ${cronExpression} UTC`);
}

// Test command handler for manual testing
async function testAnnouncements(client, type = 'both')
{
    if (type === 'attack' || type === 'both')
    {
        console.log('[Guild War Test] Sending attack announcement...');
        const message = getRandomAnnouncement(ATTACK_ANNOUNCEMENTS);
        await postAnnouncement(client, message);
    }

    if (type === 'defense' || type === 'both')
    {
        console.log('[Guild War Test] Sending defense announcement...');
        const message = getRandomAnnouncement(DEFENSE_ANNOUNCEMENTS);
        await postAnnouncement(client, message);
    }
}

// Initialize guild war scheduler
function initializeGuildWarScheduler(client)
{
    if (!isEnabled())
    {
        console.log('[Guild War] Announcements disabled via GUILD_WAR_ANNOUNCEMENTS_ENABLED');
        return;
    }

    const channels = getAnnouncementChannels();
    if (channels.length === 0)
    {
        console.log('[Guild War] No announcement channels configured in GUILD_WAR_ANNOUNCEMENT_CHANNELS');
        return;
    }

    console.log(`[Guild War] Initializing scheduler for ${channels.length} channel(s)...`);
    console.log(`[Guild War] Announcements scheduled for ${ANNOUNCEMENT_HOUR_UTC}:00 UTC (midnight)`);

    scheduleAttackAnnouncements(client);
    scheduleDefenseAnnouncements(client);

    console.log('[Guild War] Scheduler initialized successfully');
}

module.exports = {
    initializeGuildWarScheduler,
    testAnnouncements
};
