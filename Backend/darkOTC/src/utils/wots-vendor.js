// VENDORED FROM mochimo-wots-v2@1.1.1
// Source: https://github.com/wagleanuj/mochimo-wots-v2
// License: MIT

var L = /* @__PURE__ */ ((n) => (n[n.BIG_ENDIAN = 0] = "BIG_ENDIAN", n[n.LITTLE_ENDIAN = 1] = "LITTLE_ENDIAN", n))(L || {});
class S {
  constructor(t) {
    this.buf = new Uint8Array(t), this.pos = 0, this.byteOrder = 0;
  }
  /**
   * Creates a new ByteBuffer with the given capacity
   */
  static allocate(t) {
    return new S(t);
  }
  /**
   * Creates a new ByteBuffer that wraps the given array
   */
  static wrap(t) {
    const e = new S(t.length);
    return e.buf.set(t), e;
  }
  /**
   * Sets this buffer's byte order
   */
  order(t) {
    return this.byteOrder = t, this;
  }
  /**
   * Sets or gets this buffer's position
   */
  position(t) {
    if (t === void 0)
      return this.pos;
    if (t < 0 || t > this.buf.length)
      throw new Error("Invalid position, position: " + t + ", length: " + this.buf.length);
    return this.pos = t, this;
  }
  /**
   * Returns this buffer's capacity
   */
  capacity() {
    return this.buf.length;
  }
  /**
   * Writes a byte or bytes into this buffer
   */
  put(t, e, s) {
    if (typeof t == "number") {
      if (this.pos >= this.buf.length)
        throw new Error("Buffer overflow");
      return this.buf[this.pos++] = t & 255, this;
    }
    const r = e || 0, i = s || t.length;
    if (r < 0 || r > t.length)
      throw new Error("Invalid offset");
    if (i < 0 || r + i > t.length)
      throw new Error("Invalid length");
    if (this.pos + i > this.buf.length)
      throw new Error("Buffer overflow");
    return this.buf.set(t.subarray(r, r + i), this.pos), this.pos += i, this;
  }
  /**
   * Writes an integer into this buffer
   */
  putInt(t) {
    if (this.pos + 4 > this.buf.length)
      throw new Error("Buffer overflow");
    return this.byteOrder === 0 ? (this.buf[this.pos++] = t >>> 24 & 255, this.buf[this.pos++] = t >>> 16 & 255, this.buf[this.pos++] = t >>> 8 & 255, this.buf[this.pos++] = t & 255) : (this.buf[this.pos++] = t & 255, this.buf[this.pos++] = t >>> 8 & 255, this.buf[this.pos++] = t >>> 16 & 255, this.buf[this.pos++] = t >>> 24 & 255), this;
  }
  /**
   * Gets bytes from the buffer into the destination array
   */
  get(t) {
    if (this.pos + t.length > this.buf.length)
      throw new Error("Buffer underflow");
    for (let e = 0; e < t.length; e++)
      t[e] = this.buf[this.pos++];
    return this;
  }
  /**
   * Gets a single byte from the buffer
   */
  get_() {
    if (this.pos >= this.buf.length)
      throw new Error("Buffer underflow");
    return this.buf[this.pos++];
  }
  /**
   * Returns a copy of the backing array
   */
  array() {
    return new Uint8Array(this.buf);
  }
  /**
   * Rewinds this buffer. Sets the position to zero
   */
  rewind() {
    return this.pos = 0, this;
  }
}
const it = "0123456789abcdef";
class l {
  /**
   * Create a copy of a byte array
   */
  static copyOf(t, e) {
    const s = new Uint8Array(e);
    return s.set(t.slice(0, e)), s;
  }
  /**
   * Convert a hexadecimal string to a byte array
   * @param hex The hexadecimal string to convert
   */
  static hexToBytes(t) {
    let e = t.toLowerCase();
    e.startsWith("0x") && (e = e.slice(2)), e.length % 2 !== 0 && (e = "0" + e);
    const s = new Uint8Array(e.length / 2);
    for (let r = 0; r < e.length; r += 2)
      s[r / 2] = parseInt(e.slice(r, r + 2), 16);
    return s;
  }
  /**
   * Compares two byte arrays
   */
  static compareBytes(t, e) {
    if (t.length !== e.length)
      return !1;
    for (let s = 0; s < t.length; s++)
      if (t[s] !== e[s])
        return !1;
    return !0;
  }
  /**
   * Reads little-endian unsigned values from a buffer
   */
  static readLittleEndianUnsigned(t, e = 8) {
    const s = new Uint8Array(e);
    t.get(s);
    let r = 0n;
    for (let i = e - 1; i >= 0; i--)
      r = r << 8n | BigInt(s[i]);
    return r;
  }
  /**
   * Trims address for display
   */
  static trimAddress(t) {
    return `${t.substring(0, 32)}...${t.substring(t.length - 24)}`;
  }
  /**
   * Converts number to little-endian bytes
   */
  static numberToLittleEndian(t, e) {
    const s = new Uint8Array(e);
    let r = t;
    for (let i = 0; i < e; i++)
      s[i] = r & 255, r = r >>> 8;
    return s;
  }
  /**
   * Converts byte array to little-endian
   */
  static bytesToLittleEndian(t) {
    const e = new Uint8Array(t.length);
    for (let s = 0; s < t.length; s++)
      e[s] = t[t.length - 1 - s];
    return e;
  }
  /**
   * Fits byte array or string to specified length
   */
  static fit(t, e) {
    if (typeof t == "string") {
      const i = BigInt(t), h = new Uint8Array(e);
      let o = i;
      for (let a = 0; a < e; a++)
        h[a] = Number(o & 0xffn), o >>= 8n;
      return h;
    }
    const s = new Uint8Array(e), r = Math.min(t.length, e);
    return s.set(t.subarray(0, r)), s;
  }
  /**
   * Convert a byte array to its hexadecimal string representation
   * @param bytes The byte array to convert
   * @param offset Optional starting offset in the byte array
   * @param length Optional number of bytes to convert
   */
  static bytesToHex(t, e = 0, s = t.length) {
    const r = new Array(s * 2);
    for (let i = 0; i < s; i++) {
      const h = t[i + e] & 255;
      r[i * 2] = it[h >>> 4], r[i * 2 + 1] = it[h & 15];
    }
    return r.join("");
  }
  /**
   * Convert a number to a byte array of specified length
   * @param value The number to convert
   * @param length The desired length of the resulting byte array
   */
  static toBytes(t, e) {
    const s = t.toString(16).padStart(e * 2, "0");
    return l.hexToBytes(s);
  }
  /**
   * Convert a byte array to little-endian format
   * @param value The byte array to convert
   * @param offset Optional starting offset
   * @param length Optional number of bytes to convert
   */
  static toLittleEndian(t, e = 0, s = t.length) {
    const r = new Uint8Array(s);
    r.set(t.slice(e, e + s));
    for (let i = 0; i < r.length >> 1; i++) {
      const h = r[i];
      r[i] = r[r.length - i - 1], r[r.length - i - 1] = h;
    }
    return r;
  }
  /**
   * Clear a byte array by filling it with zeros
   */
  static clear(t) {
    t.fill(0);
  }
  /**
       * Compare two byte arrays for equality
       */
  static areEqual(t, e) {
    if (t.length !== e.length) return !1;
    for (let s = 0; s < t.length; s++)
      if (t[s] !== e[s]) return !1;
    return !0;
  }
}
function ht(n) {
  if (!Number.isSafeInteger(n) || n < 0)
    throw new Error("positive integer expected, got " + n);
}
function xt(n) {
  return n instanceof Uint8Array || ArrayBuffer.isView(n) && n.constructor.name === "Uint8Array";
}
function Z(n, ...t) {
  if (!xt(n))
    throw new Error("Uint8Array expected");
  if (t.length > 0 && !t.includes(n.length))
    throw new Error("Uint8Array expected of length " + t + ", got length=" + n.length);
}
function P(n, t = !0) {
  if (n.destroyed)
    throw new Error("Hash instance has been destroyed");
  if (t && n.finished)
    throw new Error("Hash#digest() has already been called");
}
function ft(n, t) {
  Z(n);
  const e = t.outputLen;
  if (n.length < e)
    throw new Error("digestInto() expects output buffer of length at least " + e);
}
/*! noble-hashes - MIT License (c) 2022 Paul Miller (paulmillr.com) */
const mt = (n) => new Uint32Array(n.buffer, n.byteOffset, Math.floor(n.byteLength / 4)), j = (n) => new DataView(n.buffer, n.byteOffset, n.byteLength), x = (n, t) => n << 32 - t | n >>> t, F = (n, t) => n << t | n >>> 32 - t >>> 0, ot = new Uint8Array(new Uint32Array([287454020]).buffer)[0] === 68, Lt = (n) => n << 24 & 4278190080 | n << 8 & 16711680 | n >>> 8 & 65280 | n >>> 24 & 255;
function at(n) {
  for (let t = 0; t < n.length; t++)
    n[t] = Lt(n[t]);
}
function Bt(n) {
  if (typeof n != "string")
    throw new Error("utf8ToBytes expected string, got " + typeof n);
  return new Uint8Array(new TextEncoder().encode(n));
}
function Q(n) {
  return typeof n == "string" && (n = Bt(n)), Z(n), n;
}
class gt {
  // Safe version that clones internal state
  clone() {
    return this._cloneInto();
  }
}
function tt(n) {
  const t = (s) => n().update(Q(s)).digest(), e = n();
  return t.outputLen = e.outputLen, t.blockLen = e.blockLen, t.create = () => n(), t;
}
function Ut(n, t, e, s) {
  if (typeof n.setBigUint64 == "function")
    return n.setBigUint64(t, e, s);
  const r = BigInt(32), i = BigInt(4294967295), h = Number(e >> r & i), o = Number(e & i), a = s ? 4 : 0, d = s ? 0 : 4;
  n.setUint32(t + a, h, s), n.setUint32(t + d, o, s);
}
const Nt = (n, t, e) => n & t ^ ~n & e, Ht = (n, t, e) => n & t ^ n & e ^ t & e;
class wt extends gt {
  constructor(t, e, s, r) {
    super(), this.blockLen = t, this.outputLen = e, this.padOffset = s, this.isLE = r, this.finished = !1, this.length = 0, this.pos = 0, this.destroyed = !1, this.buffer = new Uint8Array(t), this.view = j(this.buffer);
  }
  update(t) {
    P(this);
    const { view: e, buffer: s, blockLen: r } = this;
    t = Q(t);
    const i = t.length;
    for (let h = 0; h < i; ) {
      const o = Math.min(r - this.pos, i - h);
      if (o === r) {
        const a = j(t);
        for (; r <= i - h; h += r)
          this.process(a, h);
        continue;
      }
      s.set(t.subarray(h, h + o), this.pos), this.pos += o, h += o, this.pos === r && (this.process(e, 0), this.pos = 0);
    }
    return this.length += t.length, this.roundClean(), this;
  }
  digestInto(t) {
    P(this), ft(t, this), this.finished = !0;
    const { buffer: e, view: s, blockLen: r, isLE: i } = this;
    let { pos: h } = this;
    e[h++] = 128, this.buffer.subarray(h).fill(0), this.padOffset > r - h && (this.process(s, 0), h = 0);
    for (let u = h; u < r; u++)
      e[u] = 0;
    Ut(s, r - 8, BigInt(this.length * 8), i), this.process(s, 0);
    const o = j(t), a = this.outputLen;
    if (a % 4)
      throw new Error("_sha2: outputLen should be aligned to 32bit");
    const d = a / 4, g = this.get();
    if (d > g.length)
      throw new Error("_sha2: outputLen bigger than state");
    for (let u = 0; u < d; u++)
      o.setUint32(4 * u, g[u], i);
  }
  digest() {
    const { buffer: t, outputLen: e } = this;
    this.digestInto(t);
    const s = t.slice(0, e);
    return this.destroy(), s;
  }
  _cloneInto(t) {
    t || (t = new this.constructor()), t.set(...this.get());
    const { blockLen: e, buffer: s, length: r, finished: i, destroyed: h, pos: o } = this;
    return t.length = r, t.pos = o, t.finished = i, t.destroyed = h, r % e && t.buffer.set(s), t;
  }
}
const _t = /* @__PURE__ */ new Uint32Array([
  1116352408,
  1899447441,
  3049323471,
  3921009573,
  961987163,
  1508970993,
  2453635748,
  2870763221,
  3624381080,
  310598401,
  607225278,
  1426881987,
  1925078388,
  2162078206,
  2614888103,
  3248222580,
  3835390401,
  4022224774,
  264347078,
  604807628,
  770255983,
  1249150122,
  1555081692,
  1996064986,
  2554220882,
  2821834349,
  2952996808,
  3210313671,
  3336571891,
  3584528711,
  113926993,
  338241895,
  666307205,
  773529912,
  1294757372,
  1396182291,
  1695183700,
  1986661051,
  2177026350,
  2456956037,
  2730485921,
  2820302411,
  3259730800,
  3345764771,
  3516065817,
  3600352804,
  4094571909,
  275423344,
  430227734,
  506948616,
  659060556,
  883997877,
  958139571,
  1322822218,
  1537002063,
  1747873779,
  1955562222,
  2024104815,
  2227730452,
  2361852424,
  2428436474,
  2756734187,
  3204031479,
  3329325298
]), B = /* @__PURE__ */ new Uint32Array([
  1779033703,
  3144134277,
  1013904242,
  2773480762,
  1359893119,
  2600822924,
  528734635,
  1541459225
]), U = /* @__PURE__ */ new Uint32Array(64);
class Gt extends wt {
  constructor() {
    super(64, 32, 8, !1), this.A = B[0] | 0, this.B = B[1] | 0, this.C = B[2] | 0, this.D = B[3] | 0, this.E = B[4] | 0, this.F = B[5] | 0, this.G = B[6] | 0, this.H = B[7] | 0;
  }
  get() {
    const { A: t, B: e, C: s, D: r, E: i, F: h, G: o, H: a } = this;
    return [t, e, s, r, i, h, o, a];
  }
  // prettier-ignore
  set(t, e, s, r, i, h, o, a) {
    this.A = t | 0, this.B = e | 0, this.C = s | 0, this.D = r | 0, this.E = i | 0, this.F = h | 0, this.G = o | 0, this.H = a | 0;
  }
  process(t, e) {
    for (let u = 0; u < 16; u++, e += 4)
      U[u] = t.getUint32(e, !1);
    for (let u = 16; u < 64; u++) {
      const w = U[u - 15], f = U[u - 2], G = x(w, 7) ^ x(w, 18) ^ w >>> 3, H = x(f, 17) ^ x(f, 19) ^ f >>> 10;
      U[u] = H + U[u - 7] + G + U[u - 16] | 0;
    }
    let { A: s, B: r, C: i, D: h, E: o, F: a, G: d, H: g } = this;
    for (let u = 0; u < 64; u++) {
      const w = x(o, 6) ^ x(o, 11) ^ x(o, 25), f = g + w + Nt(o, a, d) + _t[u] + U[u] | 0, H = (x(s, 2) ^ x(s, 13) ^ x(s, 22)) + Ht(s, r, i) | 0;
      g = d, d = a, a = o, o = h + f | 0, h = i, i = r, r = s, s = f + H | 0;
    }
    s = s + this.A | 0, r = r + this.B | 0, i = i + this.C | 0, h = h + this.D | 0, o = o + this.E | 0, a = a + this.F | 0, d = d + this.G | 0, g = g + this.H | 0, this.set(s, r, i, h, o, a, d, g);
  }
  roundClean() {
    U.fill(0);
  }
  destroy() {
    this.set(0, 0, 0, 0, 0, 0, 0, 0), this.buffer.fill(0);
  }
}
const vt = /* @__PURE__ */ tt(() => new Gt()), O = /* @__PURE__ */ BigInt(2 ** 32 - 1), dt = /* @__PURE__ */ BigInt(32);
function kt(n, t = !1) {
  return t ? { h: Number(n & O), l: Number(n >> dt & O) } : { h: Number(n >> dt & O) | 0, l: Number(n & O) | 0 };
}
function Wt(n, t = !1) {
  let e = new Uint32Array(n.length), s = new Uint32Array(n.length);
  for (let r = 0; r < n.length; r++) {
    const { h: i, l: h } = kt(n[r], t);
    [e[r], s[r]] = [i, h];
  }
  return [e, s];
}
const Ft = (n, t, e) => n << e | t >>> 32 - e, Ot = (n, t, e) => t << e | n >>> 32 - e, Ct = (n, t, e) => t << e - 32 | n >>> 64 - e, Dt = (n, t, e) => n << e - 32 | t >>> 64 - e, At = [], bt = [], Tt = [], Rt = /* @__PURE__ */ BigInt(0), k = /* @__PURE__ */ BigInt(1), Pt = /* @__PURE__ */ BigInt(2), Yt = /* @__PURE__ */ BigInt(7), Mt = /* @__PURE__ */ BigInt(256), Vt = /* @__PURE__ */ BigInt(113);
for (let n = 0, t = k, e = 1, s = 0; n < 24; n++) {
  [e, s] = [s, (2 * e + 3 * s) % 5], At.push(2 * (5 * s + e)), bt.push((n + 1) * (n + 2) / 2 % 64);
  let r = Rt;
  for (let i = 0; i < 7; i++)
    t = (t << k ^ (t >> Yt) * Vt) % Mt, t & Pt && (r ^= k << (k << /* @__PURE__ */ BigInt(i)) - k);
  Tt.push(r);
}
const [$t, Kt] = /* @__PURE__ */ Wt(Tt, !0), lt = (n, t, e) => e > 32 ? Ct(n, t, e) : Ft(n, t, e), ct = (n, t, e) => e > 32 ? Dt(n, t, e) : Ot(n, t, e);
function Xt(n, t = 24) {
  const e = new Uint32Array(10);
  for (let s = 24 - t; s < 24; s++) {
    for (let h = 0; h < 10; h++)
      e[h] = n[h] ^ n[h + 10] ^ n[h + 20] ^ n[h + 30] ^ n[h + 40];
    for (let h = 0; h < 10; h += 2) {
      const o = (h + 8) % 10, a = (h + 2) % 10, d = e[a], g = e[a + 1], u = lt(d, g, 1) ^ e[o], w = ct(d, g, 1) ^ e[o + 1];
      for (let f = 0; f < 50; f += 10)
        n[h + f] ^= u, n[h + f + 1] ^= w;
    }
    let r = n[2], i = n[3];
    for (let h = 0; h < 24; h++) {
      const o = bt[h], a = lt(r, i, o), d = ct(r, i, o), g = At[h];
      r = n[g], i = n[g + 1], n[g] = a, n[g + 1] = d;
    }
    for (let h = 0; h < 50; h += 10) {
      for (let o = 0; o < 10; o++)
        e[o] = n[h + o];
      for (let o = 0; o < 10; o++)
        n[h + o] ^= ~e[(o + 2) % 10] & e[(o + 4) % 10];
    }
    n[0] ^= $t[s], n[1] ^= Kt[s];
  }
  e.fill(0);
}
class et extends gt {
  // NOTE: we accept arguments in bytes instead of bits here.
  constructor(t, e, s, r = !1, i = 24) {
    if (super(), this.blockLen = t, this.suffix = e, this.outputLen = s, this.enableXOF = r, this.rounds = i, this.pos = 0, this.posOut = 0, this.finished = !1, this.destroyed = !1, ht(s), 0 >= this.blockLen || this.blockLen >= 200)
      throw new Error("Sha3 supports only keccak-f1600 function");
    this.state = new Uint8Array(200), this.state32 = mt(this.state);
  }
  keccak() {
    ot || at(this.state32), Xt(this.state32, this.rounds), ot || at(this.state32), this.posOut = 0, this.pos = 0;
  }
  update(t) {
    P(this);
    const { blockLen: e, state: s } = this;
    t = Q(t);
    const r = t.length;
    for (let i = 0; i < r; ) {
      const h = Math.min(e - this.pos, r - i);
      for (let o = 0; o < h; o++)
        s[this.pos++] ^= t[i++];
      this.pos === e && this.keccak();
    }
    return this;
  }
  finish() {
    if (this.finished)
      return;
    this.finished = !0;
    const { state: t, suffix: e, pos: s, blockLen: r } = this;
    t[s] ^= e, e & 128 && s === r - 1 && this.keccak(), t[r - 1] ^= 128, this.keccak();
  }
  writeInto(t) {
    P(this, !1), Z(t), this.finish();
    const e = this.state, { blockLen: s } = this;
    for (let r = 0, i = t.length; r < i; ) {
      this.posOut >= s && this.keccak();
      const h = Math.min(s - this.posOut, i - r);
      t.set(e.subarray(this.posOut, this.posOut + h), r), this.posOut += h, r += h;
    }
    return t;
  }
  xofInto(t) {
    if (!this.enableXOF)
      throw new Error("XOF is not possible for this instance");
    return this.writeInto(t);
  }
  xof(t) {
    return ht(t), this.xofInto(new Uint8Array(t));
  }
  digestInto(t) {
    if (ft(t, this), this.finished)
      throw new Error("digest() was already called");
    return this.writeInto(t), this.destroy(), t;
  }
  digest() {
    return this.digestInto(new Uint8Array(this.outputLen));
  }
  destroy() {
    this.destroyed = !0, this.state.fill(0);
  }
  _cloneInto(t) {
    const { blockLen: e, suffix: s, outputLen: r, rounds: i, enableXOF: h } = this;
    return t || (t = new et(e, s, r, h, i)), t.state32.set(this.state32), t.pos = this.pos, t.posOut = this.posOut, t.finished = this.finished, t.rounds = i, t.suffix = s, t.outputLen = r, t.enableXOF = h, t.destroyed = this.destroyed, t;
  }
}
const jt = (n, t, e) => tt(() => new et(t, n, e)), qt = /* @__PURE__ */ jt(6, 72, 512 / 8), Jt = /* @__PURE__ */ new Uint8Array([7, 4, 13, 1, 10, 6, 15, 3, 12, 0, 9, 5, 2, 14, 11, 8]), Et = /* @__PURE__ */ new Uint8Array(new Array(16).fill(0).map((n, t) => t)), zt = /* @__PURE__ */ Et.map((n) => (9 * n + 5) % 16);
let st = [Et], rt = [zt];
for (let n = 0; n < 4; n++)
  for (let t of [st, rt])
    t.push(t[n].map((e) => Jt[e]));
