/**
 * generate-icon.cjs — 生成多尺寸 icon.ico（纯 Node.js，无外部依赖）
 *
 * 用法：node scripts/generate-icon.cjs
 * 输出：resources/icon.ico（16×16, 32×32, 48×48, 256×256 PNG-based ICO）
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// ==================================================================
// CRC32
// ==================================================================
function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

// ==================================================================
// PNG 编码
// ==================================================================
function encodePNG(width, height, pixels) {
  // pixels: Buffer of RGBA data, size = width * height * 4
  const rawScanlines = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    const offset = y * (1 + width * 4);
    rawScanlines[offset] = 0; // filter: None
    pixels.copy(rawScanlines, offset + 1, y * width * 4, (y + 1) * width * 4);
  }

  const compressed = zlib.deflateSync(rawScanlines, { level: 9 });

  function pngChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeB = Buffer.from(type, 'ascii');
    const crcData = Buffer.concat([typeB, data]);
    const crcVal = crc32(crcData);
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crcVal, 0);
    return Buffer.concat([len, typeB, data, crcBuf]);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;   // bit depth
  ihdr[9] = 6;   // color type: RGBA
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([
    signature,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', compressed),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

// ==================================================================
// 像素绘制：蓝底 + 白色 "HC" 文字
// ==================================================================
function generatePixels(size) {
  const pixels = Buffer.alloc(size * size * 4);
  const scale = size / 32; // 相对于 32px 基准的缩放因子

  function setPixel(x, y, r, g, b, a) {
    if (x < 0 || x >= size || y < 0 || y >= size) return;
    const idx = (y * size + x) * 4;
    pixels[idx + 0] = r;
    pixels[idx + 1] = g;
    pixels[idx + 2] = b;
    pixels[idx + 3] = a;
  }

  // "HC" 文字定位（按比例缩放）
  const ox = Math.round(6 * scale);
  const oy = Math.round(10 * scale);
  const hw = Math.round(6 * scale);  // H 宽度
  const hh = Math.round(12 * scale); // H 高度
  const hm = Math.round(5 * scale);  // H 横线位置（相对 oy）

  // H: 两条竖线
  const hLeft = ox;
  const hRight = ox + hw;
  for (let y = oy; y < oy + hh; y++) {
    for (let t = 0; t < Math.max(1, Math.round(1.2 * scale)); t++) {
      setPixel(hLeft + t, y, 255, 255, 255, 255);
      setPixel(hRight + t, y, 255, 255, 255, 255);
    }
  }
  // H: 中间横线
  for (let x = hLeft; x <= hRight + Math.round(1.2 * scale); x++) {
    for (let t = 0; t < Math.max(1, Math.round(1.2 * scale)); t++) {
      setPixel(x, oy + hm + t, 255, 255, 255, 255);
    }
  }

  // C: 起始 X 偏移
  const cx = ox + Math.round(11 * scale);
  const cw = Math.round(5 * scale);
  const ct = Math.round(2 * scale);  // C 顶部偏移
  const cb = Math.round(9 * scale);  // C 底部偏移
  for (let y = oy + ct; y < oy + cb; y++) {
    for (let t = 0; t < Math.max(1, Math.round(1.2 * scale)); t++) {
      setPixel(cx + t, y, 255, 255, 255, 255);
    }
  }
  for (let x = cx; x <= cx + cw + Math.round(1.2 * scale); x++) {
    for (let t = 0; t < Math.max(1, Math.round(1.2 * scale)); t++) {
      setPixel(x, oy + ct + t, 255, 255, 255, 255);
      setPixel(x, oy + cb + t, 255, 255, 255, 255);
    }
  }

  // 圆角背景（四角透明 + 蓝色渐变）
  const cornerRadius = Math.round(4 * scale);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      if (pixels[idx + 3] !== 0) continue; // 已是前景色

      // 计算到最近角的距离
      const toTL = Math.sqrt(x * x + y * y);
      const toTR = Math.sqrt((size - 1 - x) * (size - 1 - x) + y * y);
      const toBL = Math.sqrt(x * x + (size - 1 - y) * (size - 1 - y));
      const toBR = Math.sqrt((size - 1 - x) * (size - 1 - x) + (size - 1 - y) * (size - 1 - y));
      const isCorner = (x < cornerRadius && y < cornerRadius && toTL > cornerRadius) ||
                       (x >= size - cornerRadius && y < cornerRadius && toTR > cornerRadius) ||
                       (x < cornerRadius && y >= size - cornerRadius && toBL > cornerRadius) ||
                       (x >= size - cornerRadius && y >= size - cornerRadius && toBR > cornerRadius);

      if (isCorner) {
        pixels[idx + 3] = 0; // 透明
      } else {
        const t = (x + y) / (size * 2);
        pixels[idx + 0] = Math.floor(30 + 70 * t);
        pixels[idx + 1] = Math.floor(100 + 80 * t);
        pixels[idx + 2] = Math.floor(180 + 50 * t);
        pixels[idx + 3] = 255;
      }
    }
  }

  return pixels;
}

// ==================================================================
// ICO 封装（多尺寸）
// ==================================================================
const SIZES = [16, 32, 48, 256];
const pngImages = [];

for (const size of SIZES) {
  const pixels = generatePixels(size);
  const png = encodePNG(size, size, pixels);
  pngImages.push({ size, png });
}

// ICO header
const icoHeader = Buffer.alloc(6);
icoHeader.writeUInt16LE(0, 0);
icoHeader.writeUInt16LE(1, 2);
icoHeader.writeUInt16LE(SIZES.length, 4);

// Directory entries + image data
const entrySize = 16;
let imageOffset = 6 + SIZES.length * entrySize;
const entries = [];
const imageBuffers = [];

for (const { size, png } of pngImages) {
  const entry = Buffer.alloc(entrySize);
  entry.writeUInt8(size >= 256 ? 0 : size, 0);
  entry.writeUInt8(size >= 256 ? 0 : size, 1);
  entry.writeUInt8(0, 2);
  entry.writeUInt8(0, 3);
  entry.writeUInt16LE(1, 4);
  entry.writeUInt16LE(32, 6);
  entry.writeUInt32LE(png.length, 8);
  entry.writeUInt32LE(imageOffset, 12);
  entries.push(entry);
  imageBuffers.push(png);
  imageOffset += png.length;
}

const icoData = Buffer.concat([icoHeader, ...entries, ...imageBuffers]);

// ==================================================================
// 写入
// ==================================================================
const outDir = path.join(__dirname, '..', 'resources');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, 'icon.ico');
fs.writeFileSync(outPath, icoData);

const sizeStr = SIZES.map((s, i) => `${s}×${s} (${pngImages[i].png.length}B)`).join(', ');
console.log(`✅ Icon generated: ${outPath}`);
console.log(`   Sizes: ${sizeStr}`);
console.log(`   Total: ${icoData.length} bytes`);
