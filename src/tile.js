var Tile = function () {
  // Tile data:
  this.pix = new Array(64);

  this.fbIndex = null;
  this.tIndex = null;
  this.x = null;
  this.y = null;
  this.w = null;
  this.h = null;
  this.incX = null;
  this.incY = null;
  this.palIndex = null;
  this.tpri = null;
  this.c = null;
  this.initialized = false;
  this.opaque = new Array(8);
};

Tile.prototype = {
  setBuffer: function (scanline) {
    for (this.y = 0; this.y < 8; this.y++) {
      this.setScanline(this.y, scanline[this.y], scanline[this.y + 8]);
    }
  },

  setScanline: function (sline, b1, b2) {
    this.initialized = true;
    this.tIndex = sline << 3;
    for (this.x = 0; this.x < 8; this.x++) {
      this.pix[this.tIndex + this.x] =
        ((b1 >> (7 - this.x)) & 1) + (((b2 >> (7 - this.x)) & 1) << 1);
      if (this.pix[this.tIndex + this.x] === 0) {
        this.opaque[sline] = false;
      }
    }
  },

  render: function (
    buffer,
    srcx1,
    srcy1,
    srcx2,
    srcy2,
    dx,
    dy,
    palAdd,
    palette,
    flipHorizontal,
    flipVertical,
    pri,
    priTable
  ) {
    if (dx < -7 || dx >= 256 || dy < -7 || dy >= 240) {
      return;
    }

    const w = srcx2 - srcx1;
    const h = srcy2 - srcy1;

    if (dx < 0) {
      srcx1 -= dx;
    }
    if (dx + srcx2 >= 256) {
      srcx2 = 256 - dx;
    }

    if (dy < 0) {
      srcy1 -= dy;
    }
    if (dy + srcy2 >= 240) {
      srcy2 = 240 - dy;
    }

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const srcX = flipHorizontal ? w - 1 - x : x;
        const srcY = flipVertical ? h - 1 - y : y;
        const targetX = dx + x;
        const targetY = dy + y;

        if (targetX >= 0 && targetX < 256 && targetY >= 0 && targetY < 240) {
          const fbIndex = (targetY << 8) + targetX;
          const tIndex = (srcY << 3) + srcX;
          const palIndex = this.pix[tIndex];
          const tpri = priTable[fbIndex];

          if (palIndex !== 0 && pri <= (tpri & 0xff)) {
            buffer[fbIndex] = palette[palIndex + palAdd];
            priTable[fbIndex] = (tpri & 0xf00) | pri;
          }
        }
      }
    }
  },

  isTransparent: function (x, y) {
    return this.pix[(y << 3) + x] === 0;
  },

  toJSON: function () {
    return {
      opaque: this.opaque,
      pix: this.pix,
    };
  },

  fromJSON: function (s) {
    this.opaque = s.opaque;
    this.pix = s.pix;
  },
};

module.exports = Tile;
