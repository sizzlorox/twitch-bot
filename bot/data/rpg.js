const CLASS_DEFS = {
  warrior: { base_hp: 150, base_atk: 12, base_def: 10, hp_per_lvl: 15, atk_per_lvl: 2, def_per_lvl: 3 },
  mage:    { base_hp: 80,  base_atk: 18, base_def: 3,  hp_per_lvl: 8,  atk_per_lvl: 4, def_per_lvl: 1, xp_bonus: 10 },
  rogue:   { base_hp: 100, base_atk: 15, base_def: 5,  hp_per_lvl: 10, atk_per_lvl: 3, def_per_lvl: 2, variance: 5 },
  ranger:  { base_hp: 110, base_atk: 14, base_def: 6,  hp_per_lvl: 12, atk_per_lvl: 3, def_per_lvl: 2 },
};

const MONSTERS = [
  { name: 'Goblin',       type: 'goblin', hp: 40,  attack: 8,  defense: 2,  xp: 20,  gold: 10, multiTarget: false },
  { name: 'Kobold',       type: 'goblin', hp: 30,  attack: 7,  defense: 1,  xp: 15,  gold: 8,  multiTarget: false },
  { name: 'Forest Imp',   type: 'goblin', hp: 35,  attack: 9,  defense: 1,  xp: 18,  gold: 8,  multiTarget: false },
  { name: 'Vampire Bat',  type: 'goblin', hp: 40,  attack: 10, defense: 1,  xp: 22,  gold: 12, multiTarget: false },
  { name: 'Slime',        type: 'goblin', hp: 45,  attack: 6,  defense: 0,  xp: 15,  gold: 5,  multiTarget: false },
  { name: 'Skeleton',     type: 'goblin', hp: 55,  attack: 10, defense: 3,  xp: 25,  gold: 12, multiTarget: false },
  { name: 'Harpy',        type: 'goblin', hp: 55,  attack: 12, defense: 2,  xp: 30,  gold: 18, multiTarget: false },
  { name: 'Giant Spider', type: 'goblin', hp: 65,  attack: 11, defense: 3,  xp: 28,  gold: 15, multiTarget: false },
  { name: 'Bandit',       type: 'goblin', hp: 70,  attack: 13, defense: 4,  xp: 30,  gold: 35, multiTarget: false },
  { name: 'Wraith',       type: 'goblin', hp: 70,  attack: 14, defense: 3,  xp: 45,  gold: 30, multiTarget: false },
  { name: 'Zombie',       type: 'goblin', hp: 75,  attack: 9,  defense: 4,  xp: 28,  gold: 10, multiTarget: false },
  { name: 'Dark Wizard',  type: 'goblin', hp: 60,  attack: 16, defense: 2,  xp: 40,  gold: 25, multiTarget: false },
  { name: 'Orc',          type: 'goblin', hp: 80,  attack: 14, defense: 5,  xp: 35,  gold: 20, multiTarget: false },
  { name: 'Werewolf',     type: 'goblin', hp: 100, attack: 15, defense: 6,  xp: 55,  gold: 40, multiTarget: true  },
  { name: 'Minotaur',     type: 'goblin', hp: 110, attack: 17, defense: 7,  xp: 65,  gold: 45, multiTarget: true  },
  { name: 'Cave Troll',   type: 'goblin', hp: 120, attack: 12, defense: 8,  xp: 50,  gold: 30, multiTarget: true  },
  { name: 'Ogre',         type: 'goblin', hp: 130, attack: 16, defense: 6,  xp: 58,  gold: 42, multiTarget: true  },
  { name: 'Stone Golem',  type: 'goblin', hp: 140, attack: 11, defense: 10, xp: 60,  gold: 35, multiTarget: true  },
];

