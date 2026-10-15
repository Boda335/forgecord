const NEXUS = require('../handlers/Nexus.js');
const { Logger } = require('../core/logger');
const { InteractionContextType, ApplicationIntegrationType, ApplicationCommandType } = require('discord.js');
const i18n = require('@base/i18n.js');

/**
 * @param {NEXUS} client
 */
async function registerSlashCommands(client) {
  const { slash } = client.config;
  const allCommands = [];
  client.commands.forEach(cmd => {
    if (!cmd.slashCommand || !cmd.slashCommand.enabled) return;

    // dmonly=true       -> command only usable in DMs with the bot
    // userInstall=true  -> also forces DM-only (a user-installed command never
    //                      shows up in server "/" menus, only in the user's DMs)
    // both false/undefined -> command only usable in servers (guilds)
    const contexts = cmd.dmonly || cmd.userInstall ? [InteractionContextType.BotDM] : [InteractionContextType.Guild];

    // userInstall=true -> app can be added by a user ("Add to My Apps") and used
    //                      without the bot being in a server
    // userInstall=false/undefined -> app must be added to a server (Guild Install)
    const integrationTypes = cmd.userInstall ? [ApplicationIntegrationType.UserInstall] : [ApplicationIntegrationType.GuildInstall];

    const localizeOptions = options =>
      (options || []).map(option => {
        const localized = {
          ...option,
          description_localizations: i18n.getLocalizations(`commands.${cmd.name}.${option.name}`),
        };

        if (!Object.keys(localized.description_localizations).length) {
          delete localized.description_localizations;
        }

        if (Array.isArray(option.options)) {
          localized.options = localizeOptions(option.options);
        }

        return localized;
      });

    const descriptionLocalizations = i18n.getLocalizations(`commands.${cmd.name}.description`);

    const commandData = {
      name: cmd.name,
      description: cmd.description,
      ...(Object.keys(descriptionLocalizations).length ? { description_localizations: descriptionLocalizations } : {}),
      options: localizeOptions(cmd.options),
      type: cmd.type || 1,
      contexts,
      integration_types: integrationTypes,
    };

    allCommands.push(commandData);
  });

  try {
    if (slash.global) {
      // Discord does not allow a bulk overwrite to implicitly remove the
      // application's PRIMARY_ENTRY_POINT command (type 4), which is the
      // command Discord uses to launch an Activity. Preserve any existing
      // Entry Point command while replacing the framework-managed commands.
      const existingGlobalCommands = await client.application.commands.fetch();
      const entryPointCommands = [...existingGlobalCommands.values()].filter(command => command.type === ApplicationCommandType.PrimaryEntryPoint);

      await client.application.commands.set([...allCommands, ...entryPointCommands]);
      Logger.info(`Global slash commands registered (${allCommands.length} managed, ${entryPointCommands.length} Entry Point preserved).`);
    } else {
      for (const guildID of slash.guildIDS) {
        const guild = await client.guilds.fetch(guildID).catch(() => null);
        if (!guild) {
          Logger.warn(`Guild with ID ${guildID} not found.`);
          continue;
        }

        await guild.commands.set(allCommands);
        Logger.info(`Slash commands registered for guild: ${guild.name} (${guildID})`);
      }
    }
  } catch (error) {
    Logger.error('Failed to register slash commands:', error);
    client.errorHandler?.report?.(`Failed to register slash commands: ${error.message}`, { source: 'registerSlashCommands' });
  }
}

module.exports = registerSlashCommands;
