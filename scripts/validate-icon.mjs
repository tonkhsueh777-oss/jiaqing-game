import fs from 'node:fs';
import zlib from 'node:zlib';

const path = process.argv[2] || 'assets/app-icon-source.png';
const data = fs.readFileSync(path);
if (data.length < 24 || data.toString('hex', 0, 8) !== '89504e470d0a1a0a') {
  throw new Error(`${path} is not a PNG file`);
}
let offset = 8;
let sawIHDR = false;
let sawIDAT = false;
let sawIEND = false;
while (offset + 12 <= data.length) {
  const length = data.readUInt32BE(offset);
  const type = data.toString('ascii', offset + 4, offset + 8);
  const end = offset + 12 + length;
  if (end > data.length) throw new Error(`${path} has a truncated ${type} chunk`);
  if (type === 'IHDR') sawIHDR = true;
  if (type === 'IDAT') sawIDAT = true;
  if (type === 'IEND') { sawIEND = true; break; }
  offset = end;
}
if (!sawIHDR || !sawIDAT || !sawIEND) throw new Error(`${path} is missing required PNG chunks`);
console.log(`PNG structure OK: ${path} (${data.length} bytes)`);
