module.exports = {
  name: 'throws-plugin',
  async onLoad() {
    throw new Error('setup failed');
  },
};