const yt = /* @__PURE__ */ [
  [11, 14, 15, 12, 5, 8, 7, 9, 11, 13, 14, 15, 6, 7, 9, 8],
  [12, 13, 11, 15, 6, 9, 9, 7, 12, 15, 11, 13, 7, 8, 7, 7],
  [13, 15, 14, 11, 7, 7, 6, 8, 13, 14, 13, 12, 5, 5, 6, 9],
  [14, 11, 12, 14, 8, 6, 5, 5, 15, 12, 15, 14, 9, 9, 8, 6],
  [15, 12, 13, 13, 9, 5, 8, 6, 14, 11, 12, 11, 8, 6, 5, 5]
].map((n) => new Uint8Array(n)), Zt = /* @__PURE__ */ st.map((n, t) => n.map((e) => yt[t][e])), Qt = /* @__PURE__ */ rt.map((n, t) => n.map((e) => yt[t][e])), te = /* @__PURE__ */ new Uint32Array([
  0,
  1518500249,
  1859775393,
  2400959708,
  2840853838
]), ee = /* @__PURE__ */ new Uint32Array([
  1352829926,
  1548603684,
  1836072691,
  2053994217,
  0
]);
function ut(n, t, e, s) {
  return n === 0 ? t ^ e ^ s : n === 1 ? t & e | ~t & s : n === 2 ? (t | ~e) ^ s : n === 3 ? t & s | e & ~s : t ^ (e | ~s);
}
const C = /* @__PURE__ */ new Uint32Array(16);
class se extends wt {
  constructor() {
    super(64, 20, 8, !0), this.h0 = 1732584193, this.h1 = -271733879, this.h2 = -1732584194, this.h3 = 271733878, this.h4 = -1009589776;
  }
  get() {
    const { h0: t, h1: e, h2: s, h3: r, h4: i } = this;
    return [t, e, s, r, i];
  }
  set(t, e, s, r, i) {
    this.h0 = t | 0, this.h1 = e | 0, this.h2 = s | 0, this.h3 = r | 0, this.h4 = i | 0;
  }
  process(t, e) {
    for (let f = 0; f < 16; f++, e += 4)
      C[f] = t.getUint32(e, !0);
    let s = this.h0 | 0, r = s, i = this.h1 | 0, h = i, o = this.h2 | 0, a = o, d = this.h3 | 0, g = d, u = this.h4 | 0, w = u;
    for (let f = 0; f < 5; f++) {
      const G = 4 - f, H = te[f], $ = ee[f], v = st[f], K = rt[f], p = Zt[f], St = Qt[f];
      for (let m = 0; m < 16; m++) {
        const X = F(s + ut(f, i, o, d) + C[v[m]] + H, p[m]) + u | 0;
        s = u, u = d, d = F(o, 10) | 0, o = i, i = X;
      }
      for (let m = 0; m < 16; m++) {
        const X = F(r + ut(G, h, a, g) + C[K[m]] + $, St[m]) + w | 0;
        r = w, w = g, g = F(a, 10) | 0, a = h, h = X;
      }
    }
    this.set(this.h1 + o + g | 0, this.h2 + d + w | 0, this.h3 + u + r | 0, this.h4 + s + h | 0, this.h0 + i + a | 0);
  }
  roundClean() {
    C.fill(0);
  }
  destroy() {
    this.destroyed = !0, this.buffer.fill(0), this.set(0, 0, 0, 0, 0);
  }
}
const re = /* @__PURE__ */ tt(() => new se());
class T {
  constructor(t = "sha256") {
    this.algorithm = t, this.hasher = this.createHasher(t);
  }
  createHasher(t) {
    switch (t.toLowerCase()) {
      case "sha256":
        return vt.create();
      case "sha3-512":
        return qt.create();
      case "ripemd160":
        return re.create();
      default:
        throw new Error(`Unsupported hash algorithm: ${t}`);
    }
  }
  /**
   * Updates the hash with the given data
   */
  update(t, e = 0, s = t.length) {
    if (e < 0 || e > t.length)
      throw new Error("Invalid offset");
    if (s < 0 || e + s > t.length)
      throw new Error("Invalid length");
    const r = t.subarray(e, e + s);
    this.hasher.update(r);
  }
  /**
   * Returns the final hash value
   */
  digest() {
    const t = this.hasher.digest();
    return this.hasher = this.createHasher(this.algorithm), t;
  }
  static hash(t, e, s) {
    const r = new T();
    return e !== void 0 && s !== void 0 ? r.update(new Uint8Array(t.subarray(e, e + s))) : r.update(new Uint8Array(t)), r.digest();
  }
  static hashWith(t, e) {
    const s = new T(t);
    return s.update(e), s.digest();
  }
}
const V = class V {
  /**
   * Set chain address in the address buffer
   */
  static setChainAddr(t, e) {
    t.position(20), t.putInt(e);
  }
  /**
   * Set hash address in the address buffer
   */
  static setHashAddr(t, e) {
    t.position(24), t.putInt(e);
  }
  /**
   * Set key and mask in the address buffer
   */
  static setKeyAndMask(t, e) {
    t.position(28), t.putInt(e);
  }
  /**
   * Convert address buffer to bytes in little-endian format
   */
  static addrToBytes(t) {
    t.position(0);
    const e = new Uint8Array(t.capacity());
    for (let s = 0; s < e.length; s += 4) {
      const r = t.get_(), i = t.get_(), h = t.get_(), o = t.get_();
      e[s] = o, e[s + 1] = h, e[s + 2] = i, e[s + 3] = r;
    }
    return e;
  }
  /**
   * PRF function
   */
  static prf(t, e, s, r) {
    const i = new Uint8Array(96), h = new Uint8Array(32);
    h[31] = this.XMSS_HASH_PADDING_PRF, i.set(h, 0), i.set(r, 32), i.set(s, 64);
    const o = new T();
    o.update(i);
    const a = o.digest();
    return t.set(a, e), t;
  }
  /**
   * F hash function
   */
  static thashF(t, e, s, r, i, h) {
    const o = new Uint8Array(96), a = new Uint8Array(32);
    a[31] = this.XMSS_HASH_PADDING_F, o.set(a, 0), this.setKeyAndMask(h, 0);
    let d = this.addrToBytes(h);
    this.prf(o, 32, d, i), this.setKeyAndMask(h, 1), d = this.addrToBytes(h);
    const g = new Uint8Array(32);
    this.prf(g, 0, d, i);
    for (let f = 0; f < 32; f++)
      o[64 + f] = s[f + r] ^ g[f];
    const u = new T();
    u.update(o);
    const w = u.digest();
    t.set(w, e);
  }
};
V.XMSS_HASH_PADDING_F = 0, V.XMSS_HASH_PADDING_PRF = 3;
let N = V;
const _ = class _ {
  /**
   * Gets the tag from an address
   */
  static getTag(t) {
    if (t.length !== 2208)
      throw new Error("Invalid address length");
    const e = new Uint8Array(_.TAG_LENGTH);
    return e.set(t.subarray(t.length - _.TAG_LENGTH)), e;
  }
  /**
   * Checks if a tag is all zeros
   */
  static isZero(t) {
    return !t || t.length !== _.TAG_LENGTH ? !1 : t.every((e) => e === 0);
  }
  /**
   * Validates a tag
   */
  static isValid(t) {
    return !(!t || t.length !== _.TAG_LENGTH);
  }
  /**
   * Tags an address with the specified tag
   */
  static tag(t, e) {
    if (!this.isValid(e))
      throw new Error("Invalid tag");
    if (t.length !== 2208)
      throw new Error("Invalid address length");
    if (e.length !== 12)
      throw new Error("Invalid tag length");
    const s = new Uint8Array(t);
    return s.set(e, s.length - e.length), s;
  }
};
_.TAG_LENGTH = 12;
let Y = _;
const b = class b {
  /**
   * Generates chains for WOTS
   */
  static gen_chain(t, e, s, r, i, h, o, a) {
    t.set(s.subarray(r, r + b.PARAMSN), e);
    for (let d = i; d < i + h && d < 16; d++)
      N.setHashAddr(a, d), N.thashF(t, e, t, e, o, a);
  }
  /**
   * Expands seed into WOTS private key
   */
  static expand_seed(t, e) {
    for (let s = 0; s < b.WOTSLEN; s++) {
      const r = l.toBytes(s, 32);
      N.prf(t, s * 32, r, e);
    }
  }
  /**
   * Converts message to base w (convenience overload)
   */
  static base_w(t, e) {
    return this.base_w_(t, e, 0, e.length);
  }
  /**
   * Converts message to base w
   */
  static base_w_(t, e, s = 0, r = e.length) {
    let i = 0, h = 0, o = 0, a = 0;
    for (let d = 0; d < r; d++)
      a === 0 && (o = t[i++], a += 8), a -= 4, e[h++ + s] = o >> a & 15;
    return e;
  }
  /**
   * Computes WOTS checksum
   */
  static wotsChecksum(t, e) {
    let s = 0;
    for (let i = 0; i < 64; i++)
      s += 15 - t[i];
    s <<= 4;
    const r = new Uint8Array(2);
    return r[0] = s >> 8 & 255, r[1] = s & 255, this.base_w_(r, t, e, t.length - e);
  }
  /**
   * Computes chain lengths
   */
  static chain_lengths(t, e) {
    const s = this.base_w_(t, e, 0, 64);
    return this.wotsChecksum(s, 64);
  }
  /**
   * Generates WOTS public key
   */
  static wots_pkgen(t, e, s, r, i) {
    this.expand_seed(t, e);
    const h = S.wrap(i);
    h.order(L.LITTLE_ENDIAN);
    for (let o = 0; o < b.WOTSLEN; o++)
      N.setChainAddr(h, o), this.gen_chain(t, o * 32, t, o * 32, 0, 15, s.subarray(r), h);
  }
  /**
   * Signs a message using WOTS
   */
  static wots_sign(t, e, s, r, i, h) {
    const o = new Array(b.WOTSLEN);
    this.chain_lengths(e, o), this.expand_seed(t, s);
    const a = S.wrap(h);
    a.order(L.LITTLE_ENDIAN);
    for (let d = 0; d < b.WOTSLEN; d++)
      N.setChainAddr(a, d), this.gen_chain(t, d * 32, t, d * 32, 0, o[d], r.subarray(i), a);
  }
  /**
   * Verifies a WOTS signature
   */
  static wots_pk_from_sig(t, e, s, r) {
    const i = new Uint8Array(b.WOTSSIGBYTES), h = new Array(b.WOTSLEN), o = new Uint8Array(r), a = S.wrap(o);
    a.order(L.LITTLE_ENDIAN), this.chain_lengths(e, h);
    for (let d = 0; d < b.WOTSLEN; d++)
      N.setChainAddr(a, d), this.gen_chain(i, d * 32, t, d * 32, h[d], 15 - h[d], s, a);
    return i;
  }
  /**
   * Generates a WOTS address using the componentsGenerator. 
   * Note:: use you own componentsGenerator that fills in deterministic bytes if you want to generate a specific address
   */
  static generateAddress(t, e, s) {
    if (!s)
      throw new Error("Invalid componentsGenerator");
    if (e.length !== 32)
      throw new Error("Invalid secret length");
    if (t !== null && t.length !== 12)
      throw new Error("Invalid tag");
    const r = new Uint8Array(2144), i = s(e);
    b.wots_pkgen(r, i.private_seed, i.public_seed, 0, i.addr_seed);
    const h = new Uint8Array(2208);
    h.set(r, 0), h.set(i.public_seed, 2144), h.set(i.addr_seed, 2176);
    const o = t ? Y.tag(h, t) : h;
    for (let a = 0; a < 10; a++)
      if (!this.isValid(i.private_seed, o, D))
        throw new Error("Invalid WOTS");
    return o;
  }
  /**
   * Validates WOTS components
   */
  static isValidWithComponents(t, e, s, r, i) {
    if (t.length !== 32)
      throw new Error("Invalid secret length");
    if (e.length !== 2144)
      throw new Error("Invalid pk length");
    if (s.length !== 32)
      throw new Error("Invalid pubSeed length");
    if (r.length !== 32)
      throw new Error("Invalid rnd2 length");
    const h = new Uint8Array(32);
    i(h);
    const o = new Uint8Array(2144);
    this.wots_sign(o, h, t, s, 0, r);
    const a = this.wots_pk_from_sig(o, h, s, r);
    return l.compareBytes(a, e);
  }
  /**
   * Splits a WOTS address into its components
   */
  static splitAddress(t, e, s, r, i) {
    if (t.length !== 2208)
      throw new Error("Invalid address length");
    if (e.length !== 2144)
      throw new Error("Invalid pk length");
    if (s.length !== 32)
      throw new Error("Invalid pubSeed length");
    if (r.length !== 32)
      throw new Error("Invalid rnd2 length");
    if (i !== null && i.length !== 12)
      throw new Error("Invalid tag length");
    e.set(t.subarray(0, 2144)), s.set(t.subarray(2144, 2176)), r.set(t.subarray(2176, 2208)), i !== null && i.set(r.subarray(20, 32));
  }
  /**
   * Validates a WOTS address using a Random generator
   */
  static isValid(t, e, s = D) {
    const r = new Uint8Array(2144), i = new Uint8Array(32), h = new Uint8Array(32);
    return this.splitAddress(e, r, i, h, null), this.isValidWithComponents(t, r, i, h, D);
  }
  /**
   * Generates a random WOTS address using the randomGenerator
   * Note:: use you own randomGenerator that fills in deterministic bytes if you want to generate a specific address
   */
  static generateRandomAddress(t, e, s = D) {
    if (e.length !== 32)
      throw new Error("Invalid secret length");
    if (t !== null && t.length !== 12)
      throw new Error("Invalid tag");
    const r = new Uint8Array(2208), i = new Uint8Array(32);
    s(r), i.set(r.subarray(2176, 2208)), this.wots_pkgen(r, e, r, 2144, i), r.set(i, 2176);
    const h = t ? Y.tag(r, t) : r;
    for (let o = 0; o < 10; o++)
      if (!this.isValid(e, h, s))
        throw new Error("Invalid WOTS");
    return h;
  }
};
b.WOTSW = 16, b.WOTSLOGW = 4, b.PARAMSN = 32, b.WOTSLEN1 = 64, b.WOTSLEN2 = 3, b.WOTSLEN = 67, b.WOTSSIGBYTES = 2144, b.TXSIGLEN = 2144;
let c = b;
function D(n) {
  for (let t = 0; t < n.length; t++)
    n[t] = Math.floor(Math.random() * 256);
}
const I = 40, y = 20, q = 2144, J = 8;
class W {
  constructor() {
    this.address = new Uint8Array(I), this.amount = BigInt(0);
  }
  bytes() {
    const t = new Uint8Array(I + J);
    return t.set(this.address), t.set(this.getAmountBytes(), I), t;
  }
  getTag() {
    return this.address.slice(0, y);
  }
  setTag(t) {
    this.address.set(t.slice(0, y), 0);
  }
  getAddress() {
    return this.address.slice(y);
  }
  setAddress(t) {
    this.address.set(t.slice(0, I - y), y);
  }
  setAmountBytes(t) {
    this.amount = BigInt(
      new DataView(t.buffer).getBigUint64(0, !0)
    );
  }
  getAmount() {
    return this.amount;
  }
  getAmountBytes() {
    const t = new ArrayBuffer(J);
    return new DataView(t).setBigUint64(0, this.amount, !0), new Uint8Array(t);
  }
  static wotsAddressFromBytes(t) {
    const e = new W();
    if (t.length === q) {
      const s = this.addrFromWots(t);
      s && (e.setTag(s.slice(0, y)), e.setAddress(s.slice(y)));
    } else t.length === I ? (e.setTag(t.slice(0, y)), e.setAddress(t.slice(y))) : t.length === I + J && (e.setTag(t.slice(0, y)), e.setAddress(t.slice(y, I)), e.setAmountBytes(t.slice(I)));
    return e;
  }
  static wotsAddressFromHex(t) {
    const e = Buffer.from(t, "hex");
    return e.length !== I ? new W() : this.wotsAddressFromBytes(e);
  }
  static addrFromImplicit(t) {
    const e = new Uint8Array(I);
    return e.set(t.slice(0, y), 0), e.set(t.slice(0, I - y), y), e;
  }
  static addrHashGenerate(t) {
    const e = T.hashWith("sha3-512", t);
    return T.hashWith("ripemd160", e);
  }
  static addrFromWots(t) {
    if (t.length !== q)
      return null;
    const e = this.addrHashGenerate(t.slice(0, q));
    return this.addrFromImplicit(e);
  }
}
let he = class pt {
  /**
   * Creates a new WOTS wallet
   */
  constructor({
    name: t = null,
    wots: e = null,
    addrTag: s = null,
    secret: r = null
  }) {
    var i;
    if (r && r.length !== 32)
      throw new Error("Invalid secret length");
    if (s && s.length !== 20)
      throw new Error("Invalid address tag");
    this.name = t, this.wots = e, this.addrTag = s, this.secret = r, this.wotsAddrHex = this.wots ? l.bytesToHex(this.wots) : null, this.addrTagHex = this.addrTag ? l.bytesToHex(this.addrTag) : null, this.mochimoAddr = this.wots ? W.wotsAddressFromBytes(this.wots) : null, (i = this.mochimoAddr) == null || i.setTag(this.addrTag);
  }
  getName() {
    return this.name;
  }
  /**
   * Get the full wots address (2208 bytes)
   * @returns 
   */
  getWots() {
    return this.wots ? new Uint8Array(this.wots) : null;
  }
  /**
  * Get the hex string of the full wots address
  */
  getWotsHex() {
    return this.wotsAddrHex;
  }
  /**
   * Get the wots public key (2144 bytes)
   */
  getWotsPk() {
    return this.wots ? new Uint8Array(this.wots.slice(0, c.WOTSSIGBYTES)) : null;
  }
  /**
  * Get the public seed used when generating the wots address
  */
  getWotsPubSeed() {
    return this.wots ? this.wots.subarray(c.WOTSSIGBYTES, c.WOTSSIGBYTES + 32) : null;
  }
  /**
  * Get the wots+ address scheme used when generating the address
  */
  getWotsAdrs() {
    return this.wots ? this.wots.subarray(c.WOTSSIGBYTES + 32, c.WOTSSIGBYTES + 64) : null;
  }
  /**
   * Get the wots+ tag used when generating the address
   */
  getWotsTag() {
    return this.wots ? this.wots.subarray(c.WOTSSIGBYTES + 64 - 12, c.WOTSSIGBYTES + 64) : null;
  }
  /**
   * Get the 20 byte mochimo address 
   */
  getAddress() {
    return this.mochimoAddr ? this.mochimoAddr.getAddress() : null;
  }
  /**
   * Get the address tag (20 bytes)
   */
  getAddrTag() {
    return this.addrTag ? new Uint8Array(this.addrTag) : null;
  }
  getAddrTagHex() {
    return this.addrTagHex;
  }
  /**
   * Get the address hash of mochimo address (40 bytes), [20 bytes tag + 20 bytes address]
   */
  getAddrHash() {
    return this.mochimoAddr ? this.mochimoAddr.getAddress() : null;
  }
  getSecret() {
    return this.secret ? new Uint8Array(this.secret) : null;
  }
  hasSecret() {
    return this.secret !== null;
  }
  /**
   * Sign data using the secret key
   */
  sign(t) {
    const e = this.secret, s = this.wots;
    if (!e || !s)
      throw new Error("Cannot sign without secret key or address");
    if (e.length !== 32)
      throw new Error("Invalid sourceSeed length, expected 32, got " + e.length);
    if (s.length !== 2208)
      throw new Error("Invalid sourceWots length, expected 2208, got " + s.length);
    s.subarray(0, c.WOTSSIGBYTES);
    const r = s.subarray(c.WOTSSIGBYTES, c.WOTSSIGBYTES + 32), i = s.subarray(c.WOTSSIGBYTES + 32, c.WOTSSIGBYTES + 64), h = new Uint8Array(c.WOTSSIGBYTES);
    return c.wots_sign(h, t, e, r, 0, i), h;
  }
  /**
   * Verifies whether a signature is valid for a given message
   */
  verify(t, e) {
    if (!this.wots)
      throw new Error("Cannot verify without public key (address)");
    const s = this.wots, r = s.subarray(0, c.WOTSSIGBYTES), i = s.subarray(c.WOTSSIGBYTES, c.WOTSSIGBYTES + 32), h = s.subarray(c.WOTSSIGBYTES + 32, c.WOTSSIGBYTES + 64), o = c.wots_pk_from_sig(e, t, i, h);
    return l.areEqual(o, r);
  }
  /**
   * Address components generator used for generating address components for pk generation
   * @param wotsSeed 
   * @returns 
   */
  static componentsGenerator(t) {
    const e = Buffer.from(t).toString("ascii"), s = T.hash(Buffer.from(e + "seed", "ascii")), r = T.hash(Buffer.from(e + "publ", "ascii")), i = T.hash(Buffer.from(e + "addr", "ascii"));
    return {
      private_seed: s,
      public_seed: r,
      addr_seed: i
    };
  }
  clear() {
    this.secret && l.clear(this.secret), this.wots && l.clear(this.wots), this.addrTag && l.clear(this.addrTag), this.addrTagHex && (this.addrTagHex = null), this.wotsAddrHex && (this.wotsAddrHex = null), this.mochimoAddr && (this.mochimoAddr = null);
  }
  toString() {
    let t = "Empty address";
    return this.wotsAddrHex ? t = `${this.wotsAddrHex.substring(0, 32)}...${this.wotsAddrHex.substring(this.wotsAddrHex.length - 24)}` : this.addrTagHex && (t = `tag-${this.addrTagHex}`), t;
  }
  /**
       * Creates a wallet instance
  
       */
  static create(t, e, s, r) {
    if (e.length !== 32)
      throw new Error("Invalid secret length");
    if (s.length !== 20)
      throw new Error("Invalid tag");
    let i = e, h = null;
    const o = Buffer.from("420000000e00000001000000", "hex");
    return r ? h = c.generateRandomAddress(o, e, r) : ({ private_seed: i } = this.componentsGenerator(e), h = c.generateAddress(o, e, this.componentsGenerator)), new pt({ name: t, wots: h, addrTag: s, secret: i });
  }
  toJSON() {
    return {
      name: this.name,
      wots: this.wots,
      addrTag: this.addrTag,
      secret: this.secret,
      addrTagHex: this.addrTagHex,
      wotsAddrHex: this.wotsAddrHex
    };
  }
};
var nt = /* @__PURE__ */ ((n) => (n[n.Null = 0] = "Null", n[n.Hello = 1] = "Hello", n[n.HelloAck = 2] = "HelloAck", n[n.Transaction = 3] = "Transaction", n[n.Found = 4] = "Found", n[n.GetBlock = 5] = "GetBlock", n[n.GetIPList = 6] = "GetIPList", n[n.SendBL = 7] = "SendBL", n[n.SendIP = 8] = "SendIP", n[n.Busy = 9] = "Busy", n[n.Nack = 10] = "Nack", n[n.GetTFile = 11] = "GetTFile", n[n.Balance = 12] = "Balance", n[n.SendBal = 13] = "SendBal", n[n.Resolve = 14] = "Resolve", n[n.GetCBlock = 15] = "GetCBlock", n[n.MBlock = 16] = "MBlock", n[n.Hash = 17] = "Hash", n[n.TF = 18] = "TF", n[n.Identify = 19] = "Identify", n))(nt || {});
const ne = [
  0,
  4129,
  8258,
  12387,
  16516,
  20645,
  24774,
  28903,
  33032,
  37161,
  41290,
  45419,
  49548,
  53677,
  57806,
  61935,
  4657,
  528,
  12915,
  8786,
  21173,
  17044,
  29431,
  25302,
  37689,
  33560,
  45947,
  41818,
  54205,
  50076,
  62463,
  58334,
  9314,
  13379,
  1056,
  5121,
  25830,
  29895,
  17572,
  21637,
  42346,
  46411,
  34088,
  38153,
  58862,
  62927,
  50604,
  54669,
  13907,
  9842,
  5649,
  1584,
  30423,
  26358,
  22165,
  18100,
  46939,
  42874,
  38681,
  34616,
  63455,
  59390,
  55197,
  51132,
  18628,
  22757,
  26758,
  30887,
  2112,
  6241,
  10242,
  14371,
  51660,
  55789,
  59790,
  63919,
  35144,
  39273,
  43274,
  47403,
  23285,
  19156,
  31415,
  27286,
  6769,
  2640,
  14899,
  10770,
  56317,
  52188,
  64447,
  60318,
  39801,
  35672,
  47931,
  43802,
  27814,
  31879,
  19684,
  23749,
  11298,
  15363,
  3168,
  7233,
  60846,
  64911,
  52716,
  56781,
  44330,
  48395,
  36200,
  40265,
  32407,
  28342,
  24277,
  20212,
  15891,
  11826,
  7761,
  3696,
  65439,
  61374,
  57309,
  53244,
  48923,
  44858,
  40793,
  36728,
  37256,
  33193,
  45514,
  41451,
  53516,
  49453,
  61774,
  57711,
  4224,
  161,
  12482,
  8419,
  20484,
  16421,
  28742,
  24679,
  33721,
  37784,
  41979,
  46042,
  49981,
  54044,
  58239,
  62302,
  689,
  4752,
  8947,
  13010,
  16949,
  21012,
  25207,
  29270,
  46570,
  42443,
  38312,
  34185,
  62830,
  58703,
  54572,
  50445,
  13538,
  9411,
  5280,
  1153,
  29798,
  25671,
  21540,
  17413,
  42971,
  47098,
  34713,
  38840,
  59231,
  63358,
  50973,
  55100,
  9939,
  14066,
  1681,
  5808,
  26199,
  30326,
  17941,
  22068,
  55628,
  51565,
  63758,
  59695,
  39368,
  35305,
  47498,
  43435,
  22596,
  18533,
  30726,
  26663,
  6336,
  2273,
  14466,
  10403,
  52093,
  56156,
  60223,
  64286,
  35833,
  39896,
  43963,
  48026,
  19061,
  23124,
  27191,
  31254,
  2801,
  6864,
  10931,
  14994,
  64814,
  60687,
  56684,
  52557,
  48554,
  44427,
  40424,
  36297,
  31782,
  27655,
  23652,
  19525,
  15522,
  11395,
  7392,
  3265,
  61215,
  65342,
  53085,
  57212,
  44955,
  49082,
  36825,
  40952,
  28183,
  32310,
  20053,
  24180,
  11923,
  16050,
  3793,
  7920
];
function ie(n, t, e) {
  if (t + e > n.length)
    throw new Error("Offset + length exceeds array bounds");
  let s = 0;
  for (let r = t; r < t + e; r++) {
    const i = n[r] & 255, h = (s >>> 8 ^ i) & 255;
    s = (s << 8 ^ ne[h]) & 65535;
  }
  return s;
}
const R = {
  LENGTH: 8920,
  TRANSACTION_BUFFER_LENGTH_OFFSET: 122,
  TRANSACTION_BUFFER_LENGTH_LENGTH: 2,
  TRANSACTION_BUFFER_OFFSET: 124,
  TRANSACTION_BUFFER_LENGTH: 8792,
  ADD_TO_PEER_LIST_TRANSACTION_BUFFER_LENGTH: 0,
  DO_NOT_ADD_TO_PEER_LIST_TRANSACTION_BUFFER_LENGTH: 1
};
var It = /* @__PURE__ */ ((n) => (n[n.Push = 7] = "Push", n[n.Wallet = 6] = "Wallet", n[n.Sanctuary = 5] = "Sanctuary", n[n.MFee = 4] = "MFee", n[n.Logging = 3] = "Logging", n))(It || {});
class M {
  constructor() {
    this.version = 4, this.flags = new Array(8).fill(!1), this.network = 1337, this.id1 = 0, this.id2 = 0, this.operation = nt.Transaction, this.cblock = 0n, this.blocknum = 0n, this.cblockhash = new Uint8Array(32), this.pblockhash = new Uint8Array(32), this.weight = new Uint8Array(32), this.transactionBufferLength = 1, this.sourceAddress = new Uint8Array(2208), this.destinationAddress = new Uint8Array(2208), this.changeAddress = new Uint8Array(2208), this.totalSend = new Uint8Array(8), this.totalChange = new Uint8Array(8), this.fee = new Uint8Array(8), this.signature = new Uint8Array(2144), this.trailer = 43981;
  }
  /**
   * Serializes datagram to bytes
   */
  serialize() {
    if (!this.operation)
      throw new Error("Operation not set");
    const t = S.allocate(R.LENGTH);
    t.order(L.LITTLE_ENDIAN), t.put(this.version);
    const e = this.flags.map((r) => r ? "1" : "0").join("");
    t.put(parseInt(e, 2)), t.put(l.numberToLittleEndian(this.network, 2)), t.put(l.numberToLittleEndian(this.id1, 2)), t.put(l.numberToLittleEndian(this.id2, 2)), t.put(l.numberToLittleEndian(this.operation, 2)), t.put(l.numberToLittleEndian(Number(this.cblock), 8)), t.put(l.numberToLittleEndian(Number(this.blocknum), 8)), t.put(this.cblockhash), t.put(this.pblockhash), t.put(this.weight), t.put(l.numberToLittleEndian(this.transactionBufferLength, 2)), t.put(this.sourceAddress), t.put(this.destinationAddress), t.put(this.changeAddress), t.put(this.totalSend), t.put(this.totalChange), t.put(this.fee), t.put(this.signature);
    const s = t.array();
    return this.crc = ie(s, 0, 8916), t.put(l.numberToLittleEndian(this.crc, 2)), t.put(l.numberToLittleEndian(this.trailer, 2)), t.array();
  }
  /**
   * Gets the network ID
   */
  getNetwork() {
    return this.network;
  }
  /**
   * Gets the trailer
   */
  getTrailer() {
    return this.trailer;
  }
  /**
   * Gets ID1
   */
  getId1() {
    return this.id1;
  }
  /**
   * Sets ID1
   */
  setId1(t) {
    return this.id1 = t, this;
  }
  /**
   * Gets ID2
   */
  getId2() {
    return this.id2;
  }
  /**
   * Sets ID2
   */
  setId2(t) {
    return this.id2 = t, this;
  }
  /**
   * Gets operation
   */
  getOperation() {
    return this.operation;
  }
  /**
   * Sets operation
   */
  setOperation(t) {
    return this.operation = t, this;
  }
  /**
   * Gets current block height
   */
  getCurrentBlockHeight() {
    return this.cblock;
  }
  /**
   * Sets current block height
   */
  setCurrentBlockHeight(t) {
    return this.cblock = t, this;
  }
  /**
   * Sets current block hash
   */
  setCurrentBlockHash(t) {
    if (t.length !== 32) throw new Error("Invalid hash length");
    return this.cblockhash = new Uint8Array(t), this;
  }
  /**
   * Sets previous block hash
   */
  setPreviousBlockHash(t) {
    if (t.length !== 32) throw new Error("Invalid hash length");
    return this.pblockhash = new Uint8Array(t), this;
  }
  /**
   * Gets block number
   */
  getBlocknum() {
    return this.blocknum;
  }
  /**
   * Sets block number
   */
  setBlocknum(t) {
    return this.blocknum = t, this;
  }
  /**
   * Gets weight
   */
  getWeight() {
    return new Uint8Array(this.weight);
  }
  /**
   * Sets weight from bigint
   */
  setWeight(t) {
    const e = l.fit(t.toString(), 32);
    return this.weight = l.bytesToLittleEndian(e), this;
  }
  /**
   * Sets weight from bytes
   */
  setWeightBytes(t) {
    if (t.length !== 32)
      throw new Error("Invalid weight length");
    return this.weight = l.bytesToLittleEndian(l.fit(t, 32)), this;
  }
  /**
   * Gets CRC
   */
  getCRC() {
    return this.crc ?? 0;
  }
  /**
   * Gets source address
   */
  getSourceAddress() {
    return new Uint8Array(this.sourceAddress);
  }
  /**
   * Sets source address
   */
  setSourceAddress(t) {
    if (t.length !== 2208)
      throw new Error("Invalid address length");
    return this.sourceAddress = new Uint8Array(t), this;
  }
  /**
   * Gets destination address
   */
  getDestinationAddress() {
    return new Uint8Array(this.destinationAddress);
  }
  /**
   * Sets destination address
   */
  setDestinationAddress(t) {
    if (t.length !== 2208)
      throw new Error("Invalid address length");
    return this.destinationAddress = new Uint8Array(t), this;
  }
  /**
   * Gets change address
   */
  getChangeAddress() {
    return new Uint8Array(this.changeAddress);
  }
  /**
   * Sets change address
   */
  setChangeAddress(t) {
    if (t.length !== 2208)
      throw new Error("Invalid address length");
    return this.changeAddress = new Uint8Array(t), this;
  }
  /**
   * Gets total send amount
   */
  getTotalSend() {
    return new Uint8Array(this.totalSend);
  }
  /**
   * Sets total send amount
   */
  setTotalSend(t) {
    if (t.length !== 8)
      throw new Error("Invalid amount length");
    return this.totalSend = new Uint8Array(t), this;
  }
  /**
   * Sets total send amount from bigint
   */
  setTotalSendBigInt(t) {
    return this.totalSend = l.numberToLittleEndian(Number(t), 8), this;
  }
  /**
   * Gets total change amount
   */
  getTotalChange() {
    return new Uint8Array(this.totalChange);
  }
  /**
   * Sets total change amount
   */
  setTotalChange(t) {
    if (t.length !== 8)
      throw new Error("Invalid amount length");
    return this.totalChange = new Uint8Array(t), this;
  }
  /**
   * Sets total change amount from bigint
   */
  setTotalChangeBigInt(t) {
    return this.totalChange = l.numberToLittleEndian(Number(t), 8), this;
  }
  /**
   * Gets fee amount
   */
  getFee() {
    return new Uint8Array(this.fee);
  }
  /**
   * Sets fee amount
   */
  setFee(t) {
    if (t.length !== 8)
      throw new Error("Invalid amount length");
    return this.fee = new Uint8Array(t), this;
  }
  /**
   * Sets fee amount from bigint
   */
  setFeeBigInt(t) {
    return this.fee = l.numberToLittleEndian(Number(t), 8), this;
  }
  /**
   * Gets signature
   */
  getSignature() {
    return new Uint8Array(this.signature);
  }
  /**
   * Sets signature
   */
  setSignature(t) {
    if (t.length !== 2144)
      throw new Error("Invalid signature length");
    return this.signature = new Uint8Array(t), this;
  }
  /**
   * Gets previous block hash
   */
  getPblockhash() {
    return new Uint8Array(this.pblockhash);
  }
  /**
   * Gets current block hash
   */
  getCblockhash() {
    return new Uint8Array(this.cblockhash);
  }
  /**
   * Parses capabilities from datagram
   */
  static parseCapabilities(t, e) {
    for (const s of Object.values(It))
      typeof s == "number" && t.flags[s] && e.add(s);
    return e;
  }
  /**
   * Gets route as weight
   */
  static getRouteAsWeight(t) {
    const e = new Uint8Array(32);
    let s = 0;
    const r = t.length > 8 ? t.length - 8 : 0;
    for (let i = r; i < t.length; i++) {
      const h = t[i].trim(), o = h.split(".");
      if (o.length !== 4)
        throw new Error(`Invalid IP ${h}`);
      for (const a of o) {
        const d = parseInt(a);
        if (d < 0 || d > 255)
          throw new Error(`Invalid byte ${d}`);
        e[s++] = d;
      }
    }
    return e;
  }
  /**
   * Parses transaction IPs from datagram
   */
  static parseTxIps(t, e) {
    const s = t.getWeight();
    for (let r = 0; r < s.length; r += 4) {
      let i = 0;
      const h = [];
      for (let o = 0; o < 4; o++) {
        const a = s[r + o];
        if (a === 0 && i++, i >= 4) break;
        h.push(a);
      }
      if (i >= 4) break;
      e.add(h.join("."));
    }
    return e;
  }
  /**
   * Gets transaction buffer length
   */
  getTransactionBufferLength() {
    return this.transactionBufferLength;
  }
  /**
   * Sets transaction buffer length
   */
  setTransactionBufferLength(t) {
    return this.transactionBufferLength = t, this;
  }
  /**
   * Checks if should add to peer list
   */
  isAddToPeerList() {
    return this.getTransactionBufferLength() !== 1;
  }
  /**
   * Sets add to peer list flag
   */
  setAddToPeerList(t) {
    return this.setTransactionBufferLength(t ? 0 : 1), this;
  }
  /**
   * Gets version
   */
  getVersion() {
    return this.version;
  }
  /**
   * Creates a clone of this datagram
   */
  clone() {
    return M.of(this.serialize());
  }
  /**
   * Creates datagram from bytes
   */
  static of(t) {
    if (t.length < R.LENGTH)
      throw new Error(`Data length cannot be less than datagram length (${R.LENGTH})`);
    const e = S.allocate(R.LENGTH);
    e.order(L.LITTLE_ENDIAN), e.put(t), e.rewind();
    const s = new M();
    s.version = e.get_();
    const i = e.get_().toString(2).padStart(8, "0");
    s.flags = Array.from(i).map((o) => o !== "0"), s.network = Number(l.readLittleEndianUnsigned(e, 2)), s.id1 = Number(l.readLittleEndianUnsigned(e, 2)), s.id2 = Number(l.readLittleEndianUnsigned(e, 2));
    const h = Number(l.readLittleEndianUnsigned(e, 2));
    if (h === 0)
      throw new Error("Invalid operation code 0");
    return s.operation = h, s.cblock = l.readLittleEndianUnsigned(e, 8), s.blocknum = l.readLittleEndianUnsigned(e, 8), e.get(s.cblockhash), e.get(s.pblockhash), e.get(s.weight), s.transactionBufferLength = Number(l.readLittleEndianUnsigned(e, 2)), e.get(s.sourceAddress), e.get(s.destinationAddress), e.get(s.changeAddress), e.get(s.totalSend), e.get(s.totalChange), e.get(s.fee), e.get(s.signature), s.crc = Number(l.readLittleEndianUnsigned(e, 2)), s.trailer = Number(l.readLittleEndianUnsigned(e, 2)), s;
  }
}
const A = {
  LENGTH: 8824,
  ADDRESS_LENGTH: 2208,
  SIGNATURE_LENGTH: 2144,
  ID_LENGTH: 32,
  AMOUNT_LENGTH: 8
};
class E {
  constructor(t, e, s, r, i, h, o, a) {
    if (t.length !== 2208) throw new Error("Invalid source address length");
    if (e.length !== 2208) throw new Error("Invalid destination address length");
    if (s.length !== 2208) throw new Error("Invalid change address length");
    if (o.length !== 2144) throw new Error("Invalid signature length");
    if (a.length !== 32) throw new Error("Invalid id length");
    this.sourceAddress = new Uint8Array(t), this.destinationAddress = new Uint8Array(e), this.changeAddress = new Uint8Array(s), this.signature = new Uint8Array(o), this.id = new Uint8Array(a), this.sourceAddressHex = l.bytesToHex(this.sourceAddress), this.destinationAddressHex = l.bytesToHex(this.destinationAddress), this.changeAddressHex = l.bytesToHex(this.changeAddress), this.signatureHex = l.bytesToHex(this.signature), this.idHex = l.bytesToHex(this.id), this.totalSend = r, this.totalChange = i, this.fee = h, this.idValue = E.txIdToInteger(this.id);
  }
  /**
   * Converts transaction ID to integer value
   */
  static txIdToInteger(t) {
    let e = 0n;
    for (let s = 0; s < t.length; s++)
      e = e << 8n | BigInt(t[s]);
    return e;
  }
  /**
   * Calculates transaction ID from WOTS address
   */
  static txId(t) {
    if (t.length !== 2208)
      throw new Error("Invalid WOTS length");
    return T.hash(t);
  }
  /**
   * Validates WOTS signature
   */
  static isValidWOTSSignature(t) {
    const e = T.hash(t.subarray(0, 6648)), s = t.subarray(0, 2208), r = s.subarray(0, 2144), i = s.subarray(2144, 2176), h = s.subarray(2176, 2208), o = t.subarray(6648, 8792), a = c.wots_pk_from_sig(o, e, i, h);
    if (a.length !== r.length) return !1;
    for (let d = 0; d < r.length; d++)
      if (a[d] !== r[d]) return !1;
    return !0;
  }
  /**
   * Creates Transaction from raw bytes
   */
  static of(t) {
    if (t.length !== A.LENGTH)
      throw new Error(`Data length must be ${A.LENGTH}`);
    const e = S.wrap(t);
    e.order(L.LITTLE_ENDIAN);
    const s = new Uint8Array(2208);
    e.get(s);
    const r = new Uint8Array(2208);
    e.get(r);
    const i = new Uint8Array(2208);
    e.get(i);
    const h = l.readLittleEndianUnsigned(e, 8), o = l.readLittleEndianUnsigned(e, 8), a = l.readLittleEndianUnsigned(e, 8), d = new Uint8Array(2144);
    e.get(d);
    const g = new Uint8Array(32);
    return e.get(g), new E(
      s,
      r,
      i,
      h,
      o,
      a,
      d,
      g
    );
  }
  /**
   * Converts bigint to little-endian bytes
   */
  static bigIntToLEBytes(t, e) {
    const s = new Uint8Array(e);
    let r = t;
    for (let i = 0; i < e; i++)
      s[i] = Number(r & 0xFFn), r >>= 8n;
    return s;
  }
  /**
   * Converts little-endian bytes to bigint
   */
  static bytesToBigInt(t) {
    let e = 0n;
    for (let s = t.length - 1; s >= 0; s--)
      e = e << 8n | BigInt(t[s]);
    return e;
  }
  /**
   * Creates raw bytes from transaction
   */
  serialize() {
    const t = S.allocate(A.LENGTH);
    return t.order(L.LITTLE_ENDIAN), t.put(this.sourceAddress), t.put(this.destinationAddress), t.put(this.changeAddress), t.put(E.bigIntToLEBytes(this.totalSend, 8)), t.put(E.bigIntToLEBytes(this.totalChange, 8)), t.put(E.bigIntToLEBytes(this.fee, 8)), t.put(this.signature), t.put(this.id), t.array();
  }
  /**
   * Validates a transaction
   */
  static validate(t, e, s) {
    const r = t.serialize();
    if (r.length !== A.LENGTH)
      return `Invalid transaction length (expected ${A.LENGTH} but was ${r.length})`;
    if (l.compareBytes(t.sourceAddress, t.destinationAddress))
      return "Source address is identical to destination address";
    if (l.compareBytes(t.sourceAddress, t.changeAddress))
      return "Source address is identical to change address";
    if (t.fee < e)
      return `Invalid transaction fee (min required ${e} but was ${t.fee})`;
    const i = E.txId(t.sourceAddress);
    return l.compareBytes(i, t.id) ? s && t.idValue <= s.idValue ? `Invalid transaction order (id ${t.idValue} should be after ${s.idValue})` : t.totalSend < 0n ? "Total send cannot be negative" : t.totalChange < 0n ? "Total change cannot be negative" : t.fee < 0n ? "Fee cannot be negative" : E.isValidWOTSSignature(r) ? null : "Invalid WOTS signature" : `Invalid transaction id (expected ${l.bytesToHex(i)} but was ${t.idHex})`;
  }
  /**
   * Signs a transaction
   */
  static sign(t, e, s, r, i, h, o, a) {
    if (i.length !== 2208) throw new Error("Invalid source address length");
    if (o.length !== 2208) throw new Error("Invalid destination address length");
    if (a.length !== 2208) throw new Error("Invalid change address length");
    if (t <= 0n) throw new Error("Balance must be positive");
    if (e < 0n) throw new Error("Payment cannot be negative");
    if (s < 0n) throw new Error("Fee cannot be negative");
    if (r < 0n) throw new Error("Change cannot be negative");
    const d = t - s;
    if (d < 0n) throw new Error("Not enough fund for fee");
    const g = d - e;
    if (g < 0n) throw new Error("Not enough fund for fee and payment");
    const u = g - r;
    if (u < 0n) throw new Error("Not enough fund for fee, payment and change");
    if (u > 0n) throw new Error("Source address not fully spent");
    const w = S.allocate(A.LENGTH);
    w.order(L.LITTLE_ENDIAN), w.put(i), w.put(o), w.put(a), w.put(E.bigIntToLEBytes(e, A.AMOUNT_LENGTH)), w.put(E.bigIntToLEBytes(r, A.AMOUNT_LENGTH)), w.put(E.bigIntToLEBytes(s, A.AMOUNT_LENGTH));
    const f = w.array().subarray(0, 6648), G = T.hash(f);
    i.subarray(0, A.SIGNATURE_LENGTH);
    const H = i.subarray(A.SIGNATURE_LENGTH, A.SIGNATURE_LENGTH + 32), $ = i.subarray(A.SIGNATURE_LENGTH + 32, A.SIGNATURE_LENGTH + 64), v = new Uint8Array(A.SIGNATURE_LENGTH);
    c.wots_sign(v, G, h, H, 0, $), w.position(6648), w.put(v);
    const K = E.txId(i);
    if (w.put(K), w.array().length !== A.LENGTH)
      throw new Error("Transaction length mismatch");
    const p = new M();
    return p.setOperation(nt.Transaction), p.setSourceAddress(i), p.setDestinationAddress(o), p.setChangeAddress(a), p.setTotalSend(E.bigIntToLEBytes(e, A.AMOUNT_LENGTH)), p.setTotalChange(E.bigIntToLEBytes(r, A.AMOUNT_LENGTH)), p.setFee(E.bigIntToLEBytes(s, A.AMOUNT_LENGTH)), p.setSignature(v), { datagram: p.serialize(), tx: w.array() };
  }
}
class z {
  /**
   * Creates a new WOTS wallet
   */
  constructor({
    name: t = null,
    address: e = null,
    tag: s = null,
    secret: r = null
  }) {
    this.name = t, this.address = e, this.tag = s, this.secret = r, this.addressHex = this.address ? l.bytesToHex(this.address) : null, this.tagHex = this.tag ? l.bytesToHex(this.tag) : null, this.v3address = this.address ? W.wotsAddressFromBytes(this.address) : null;
  }
  getName() {
    return this.name;
  }
  getAddress() {
    return this.address ? new Uint8Array(this.address) : null;
  }
  getAddr() {
    return this.address ? new Uint8Array(this.address.slice(c.WOTSSIGBYTES, c.WOTSSIGBYTES + 32)) : null;
  }
  getPublSeed() {
    return this.address ? new Uint8Array(this.address.slice(c.WOTSSIGBYTES, c.WOTSSIGBYTES + 32)) : null;
  }
  getAddressHex() {
    return this.addressHex;
  }
  getTag() {
    return this.tag ? new Uint8Array(this.tag) : null;
  }
  getTagHex() {
    return this.tagHex;
  }
  getSecret() {
    return this.secret ? new Uint8Array(this.secret) : null;
  }
  hasSecret() {
    return this.secret !== null;
  }
  /**
   * Sign data using the secret key
   * @param data 
   * @returns 
   */
  sign(t) {
    const e = this.secret, s = this.address;
    if (!e || !s)
      throw new Error("Cannot sign without secret key or address");
    if (e.length !== 32)
      throw new Error("Invalid sourceSeed length, expected 32, got " + e.length);
    if (s.length !== 2208)
      throw new Error("Invalid sourceWots length, expected 2208, got " + s.length);
    s.subarray(0, c.WOTSSIGBYTES);
    const r = s.subarray(c.WOTSSIGBYTES, c.WOTSSIGBYTES + 32), i = s.subarray(c.WOTSSIGBYTES + 32, c.WOTSSIGBYTES + 64), h = new Uint8Array(c.WOTSSIGBYTES);
    return c.wots_sign(h, t, e, r, 0, i), h;
  }
  /**
   * Verifies whether a signature is valid for a given message
   * @param message 
   * @param signature 
   * @returns 
   */
  verify(t, e) {
    if (!this.address)
      throw new Error("Cannot verify without public key (address)");
    const s = this.address, r = s.subarray(0, c.WOTSSIGBYTES), i = s.subarray(c.WOTSSIGBYTES, c.WOTSSIGBYTES + 32), h = s.subarray(c.WOTSSIGBYTES + 32, c.WOTSSIGBYTES + 64), o = c.wots_pk_from_sig(e, t, i, h);
    return l.areEqual(o, r);
  }
  /**
   * Address components generator used for generating address components for pk generation
   * @param wotsSeed 
   * @returns 
   */
  static componentsGenerator(t) {
    const e = Buffer.from(t).toString("ascii"), s = T.hash(Buffer.from(e + "seed", "ascii")), r = T.hash(Buffer.from(e + "publ", "ascii")), i = T.hash(Buffer.from(e + "addr", "ascii"));
    return {
      private_seed: s,
      public_seed: r,
      addr_seed: i
    };
  }
  clear() {
    this.secret && l.clear(this.secret), this.address && l.clear(this.address), this.tag && l.clear(this.tag), this.tagHex && (this.tagHex = null), this.addressHex && (this.addressHex = null);
  }
  toString() {
    let t = "Empty address";
    return this.addressHex ? t = `${this.addressHex.substring(0, 32)}...${this.addressHex.substring(this.addressHex.length - 24)}` : this.tagHex && (t = `tag-${this.tagHex}`), t;
  }
  toJSON() {
    return {
      name: this.name,
      address: this.address,
      tag: this.tag,
      secret: this.secret,
      tagHex: this.tagHex,
      addressHex: this.addressHex
    };
  }
  static create(t, e, s) {
    if (e.length !== 32)
      throw new Error("Invalid secret length");
    if (s !== null && s.length !== 12)
      throw new Error("Invalid tag");
    const { private_seed: r } = this.componentsGenerator(e), i = c.generateAddress(s, e, this.componentsGenerator);
    return new z({ name: t, address: i, tag: s, secret: r });
  }
  static createV3(t, e, s) {
    const { private_seed: r } = this.componentsGenerator(e), i = c.generateAddress(s, e, this.componentsGenerator);
    return new z({ name: t, address: i, tag: s, secret: r });
  }
}

// Export for TypeScript/CommonJS usage

// Removed export type


// CommonJS export
module.exports = { WOTS: c };
