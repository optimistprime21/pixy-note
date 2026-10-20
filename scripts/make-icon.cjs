// Uygulama simgesini (electron/icon.png) pikselart haritasından üretir.
// Bağımlılık yok: PNG'yi zlib ile elle kodluyoruz.  Kullanım: node scripts/make-icon.cjs
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');

const PALETTE = {
  k: [59, 35, 20], // dış hat
  B: [217, 160, 102], // açık ahşap
  b: [139, 90, 43], // koyu ahşap
  p: [246, 231, 193], // parşömen
  g: [63, 138, 52],
  G: [124, 207, 79],
  y: [242, 201, 76],
  o: [224, 123, 57],
  w: [255, 246, 220],
};

// Ahşap çerçeve içinde parşömen üzerinde dolgun bir yaban havucu
const CROP = [
  '.....G..G.....',
  '....GgGGgG....',
  '...GgGggGgG...',
  '.....gGGg.....',
  '....kkggkk....',
  '...kyyyyyyk...',
  '..kyywyyyyyk..',
  '..kywyyyyyok..',
  '..kyyyyyyyok..',
  '...kyyyyyok...',
  '...kyyyyook...',
  '....kyyook....',
  '.....kyok.....',
  '......kk......',
];

const N = 22; // ızgara boyutu: 3 çerçeve + 1 boşluk + 14 + 1 + 3
function buildGrid() {
  const grid = [];
  for (let y = 0; y < N; y++) {
    const row = [];
    for (let x = 0; x < N; x++) {
      const d = Math.min(x, y, N - 1 - x, N - 1 - y); // kenara uzaklık
      row.push(d === 0 ? 'k' : d === 1 ? 'B' : d === 2 ? 'b' : 'p');
    }
    grid.push(row);
  }
  // Köşeleri pikselli yuvarla
  for (const [x, y] of [[0, 0], [1, 0], [0, 1], [N - 1, 0], [N - 2, 0], [N - 1, 1], [0, N - 1], [1, N - 1], [0, N - 2], [N - 1, N - 1], [N - 2, N - 1], [N - 1, N - 2]]) {
    grid[y][x] = '.';
  }
  for (const [x, y] of [[1, 1], [N - 2, 1], [1, N - 2], [N - 2, N - 2]]) grid[y][x] = 'k';
  CROP.forEach((line, cy) => [...line].forEach((c, cx) => c !== '.' && (grid[cy + 4][cx + 4] = c)));
  return grid;
}

function crc32(buf) {
  let c = ~0;
  for (const byte of buf) {
    c ^= byte;
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function encodePng(size, pixel) {
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0; // filtre yok
    for (let x = 0; x < size; x++) {
      const [r, g, b, a] = pixel(x, y);
      raw.set([r, g, b, a], y * (size * 4 + 1) + 1 + x * 4);
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit derinliği
  ihdr[9] = 6; // RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const SIZE = 512;
const scale = Math.floor(SIZE / N);
const offset = Math.floor((SIZE - scale * N) / 2);
const grid = buildGrid();

const png = encodePng(SIZE, (x, y) => {
  const gx = Math.floor((x - offset) / scale);
  const gy = Math.floor((y - offset) / scale);
  const c = grid[gy]?.[gx];
  return c && c !== '.' ? [...PALETTE[c], 255] : [0, 0, 0, 0];
});

const out = path.join(__dirname, '..', 'electron', 'icon.png');
fs.writeFileSync(out, png);
console.log('Simge yazıldı:', out);
