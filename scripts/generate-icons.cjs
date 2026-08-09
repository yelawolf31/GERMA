const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

function crc32(buf) {
  let c, table = crc32.table;
  if (!table) {
    table = crc32.table = [];
    for (let n = 0; n < 256; n++) {
      c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      table[n] = c >>> 0;
    }
  }
  c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function encodePNG(width, height, rgba) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0; // filter: none
    rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  }
  const idat = zlib.deflateSync(raw);
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}

// Simple rasterizer helpers
function makeCanvas(size) {
  const data = Buffer.alloc(size * size * 4);
  return {
    size,
    data,
    set(x, y, r, g, b, a) {
      if (x < 0 || y < 0 || x >= size || y >= size) return;
      const i = (y * size + x) * 4;
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
      data[i + 3] = a;
    },
    fillRect(x, y, w, h, r, g, b, a) {
      for (let yy = y; yy < y + h; yy++) {
        for (let xx = x; xx < x + w; xx++) {
          this.set(xx, yy, r, g, b, a);
        }
      }
    },
    fillCircle(cx, cy, rad, r, g, b, a) {
      for (let y = Math.floor(cy - rad); y <= Math.ceil(cy + rad); y++) {
        for (let x = Math.floor(cx - rad); x <= Math.ceil(cx + rad); x++) {
          const d = Math.hypot(x - cx, y - cy);
          if (d <= rad) {
            const edge = rad - d;
            const alpha = a * Math.min(1, edge + 0.5);
            const i = (y * this.size + x) * 4;
            const prevA = data[i + 3] / 255;
            const outA = alpha / 255 + prevA * (1 - alpha / 255);
            if (outA <= 0) continue;
            data[i] = (r * alpha / 255 + data[i] * prevA * (1 - alpha / 255)) / outA;
            data[i + 1] = (g * alpha / 255 + data[i + 1] * prevA * (1 - alpha / 255)) / outA;
            data[i + 2] = (b * alpha / 255 + data[i + 2] * prevA * (1 - alpha / 255)) / outA;
            data[i + 3] = outA * 255;
          }
        }
      }
    },
    drawLine(x0, y0, x1, y1, w, r, g, b, a) {
      const dist = Math.hypot(x1 - x0, y1 - y0);
      const steps = Math.max(1, Math.floor(dist));
      for (let t = 0; t <= steps; t++) {
        const x = x0 + ((x1 - x0) * t) / steps;
        const y = y0 + ((y1 - y0) * t) / steps;
        this.fillCircle(x, y, w / 2, r, g, b, a);
      }
    },
  };
}

function drawIcon(size, file, maskable = false) {
  const c = makeCanvas(size);
  const S = size;

  if (maskable) {
    c.fillRect(0, 0, S, S, 15, 118, 110, 255);
  } else {
    c.fillRect(0, 0, S, S, 248, 250, 252, 255);
    const r = S * 0.18;
    for (let y = S * 0.06; y < S * 0.94; y++) {
      for (let x = S * 0.06; x < S * 0.94; x++) {
        const dx = Math.max(S * 0.06 + r - x, x - (S * 0.94 - r), 0);
        const dy = Math.max(S * 0.06 + r - y, y - (S * 0.94 - r), 0);
        if (Math.hypot(dx, dy) <= r) c.set(x, y, 15, 118, 110, 255);
      }
    }
  }

  const cx = S / 2;
  const cy = S / 2;
  const R = S * 0.32;
  const lw = S * 0.05;
  const branchW = S * 0.032;

  for (let i = 0; i < 6; i++) {
    const angle = (i * 60 * Math.PI) / 180;
    c.drawLine(cx, cy, cx + R * Math.cos(angle), cy + R * Math.sin(angle), lw, 255, 255, 255, 255);
  }
  for (let i = 0; i < 6; i++) {
    const angle = (i * 60 * Math.PI) / 180;
    const bx = cx + R * 0.6 * Math.cos(angle);
    const by = cy + R * 0.6 * Math.sin(angle);
    for (const s of [-1, 1]) {
      const a = angle + (s * 30 * Math.PI) / 180;
      c.drawLine(bx, by, bx + R * 0.28 * Math.cos(a), by + R * 0.28 * Math.sin(a), branchW, 255, 255, 255, 255);
    }
  }
  c.fillCircle(cx, cy, S * 0.055, 255, 255, 255, 255);

  fs.mkdirSync(path.join('public', 'icons'), { recursive: true });
  fs.writeFileSync(path.join('public', 'icons', file), encodePNG(size, size, c.data));
  console.log('created public/icons/' + file);
}

drawIcon(192, 'icon-192.png');
drawIcon(512, 'icon-512.png');
drawIcon(512, 'maskable-512.png', true);
