require('dotenv').config();
const { Client, GatewayIntentBits, ChannelType, PermissionFlagsBits, Colors } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildModeration,
  ],
});

// ================== CONFIG FROM .ENV ==================
const TOKEN = process.env.TOKEN;
const TARGET_GUILD_ID = process.env.TARGET_GUILD_ID || null;
const CHAOS_INTERVAL = Number(process.env.CHAOS_INTERVAL) || 4 * 60 * 1000;
const MAX_ACTIONS_PER_TICK = Number(process.env.MAX_ACTIONS_PER_TICK) || 3;

if (!TOKEN) {
  console.error('❌ TOKEN is missing in .env file!');
  process.exit(1);
}

// ================== CHAOS LISTS ==================
const SERVER_NAMES = [
  'THE VOID HAS CLAIMED US', 'server.exe stopped responding', 'OH NO EVERYTHING IS FINE',
  'chaos mode: ACTIVATED', 'why is the floor lava', 'ADMINISTRATOR LEFT THE CHAT',
  'this is fine 🔥', 'SERVER UNDER NEW MANAGEMENT (GOD)', 'error 404: sanity not found',
  'we live in a simulation', 'HELP THE BOT IS SENTIENT', 'welcome to hell',
  'I CONTROL EVERYTHING NOW', 'the end is extremely fucking nigh', 'chaos.gg'
];

const CHANNEL_NAMES = [
  'the-abyss', 'screaming-void', 'please-help', 'general-but-cursed', 'why-are-we-here',
  'chaos-central', 'do-not-enter', 'the-end-is-nigh', 'random-bullshit', 'i-regretted-this',
  'pain-and-suffering', 'bot-playground', 'delete-this-later', 'cursed-chat', 'void-whispers',
  'admin-is-crying', 'we-are-lost', 'final-destination', 'chaos-spawn', 'no-escape'
];

const VOICE_NAMES = [
  'screaming-chamber', 'void-echoes', 'the-pit', 'chaos-vc', 'why-are-you-here',
  'pain-room', 'final-vc', 'bot-listening', 'the-abyss-voice', 'cursed-hangout'
];

const NICKNAMES = [
  'Victim of Chaos', 'NPC #420', 'why me', 'lost soul', 'chaos vessel', 'error 69',
  'the chosen one (not)', 'please stop', "admin's nightmare", 'i was normal once',
  'BOT FOOD', 'subject #13', 'mentally gone', 'help me', 'chaos slave', 'void touched'
];

const ROLE_NAMES = [
  'Chaos Spawn', 'Void Walker', 'Bot Victim', 'The Damned', 'Random Role',
  'Please Delete Me', 'Admin Tears', 'Cursed One', 'Chaos Lord', 'Temporary Suffering'
];

const MESSAGES = [
  '**THE BOT SEES ALL**', 'everything is chaos and nothing hurts', 'why did you invite me',
  'I control the server now', 'random chaos event triggered', 'good luck surviving this',
  'you cannot escape', 'the void is hungry', 'this message was brought to you by pure chaos',
  'ADMINISTRATOR IS CRYING', 'I just changed something... good luck finding what',
  'chaos level rising', 'you asked for this', 'THE SERVER IS MINE'
];

const COLORS = [
  Colors.Red, Colors.DarkRed, Colors.Purple, Colors.DarkPurple, Colors.Fuchsia,
  Colors.Orange, Colors.Yellow, Colors.Green, Colors.Blue, Colors.DarkBlue, Colors.Grey
];

// ================== HELPERS ==================
function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function chance(percent) {
  return Math.random() * 100 < percent;
}