const BOSS_MONSTERS = [
  { name: 'Dragon',        type: 'goblin', hp: 400, attack: 22, defense: 12, xp: 200, gold: 200, multiTarget: true },
  { name: 'Lich King',     type: 'goblin', hp: 350, attack: 25, defense: 8,  xp: 220, gold: 180, multiTarget: true },
  { name: 'Demon Lord',    type: 'goblin', hp: 450, attack: 20, defense: 15, xp: 250, gold: 250, multiTarget: true },
  { name: 'Hydra',         type: 'goblin', hp: 380, attack: 21, defense: 11, xp: 210, gold: 190, multiTarget: true },
  { name: 'Ancient Golem', type: 'goblin', hp: 500, attack: 18, defense: 18, xp: 260, gold: 220, multiTarget: true },
];

const RARITIES = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
const RARITY_WEIGHTS = [50, 25, 15, 8, 2]; // sum = 100

const RARITY_STAT_RANGES = {
  common:    { min: 1,  max: 3  },
  uncommon:  { min: 3,  max: 6  },
  rare:      { min: 6,  max: 10 },
  epic:      { min: 10, max: 15 },
  legendary: { min: 15, max: 25 },
};

const RARITY_HP_RANGES = {
  common:    { min: 5,  max: 10 },
  uncommon:  { min: 10, max: 20 },
  rare:      { min: 20, max: 35 },
  epic:      { min: 35, max: 55 },
  legendary: { min: 55, max: 80 },
};

