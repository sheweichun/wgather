

const stream = process.stderr;

module.exports = {
  flag: false,
  index: -1,
  chars: ['🌕 ', '🌖 ', '🌗 ', '🌘 ', '🌑 ', '🌒 ', '🌓 ', '🌔 '],
  start() {
    this.flag = true;
    this.run();
  },
  run() {
    if (stream.isTTY) {
      const prevIndex = this.index;
      this.index += 1;
      const prevContent = this.chars[prevIndex % 8] || '';
      stream.moveCursor(-(prevContent.length), 0);
      stream.write(this.chars[this.index % 8] || '');
    } else {
      stream.write('.');
    }
    if (!this.flag) { return; }
    this.timeId = setTimeout(() => {
      this.run();
    }, 30);
  },
  stop() {
    clearTimeout(this.timeId);
    this.flag = false;
    stream.write('\n');
  },
};
