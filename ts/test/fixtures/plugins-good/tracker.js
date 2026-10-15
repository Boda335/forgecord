module.exports = {
  name: 'tracker',
  async onLoad(client) {
    client.hooks.on('commandExecuted', () => {});
    client._trackerLoaded = true;
  },
};