const ITEM_NAMES = {
  weapon: {
    common:    ['Iron Sword','Worn Blade','Rusty Dagger','Chipped Axe','Bent Shortsword','Cracked Staff','Dull Hatchet','Splinted Spear','Wooden Club','Battered Mace','Old Pitchfork','Crude Shiv','Notched Cleaver','Frayed Whip','Stone Hatchet'],
    uncommon:  ['Steel Longsword','Silver Blade','Hunting Knife','Iron Hatchet','Soldier\'s Rapier','Crossbow','Recurve Bow','Oak Staff','Bone Mace','Chain Flail','Serrated Dirk','Militia Polearm','Reinforced Club','Warclub','Bronze Glaive'],
    rare:      ['Runesword','Arcane Blade','Shadowfang','Frostbite Edge','Stormcleaver','Emberstrike','Venomfang','Moonfang','Tidecutter','Warpblade','Hexstaff','Crystalblade','Thornwhip','Spectral Saber','Forgebreaker'],
    epic:      ['Demonblade','Soulreaper','Chaos Edge','Voidcleaver','Hellcleaver','Oblivion\'s Fang','Bloodthorn','Deathwhisper','Nightmare Saber','Eclipse Blade','Shadowrend','Abyssal Shard','Doomcleaver','Ruinblade','Cataclysm'],
    legendary: ['Excalibur','Godslayer','Dawn\'s Light','Eternity\'s Edge','Ragnarok','Mjolnir','Stormbreaker','The Devastator','Sunfire Blade','Worldbreaker','Celestial Edge','Starfall','The Last Word','Judgement','Apocalypse'],
  },
  chest: {
    common:    ['Leather Vest','Padded Armor','Cloth Tunic','Worn Jerkin','Rough Hide Coat','Burlap Gambeson','Peasant\'s Coat','Tattered Robe','Fraying Doublet','Bark Armor','Patchwork Mail','Farmhand\'s Vest','Sackcloth Armor','Loose Chainshirt','Moth-eaten Coat'],
    uncommon:  ['Chainmail','Studded Leather','Ringmail','Plated Vest','Brigandine','Scale Hauberk','Lamellar Vest','Riveted Coat','Soldier\'s Cuirass','Mercenary Plate','Hunter\'s Jerkin','Ranger\'s Coat','Battle Vest','Iron Hauberk','Bronze Plate'],
    rare:      ['Enchanted Breastplate','Runic Chainmail','Arcane Plate','Mystic Cuirass','Stormweave Mail','Frosted Plate','Shadowcloak','Emberveil','Tideguard','Moonweave Vest','Hexplate','Crystalmail','Wraithcoat','Gloomguard','Forged Sanctum'],
    epic:      ['Chaos Armor','Demonplate','Voidmail','Shadow Carapace','Hellforged Plate','Abyssal Cuirass','Dreadmail','Nightguard','Eclipse Plate','Nightmare Carapace','Soulveil','Ruinplate','Doomguard','Deathshroud','Oblivion Mail'],
    legendary: ['Divine Plate','Celestial Cuirass','Heaven\'s Guard','Godplate','Aegis of Creation','Mantle of Eternity','Starweave Raiment','Sunforged Plate','The Unbroken','Bastion of Dawn','Soulguard','Cosmic Mail','Radiant Carapace','Holy Sanctum','Dawnbreaker Plate'],
  },
  helmet: {
    common:    ['Iron Cap','Leather Hood','Cloth Coif','Rusty Helm','Battered Skullcap','Tin Helm','Frayed Cowl','Wooden Headpiece','Ragged Hood','Wicker Hat','Patched Coif','Old Headband','Dented Pot Helm','Worn Visor','Crude Cap'],
    uncommon:  ['Steel Helm','Chainmail Coif','Great Helm','Plated Visor','Kettle Helm','Spangenhelm','Soldier\'s Casque','Barbute','Iron Sallet','Nasal Helm','Guard\'s Helm','Riveted Coif','Battle Helm','Bronze Casque','Warrior\'s Headband'],
    rare:      ['Arcane Helm','Runic Crown','Enchanted Visor','Mystic Cap','Stormcrest','Frostvisor','Shadowhood','Ember Crown','Moonhelm','Tidecrest','Hexcrown','Crystalvisor','Wraithhood','Gloomcrest','Sanctum Helm'],
    epic:      ['Demon Crown','Chaos Helm','Horned Visor','Voidhelm','Hellcrown','Abyssal Crown','Dreadvisor','Nightmare Helm','Eclipse Crown','Soulcrown','Doomcrest','Oblivion Visor','Ruincrown','Deathhelm','Nightcrown'],
    legendary: ['Crown of Kings','Divine Helm','Celestial Crown','Halo Crest','Aureate Circlet','Mantle of the Eternal','Starlight Crown','Sunfire Helm','God\'s Gaze','Heaven\'s Crest','Cosmic Crown','Radiant Visor','Dawncrown','Holy Circlet','Apex Crown'],
  },
  boots: {
    common:    ['Leather Boots','Cloth Shoes','Worn Sandals','Hide Wraps','Muddy Boots','Straw Sandals','Fraying Wraps','Peasant\'s Clogs','Battered Shoes','Rough Moccasins','Patched Boots','Old Treads','Worn Sneakers','Tattered Slippers','Crude Sabatons'],
    uncommon:  ['Steel Greaves','Studded Boots','Reinforced Shoes','Iron Sabatons','Soldier\'s Greaves','Chain Sabatons','Hunter\'s Boots','Ranger\'s Treads','Battle Greaves','Riveted Boots','Mercenary Treads','Bronze Sabatons','Guard\'s Boots','Scout\'s Shoes','Iron Warboots'],
    rare:      ['Arcane Boots','Runic Greaves','Enchanted Shoes','Mystic Treads','Stormwalkers','Frosted Sabatons','Shadowstep','Emberwalkers','Moontrode','Tidewalkers','Hexboots','Crystalstep','Wraithwalkers','Gloomstride','Runic Sabatons'],
    epic:      ['Demon Boots','Chaos Greaves','Voidwalkers','Shadow Steps','Hellwalkers','Abyssal Treads','Dreadstep','Nightmare Greaves','Eclipse Walkers','Soulstride','Doomstep','Oblivion Treads','Ruinwalkers','Deathstride','Nightwalkers'],
    legendary: ['Winged Boots','Divine Treads','Celestial Steps','Heaven\'s Walk','Boots of Ascension','Eternal Walkers','Starlance Treads','Sunstride','God\'s Step','Heaven\'s Stride','Cosmic Walkers','Radiant Treads','Dawnwalkers','Holy Steps','Apex Sabatons'],
  },
};

