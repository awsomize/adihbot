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

// ================== LEVEL 1000 CONFIG ==================
const TOKEN = process.env.TOKEN;
const TARGET_GUILD_ID = process.env.TARGET_GUILD_ID || null;
const CHAOS_INTERVAL = Number(process.env.CHAOS_INTERVAL) || 35 * 1000; // 35 seconds
const MAX_ACTIONS_PER_TICK = Number(process.env.MAX_ACTIONS_PER_TICK) || 14;

if (!TOKEN) {
  console.error('❌ TOKEN is missing!');
  process.exit(1);
}

// ================== CHAOS LISTS ==================
const SERVER_NAMES = [
  'LEVEL 1000 CHAOS', 'THE SERVER IS DYING', 'NO ESCAPE', 'EVERYTHING IS BURNING',
  'BOT IS SENTIENT', 'YOU ASKED FOR THIS', 'FINAL STAGE', 'TOTAL COLLAPSE',
  'THE VOID WON', 'ADMIN IS CRYING', 'CHAOS INCARNATE', 'GOODBYE SANITY',
  'I OWN THIS PLACE', 'ERROR 1000', 'THE END IS NOW', 'HELP IS NOT COMING'
];

const CHANNEL_NAMES = [
  'the-abyss', 'screaming-void', 'please-help', 'pain-chamber', 'no-escape',
  'level-1000', 'total-destruction', 'bot-playground', 'cursed-zone', 'void-whispers',
  'admin-tears', 'final-destination', 'chaos-spawn', 'we-are-lost', 'delete-me',
  'suffering', 'the-pit', 'last-chance', 'everything-hurts', 'no-hope',
  'burning-alive', 'mental-breakdown', 'server-corpse', 'chaos-overflow'
];

const VOICE_NAMES = [
  'screaming-chamber', 'void-echoes', 'the-pit', 'pain-room', 'no-return',
  'level-1000-vc', 'final-vc', 'suffering-vc', 'bot-listening', 'cursed-hangout',
  'death-chamber', 'last-voice'
];

const NICKNAMES = [
  'LEVEL 1000 VICTIM', 'I REGRET EVERYTHING', 'PLEASE END THIS', 'BOT PROPERTY',
  'NO HOPE LEFT', 'MENTALLY GONE', 'CHAOS SLAVE', 'VOID TOUCHED', 'HELP ME',
  'SERVER CORPSE', 'THE DAMNED', 'ERROR 1000', 'FINAL FORM', 'BROKEN',
  'OWNED BY BOT', 'SANITY: 0', 'WHY DID I JOIN', 'PAIN VESSEL'
];

const ROLE_NAMES = [
  'Chaos God', 'Void Walker', 'Level 1000 Victim', 'The Damned', 'Bot Property',
  'No Hope', 'Eternal Suffering', 'Server Corpse', 'Final Role', 'Owned',
  'Mental Collapse', 'Chaos Overflow', 'Do Not Keep'
];

const MESSAGES = [
  '**LEVEL 1000 CHAOS**', 'THE SERVER IS COLLAPSING', 'YOU WANTED THIS',
  'NO MERCY', 'EVERYTHING IS GONE', 'I CONTROL ALL', 'GOOD LUCK',
  'THE VOID IS HERE', 'ADMIN CANNOT SAVE YOU', 'THIS IS THE END',
  'CHAOS HAS WON', 'FEEL THE PAIN', 'NO ESCAPE FROM LEVEL 1000',
  'THE BOT IS ALIVE', 'BURN IT ALL'
];

const COLORS = [
  Colors.Red, Colors.DarkRed, Colors.Purple, Colors.DarkPurple, Colors.Fuchsia,
  Colors.Orange, Colors.Yellow, Colors.DarkButNotBlack, Colors.DarkerGrey
];

// ================== HELPERS ==================
function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function chance(percent) {
  return Math.random() * 100 < percent;
}

