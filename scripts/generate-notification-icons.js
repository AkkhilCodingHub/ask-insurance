const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Minimal pure-JS PNG encoder for 32-bit RGBA
function createPNG(width, height, getPixel) {
  const bytesPerPixel = 4;
  const scanlineWidth = width * bytesPerPixel + 1; // 1 byte for filter type 0
  const rawData = Buffer.alloc(scanlineWidth * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * scanlineWidth;
    rawData[rowOffset] = 0; // Filter: None
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = getPixel(x, y, width, height);
      const pxOffset = rowOffset + 1 + x * bytesPerPixel;
      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  const compressed = zlib.deflateSync(rawData);

  // PNG Header
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR Chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type: RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace
  const ihdrChunk = makeChunk('IHDR', ihdr);

  // IDAT Chunk
  const idatChunk = makeChunk('IDAT', compressed);

  // IEND Chunk
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function makeChunk(type, data) {
  const length = data.length;
  const buf = Buffer.alloc(8 + length + 4);
  buf.writeUInt32BE(length, 0);
  buf.write(type, 4, 4, 'ascii');
  data.copy(buf, 8);
  const crc = crc32(buf.subarray(4, 8 + length));
  buf.writeUInt32BE(crc, 8 + length);
  return buf;
}

// Standard CRC32 table
const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

// Draw a crisp white shield with checkmark on transparent background
function renderShieldPixel(x, y, w, h) {
  const nx = (x / w) * 24;
  const ny = (y / h) * 24;

  // Inside shield condition (approx polygon / curve)
  let inShield = false;

  // Top edge: y >= 2 + abs(x - 12) * 0.35
  // Side edges: x >= 3 && x <= 21
  // Bottom curve: y <= 22 - (abs(x - 12) ** 1.8) * 0.15
  if (nx >= 4 && nx <= 20) {
    const topY = 2 + Math.abs(nx - 12) * 0.35;
    const botY = 22 - Math.pow(Math.abs(nx - 12) / 8, 2) * 10;
    if (ny >= topY && ny <= botY) {
      inShield = true;
    }
  }

  // Punch out an inner checkmark or cut-out for high contrast
  let isCutout = false;
  // Checkmark line 1: (7, 12) -> (10.5, 15.5)
  // Checkmark line 2: (10.5, 15.5) -> (17, 8)
  const distToCheck1 = distToSegment(nx, ny, 7.5, 12, 10.5, 15);
  const distToCheck2 = distToSegment(nx, ny, 10.5, 15, 16.5, 8.5);
  if (distToCheck1 < 1.1 || distToCheck2 < 1.1) {
    isCutout = true;
  }

  if (inShield && !isCutout) {
    return [255, 255, 255, 255]; // Pure White
  }
  return [0, 0, 0, 0]; // Transparent
}

function distToSegment(px, py, x1, y1, x2, y2) {
  const l2 = (x2 - x1) ** 2 + (y2 - y1) ** 2;
  if (l2 === 0) return Math.hypot(px - x1, py - y1);
  let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)));
}

// Generate for all Android resource densities
const densities = [
  { dir: 'drawable-mdpi', size: 24 },
  { dir: 'drawable-hdpi', size: 36 },
  { dir: 'drawable-xhdpi', size: 48 },
  { dir: 'drawable-xxhdpi', size: 72 },
  { dir: 'drawable-xxxhdpi', size: 96 },
  { dir: 'drawable', size: 96 }
];

const resBase = path.join(__dirname, '..', 'mobile', 'android', 'app', 'src', 'main', 'res');
densities.forEach(({ dir, size }) => {
  const targetDir = path.join(resBase, dir);
  if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
  const pngBuf = createPNG(size, size, renderShieldPixel);
  fs.writeFileSync(path.join(targetDir, 'notification_icon.png'), pngBuf);
  console.log(`Generated ${dir}/notification_icon.png (${size}x${size})`);
});

// Also write to mobile/assets/images/notification_icon.png
const assetPng = createPNG(96, 96, renderShieldPixel);
const assetsDir = path.join(__dirname, '..', 'mobile', 'assets', 'images');
fs.writeFileSync(path.join(assetsDir, 'notification_icon.png'), assetPng);
console.log(`Generated assets/images/notification_icon.png (96x96)`);
