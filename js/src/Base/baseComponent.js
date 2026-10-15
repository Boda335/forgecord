const baseClient = require('./baseClient');

/**
 * @typedef {Object} ComponentData
 * @property {string} name
 * @property {boolean} enabled
 * @property {import('discord.js').PermissionResolvable[]} [botPermissions] - Permissions required by the client to use the command.
 * @property {import('discord.js').PermissionResolvable[]} [userPermissions] - Permissions required by the user to use the command
 * @property {function(baseClient,import('discord.js').ChatInputCommandInteraction, string[])} action - The callback to be executed when the interaction is invoked
 *
 */

/**
 * @type {ComponentData}
 */
module.exports = {
  name: '',
  enabled: true,
  botPermissions: [],
  userPermissions: [],
  async action(client, interaction, parts) {},
};