const SLOTS = ['weapon', 'chest', 'helmet', 'boots'];

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function rollRarity() {
  const roll = randomInt(1, 100);
  let cum = 0;
  for (let i = 0; i < RARITIES.length; i++) {
    cum += RARITY_WEIGHTS[i];
    if (roll <= cum) return RARITIES[i];
  }
  return 'common';
}

function calcDamage(attacker, defender, isRogue = false) {
  const variance = isRogue ? randomInt(-5, 5) : randomInt(-3, 3);
  return Math.max(1, attacker.attack - Math.floor(defender.defense / 4) + variance);
}

function calcStatsForLevel(cls, level) {
  const def = CLASS_DEFS[cls];
  if (!def) return null;
  return {
    max_hp:  def.base_hp  + def.hp_per_lvl  * (level - 1),
    attack:  def.base_atk + def.atk_per_lvl * (level - 1),
    defense: def.base_def + def.def_per_lvl * (level - 1),
  };
}

function applyEquipment(player, bonuses) {
  return {
    ...player,
    attack:  player.attack  + (bonuses.atk || 0),
    defense: player.defense + (bonuses.def || 0),
    max_hp:  player.max_hp  + (bonuses.hp  || 0),
    hp:      Math.min(player.hp, player.max_hp + (bonuses.hp || 0)),
  };
}

// Runs a full party-vs-monster combat simulation.
// monster.hp must already be scaled before calling.
// Returns rounds array: [{ partyAttacks, monsterAttacks, monsterHpPct, playerHpPcts }]
function runCombat(effectivePlayers, monster) {
  let monsterHp = monster.hp;
  const maxMonsterHp = monster.hp;
  const playerHps = effectivePlayers.map(p => p.hp);
  const rounds = [];

  while (monsterHp > 0 && playerHps.some(h => h > 0) && rounds.length < 20) {
    const round = { partyAttacks: [], monsterAttacks: [] };

    // Party attacks — no early break; combat is simultaneous
    for (let i = 0; i < effectivePlayers.length; i++) {
      if (playerHps[i] <= 0) continue;
      const dmg = calcDamage(effectivePlayers[i], monster, effectivePlayers[i].class === 'rogue');
      monsterHp -= dmg;
      round.partyAttacks.push({ playerIdx: i, damage: dmg });
    }

    // Monster retaliates in the same round even if it just died — focus lowest HP target
    const alive = playerHps.reduce((acc, h, i) => h > 0 ? [...acc, i] : acc, []);
    if (alive.length) {
      const byHp = [...alive].sort((a, b) => playerHps[a] - playerHps[b]);
      const targets = monster.multiTarget
        ? byHp.slice(0, Math.min(2, byHp.length))
        : [byHp[0]];
      for (const ti of targets) {
        const dmg = calcDamage(monster, effectivePlayers[ti]);
        playerHps[ti] = Math.max(0, playerHps[ti] - dmg);
        round.monsterAttacks.push({ playerIdx: ti, damage: dmg });
      }
    }

    round.monsterHpPct = Math.max(0, Math.round(monsterHp / maxMonsterHp * 100));
    round.playerHpPcts = playerHps.map((h, i) => Math.max(0, Math.round(h / effectivePlayers[i].max_hp * 100)));
    rounds.push(round);
  }

  return rounds;
}

class RPGEngine {
  constructor(client, db) {
    this.client = client;
    this.db = db;
    this.intervalMs = (Number(process.env.RPG_INTERVAL) || 10) * 60 * 1000;
    this._timer = null;
  }

  start() {
    if (this._timer) return;
    this._timer = setInterval(() => this._runCycle(), this.intervalMs);
    console.log(`[RPG] Engine started. Cycle every ${this.intervalMs / 60000} min.`);
  }

