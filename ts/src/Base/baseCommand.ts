import type { CommandData } from '../types/command';
export type { CommandData, CommandCategory, Validation, SubCommand, CommandInfo, InteractionInfo } from '../types/command';

/** Placeholder command shape used as the canonical template for new commands. */
const baseCommand: CommandData = {
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
  command: { enabled: true, aliases: [], minArgsCount: 0, subcommands: [] },
  slashCommand: { enabled: true, ephemeral: false },
  msgExecute: () => {},
  interactionExecute: () => {},
  autocompleteExecute: () => {},
};

export default baseCommand;
