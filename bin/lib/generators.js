'use strict';

const fs = require('fs');
const path = require('path');

const LANGUAGES = {
  js: { key: 'js', label: 'JavaScript', hint: 'discord.js — plain JS, zero build step' },
  ts: { key: 'ts', label: 'TypeScript', hint: 'discord.js — fully typed, tsc/tsx' },
  py: { key: 'py', label: 'Python', hint: 'discord.py — async, typed with dataclasses' },
};
const LANG_ALIASES = { js: 'js', javascript: 'js', ts: 'ts', typescript: 'ts', py: 'py', python: 'py' };

const COMMAND_CATEGORIES = ['ADMIN', 'ANIME', 'AUTOMOD', 'ECONOMY', 'FUN', 'IMAGE', 'INFORMATION', 'INVITE', 'MODERATION', 'NONE', 'OWNER', 'SOCIAL', 'PUBLIC', 'TICKET', 'UTILITY'];

function safeIdentifier(value, label = 'name') {
  const clean = String(value || '').trim();
  if (!/^[A-Za-z][A-Za-z0-9_-]*$/.test(clean)) throw new Error(`Invalid ${label}. Use letters, numbers, underscores, or hyphens; it must start with a letter.`);
  return clean;
}
function slug(value) {
  return value
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}
function quotePy(value) {
  return JSON.stringify(value);
}
function discoverCategories(langRoot) {
  const root = path.join(langRoot, 'src', 'Commands');
  try {
    return fs
      .readdirSync(root, { withFileTypes: true })
      .filter(x => x.isDirectory())
      .map(x => x.name);
  } catch {
    return [];
  }
}
async function promptText(clack, message, placeholder, initialValue = '') {
  const value = await clack.text({
    message,
    placeholder,
    initialValue,
    validate(v) {
      return v && v.trim().length > 120 ? 'Please keep this under 120 characters.' : undefined;
    },
  });
  if (clack.isCancel(value)) throw new Error('Cancelled by user.');
  return String(value || '').trim();
}
async function promptBoolean(clack, message, initialValue = true) {
  const value = await clack.confirm({ message, initialValue });
  if (clack.isCancel(value)) throw new Error('Cancelled by user.');
  return value;
}
function discoverEventTargets(projectRoot) {
  const base = path.join(projectRoot, 'src', 'events');
  const targets = new Set(['client']);
  function walk(dir) {
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.(?:js|ts|py)$/.test(entry.name)) {
        const source = fs.readFileSync(full, 'utf8');
        for (const match of source.matchAll(/\btarget\s*[:=]\s*['"]([^'"]+)['"]/g)) targets.add(match[1]);
      }
    }
  }
  walk(base);
  return [...targets].sort((a, b) => (a === 'client' ? -1 : b === 'client' ? 1 : a.localeCompare(b)));
}
async function promptEventTarget(clack, projectRoot) {
  const known = discoverEventTargets(projectRoot);
  const selected = await clack.select({
    message: 'Event target',
    options: [...known.map(value => ({ value, label: value, hint: value === 'client' ? 'default Discord client target' : 'detected in existing events' })), { value: '__custom__', label: 'Enter a custom target…' }],
    initialValue: 'client',
  });
  if (clack.isCancel(selected)) throw new Error('Cancelled by user.');
  if (selected !== '__custom__') return selected;
  return (await promptText(clack, 'Custom event target', 'e.g. distube')).trim() || 'client';
}
async function promptCategory(clack, known) {
  const choices = [...new Set([...COMMAND_CATEGORIES, ...known.map(x => x.toUpperCase())])].sort();
  const choice = await clack.select({ message: 'Command category', options: [...choices.map(value => ({ value, label: value })), { value: '__custom__', label: 'Enter a custom category…' }], initialValue: choices.includes('UTILITY') ? 'UTILITY' : choices[0] });
  if (clack.isCancel(choice)) throw new Error('Cancelled by user.');
  if (choice !== '__custom__') return choice;
  return (await promptText(clack, 'Custom category', 'e.g. MUSIC')).toUpperCase().replace(/\s+/g, '_') || 'CUSTOM';
}
function commandTemplate(lang, data) {
  const { name, description, cooldownMinutes, category, commandEnabled, slashEnabled } = data;
  const messageHandler = commandEnabled ? `  msgExecute: async (client, message, args) => {\n    // TODO: implement this prefix command.\n    await message.reply('This command is not implemented yet.');\n  },` : `  // msgExecute: async (client, message, args) => {\n  //   // Prefix command disabled during generation. Uncomment to enable it.\n  // },`;
  const slashHandler = slashEnabled ? `  interactionExecute: async (client, interaction) => {\n    // TODO: implement this slash command.\n    await interaction.reply({ content: 'This command is not implemented yet.', ephemeral: true });\n  },` : `  // interactionExecute: async (client, interaction) => {\n  //   // Slash command disabled during generation. Uncomment to enable it.\n  // },`;
  if (lang === 'js') return `/**\n * ${description}\n * Generated by Forgecord CLI.\n */\nmodule.exports = {\n  name: ${JSON.stringify(name.toLowerCase())},\n  description: ${JSON.stringify(description)},\n  cooldown: ${Math.round(cooldownMinutes * 60 * 1000)}, // milliseconds; entered in minutes\n  category: ${JSON.stringify(category)},\n  command: { enabled: ${commandEnabled}, aliases: [], usage: '', minArgsCount: 0, subcommands: [] },\n  slashCommand: { enabled: ${slashEnabled}, ephemeral: false },\n${messageHandler}\n${slashHandler}\n  // Optional autocomplete handler for slash-command options.\n  // autocompleteExecute: async (client, interaction) => {},\n};\n`;
  if (lang === 'ts') return `import type { CommandData } from '../../types/command';\n\n/** ${description} */\nconst command: CommandData = {\n  name: ${JSON.stringify(name.toLowerCase())},\n  description: ${JSON.stringify(description)},\n  cooldown: ${Math.round(cooldownMinutes * 60 * 1000)}, // milliseconds; entered in minutes\n  category: ${JSON.stringify(category)},\n  command: { enabled: ${commandEnabled}, aliases: [], usage: '', minArgsCount: 0, subcommands: [] },\n  slashCommand: { enabled: ${slashEnabled}, ephemeral: false },\n${messageHandler}\n${slashHandler}\n  // autocompleteExecute: async (client, interaction) => {},\n};\n\nexport default command;\n`;
  const pythonCategory = category.toLowerCase();
  return `"""${description}"""\nfrom ...Base.baseCommand import CommandData, CommandInfo, SlashCommandInfo\n\n${commandEnabled ? `async def msg_execute(client, message, args, used_prefix='!'):\n    # TODO: implement this prefix command.\n    await message.reply(content="This command is not implemented yet.")\n` : `# async def msg_execute(client, message, args, used_prefix='!'):\n#     # Prefix command disabled during generation. Uncomment to enable it.\n#     pass\n`}\n${slashEnabled ? `async def interaction_execute(client, interaction, args=None):\n    # TODO: implement this slash command.\n    await interaction.response.send_message("This command is not implemented yet.", ephemeral=True)\n` : `# async def interaction_execute(client, interaction, args=None):\n#     # Slash command disabled during generation. Uncomment to enable it.\n#     pass\n`}\ndata = CommandData(\n    name=${quotePy(name.toLowerCase())},\n    description=${quotePy(description)},\n    cooldown=${Math.max(0, Math.round(cooldownMinutes * 60))},  # seconds; entered in minutes\n    category=${quotePy(pythonCategory)},\n    command=CommandInfo(enabled=${commandEnabled}),\n    slashCommand=SlashCommandInfo(enabled=${slashEnabled}, ephemeral=False),\n    ${commandEnabled ? 'msgExecute=msg_execute,' : '# msgExecute=msg_execute,  # disabled during generation'}\n    ${slashEnabled ? 'interactionExecute=interaction_execute,' : '# interactionExecute=interaction_execute,  # disabled during generation'}\n)\n`;
}
function eventTemplate(lang, data) {
  const { name, target, once } = data;
  if (lang === 'js') return `/** Event: ${name}; target: ${target}; once: ${once} */\nmodule.exports = {\n  name: ${JSON.stringify(name)},\n  target: ${JSON.stringify(target)},\n  once: ${once},\n  // Implement this callback. Keep it commented to disable the event handler.\n  async execute(client, ...args) {\n    // TODO: implement event logic.\n    // client.logger?.info('Event ${name} fired');\n  },\n};\n`;
  if (lang === 'ts') return `import type { BaseEvent } from '../../types/event';\n\nconst event: BaseEvent = {\n  name: ${JSON.stringify(name)} as keyof import('discord.js').ClientEvents,\n  target: ${JSON.stringify(target)},\n  once: ${once},\n  // Implement this callback. Keep it commented to disable the event handler.\n  // execute: async (client, ...args) => { client.logger.info('Event ${name} fired'); },\n  execute: async () => {},\n};\n\nexport default event;\n`;
  let pyName = name === 'clientReady' ? 'on_ready' : name;
  if (!pyName.startsWith('on_')) pyName = `on_${pyName.replace(/[A-Z]/g, m => `_${m.toLowerCase()}`).replace(/^_/, '')}`;
  return `"""Generated event. Discord.py event name: ${pyName}; target metadata: ${target}; once: ${once}."""\nfrom ...Base.baseEvents import EventData\n\nasync def execute(client, *args, **kwargs):\n    # Implement event logic here.\n    # Example: client.logger.info("${pyName} fired")\n    pass\n\ndata = EventData(name=${quotePy(pyName)}, execute=execute, once=${once}, target=${quotePy(target)})\n`;
}
function componentTemplate(lang, name, enabled) {
  if (lang === 'js') return `/** Generated component handler. */\nmodule.exports = {\n  name: ${JSON.stringify(name)},\n  enabled: ${enabled},\n  botPermissions: [],\n  userPermissions: [],\n  // Uncomment and implement action to enable this component handler.\n  async action(client, interaction, parts) {\n    // TODO: implement this component action.\n    // await interaction.reply({ content: 'Component ${name}', ephemeral: true });\n  },\n};\n`;
  if (lang === 'ts') return `import type { ComponentData } from '../../types/component';\n\nconst component: ComponentData = {\n  name: ${JSON.stringify(name)},\n  enabled: ${enabled},\n  botPermissions: [],\n  userPermissions: [],\n  // Uncomment and implement action to enable this component handler.\n  // action: async (client, interaction, parts) => { await interaction.reply({ content: 'Component ${name}', ephemeral: true }); },\n  action: async () => {},\n};\n\nexport default component;\n`;
  return `"""Generated component handler."""\nfrom ...Base.baseComponent import ComponentData\n\nasync def action(client, interaction, parts):\n    # Implement component action here.\n    # await interaction.response.send_message("Component ${name}", ephemeral=True)\n    pass\n\ndata = ComponentData(name=${quotePy(name)}, action=action, enabled=${enabled})\n`;
}
function pluginTemplate(lang, name) {
  if (lang === 'js') return `/** Forgecord plugin: ${name} */\nmodule.exports = {\n  name: ${JSON.stringify(name)},\n  async onLoad(client) {\n    // Register hooks or initialize integrations here.\n    // client.hooks.on('commandExecuted', payload => {});\n    client.logger?.info?.('Plugin ${name} loaded');\n  },\n};\n`;
  if (lang === 'ts') return `import type { NexusClient } from '../types/client';\n\nconst plugin = {\n  name: ${JSON.stringify(name)},\n  async onLoad(client: NexusClient) {\n    // Register hooks or initialize integrations here.\n    // client.hooks.on('commandExecuted', payload => {});\n    client.logger.info('Plugin ${name} loaded');\n  },\n};\n\nexport default plugin;\n`;
  return `"""Forgecord plugin: ${name}."""\nfrom ..core.PluginManager import ForgecordPlugin\n\nasync def on_load(client) -> None:\n    # Register hooks or initialize integrations here.\n    client.logger.info("Plugin ${name} loaded")\n\nplugin = ForgecordPlugin(name=${quotePy(name)}, on_load=on_load)\n`;
}
async function runAddGenerator(clack, kind, args, chalk) {
  const cwd = process.cwd();
  const languageArg = args.find(x => /^--lang=/.test(x));
  let lang = languageArg ? LANG_ALIASES[languageArg.slice(7).toLowerCase()] : null;
  if (!lang) {
    if (fs.existsSync(path.join(cwd, 'bot.js'))) lang = 'js';
    else if (fs.existsSync(path.join(cwd, 'bot.ts'))) lang = 'ts';
    else if (fs.existsSync(path.join(cwd, 'bot.py'))) lang = 'py';
  }
  if (!lang) {
    const choices = Object.entries(LANGUAGES).map(([value, info]) => ({ value, label: info.label }));
    lang = await clack.select({ message: 'Project language', options: choices, initialValue: 'js' });
    if (clack.isCancel(lang)) return clack.cancel('Cancelled.');
  }
  const root = path.resolve(cwd, lang);
  // If run inside an already generated project, use its own source root.
  const isGeneratedProject = fs.existsSync(path.join(cwd, 'src', 'Commands')) && (fs.existsSync(path.join(cwd, 'package.json')) || fs.existsSync(path.join(cwd, 'requirements.txt')));
  const actualRoot = isGeneratedProject ? cwd : root;
  if (!languageArg && isGeneratedProject && !lang) {
    if (fs.existsSync(path.join(cwd, 'requirements.txt'))) lang = 'py';
    else if (fs.existsSync(path.join(cwd, 'tsconfig.json'))) lang = 'ts';
    else lang = 'js';
  }
  const ext = { js: '.js', ts: '.ts', py: '.py' }[lang];
  const name = safeIdentifier(await promptText(clack, `${kind} name`, kind === 'event' ? 'clientReady' : kind === 'command' ? 'ping' : kind === 'plugin' ? 'myPlugin' : 'myComponent'), `${kind} name`);
  let targetDir, filename, content;
  if (kind === 'command') {
    const known = discoverCategories(actualRoot);
    const descriptionInput = await promptText(clack, 'Description (optional)', 'A short description');
    const cooldownInput = await promptText(clack, 'Cooldown in minutes', '1', '1');
    const cooldownMinutes = Number(cooldownInput || 1);
    if (!Number.isFinite(cooldownMinutes) || cooldownMinutes < 0 || cooldownMinutes > 1440) throw new Error('Cooldown must be between 0 and 1440 minutes.');
    const category = await promptCategory(clack, known);
    const commandEnabled = await promptBoolean(clack, 'Enable prefix/message command?', true);
    const slashEnabled = await promptBoolean(clack, 'Enable slash command?', true);
    content = commandTemplate(lang, { name, description: descriptionInput || `Command ${name}`, cooldownMinutes, category, commandEnabled, slashEnabled });
    const categoryDir = slug(category);
    targetDir = path.join(actualRoot, 'src', 'Commands', categoryDir);
    filename = `${slug(name)}${ext}`;
  } else if (kind === 'event') {
    const target = await promptEventTarget(clack, actualRoot);
    const once = await promptBoolean(clack, 'Run only once?', false);
    content = eventTemplate(lang, { name, target, once });
    targetDir = path.join(actualRoot, 'src', 'events', slug(target));
    filename = `${slug(name)}${ext}`;
  } else if (kind === 'component') {
    const enabled = await promptBoolean(clack, 'Enable this component handler?', true);
    content = componentTemplate(lang, name, enabled);
    targetDir = path.join(actualRoot, 'src', 'ComponentsAction', 'public');
    filename = `${slug(name)}${ext}`;
  } else {
    content = pluginTemplate(lang, name);
    targetDir = path.join(actualRoot, 'src', 'plugins');
    filename = `${slug(name)}${ext}`;
  }
  fs.mkdirSync(targetDir, { recursive: true });
  const output = path.join(targetDir, filename);
  if (fs.existsSync(output)) {
    const overwrite = await promptBoolean(clack, `${path.relative(actualRoot, output)} exists. Overwrite?`, false);
    if (!overwrite) return clack.cancel('No files changed.');
  }
  fs.writeFileSync(output, content, 'utf8');
  clack.outro(chalk.green(`Created ${path.relative(actualRoot, output)}`));
}
async function runDoctor(clack, args) {
  const cwd = process.cwd();
  const checks = [];
  const lang = args.find(x => /^--lang=/.test(x))?.slice(7);
  const roots = lang && LANG_ALIASES[lang] ? [path.join(cwd, LANG_ALIASES[lang])] : ['.', 'js', 'ts', 'py'].map(x => path.join(cwd, x));
  for (const root of roots) {
    if (!fs.existsSync(root)) continue;
    const label = path.relative(cwd, root) || '.';
    const isJs = fs.existsSync(path.join(root, 'package.json'));
    const isPy = fs.existsSync(path.join(root, 'requirements.txt'));
    if (!isJs && !isPy) continue;
    checks.push(`${label}: project detected (${isJs ? 'Node.js' : 'Python'})`);
    const env = path.join(root, '.env');
    checks.push(`${label}: ${fs.existsSync(env) ? '.env exists (verify TOKEN manually)' : 'WARNING: .env is missing'}`);
    const entry = ['bot.js', 'bot.ts', 'bot.py'].find(x => fs.existsSync(path.join(root, x)));
    checks.push(`${label}: ${entry ? `entry point ${entry} found` : 'WARNING: no standard bot entry point found'}`);
    checks.push(`${label}: ${fs.existsSync(path.join(root, 'src', 'Commands')) ? 'commands directory found' : 'WARNING: src/Commands is missing'}`);
  }
  if (!checks.length) checks.push('No Forgecord project found in this directory. Run this command from a project folder or pass --lang=js|ts|py.');
  clack.note(checks.join('\n'), 'Forgecord Doctor');
  clack.outro('Doctor checks completed. This is a configuration check, not a live Discord/API test.');
}

module.exports = { commandTemplate, eventTemplate, componentTemplate, pluginTemplate, safeIdentifier, slug, runAddGenerator, runDoctor };
