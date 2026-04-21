const { CLASS_DEFS } = require('./rpg');

module.exports = {
  "!say": (ctx, parsedMsg, metadata) => {
    const { mod, isStreamer } = metadata;
    if (!mod && !isStreamer) return;
    if (!parsedMsg) return;
    ctx.sse.send(parsedMsg, 'tts');
  },
  // -------------------------------------------------------------------------------------------------------
  "!shoutout": (ctx, parsedMsg, metadata) => {
    const { channel, mod, isStreamer } = metadata;
    if ((!mod && !isStreamer) || !parsedMsg) return;

    const sanitizedUsername = parsedMsg.replace(/@/g, '').trim();
    ctx.sse.send('Hey Everyone!', 'tts');
    return ctx.say(
      channel,
      `Hey everyone! Check out ${sanitizedUsername}'s channel at https://twitch.tv/${sanitizedUsername.toLowerCase()}`,
    );
  },
  // -------------------------------------------------------------------------------------------------------
  "!commands": (ctx, parsedMsg, metadata) => {
    const { channel } = metadata;
    const cmds = Object.keys(module.exports).join(' · ');
    return ctx.say(channel, `Available commands: ${cmds}`);
  },
  // -------------------------------------------------------------------------------------------------------
  "!points": (ctx, parsedMsg, metadata) => {
    const { channel, username } = metadata;
    const db = ctx.db;
    const target = parsedMsg ? parsedMsg.replace(/@/g, '').trim().toLowerCase() : username;
    const viewer = db.getViewer(target);
    if (!viewer) return ctx.say(channel, `@${target} has no points yet.`);
    return ctx.say(channel, `@${target} has ${viewer.points} points.`);
  },
  // -------------------------------------------------------------------------------------------------------
  "!top": (ctx, parsedMsg, metadata) => {
    const { channel } = metadata;
    const db = ctx.db;
    const top = db.getLeaderboard(5);
    if (!top.length) return ctx.say(channel, 'No points yet!');
    const list = top.map((v, i) => `${i + 1}. ${v.username} (${v.points}pts)`).join(' | ');
    return ctx.say(channel, list);
  },
  // -------------------------------------------------------------------------------------------------------
  "!rpg": (ctx, parsedMsg, metadata) => {
    const { channel, username } = metadata;
    const db = ctx.db;
    const sub = (parsedMsg || '').trim().toLowerCase();
    const [subCmd, ...rest] = sub.split(/\s+/);

    if (!subCmd || subCmd === 'join') {
      db.upsertPlayer(username);
      const player = db.getPlayer(username);
      if (player.class === 'none') {
        return ctx.say(channel, `@${username} joined the RPG! Choose a class with !rpg class <${Object.keys(CLASS_DEFS).join('|')}>`);
      }
      return ctx.say(channel, `@${username} — Lv.${player.level} ${player.class} | HP: ${player.hp}/${player.max_hp} | ATK: ${player.attack} | DEF: ${player.defense} | XP: ${player.xp}/${player.level * 100} | Gold: ${player.gold}`);
    }

    if (subCmd === 'class') {
      const className = rest[0] && rest[0].toLowerCase();
      if (!CLASS_DEFS[className]) {
        return ctx.say(channel, `@${username} Invalid class. Choose: ${Object.keys(CLASS_DEFS).join(', ')}`);
      }
      db.upsertPlayer(username);
      const player = db.getPlayer(username);
      if (player.class !== 'none') {
        return ctx.say(channel, `@${username} You already chose ${player.class}. Class cannot be changed.`);
      }
      const def = CLASS_DEFS[className];
      db.updatePlayer(username, {
        class: className,
        hp: def.base_hp,
        max_hp: def.base_hp,
        attack: def.base_atk,
        defense: def.base_def,
      });
      return ctx.say(channel, `@${username} is now a ${className}! HP: ${def.base_hp} | ATK: ${def.base_atk} | DEF: ${def.base_def}`);
    }

    if (subCmd === 'stats') {
      const player = db.getPlayer(username);
      if (!player || player.class === 'none') {
        return ctx.say(channel, `@${username} hasn't joined the RPG. Use !rpg join`);
      }
      return ctx.say(channel, `@${username} — Lv.${player.level} ${player.class} | HP: ${player.hp}/${player.max_hp} | ATK: ${player.attack} | DEF: ${player.defense} | XP: ${player.xp}/${player.level * 100} | Gold: ${player.gold}`);
    }

    if (subCmd === 'inventory' || subCmd === 'inv') {
      const player = db.getPlayer(username);
      if (!player || player.class === 'none') return ctx.say(channel, `@${username} Join the RPG first with !rpg join`);
      const inv = db.getInventory(username);
      if (!inv.length) return ctx.say(channel, `@${username} Inventory is empty. Earn loot by fighting monsters!`);
      const list = inv.slice(0, 8).map(i => `[${i.inventory_id}] ${i.name} (${i.rarity}) +${i.atk_bonus}atk +${i.def_bonus}def +${i.hp_bonus}hp${i.equipped ? ' ✓' : ''}`).join(' · ');
      return ctx.say(channel, `@${username} Inventory: ${list}`);
    }

    if (subCmd === 'equip') {
      const player = db.getPlayer(username);
      if (!player || player.class === 'none') return ctx.say(channel, `@${username} Join the RPG first with !rpg join`);
      const invId = parseInt(rest[0], 10);
      if (!invId) return ctx.say(channel, `@${username} Usage: !rpg equip <inventory_id> — find IDs with !rpg inventory`);
      const inv = db.getInventory(username);
      const entry = inv.find(i => i.inventory_id === invId);
      if (!entry) return ctx.say(channel, `@${username} Item #${invId} not found in your inventory.`);
      db.equipItem(username, invId, entry.slot);
      const bonuses = db.getEquippedBonuses(username);
      return ctx.say(channel, `@${username} Equipped ${entry.name} (${entry.rarity}) in ${entry.slot} slot! Total gear bonuses: +${bonuses.atk}atk +${bonuses.def}def +${bonuses.hp}hp`);
    }

    if (subCmd === 'gear') {
      const player = db.getPlayer(username);
      if (!player || player.class === 'none') return ctx.say(channel, `@${username} Join the RPG first with !rpg join`);
      const eq = db.getEquipment(username);
      const slots = ['weapon', 'chest', 'helmet', 'boots'];
      const parts = slots.map(s => eq[s] ? `${s}: ${eq[s].name} (${eq[s].rarity})` : `${s}: empty`);
      const bonuses = db.getEquippedBonuses(username);
      return ctx.say(channel, `@${username} Gear — ${parts.join(' · ')} | Bonuses: +${bonuses.atk}atk +${bonuses.def}def +${bonuses.hp}hp`);
    }

    return ctx.say(channel, `@${username} RPG commands: !rpg join · !rpg class <name> · !rpg stats · !rpg inventory · !rpg equip <id> · !rpg gear`);
  },
  // -------------------------------------------------------------------------------------------------------
  "!heal": (ctx, parsedMsg, metadata) => {
    const { channel, username } = metadata;
    const db = ctx.db;
    const amount = parseInt(parsedMsg, 10);
    if (!amount || amount <= 0) return ctx.say(channel, `@${username} Usage: !heal <amount>`);
    const player = db.getPlayer(username);
    if (!player || player.class === 'none') return ctx.say(channel, `@${username} Join the RPG first with !rpg join`);
    if (player.hp >= player.max_hp) return ctx.say(channel, `@${username} Already at full HP!`);
    const actualHeal = Math.min(amount, player.max_hp - player.hp);
    const cost = actualHeal * 2;
    const spent = db.spendPoints(username, cost);
    if (!spent) {
      const viewer = db.getViewer(username);
      return ctx.say(channel, `@${username} Not enough points. Need ${cost}, have ${viewer ? viewer.points : 0}.`);
    }
    db.updatePlayer(username, { hp: player.hp + actualHeal });
    return ctx.say(channel, `@${username} healed ${actualHeal} HP for ${cost} points. HP: ${player.hp + actualHeal}/${player.max_hp}`);
  },
  // -------------------------------------------------------------------------------------------------------
};
