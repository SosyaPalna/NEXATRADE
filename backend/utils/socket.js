let io = null;

module.exports = {
  setIo: (instance) => { io = instance; },
  getIo: () => io,
};
