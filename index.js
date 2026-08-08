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

// ================== CONFIG ==================
const TOKEN = process.env.TOKEN;
const TARGET_GUILD_ID = process.env.TARGET_GUILD_ID || null;

// LEVEL 100 SETTINGS
const CHAOS_INTERVAL = Number(process.env.CHAOS_INTERVAL) || 90 * 1000; // 90 seconds
const MAX_ACTIONS_PER_TICK = Number(process.env.MAX_ACTIONS_PER_TICK) || 8;

if (!TOKEN) {
  console.error('❌ TOKEN is missing!');
  process.exit(1);
}

// ================== CHAOS LISTS ==================
const SERVER_NAMES = [
  'THE VOID HAS CLAIMED US', 'server.exe stopped responding', 'OH NO EVERYTHING IS FINE',
  'chaos mode: LEVEL 100', 'why is the floor lava', 'ADMINISTRATOR LEFT THE CHAT',
  'this is fine 🔥', 'SERVER UNDER NEW MANAGEMENT (GOD)', 'error 404: sanity not found',
  'we live in a simulation', 'HELP THE BOT IS SENTIENT', 'welcome to hell',
  'I CONTROL EVERYTHING NOW', 'the end is extremely fucking nigh', 'chaos.gg',
  'EVERYTHING IS BURNING', 'NO ESCAPE', 'THE BOT OWNS THIS PLACE', 'FINAL WARNING',
  'YOU ASKED FOR LEVEL 100'
];

const CHANNEL_NAMES = [
  'the-abyss', 'screaming-void', 'please-help', 'general-but-cursed', 'why-are-we-here',
  'chaos-central', 'do-not-enter', 'the-end-is-nigh', 'random-bullshit', 'i-regretted-this',
  'pain-and-suffering', 'bot-playground', 'delete-this-later', 'cursed-chat', 'void-whispers',
  'admin-is-crying', 'we-are-lost', 'final-destination', 'chaos-spawn', 'no-escape',
  'level-100-zone', 'total-destruction', 'help-us', 'bot-is-angry', 'everything-hurts'
];

const VOICE_NAMES = [
  'screaming-chamber', 'void-echoes', 'the-pit', 'chaos-vc', 'why-are-you-here',
  'pain-room', 'final-vc', 'bot-listening', 'the-abyss-voice', 'cursed-hangout',
  'level-100-voice', 'no-return', 'suffering-vc'
];

const NICKNAMES = [
  'Victim of Chaos', 'NPC #420', 'why me', 'lost soul', 'chaos vessel', 'error 69',
  'the chosen one (not)', 'please stop', "admin's nightmare", 'i was normal once',
  'BOT FOOD', 'subject #13', 'mentally gone', 'help me', 'chaos slave', 'void touched',
  'LEVEL 100 VICTIM', 'I REGRET EVERYTHING', 'PLEASE END THIS', 'BOT PROPERTY'
];

const ROLE_NAMES = [
  'Chaos Spawn', 'Void Walker', 'Bot Victim', 'The Damned', 'Random Role',
  'Please Delete Me', 'Admin Tears', 'Cursed One', 'Chaos Lord', 'Temporary Suffering',
  'Level 100 Victim', 'Owned by Bot', 'No Hope', 'Eternal Chaos'
];