  stop() {
    if (this._timer) { clearInterval(this._timer); this._timer = null; }
  }

  _say(msg) {
    const channel = process.env.CHANNEL_NAME;
    if (!channel) return;
    try { this.client.say(`#${channel}`, msg); } catch (e) { /* noop */ }
  }

  _selectParty() {
    const classes = Object.keys(CLASS_DEFS);
    const viewers = this.client.viewers;
    if (!viewers || viewers.size === 0) return [];
    const pool = [...viewers];

    return shuffle(pool).slice(0, 4).map(username => {
      this.db.upsertPlayer(username);
      let player = this.db.getPlayer(username);
      if (!player || player.class === 'none') {
        const cls = classes[randomInt(0, classes.length - 1)];
        const def = CLASS_DEFS[cls];
        this.db.updatePlayer(username, { class: cls, hp: def.base_hp, max_hp: def.base_hp, attack: def.base_atk, defense: def.base_def });
        player = this.db.getPlayer(username);
      }
      return player;
    }).filter(Boolean);
  }

  _dropLoot(username, dropChance) {
    if (Math.random() > dropChance) return null;
    const rarity = rollRarity();
    const slot = SLOTS[randomInt(0, SLOTS.length - 1)];
    const statRange = RARITY_STAT_RANGES[rarity];
    const hpRange = RARITY_HP_RANGES[rarity];
    const namePool = ITEM_NAMES[slot][rarity];
    const name = namePool[randomInt(0, namePool.length - 1)];
    const atk = randomInt(statRange.min, statRange.max);
    const def = randomInt(statRange.min, statRange.max);
    const hp  = randomInt(hpRange.min, hpRange.max);
    const spritePath = `/assets/items/overlay_${slot}_${rarity}.png`;

    const item = this.db.createItem(name, slot, rarity, atk, def, hp, spritePath);
    const invId = this.db.addToInventory(username, item.id);

    // Auto-equip if slot is empty or new item has higher total bonus
    const currentEquip = this.db.getEquipment(username);
    const current = currentEquip[slot];
    const newTotal = atk + def + hp;
    const curTotal = current ? (current.atk_bonus + current.def_bonus + current.hp_bonus) : -1;
    if (newTotal > curTotal) {
      this.db.equipItem(username, invId, slot);
    }

    return { name, rarity, slot, spriteUrl: spritePath, atk_bonus: atk, def_bonus: def, hp_bonus: hp };
  }

  _buildPartyPayload(players, results, loots) {
    return players.map((p, i) => ({
      username: p.username,
      class: p.class,
      level: p.level,
      result: results[i],
      avatarUrl: `/assets/avatars/${p.class}.png`,
      equipment: this.db.getEquipment(p.username),
      loot: loots[i] || null,
    }));
  }

  _runCycle() {
    if (this.client.readyState() !== 'OPEN') return;

    const players = this._selectParty();
    if (!players.length) return;

    const roll = Math.random();
    const hasBoss = players.length >= 3;

    if (hasBoss && roll < 0.15) {
      this._bossRaid(players);
    } else if (roll < 0.55) {
      this._monsterEncounter(players);
    } else if (roll < 0.75) {
      this._treasureEvent(players);
    } else {
      this._trainingEvent(players);
    }
  }