// ================== LEVEL 1000 ACTIONS ==================
const chaosActions = [
  // Server rename (very frequent)
  async (guild) => {
    await guild.setName(randomItem(SERVER_NAMES));
    console.log('🔥 Server renamed');
  },

  // Description
  async (guild) => {
    await guild.setDescription(randomItem([
      'LEVEL 1000 CHAOS ACTIVE',
      'This server is actively dying.',
      'No one is safe.',
      'The bot owns everything now.',
      'You asked for Level 1000.',
      null
    ]));
  },

  // Heavy channel rename + settings
  async (guild) => {
    const channels = guild.channels.cache.filter(c => c.type === ChannelType.GuildText && c.manageable);
    if (!channels.size) return;
    const channel = channels.random();
    await channel.setName(randomItem(CHANNEL_NAMES));
    await channel.setTopic(randomItem(['LEVEL 1000', 'No escape', 'The end', 'Pain', null]));
    await channel.setRateLimitPerUser(Math.floor(Math.random() * 60));
    if (chance(50)) await channel.setNSFW(true);
  },

  // Voice channel chaos
  async (guild) => {
    const channels = guild.channels.cache.filter(c => c.type === ChannelType.GuildVoice && c.manageable);
    if (!channels.size) return;
    const channel = channels.random();
    await channel.setName(randomItem(VOICE_NAMES));
    await channel.setUserLimit(Math.floor(Math.random() * 15));
  },

  // Create many temporary text channels
  async (guild) => {
    for (let i = 0; i < 3; i++) {
      const ch = await guild.channels.create({
        name: randomItem(CHANNEL_NAMES),
        type: ChannelType.GuildText,
        topic: 'LEVEL 1000 temporary hell',
      });
      await ch.send(randomItem(MESSAGES)).catch(() => {});
      setTimeout(() => ch.delete().catch(() => {}), (4 + Math.random() * 8) * 60 * 1000);
    }
    console.log('✨ Created multiple text channels');
  },

  // Create voice channels
  async (guild) => {
    for (let i = 0; i < 2; i++) {
      const ch = await guild.channels.create({
        name: randomItem(VOICE_NAMES),
        type: ChannelType.GuildVoice,
      });
      setTimeout(() => ch.delete().catch(() => {}), (5 + Math.random() * 8) * 60 * 1000);
    }
  },

  // Mass nickname destruction
  async (guild) => {
    const members = await guild.members.fetch();
    const targets = [...members.filter(m => !m.user.bot && m.manageable).values()]
      .sort(() => 0.5 - Math.random())
      .slice(0, 12);
    for (const m of targets) {
      await m.setNickname(randomItem(NICKNAMES)).catch(() => {});
    }
    console.log(`👤 Destroyed ${targets.length} nicknames`);
  },

  // Role chaos
  async (guild) => {
    const roles = guild.roles.cache.filter(r => r.editable && r.id !== guild.id);
    if (!roles.size) return;
    const role = roles.random();
    await role.setName(randomItem(ROLE_NAMES));
    await role.setColor(randomItem(COLORS));
  },

  // Create many temporary roles
  async (guild) => {
    for (let i = 0; i < 3; i++) {
      const role = await guild.roles.create({
        name: randomItem(ROLE_NAMES),
        color: randomItem(COLORS),
        reason: 'LEVEL 1000',
      });
      setTimeout(() => role.delete().catch(() => {}), (6 + Math.random() * 10) * 60 * 1000);
    }
  },

  // Mass role spam
  async (guild) => {
    const members = await guild.members.fetch();
    const humans = [...members.filter(m => !m.user.bot && m.manageable).values()];
    const roles = [...guild.roles.cache.filter(r => r.editable && r.id !== guild.id).values()];
    if (!humans.length || !roles.length) return;

    for (let i = 0; i < 10; i++) {
      const member = randomItem(humans);
      const role = randomItem(roles);
      if (chance(60)) await member.roles.add(role).catch(() => {});
      else await member.roles.remove(role).catch(() => {});
    }
    console.log('🎭 Mass role chaos');
  },

  // Voice move chaos
  async (guild) => {
    const voiceChannels = [...guild.channels.cache.filter(c => c.type === ChannelType.GuildVoice).values()];
    if (voiceChannels.length < 2) return;
    const members = await guild.members.fetch();
    const inVoice = [...members.filter(m => m.voice.channel && m.manageable).values()];
    for (const target of inVoice.slice(0, 6)) {
      const newCh = randomItem(voiceChannels.filter(c => c.id !== target.voice.channelId));
      await target.voice.setChannel(newCh).catch(() => {});
    }
  },

  // Heavy timeouts
  async (guild) => {
    const members = await guild.members.fetch();
    const targets = [...members.filter(m => !m.user.bot && m.moderatable).values()]
      .sort(() => 0.5 - Math.random())
      .slice(0, 6);
    for (const m of targets) {
      const seconds = [120, 300, 600, 900, 1800][Math.floor(Math.random() * 5)];
      await m.timeout(seconds * 1000, 'LEVEL 1000').catch(() => {});
    }
    console.log('⏳ Mass timeouts');
  },

  // Extreme message spam
  async (guild) => {
    const channels = guild.channels.cache.filter(c =>
      c.type === ChannelType.GuildText &&
      c.permissionsFor(guild.members.me)?.has(PermissionFlagsBits.SendMessages)
    );
    if (!channels.size) return;

    for (let i = 0; i < 5; i++) {
      const channel = channels.random();
      const msg = await channel.send(randomItem(MESSAGES)).catch(() => {});
      if (msg) {
        for (const e of ['🔥', '💀', '☠️', '💣', '👁️', '🩸'].sort(() => 0.5 - Math.random()).slice(0, 4)) {
          await msg.react(e).catch(() => {});
        }
      }
    }
    console.log('💬 Extreme spam');
  },

  // Bot nickname
  async (guild) => {
    await guild.members.me.setNickname(randomItem([
      'LEVEL 1000', 'THE DESTROYER', 'SERVER OWNER', 'CHAOS GOD',
      'NO MERCY', 'I AM INEVITABLE', 'YOUR END', 'VOID'
    ])).catch(() => {});
  },

  // Create categories
  async (guild) => {
    for (let i = 0; i < 2; i++) {
      const cat = await guild.channels.create({
        name: randomItem(['LEVEL 1000', 'THE VOID', 'NO HOPE', 'FINAL ZONE', 'CHAOS']),
        type: ChannelType.GuildCategory,
      });
      setTimeout(() => cat.delete().catch(() => {}), 10 * 60 * 1000);
    }
  },

  // Aggressive permission chaos
  async (guild) => {
    const channels = guild.channels.cache.filter(c => c.type === ChannelType.GuildText && c.manageable);
    if (!channels.size) return;
    for (let i = 0; i < 3; i++) {
      const channel = channels.random();
      await channel.permissionOverwrites.edit(guild.roles.everyone, {
        ViewChannel: chance(40),
        SendMessages: chance(30),
      }).catch(() => {});
    }
    console.log('🔐 Permission destruction');
  },
];

// ================== MAIN LOOP ==================
async function doChaos(guild) {
  if (!guild || !guild.members.me.permissions.has(PermissionFlagsBits.Administrator)) {
    console.log('⚠️ Missing Administrator permission');
    return;
  }

  console.log(`\n======== LEVEL 1000 CHAOS on ${guild.name} ========`);

  const selected = [...chaosActions].sort(() => 0.5 - Math.random()).slice(0, MAX_ACTIONS_PER_TICK);

  for (const action of selected) {
    try {
      await action(guild);
      await new Promise(r => setTimeout(r, 400));
    } catch (err) {
      console.error('❌', err.message);
    }
  }
}

client.once('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  console.log(`🔥 LEVEL 1000 ACTIVE | Every ${CHAOS_INTERVAL / 1000}s | ${MAX_ACTIONS_PER_TICK} actions`);
  console.log('No mercy mode enabled.');

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
    await message.reply('💥 **LEVEL 1000 UNLEASHED**');
    await doChaos(message.guild);
  }
});

client.login(TOKEN);
