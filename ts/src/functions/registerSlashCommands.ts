import { ApplicationCommandOptionData, ApplicationCommandType, ApplicationIntegrationType, InteractionContextType } from 'discord.js';
import { Logger } from '../core/logger';
import i18n from '../Base/i18n';
import type { NexusClient } from '../types/client';

export default async function registerSlashCommands(client: NexusClient): Promise<void> {
  const { slash } = client.config;
  const allCommands: any[] = [];

  client.commands.forEach(cmd => {
    if (!cmd.slashCommand?.enabled) return;

    const contexts = cmd.dmonly || cmd.userInstall
      ? [InteractionContextType.BotDM]
      : [InteractionContextType.Guild];
    const integrationTypes = cmd.userInstall
      ? [ApplicationIntegrationType.UserInstall]
      : [ApplicationIntegrationType.GuildInstall];

    const localizeOptions = (options: ApplicationCommandOptionData[] = []): ApplicationCommandOptionData[] => options.map(option => {
      const localized = {
        ...option,
        description_localizations: i18n.getLocalizations(`commands.${cmd.name}.${option.name}`),
      } as any;

      if (!Object.keys(localized.description_localizations).length) delete localized.description_localizations;
      if ('options' in option && Array.isArray(option.options)) localized.options = localizeOptions(option.options as ApplicationCommandOptionData[]);
      return localized as ApplicationCommandOptionData;
    });

    const descriptionLocalizations = i18n.getLocalizations(`commands.${cmd.name}.description`);
    allCommands.push({
      name: cmd.name,
      description: cmd.description,
      ...(Object.keys(descriptionLocalizations).length ? { description_localizations: descriptionLocalizations } : {}),
      options: localizeOptions(cmd.options),
      type: cmd.type || ApplicationCommandType.ChatInput,
      contexts,
      integration_types: integrationTypes,
    });
  });

  try {
    if (slash.global) {
      // Discord rejects a bulk overwrite that would remove the app's
      // PRIMARY_ENTRY_POINT command (type 4), which is used to launch an Activity.
      // Preserve any existing Entry Point while replacing framework-managed commands.
      const existingGlobalCommands = await client.application!.commands.fetch();
      const entryPointCommands = [...existingGlobalCommands.values()].filter(command => command.type === ApplicationCommandType.PrimaryEntryPoint);

      await client.application!.commands.set([...allCommands, ...entryPointCommands]);
      Logger.info(`Global slash commands registered (${allCommands.length} managed, ${entryPointCommands.length} Entry Point preserved).`);
      return;
    }

    for (const guildID of slash.guildIDS) {
      const guild = await client.guilds.fetch(guildID).catch(() => null);
      if (!guild) {
        Logger.warn(`Guild with ID ${guildID} not found.`);
        continue;
      }
      await guild.commands.set(allCommands);
      Logger.info(`Slash commands registered for guild: ${guild.name} (${guildID})`);
    }
  } catch (error) {
    Logger.error('Failed to register slash commands:', error);
    client.errorHandler.report(`Failed to register slash commands: ${(error as Error).message}`, { source: 'registerSlashCommands' });
  }
}
