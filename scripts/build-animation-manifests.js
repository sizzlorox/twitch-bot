const fs = require('fs');
const path = require('path');

const AVATARS_DIR = path.join(__dirname, '../bot/public/assets/avatars');
const CLASSES = ['warrior', 'mage', 'rogue', 'ranger', 'goblin'];

function classifyAnimation(folderName, frameCount) {
  if (folderName.startsWith('animating-')) return 'idle';
  if (folderName.startsWith('cross_punch_attack-')) return 'attack';
  if (folderName.startsWith('taking_a_punch-')) return 'hit';
  if (folderName.startsWith('falling_backward-')) return 'death';
  return null;
}

for (const cls of CLASSES) {
  const metaPath = path.join(AVATARS_DIR, `${cls}_anims`, 'metadata.json');
  if (!fs.existsSync(metaPath)) {
    console.warn(`Missing: ${metaPath}`);
    continue;
  }

  const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
  const manifest = { idle: null, attack: null, hit: null, death: null };

  for (const [folder, dirs] of Object.entries(meta.frames.animations)) {
    const frames = dirs.south || [];
    const type = classifyAnimation(folder, frames.length);
    if (!type) { console.warn(`Unknown animation: ${folder}`); continue; }

    manifest[type] = {
      frameCount: frames.length,
      frames: frames.map(f => `/assets/avatars/${cls}_anims/${f}`),
    };
  }

  const outPath = path.join(AVATARS_DIR, `${cls}_animations.json`);
  fs.writeFileSync(outPath, JSON.stringify(manifest, null, 2));
  console.log(`${cls}: idle=${manifest.idle?.frameCount}f attack=${manifest.attack?.frameCount}f hit=${manifest.hit?.frameCount}f death=${manifest.death?.frameCount}f`);
}