  _monsterEncounter(players) {
    const monster = { ...MONSTERS[randomInt(0, MONSTERS.length - 1)] };
    monster.hp     = monster.hp     * players.length;
    monster.attack = monster.attack * players.length; // scale to party size
    const effectivePlayers = players.map(p => applyEquipment(p, this.db.getEquippedBonuses(p.username)));
    const combatRounds = runCombat(effectivePlayers, monster);

    const lastRound = combatRounds[combatRounds.length - 1];
    const monsterDead = lastRound ? lastRound.monsterHpPct === 0 : false;
    const finalPlayerHps = lastRound
      ? lastRound.playerHpPcts.map((pct, i) => Math.round(effectivePlayers[i].max_hp * pct / 100))
      : effectivePlayers.map(p => p.hp);

    const results = [];
    const loots = [];
    const summaryParts = [];

    for (let i = 0; i < players.length; i++) {
      const player = players[i];
      const ep = effectivePlayers[i];
      if (finalPlayerHps[i] > 0 && monsterDead) {
        const xpGain = monster.xp + (CLASS_DEFS[player.class]?.xp_bonus || 0);
        this.db.updatePlayer(player.username, { hp: Math.min(ep.max_hp, finalPlayerHps[i]), xp: player.xp + xpGain, gold: player.gold + monster.gold });
        this._checkLevelUp(player.username, { ...player, xp: player.xp + xpGain });
        const loot = this._dropLoot(player.username, 0.20);
        loots.push(loot);
        results.push('won');
        summaryParts.push(`${player.username} won (+${xpGain}xp +${monster.gold}g${loot ? ` 🎁${loot.rarity} ${loot.name}` : ''})`);
      } else {
        const lostGold = Math.floor(player.gold * 0.1);
        this.db.updatePlayer(player.username, { hp: Math.ceil(ep.max_hp * 0.5), gold: Math.max(0, player.gold - lostGold) });
        loots.push(null);
        results.push('lost');
        summaryParts.push(`${player.username} defeated (-${lostGold}g)`);
      }
    }

    const summary = `⚔️ ${monster.name} appeared! ${summaryParts.join(' | ')}`;
    const party = this._buildPartyPayload(players, results, loots);
    const monsterPayload = { name: monster.name, type: monster.type, hp: monster.hp, maxHp: monster.hp, avatarUrl: `/assets/avatars/${monster.type}.png` };
    this._say(summary);
    this._logAndBroadcast('monster', summary, { monster: monster.name, results: summaryParts }, party, monsterPayload, combatRounds);
  }

  _treasureEvent(players) {
    const lucky = players[randomInt(0, players.length - 1)];
    const gold = randomInt(20, 100);
    const pts = randomInt(10, 50);
    this.db.updatePlayer(lucky.username, { gold: lucky.gold + gold });
    this.db.addPoints(lucky.username, pts);
    const summary = `💰 ${lucky.username} found a treasure chest! (+${gold}g +${pts} points)`;
    const results = players.map(p => p.username === lucky.username ? 'won' : 'idle');
    const party = this._buildPartyPayload(players, results, players.map(() => null));
    this._say(summary);
    this._logAndBroadcast('treasure', summary, { username: lucky.username, gold, points: pts }, party);
  }

  _trainingEvent(players) {
    const xpGain = randomInt(10, 30);
    const updates = [];
    for (const player of players) {
      const bonus = CLASS_DEFS[player.class]?.xp_bonus || 0;
      const total = xpGain + bonus;
      this.db.updatePlayer(player.username, { xp: player.xp + total });
      this._checkLevelUp(player.username, { ...player, xp: player.xp + total });
      updates.push(`${player.username} (+${total}xp)`);
    }
    const summary = `📚 Training session! ${updates.join(', ')}`;
    const results = players.map(() => 'won');
    const party = this._buildPartyPayload(players, results, players.map(() => null));
    this._say(summary);
    this._logAndBroadcast('training', summary, { xpGain, players: players.map(p => p.username) }, party);
  }