// ================== CHAOS ACTIONS ==================
const chaosActions = [
  // 1. Rename server
  async (guild) => {
    const name = randomItem(SERVER_NAMES);
    await guild.setName(name);
    console.log(`🔥 Server → ${name}`);
  },

  // 2. Change server description
  async (guild) => {
    await guild.setDescription(randomItem([
      'This server has fallen to chaos.',
      'Nothing is real. Everything is permitted.',
      'The bot is in control now.',
      'Welcome to the end.',
      null
    ]));
    console.log('📝 Server description changed');
  },

  // 3. Rename random text channel + topic + slowmode
  async (guild) => {
    const channels = guild.channels.cache.filter(c => c.type === ChannelType.GuildText && c.manageable);
    if (!channels.size) return;
    const channel = channels.random();
    await channel.setName(randomItem(CHANNEL_NAMES));
    await channel.setTopic(randomItem(['The void stares back.', 'Do not trust the bot.', 'Chaos lives here.', 'Help.', null]));
    if (chance(60)) await channel.setRateLimitPerUser(Math.floor(Math.random() * 30));
    if (chance(25)) await channel.setNSFW(!channel.nsfw);
    console.log(`📢 Channel chaos: ${channel.name}`);
  },

  // 4. Rename random voice channel + limits
  async (guild) => {
    const channels = guild.channels.cache.filter(c => c.type === ChannelType.GuildVoice && c.manageable);
    if (!channels.size) return;
    const channel = channels.random();
    await channel.setName(randomItem(VOICE_NAMES));
    if (chance(50)) await channel.setUserLimit(Math.floor(Math.random() * 10) + 1);
    if (chance(40)) await channel.setBitrate(8000 + Math.floor(Math.random() * 88000));
    console.log(`🔊 Voice channel chaos: ${channel.name}`);
  },

  // 5. Create temporary text channel
  async (guild) => {
    const channel = await guild.channels.create({
      name: randomItem(CHANNEL_NAMES),
      type: ChannelType.GuildText,
      topic: 'Temporary chaos zone. May self-destruct.',
    });
    await channel.send(randomItem(MESSAGES));
    console.log(`✨ Created text channel: ${channel.name}`);
    setTimeout(() => channel.delete().catch(() => {}), (8 + Math.random() * 12) * 60 * 1000);
  },

  // 6. Create temporary voice channel
  async (guild) => {
    const channel = await guild.channels.create({
      name: randomItem(VOICE_NAMES),
      type: ChannelType.GuildVoice,
      userLimit: Math.floor(Math.random() * 8) + 2,
    });
    console.log(`✨ Created voice channel: ${channel.name}`);
    setTimeout(() => channel.delete().catch(() => {}), (10 + Math.random() * 15) * 60 * 1000);
  },

  // 7. Nickname rampage
  async (guild) => {
    const members = await guild.members.fetch();
    const targets = [...members.filter(m => !m.user.bot && m.manageable).values()]
      .sort(() => 0.5 - Math.random())
      .slice(0, 4);
    for (const m of targets) {
      await m.setNickname(randomItem(NICKNAMES)).catch(() => {});
    }
    console.log(`👤 Nicknamed ${targets.length} people`);
  },

  // 8. Role rename + color
  async (guild) => {
    const roles = guild.roles.cache.filter(r => r.editable && r.id !== guild.id);
    if (!roles.size) return;
    const role = roles.random();
    await role.setName(randomItem(ROLE_NAMES));
    await role.setColor(randomItem(COLORS));
    console.log(`🎭 Role chaos: ${role.name}`);
  },

  // 9. Create temporary role
  async (guild) => {
    const role = await guild.roles.create({
      name: randomItem(ROLE_NAMES),
      color: randomItem(COLORS),
      reason: 'Chaos Bot temporary role',
    });
    console.log(`✨ Created role: ${role.name}`);
    setTimeout(() => role.delete().catch(() => {}), (15 + Math.random() * 20) * 60 * 1000);
  },

  // 10. Give / remove random roles
  async (guild) => {
    const members = await guild.members.fetch();
    const humans = [...members.filter(m => !m.user.bot && m.manageable).values()];
    const roles = [...guild.roles.cache.filter(r => r.editable && r.id !== guild.id).values()];
    if (!humans.length || !roles.length) return;

    const member = randomItem(humans);
    const role = randomItem(roles);
    if (chance(50)) {
      await member.roles.add(role).catch(() => {});
      console.log(`➕ Gave ${role.name} to ${member.user.tag}`);
    } else {
      await member.roles.remove(role).catch(() => {});
      console.log(`➖ Removed ${role.name} from ${member.user.tag}`);
    }
  },

  // 11. Move people in voice
  async (guild) => {
    const voiceChannels = [...guild.channels.cache.filter(c => c.type === ChannelType.GuildVoice).values()];
    if (voiceChannels.length < 2) return;

    const members = await guild.members.fetch();
    const inVoice = [...members.filter(m => m.voice.channel && m.voice.channelId && m.manageable).values()];
    if (!inVoice.length) return;

    const target = randomItem(inVoice);
    const newChannel = randomItem(voiceChannels.filter(c => c.id !== target.voice.channelId));
    await target.voice.setChannel(newChannel).catch(() => {});
    console.log(`🚚 Moved ${target.user.tag} to ${newChannel.name}`);
  },

  // 12. Short timeouts
  async (guild) => {
    const members = await guild.members.fetch();
    const targets = [...members.filter(m => !m.user.bot && m.moderatable).values()]
      .sort(() => 0.5 - Math.random())
      .slice(0, 2);
    for (const m of targets) {
      const seconds = [30, 60, 120, 300][Math.floor(Math.random() * 4)];
      await m.timeout(seconds * 1000, 'Chaos Bot').catch(() => {});
      console.log(`⏳ Timed out ${m.user.tag} for ${seconds}s`);
    }
  },

  // 13. Spam a message + reactions
  async (guild) => {
    const channels = guild.channels.cache.filter(c =>
      c.type === ChannelType.GuildText &&
      c.permissionsFor(guild.members.me)?.has(PermissionFlagsBits.SendMessages)
    );
    if (!channels.size) return;
    const channel = channels.random();
    const msg = await channel.send(randomItem(MESSAGES));
    const emojis = ['🔥', '💀', '👁️', '🌀', '⚠️', '🖤', '🩸'];
    for (const e of emojis.sort(() => 0.5 - Math.random()).slice(0, 3)) {
      await msg.react(e).catch(() => {});
    }
    console.log(`💬 Spammed in #${channel.name}`);
  },

  // 14. Change bot nickname
  async (guild) => {
    await guild.members.me.setNickname(randomItem([
      'Chaos Incarnate', 'The Destroyer', 'Server Owner (real)', 'God', 'Error',
      'I Am Inevitable', 'Your New Admin', 'Void Bot', 'CHAOS'
    ])).catch(() => {});
    console.log('🤖 Bot nickname changed');
  },

  // 15. Create a category
  async (guild) => {
    const cat = await guild.channels.create({
      name: randomItem(['CHAOS ZONE', 'THE VOID', 'DO NOT OPEN', 'SUFFERING', 'TEMP CATEGORY']),
      type: ChannelType.GuildCategory,
    });
    console.log(`📁 Created category: ${cat.name}`);
    setTimeout(() => cat.delete().catch(() => {}), 20 * 60 * 1000);
  },

  // 16. Mild permission chaos
  async (guild) => {
    const channel = guild.channels.cache
      .filter(c => c.type === ChannelType.GuildText && c.manageable)
      .random();
    if (!channel) return;
    const everyone = guild.roles.everyone;
    const overwrite = channel.permissionOverwrites.cache.get(everyone.id);
    const canView = overwrite ? !overwrite.deny.has(PermissionFlagsBits.ViewChannel) : true;
    await channel.permissionOverwrites.edit(everyone, {
      ViewChannel: chance(70) ? canView : !canView,
    }).catch(() => {});
    console.log(`🔐 Permission chaos on #${channel.name}`);
  },
];