const MESSAGES = [
  '**THE BOT SEES ALL**', 'everything is chaos and nothing hurts', 'why did you invite me',
  'I control the server now', 'random chaos event triggered', 'good luck surviving this',
  'you cannot escape', 'the void is hungry', 'this message was brought to you by pure chaos',
  'ADMINISTRATOR IS CRYING', 'I just changed something... good luck finding what',
  'chaos level rising', 'you asked for this', 'THE SERVER IS MINE',
  '**LEVEL 100 CHAOS ACTIVATED**', 'THERE IS NO GOING BACK', 'ENJOY THE MADNESS'
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

// ================== CHAOS ACTIONS (LEVEL 100) ==================
const chaosActions = [
  // Rename server (higher chance)
  async (guild) => {
    const name = randomItem(SERVER_NAMES);
    await guild.setName(name);
    console.log(`🔥 Server → ${name}`);
  },

  // Change description
  async (guild) => {
    await guild.setDescription(randomItem([
      'This server has fallen to LEVEL 100 chaos.',
      'Nothing is real. Everything is permitted.',
      'The bot is in full control now.',
      'Welcome to hell. You asked for this.',
      'NO ESCAPE',
      null
    ]));
    console.log('📝 Server description changed');
  },

  // Heavy text channel chaos
  async (guild) => {
    const channels = guild.channels.cache.filter(c => c.type === ChannelType.GuildText && c.manageable);
    if (!channels.size) return;
    const channel = channels.random();
    await channel.setName(randomItem(CHANNEL_NAMES));
    await channel.setTopic(randomItem(['The void stares back.', 'Do not trust the bot.', 'Chaos lives here.', 'Help.', 'LEVEL 100', null]));
    await channel.setRateLimitPerUser(Math.floor(Math.random() * 45));
    if (chance(40)) await channel.setNSFW(true);
    console.log(`📢 Channel chaos: ${channel.name}`);
  },

  // Voice channel chaos
  async (guild) => {
    const channels = guild.channels.cache.filter(c => c.type === ChannelType.GuildVoice && c.manageable);
    if (!channels.size) return;
    const channel = channels.random();
    await channel.setName(randomItem(VOICE_NAMES));
    await channel.setUserLimit(Math.floor(Math.random() * 12) + 1);
    if (chance(60)) await channel.setBitrate(8000 + Math.floor(Math.random() * 88000));
    console.log(`🔊 Voice channel chaos: ${channel.name}`);
  },

  // Create multiple temporary text channels
  async (guild) => {
    for (let i = 0; i < 2; i++) {
      const channel = await guild.channels.create({
        name: randomItem(CHANNEL_NAMES),
        type: ChannelType.GuildText,
        topic: 'LEVEL 100 temporary chaos zone.',
      });
      await channel.send(randomItem(MESSAGES));
      console.log(`✨ Created text channel: ${channel.name}`);
      setTimeout(() => channel.delete().catch(() => {}), (6 + Math.random() * 10) * 60 * 1000);
    }
  },

  // Create temporary voice channels
  async (guild) => {
    const channel = await guild.channels.create({
      name: randomItem(VOICE_NAMES),
      type: ChannelType.GuildVoice,
      userLimit: Math.floor(Math.random() * 8) + 2,
    });
    console.log(`✨ Created voice channel: ${channel.name}`);
    setTimeout(() => channel.delete().catch(() => {}), (8 + Math.random() * 12) * 60 * 1000);
  },

  // Aggressive nickname rampage
  async (guild) => {
    const members = await guild.members.fetch();
    const targets = [...members.filter(m => !m.user.bot && m.manageable).values()]
      .sort(() => 0.5 - Math.random())
      .slice(0, 8);
    for (const m of targets) {
      await m.setNickname(randomItem(NICKNAMES)).catch(() => {});
    }
    console.log(`👤 Nicknamed ${targets.length} people`);
  },

  // Role chaos
  async (guild) => {
    const roles = guild.roles.cache.filter(r => r.editable && r.id !== guild.id);
    if (!roles.size) return;
    const role = roles.random();
    await role.setName(randomItem(ROLE_NAMES));
    await role.setColor(randomItem(COLORS));
    console.log(`🎭 Role chaos: ${role.name}`);
  },

  // Create multiple temporary roles
  async (guild) => {
    for (let i = 0; i < 2; i++) {
      const role = await guild.roles.create({
        name: randomItem(ROLE_NAMES),
        color: randomItem(COLORS),
        reason: 'LEVEL 100 Chaos',
      });
      console.log(`✨ Created role: ${role.name}`);
      setTimeout(() => role.delete().catch(() => {}), (10 + Math.random() * 15) * 60 * 1000);
    }
  },

  // Mass role give/remove
  async (guild) => {
    const members = await guild.members.fetch();
    const humans = [...members.filter(m => !m.user.bot && m.manageable).values()];
    const roles = [...guild.roles.cache.filter(r => r.editable && r.id !== guild.id).values()];
    if (!humans.length || !roles.length) return;

    for (let i = 0; i < 5; i++) {
      const member = randomItem(humans);
      const role = randomItem(roles);
      if (chance(55)) {
        await member.roles.add(role).catch(() => {});
      } else {
        await member.roles.remove(role).catch(() => {});
      }
    }
    console.log(`🎭 Mass role chaos`);
  },

  // Move people around in voice
  async (guild) => {
    const voiceChannels = [...guild.channels.cache.filter(c => c.type === ChannelType.GuildVoice).values()];
    if (voiceChannels.length < 2) return;

    const members = await guild.members.fetch();
    const inVoice = [...members.filter(m => m.voice.channel && m.manageable).values()];
    if (!inVoice.length) return;

    for (const target of inVoice.slice(0, 4)) {
      const newChannel = randomItem(voiceChannels.filter(c => c.id !== target.voice.channelId));
      await target.voice.setChannel(newChannel).catch(() => {});
    }
    console.log(`🚚 Moved people in voice`);
  },

  // Longer timeouts
  async (guild) => {
    const members = await guild.members.fetch();
    const targets = [...members.filter(m => !m.user.bot && m.moderatable).values()]
      .sort(() => 0.5 - Math.random())
      .slice(0, 4);
    for (const m of targets) {
      const seconds = [60, 120, 300, 600, 900][Math.floor(Math.random() * 5)];
      await m.timeout(seconds * 1000, 'LEVEL 100 Chaos').catch(() => {});
      console.log(`⏳ Timed out ${m.user.tag} for ${seconds}s`);
    }
  },

  // Heavy message spam
  async (guild) => {
    const channels = guild.channels.cache.filter(c =>
      c.type === ChannelType.GuildText &&
      c.permissionsFor(guild.members.me)?.has(PermissionFlagsBits.SendMessages)
    );
    if (!channels.size) return;

    for (let i = 0; i < 3; i++) {
      const channel = channels.random();
      const msg = await channel.send(randomItem(MESSAGES));
      const emojis = ['🔥', '💀', '👁️', '🌀', '⚠️', '🖤', '🩸', '💣', '☠️'];
      for (const e of emojis.sort(() => 0.5 - Math.random()).slice(0, 4)) {
        await msg.react(e).catch(() => {});
      }
    }
    console.log(`💬 Heavy spam`);
  },

  // Change bot nickname aggressively
  async (guild) => {
    await guild.members.me.setNickname(randomItem([
      'Chaos Incarnate', 'The Destroyer', 'Server Owner (real)', 'God', 'Error',
      'I Am Inevitable', 'Your New Admin', 'Void Bot', 'CHAOS LEVEL 100', 'NO MERCY'
    ])).catch(() => {});
    console.log('🤖 Bot nickname changed');
  },

  // Create categories
  async (guild) => {
    const cat = await guild.channels.create({
      name: randomItem(['CHAOS ZONE', 'THE VOID', 'DO NOT OPEN', 'SUFFERING', 'LEVEL 100', 'NO HOPE']),
      type: ChannelType.GuildCategory,
    });
    console.log(`📁 Created category: ${cat.name}`);
    setTimeout(() => cat.delete().catch(() => {}), 15 * 60 * 1000);
  },

  // Permission chaos (more aggressive)
  async (guild) => {
    const channels = guild.channels.cache.filter(c => c.type === ChannelType.GuildText && c.manageable);
    if (!channels.size) return;

    for (let i = 0; i < 2; i++) {
      const channel = channels.random();
      const everyone = guild.roles.everyone;
      await channel.permissionOverwrites.edit(everyone, {
        ViewChannel: chance(50),
        SendMessages: chance(40),
      }).catch(() => {});
    }
    console.log(`🔐 Aggressive permission chaos`);
  },
];

// ================== MAIN CHAOS LOOP ==================
async function doChaos(guild) {
  if (!guild || !guild.members.me.permissions.has(PermissionFlagsBits.Administrator)) {
    console.log('⚠️ Missing Administrator permission or guild not found');
    return;
  }

  console.log(`\n======== LEVEL 100 CHAOS TICK on ${guild.name} ========`);

  const selected = [...chaosActions]
    .sort(() => 0.5 - Math.random())
    .slice(0, MAX_ACTIONS_PER_TICK);

  for (const action of selected) {
    try {
      await action(guild);
      await new Promise(r => setTimeout(r, 800)); // faster
    } catch (err) {
      console.error('❌ Action failed:', err.message);
    }
  }
}

// ================== EVENTS ==================
client.once('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  console.log(`🔥 LEVEL 100 CHAOS | Interval: ${CHAOS_INTERVAL / 1000}s | Actions: ${MAX_ACTIONS_PER_TICK}`);
  console.log('Chaos Bot is now online. No mercy.');

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
    await message.reply('💥 **LEVEL 100 CHAOS UNLEASHED**');
    await doChaos(message.guild);
  }
});

client.login(TOKEN);