// Draws the 12×12 pixel-art party Poké Ball (images/ui/ball.png). No dependencies.
import fs from "node:fs";
import zlib from "node:zlib";

const ART = [
  "....KKKK....",
  "..KKRRRRKK..",
  ".KRRRRRRHRK.",
  ".KRRRRRRRDK.",
  "KRRRKKKKRRDK",
  "KKKKKWWKKKKK",
  "KWWWKWWKWWGK",
  "KWWWKKKKWWGK",
  ".KWWWWWWWGK.",
  ".KWWWWWWGGK.",
  "..KKGGGGKK..",
  "....KKKK....",
];
const COLORS = { K: [32, 32, 40, 255], R: [232, 56, 56, 255], D: [176, 32, 40, 255], H: [255, 200, 200, 255],
  W: [248, 248, 248, 255], G: [184, 184, 200, 255], ".": [0, 0, 0, 0] };

const w = 12, h = 12;
const raw = Buffer.alloc((w * 4 + 1) * h);
ART.forEach((line, y) => [...line].forEach((c, x) => Buffer.from(COLORS[c]).copy(raw, y * (w * 4 + 1) + 1 + x * 4)));

const crcTable = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc = (buf) => { let c = 0xffffffff; for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
const chunk = (type, data) => {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type), data]);
  const sum = Buffer.alloc(4); sum.writeUInt32BE(crc(body));
  return Buffer.concat([len, body, sum]);
};
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6;
const png = Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ihdr), chunk("IDAT", zlib.deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]);
fs.writeFileSync(new URL("../images/ui/ball.png", import.meta.url), png);
console.log("images/ui/ball.png written");