// ================== MAIN CHAOS LOOP ==================
async function doChaos(guild) {
  if (!guild || !guild.members.me.permissions.has(PermissionFlagsBits.Administrator)) {
    console.log('⚠️ Missing Administrator permission or guild not found');
    return;
  }

  console.log(`\n======== CHAOS TICK on ${guild.name} ========`);

  const selected = [...chaosActions]
    .sort(() => 0.5 - Math.random())
    .slice(0, MAX_ACTIONS_PER_TICK);

  for (const action of selected) {
    try {
      await action(guild);
      await new Promise(r => setTimeout(r, 1500));
    } catch (err) {
      console.error('❌ Action failed:', err.message);
    }
  }
}

// ================== EVENTS ==================
client.once('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  console.log(`🌀 Chaos interval: ${CHAOS_INTERVAL / 1000}s | Max actions: ${MAX_ACTIONS_PER_TICK}`);
  console.log('Chaos Bot is now online. Pray.');

  setInterval(async () => {
    const guild = TARGET_GUILD_ID
      ? client.guilds.cache.get(TARGET_GUILD_ID)
      : client.guilds.cache.first();
    if (guild) await doChaos(guild);
  }, CHAOS_INTERVAL);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.guild) return;
  if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) return;

  if (message.content === '!chaos') {
    await message.reply('💥 Unleashing chaos...');
    await doChaos(message.guild);
  }
});

client.login(TOKEN);