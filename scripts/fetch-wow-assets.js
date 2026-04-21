/**
 * Fetch PixelLab generated images and convert RGBA bytes → PNG files
 * into bot/public/wow/
 */
const https = require('https');
const fs    = require('fs');
const path  = require('path');
const { PNG } = require('pngjs');

const TOKEN   = '55c3133e-c7db-49d6-9d50-10365a8ae647';
const OUT_DIR = path.join(__dirname, '..', 'bot', 'public', 'wow');

const JOBS = [
  { id: '349542f2-0bfc-413f-9e0a-6667a9764617', file: 'chat-frame.png',      w: 420, h: 200 },
  { id: '3f308161-ee11-4538-abd4-2abef0b7036c', file: 'splash-starting.png', w: 512, h: 288 },
  { id: '095eab83-c96f-40da-8ce8-cef0ef9aa072', file: 'splash-brb.png',      w: 512, h: 288 },
  { id: '1034c9d1-573c-4b15-9b13-4e24f8c8c7ca', file: 'splash-ending.png',  w: 512, h: 288 },
];

function fetchJson(url, token) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      headers: { Authorization: `Bearer ${token}` },
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error('JSON parse failed: ' + e.message)); }
      });
    });
    req.on('error', reject);
  });
}

function rgbaBufferToPng(buf, width, height) {
  return new Promise((resolve, reject) => {
    const png = new PNG({ width, height, filterType: -1 });
    png.data = buf;
    const chunks = [];
    png.pack()
      .on('data', c => chunks.push(c))
      .on('end', () => resolve(Buffer.concat(chunks)))
      .on('error', reject);
  });
}

async function processJob({ id, file, w, h }) {
  console.log(`Fetching ${file} (job ${id})…`);
  const data = await fetchJson(`https://api.pixellab.ai/v2/background-jobs/${id}`, TOKEN);

  if (data.status !== 'completed') {
    console.warn(`  ⚠  status is ${data.status}, skipping`);
    return false;
  }

  const images = data.last_response && data.last_response.images;
  if (!images || !images[0] || !images[0].base64) {
    console.warn('  ⚠  no image data in response');
    return false;
  }

  const imgData = images[0];
  const actualW = imgData.width || w;
  const rawBuf  = Buffer.from(imgData.base64, 'base64');
  const pixels  = rawBuf.length / 4;
  const actualH = Math.round(pixels / actualW);

  console.log(`  ${actualW}×${actualH} (${rawBuf.length} bytes RGBA)`);

  const pngBuf = await rgbaBufferToPng(rawBuf, actualW, actualH);
  const outPath = path.join(OUT_DIR, file);
  fs.writeFileSync(outPath, pngBuf);
  console.log(`  ✓ saved ${outPath} (${(pngBuf.length / 1024).toFixed(1)} KB)`);
  return true;
}

(async () => {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  let ok = 0;
  for (const job of JOBS) {
    try {
      if (await processJob(job)) ok++;
    } catch (e) {
      console.error(`  ✗ ${job.file}: ${e.message}`);
    }
  }
  console.log(`\nDone: ${ok}/${JOBS.length} images saved to ${OUT_DIR}`);
})();
