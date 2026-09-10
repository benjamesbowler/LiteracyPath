import { gzipSync, gunzipSync, strToU8, strFromU8 } from 'fflate';

const PREFIX = 'lp-progress-gzip-v1:';
const LOCAL_PREFIX = 'lp-progress-gzip-u15-v1:';
const THRESHOLD = 64 * 1024;
const MAX_BYTES = 128 * 1024 * 1024;
const CRC_TABLE = Uint32Array.from({length:256},(_,value)=>{
  for(let bit=0;bit<8;bit++)value=(value&1)?(0xedb88320^(value>>>1)):(value>>>1);
  return value>>>0;
});
function checksum(bytes) {
  let crc=0xffffffff;
  for(const byte of bytes)crc=CRC_TABLE[(crc^byte)&255]^(crc>>>8);
  return (crc^0xffffffff)>>>0;
}
function containsCampaign(value, depth = 0) {
  if (!value || typeof value !== 'object' || depth > 4) return false;
  if (value.v === 3 && value.campaign) return true;
  return Object.values(value).some(child => containsCampaign(child, depth + 1));
}
function base64(bytes) {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 16384) binary += String.fromCharCode(...bytes.subarray(i, i + 16384));
  return btoa(binary);
}
// localStorage accounts UTF-16 code units. Pack 15 bits per non-surrogate
// character, preserving arbitrary gzip bytes while avoiding base64's 2.5x cost.
function packLocal(bytes) {
  const chars=[];let bits=0,buffer=0;
  for(const byte of bytes){buffer=(buffer<<8)|byte;bits+=8;if(bits>=15){bits-=15;chars.push(String.fromCharCode(256+((buffer>>>bits)&32767)));buffer&=(1<<bits)-1;}}
  if(bits)chars.push(String.fromCharCode(256+(buffer<<(15-bits))));
  return chars.join('');
}
function unpackLocal(text,length) {
  if(!Number.isSafeInteger(length)||length<18||length>MAX_BYTES||text.length!==Math.ceil(length*8/15))throw new Error('Unreadable compressed progress');
  const bytes=new Uint8Array(length);let bits=0,buffer=0,index=0;
  for(const char of text){const word=char.charCodeAt(0)-256;if(word<0||word>32767)throw new Error('Unreadable compressed progress');buffer=(buffer<<15)|word;bits+=15;
    while(bits>=8&&index<length){bits-=8;bytes[index++]=(buffer>>>bits)&255;buffer&=(1<<bits)-1;}}
  if(index!==length||buffer!==0)throw new Error('Unreadable compressed progress padding');
  return bytes;
}
/** Device-only encoding. Network payloads remain ordinary JSON objects. Small
 * and legacy records retain their existing representation; nothing is dropped.
 */
export function encodeProgressStorage(value, { force = false } = {}) {
  const json = JSON.stringify(value);
  if (!force && (json.length < THRESHOLD || !containsCampaign(value))) return json;
  const bytes = strToU8(json);
  if (bytes.length > MAX_BYTES) throw new Error('Progress exceeds the supported lossless storage size');
  const packed=gzipSync(bytes,{level:6,mtime:0});
  const encoded = force ? PREFIX+bytes.length+':'+base64(packed) : LOCAL_PREFIX+bytes.length+':'+packed.length+':'+packLocal(packed);
  return force || encoded.length < json.length ? encoded : json;
}
export function decodeProgressStorage(raw) {
  if (typeof raw !== 'string' || (!raw.startsWith(PREFIX)&&!raw.startsWith(LOCAL_PREFIX))) return JSON.parse(raw);
  const local=raw.startsWith(LOCAL_PREFIX),prefix=local?LOCAL_PREFIX:PREFIX;
  const separator = raw.indexOf(':', prefix.length);
  const length = Number(raw.slice(prefix.length, separator));
  if (separator < 0 || !Number.isSafeInteger(length) || length < 0 || length > MAX_BYTES) throw new Error('Unreadable compressed progress');
  const body=raw.slice(separator+1),split=body.indexOf(':');
  const packed = local ? unpackLocal(body.slice(split+1),Number(body.slice(0,split))) : Uint8Array.from(atob(body),char=>char.charCodeAt(0));
  if (packed.length < 18) throw new Error('Unreadable compressed progress');
  const footer = new DataView(packed.buffer, packed.byteOffset, packed.byteLength);
  const declared = footer.getUint32(packed.length - 4, true);
  if (declared !== length) throw new Error('Unreadable compressed progress length');
  const unpacked = gunzipSync(packed, { out: new Uint8Array(length) });
  if (unpacked.length !== length || checksum(unpacked) !== footer.getUint32(packed.length - 8, true)) throw new Error('Unreadable compressed progress checksum');
  return JSON.parse(strFromU8(unpacked));
}