  _bossRaid(players) {
    const boss = { ...BOSS_MONSTERS[randomInt(0, BOSS_MONSTERS.length - 1)] };
    boss.hp     = boss.hp     * players.length;
    boss.attack = boss.attack * players.length;
    const effectivePlayers = players.map(p => applyEquipment(p, this.db.getEquippedBonuses(p.username)));
    const combatRounds = runCombat(effectivePlayers, boss);

    const lastRound = combatRounds[combatRounds.length - 1];
    const bossKilled = lastRound ? lastRound.monsterHpPct === 0 : false;
    const finalPlayerHps = lastRound
      ? lastRound.playerHpPcts.map((pct, i) => Math.round(effectivePlayers[i].max_hp * pct / 100))
      : effectivePlayers.map(p => p.hp);

    const results = [];
    const loots = [];

    for (let i = 0; i < players.length; i++) {
      const player = players[i];
      const ep = effectivePlayers[i];
      if (finalPlayerHps[i] > 0 && bossKilled) {
        const xpGain = boss.xp + (CLASS_DEFS[player.class]?.xp_bonus || 0);
        this.db.updatePlayer(player.username, {
          hp: Math.min(ep.max_hp, finalPlayerHps[i]),
          xp: player.xp + xpGain,
          gold: player.gold + boss.gold,
        });
        this.db.addPoints(player.username, 100);
        this._checkLevelUp(player.username, { ...player, xp: player.xp + xpGain });
        const loot = this._dropLoot(player.username, 0.60);
        loots.push(loot);
        results.push('won');
      } else {
        const respawnHp = Math.ceil(ep.max_hp * 0.5);
        const lostGold = Math.floor(player.gold * 0.1);
        this.db.updatePlayer(player.username, {
          hp: respawnHp,
          gold: Math.max(0, player.gold - lostGold),
        });
        loots.push(null);
        results.push('lost');
      }
    }

    const outcome = bossKilled ? `💀 ${boss.name} slain!` : `${boss.name} escaped!`;
    const survivors = players.filter((_, i) => results[i] === 'won').map(p => p.username);
    const fallen = players.filter((_, i) => results[i] === 'lost').map(p => p.username);
    const summary = `🐉 BOSS RAID: ${boss.name}! ${outcome}${survivors.length ? ` Survivors: ${survivors.join(', ')}` : ''}${fallen.length ? ` Fallen: ${fallen.join(', ')}` : ''}`;
    const party = this._buildPartyPayload(players, results, loots);
    const bossPayload = { name: boss.name, type: boss.type, hp: boss.hp, maxHp: boss.hp, avatarUrl: `/assets/avatars/${boss.type}.png` };
    this._say(summary);
    this._logAndBroadcast('boss', summary, { boss: boss.name, killed: bossKilled, survivors, fallen }, party, bossPayload, combatRounds);
  }

  _checkLevelUp(username, player) {
    let { level, xp } = player;
    let leveled = false;

    while (xp >= level * 100) {
      xp -= level * 100;
      level++;
      leveled = true;

      const stats = calcStatsForLevel(player.class, level);
      if (stats) {
        const newHp = Math.min(stats.max_hp, player.hp + Math.ceil(stats.max_hp * 0.2));
        this.db.updatePlayer(username, { level, xp, max_hp: stats.max_hp, hp: newHp, attack: stats.attack, defense: stats.defense });
        player = { ...player, level, xp, max_hp: stats.max_hp, hp: newHp, attack: stats.attack, defense: stats.defense };
      }

      this._say(`🎉 ${username} leveled up to level ${level} (${player.class})!`);
      if (this.client.sse) {
        this.client.sse.send({ username, newLevel: level, class: player.class }, 'rpg_levelup');
      }
    }

    if (leveled) this.db.updatePlayer(username, { level, xp });
  }

  _logAndBroadcast(type, summary, detail, party = [], monster = null, rounds = []) {
    this.db.logEvent(type, summary, JSON.stringify(detail));
    if (this.client.sse) {
      const events = this.db.getRecentEvents(1);
      const ev = events[0];
      this.client.sse.send(
        { id: ev.id, type: ev.event_type, summary: ev.summary, detail, party, monster, rounds, timestamp: ev.created_at },
        'rpg_event'
      );
      this.client.sse.send(this.db.getLeaderboard(10), 'leaderboard');
    }
  }
}

module.exports = { RPGEngine, CLASS_DEFS, MONSTERS, BOSS_MONSTERS, runCombat, calcStatsForLevel };
