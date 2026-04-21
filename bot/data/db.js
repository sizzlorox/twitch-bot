const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'db.sqlite'));

db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS viewers (
    username  TEXT PRIMARY KEY,
    points    INTEGER NOT NULL DEFAULT 0,
    last_seen INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS rpg_players (
    username  TEXT PRIMARY KEY,
    class     TEXT NOT NULL DEFAULT 'none',
    level     INTEGER NOT NULL DEFAULT 1,
    xp        INTEGER NOT NULL DEFAULT 0,
    hp        INTEGER NOT NULL DEFAULT 100,
    max_hp    INTEGER NOT NULL DEFAULT 100,
    attack    INTEGER NOT NULL DEFAULT 10,
    defense   INTEGER NOT NULL DEFAULT 5,
    gold      INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS rpg_events (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    event_type TEXT NOT NULL,
    summary    TEXT NOT NULL,
    detail     TEXT NOT NULL,
    created_at INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS items (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL,
    slot        TEXT NOT NULL,
    rarity      TEXT NOT NULL,
    atk_bonus   INTEGER NOT NULL DEFAULT 0,
    def_bonus   INTEGER NOT NULL DEFAULT 0,
    hp_bonus    INTEGER NOT NULL DEFAULT 0,
    sprite_path TEXT NOT NULL,
    created_at  INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS player_inventory (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    username    TEXT NOT NULL,
    item_id     INTEGER NOT NULL REFERENCES items(id),
    acquired_at INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS player_equipment (
    username     TEXT NOT NULL,
    slot         TEXT NOT NULL,
    inventory_id INTEGER REFERENCES player_inventory(id),
    PRIMARY KEY (username, slot)
  );

  CREATE INDEX IF NOT EXISTS idx_viewers_points    ON viewers(points DESC);
  CREATE INDEX IF NOT EXISTS idx_rpg_events_created ON rpg_events(created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_inventory_username ON player_inventory(username);
`);

const stmts = {
  getViewer:       db.prepare('SELECT * FROM viewers WHERE username = ?'),
  upsertViewer:    db.prepare('INSERT OR IGNORE INTO viewers (username) VALUES (?)'),
  touchViewer:     db.prepare('UPDATE viewers SET last_seen = ? WHERE username = ?'),
  addPoints:       db.prepare('UPDATE viewers SET points = MAX(0, points + ?) WHERE username = ?'),
  getLeaderboard:  db.prepare('SELECT username, points FROM viewers ORDER BY points DESC LIMIT ?'),
  getPlayer:       db.prepare('SELECT * FROM rpg_players WHERE username = ?'),
  upsertPlayer:    db.prepare('INSERT OR IGNORE INTO rpg_players (username) VALUES (?)'),
  getActivePlayers: db.prepare(`
    SELECT r.* FROM rpg_players r
    JOIN viewers v ON v.username = r.username
    WHERE r.class != 'none' AND v.last_seen > ?
  `),
  getAllPlayers:   db.prepare(`SELECT * FROM rpg_players WHERE class != 'none'`),
  logEvent:        db.prepare('INSERT INTO rpg_events (event_type, summary, detail, created_at) VALUES (?, ?, ?, ?)'),
  getRecentEvents: db.prepare('SELECT * FROM rpg_events ORDER BY created_at DESC LIMIT ?'),

  createItem:      db.prepare(`
    INSERT INTO items (name, slot, rarity, atk_bonus, def_bonus, hp_bonus, sprite_path, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `),
  getItem:         db.prepare('SELECT * FROM items WHERE id = ?'),
  addToInventory:  db.prepare(`
    INSERT INTO player_inventory (username, item_id, acquired_at) VALUES (?, ?, ?)
  `),
  getInventory:    db.prepare(`
    SELECT pi.id as inventory_id, pi.acquired_at, i.*,
           (pe.inventory_id IS NOT NULL) as equipped
    FROM player_inventory pi
    JOIN items i ON i.id = pi.item_id
    LEFT JOIN player_equipment pe ON pe.username = pi.username AND pe.inventory_id = pi.id
    WHERE pi.username = ?
    ORDER BY pi.acquired_at DESC
  `),
  getEquipmentSlots: db.prepare(`
    SELECT pe.slot, pi.id as inventory_id, i.*
    FROM player_equipment pe
    JOIN player_inventory pi ON pi.id = pe.inventory_id
    JOIN items i ON i.id = pi.item_id
    WHERE pe.username = ?
  `),
  equipItem:       db.prepare(`
    INSERT OR REPLACE INTO player_equipment (username, slot, inventory_id) VALUES (?, ?, ?)
  `),
  getEquippedBonuses: db.prepare(`
    SELECT COALESCE(SUM(i.atk_bonus),0) as atk, COALESCE(SUM(i.def_bonus),0) as def, COALESCE(SUM(i.hp_bonus),0) as hp
    FROM player_equipment pe
    JOIN player_inventory pi ON pi.id = pe.inventory_id
    JOIN items i ON i.id = pi.item_id
    WHERE pe.username = ?
  `),
};

const ALLOWED_PLAYER_COLS = new Set(['class','level','xp','hp','max_hp','attack','defense','gold']);

module.exports = {
  getViewer: (username) => stmts.getViewer.get(username),
  upsertViewer: (username) => stmts.upsertViewer.run(username),
  touchViewer: (username) => stmts.touchViewer.run(Date.now(), username),
  addPoints: (username, amount) => stmts.addPoints.run(amount, username),

  spendPoints: (username, amount) => {
    const viewer = stmts.getViewer.get(username);
    if (!viewer || viewer.points < amount) return false;
    stmts.addPoints.run(-amount, username);
    return true;
  },

  getLeaderboard: (limit = 10) => stmts.getLeaderboard.all(limit),
  getPlayer: (username) => stmts.getPlayer.get(username),

  upsertPlayer: (username) => {
    stmts.upsertViewer.run(username);
    stmts.upsertPlayer.run(username);
  },

  updatePlayer: (username, fields) => {
    const entries = Object.entries(fields).filter(([col]) => ALLOWED_PLAYER_COLS.has(col));
    if (!entries.length) return;
    const sets = entries.map(([col]) => `${col} = ?`).join(', ');
    const values = entries.map(([, v]) => v);
    db.prepare(`UPDATE rpg_players SET ${sets} WHERE username = ?`).run(...values, username);
  },

  getActivePlayers: (windowMs) => stmts.getActivePlayers.all(Date.now() - windowMs),
  getAllPlayers: () => stmts.getAllPlayers.all(),

  logEvent: (type, summary, detail) => stmts.logEvent.run(type, summary, detail, Date.now()),
  getRecentEvents: (limit = 20) => stmts.getRecentEvents.all(limit),

  createItem: (name, slot, rarity, atk, def, hp, spritePath) => {
    const result = stmts.createItem.run(name, slot, rarity, atk, def, hp, spritePath, Date.now());
    return stmts.getItem.get(result.lastInsertRowid);
  },

  addToInventory: (username, itemId) => {
    const result = stmts.addToInventory.run(username, itemId, Date.now());
    return result.lastInsertRowid;
  },

  getInventory: (username) => stmts.getInventory.all(username),

  getEquipment: (username) => {
    const rows = stmts.getEquipmentSlots.all(username);
    const eq = { weapon: null, chest: null, helmet: null, boots: null };
    for (const row of rows) {
      eq[row.slot] = { inventory_id: row.inventory_id, name: row.name, slot: row.slot, rarity: row.rarity, atk_bonus: row.atk_bonus, def_bonus: row.def_bonus, hp_bonus: row.hp_bonus, spriteUrl: row.sprite_path };
    }
    return eq;
  },

  equipItem: (username, inventoryId, slot) => stmts.equipItem.run(username, slot, inventoryId),

  getEquippedBonuses: (username) => stmts.getEquippedBonuses.get(username) || { atk: 0, def: 0, hp: 0 },

  getPlayersWithEquipment: (usernames) => {
    return usernames.map(username => {
      const player = stmts.getPlayer.get(username);
      if (!player) return null;
      const rows = stmts.getEquipmentSlots.all(username);
      const equipment = { weapon: null, chest: null, helmet: null, boots: null };
      for (const row of rows) {
        equipment[row.slot] = { name: row.name, rarity: row.rarity, spriteUrl: row.sprite_path };
      }
      return { ...player, equipment };
    }).filter(Boolean);
  },
};
