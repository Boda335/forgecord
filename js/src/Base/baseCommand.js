const baseClient = require('./baseClient');

/**
 * @typedef {Object} Validation
 * @property {function} callback - The condition to validate
 * @property {string} message - The message to be displayed if callback condition is not met
 */

/**
 * @typedef {Object} SubCommand
 * @property {string} trigger - subcommand invoke
 * @property {string} description - subcommand description
 */

/**
 * @typedef {"ADMIN"|"ANIME"|"AUTOMOD"|"ECONOMY"|"FUN"|"IMAGE"|"INFORMATION"|"INVITE"|"MODERATION"|"NONE"|"OWNER"|"SOCIAL"|"PUBLIC"|"TICKET"|"UTILITY"} CommandCategory
 */

/**
 * @typedef {Object} InteractionInfo
 * @property {boolean} enabled - Whether the slash command is enabled or not
 * @property {boolean} ephemeral - Whether the reply should be ephemeral
 */

/**
 * @typedef {Object} CommandInfo
 * @property {boolean} enabled - Whether the command is enabled or not
 * @property {string[]} [aliases] - Alternative names for the command (all must be lowercase)
 * @property {string} [usage=""] - The command usage format string
 * @property {number} [minArgsCount=0] - Minimum number of arguments the command takes (default is 0)
 * @property {SubCommand[]} [subcommands=[]] - List of subcommands
 */

/**
 * @typedef {Object} CommandData
 * @property {string} name - The name of the command (must be lowercase)
 * @property {string} description - A short description of the command
 * @property {number} cooldown - The command cooldown in milliseconds (use the `ms` package for readability, e.g. `ms('10s')`, `ms('1m')`)
 * @property {CommandCategory} category - The category this command belongs to
 * @property {string} [about] - The command about a developer maked
 * @property {import('discord.js').PermissionResolvable[]} [botPermissions] - Permissions required by the client to use the command.
 * @property {import('discord.js').PermissionResolvable[]} [userPermissions] - Permissions required by the user to use the command
 * @property {Validation[]} [validations] - List of validations to be run before the command is executed
 * @property {import('discord.js').ApplicationCommandOptionData[]} [options] - Shared options between prefix and slash commands
 * @property {boolean} [dmonly=false] - If true, the slash command only works in DMs with the bot (not usable in any server). If false/omitted, the command only works in servers.
 * @property {boolean} [userInstall=false] - If true, the slash command supports "User Install" (users can add the app to themselves via "Add to My Apps" and use it anywhere, even without adding the bot to a server). If false/omitted, the command only works where the bot is installed to a server (Guild Install).
 * @property {CommandInfo} command - A short description of the command
 * @property {InteractionInfo} slashCommand - Slash command configuration
 * @property {function(baseClient,import('discord.js').Message, string[])} msgExecute - The callback to be executed when the command is invoked
 * @property {function(baseClient,import('discord.js').ChatInputCommandInteraction)} interactionExecute - The callback to be executed when the interaction is invoked
 * @property {function(baseClient,import('discord.js').AutocompleteInteraction)} autocompleteExecute - The callback to be executed when the autocomplete is invoked
 */

/**
 * Placeholder for command data
 * @type {CommandData}
 */
module.exports = {
  name: '',
  description: '',
  cooldown: 0,
  isPremium: false,
  category: 'NONE',
  botPermissions: [],
  userPermissions: [],
  validations: [],
  options: [],
  dmonly: false,
  userInstall: false,
  command: {
    enabled: true,
  },
  slashCommand: {
    enabled: true,
    ephemeral: false,
  },
  msgExecute: (client, message, args) => {},
  interactionExecute: (client, interaction) => {},
  autocompleteExecute: (client, interaction) => {},
};
