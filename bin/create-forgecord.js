
'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

let chalk;
let gradient;
let forgecordGradient;

const TEMPLATES_ROOT = path.join(__dirname, '..');
const PROJECT_VERSION = require(path.join(TEMPLATES_ROOT, 'package.json')).version;

const LANGUAGES = {
  js: {
    key: 'js',
    label: 'JavaScript',
    hint: 'discord.js — plain JS, zero build step',
  },
  ts: {
    key: 'ts',
    label: 'TypeScript',
    hint: 'discord.js — fully typed, tsc/tsx',
  },
  py: {
    key: 'py',
    label: 'Python',
    hint: 'discord.py — async, typed with dataclasses',
  },
};

const LANG_ALIASES = {
  js: 'js',
  javascript: 'js',
  ts: 'ts',
  typescript: 'ts',
  py: 'py',
  python: 'py',
};

const DEFAULT_MAIN_FILES = {
  js: 'bot.js',
  ts: 'bot.ts',
  py: 'bot.py',
};

const MAIN_FILE_EXTENSIONS = {
  js: '.js',
  ts: '.ts',
  py: '.py',
};

const DATABASE_TYPES = {
  json: 'JSON',
  sqlite: 'Sqlite',
  sqlite3: 'Sqlite',
  mongodb: 'MONGODB',
  mysql: 'MySQL',
};

const {
  commandTemplate,
  eventTemplate,
  componentTemplate,
  pluginTemplate,
  safeIdentifier,
  slug,
  runAddGenerator,
  runDoctor,
} = require('./lib/generators');

const BANNER_LINES = [
  ' ______ ____  _____   _____ ______ _____ ____  _____  _____  ',
  '|  ____/ __ \\|  __ \\ / ____|  ____/ ____/ __ \\|  __ \\|  __ \\ ',
  '| |__ | |  | | |__) | |  __| |__ | |   | |  | | |__) | |  | |',
  '|  __|| |  | |  _  /| | |_ |  __|| |   | |  | |  _  /| |  | |',
  '| |   | |__| | | \\ \\| |__| | |___| |___| |__| | | \\ \\| |__| |',
  '|_|    \\____/|_|  \\_\\\\_____|______\\_____\\____/|_|  \\_\\_____/ ',
];

function printBanner() {
  console.log(forgecordGradient.multiline(BANNER_LINES.join('\n')));
  console.log(
    chalk.dim(
      '  Scaffold a Discord bot in JavaScript, TypeScript, or Python.\n',
    ),
  );
}

// --- CLI flags -------------------------------------------------------------

function parseArgs(argv) {
  const flags = {
    yes: false,
    lang: null,
    database: null,
    dashboard: null,
    noGit: false,
    noInstall: false,
    dir: null,
    entry: null,
  };

  for (const arg of argv) {
    if (arg === '--yes' || arg === '-y') {
      flags.yes = true;
    } else if (arg === '--dashboard') {
      flags.dashboard = true;
    } else if (arg === '--no-dashboard') {
      flags.dashboard = false;
    } else if (arg === '--no-git') {
      flags.noGit = true;
    } else if (arg === '--no-install') {
      flags.noInstall = true;
    } else if (arg.startsWith('--lang=')) {
      flags.lang = arg.slice('--lang='.length).toLowerCase();
    } else if (arg.startsWith('--database=')) {
      flags.database = arg.slice('--database='.length).toLowerCase();
    } else if (arg.startsWith('--entry=')) {
      flags.entry = arg.slice('--entry='.length);
    } else if (!arg.startsWith('-') && !flags.dir) {
      flags.dir = arg;
    }
  }

  return flags;
}

/**
 * Recursively copies src into dest, creating directories as needed.
 * Skips files whose basenames appear in filesToSkip.
 */
function copyDir(src, dest, filesToSkip = new Set()) {
  fs.mkdirSync(dest, { recursive: true });

  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (filesToSkip.has(entry.name)) continue;

    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath, filesToSkip);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function normalizeMainFileName(input, langKey) {
  const extension = MAIN_FILE_EXTENSIONS[langKey];
  let fileName = String(input || '').trim() || DEFAULT_MAIN_FILES[langKey];

  if (
    fileName.includes('/') ||
    fileName.includes('\\') ||
    fileName === '.' ||
    fileName === '..'
  ) {
    throw new Error('Enter a file name only, without a directory path.');
  }

  if (!/^[A-Za-z0-9_-]+(?:\.[A-Za-z0-9_-]+)*$/.test(fileName)) {
    throw new Error(
      'Use only letters, numbers, dots, underscores, and hyphens in the main file name.',
    );
  }

  const providedExtension = path.extname(fileName).toLowerCase();

  if (!providedExtension) {
    fileName += extension;
  } else if (providedExtension !== extension) {
    throw new Error(
      `The ${LANGUAGES[langKey].label} main file must end with "${extension}".`,
    );
  }

  return fileName;
}

/**
 * Renames the language template entry point and updates runtime/build references.
 */
function configureMainFile(targetDir, langKey, mainFileName) {
  const defaultMainFile = DEFAULT_MAIN_FILES[langKey];
  const defaultPath = path.join(targetDir, defaultMainFile);
  const selectedPath = path.join(targetDir, mainFileName);

  if (!fs.existsSync(defaultPath)) {
    throw new Error(`Template entry file was not found: ${defaultMainFile}`);
  }

  if (mainFileName !== defaultMainFile) {
    if (fs.existsSync(selectedPath)) {
      fs.rmSync(selectedPath, { force: true });
    }

    fs.renameSync(defaultPath, selectedPath);
  }

  const replaceInFile = (relativePath, replacements) => {
    const fullPath = path.join(targetDir, relativePath);

    if (!fs.existsSync(fullPath)) return;

    let content = fs.readFileSync(fullPath, 'utf8');

    for (const [from, to] of replacements) {
      content = content.replaceAll(from, to);
    }

    fs.writeFileSync(fullPath, content);
  };

  if (langKey === 'js') {
    replaceInFile('Dockerfile', [['bot.js', mainFileName]]);
    replaceInFile('README.md', [['bot.js', mainFileName]]);
    return;
  }

  if (langKey === 'ts') {
    const compiledName = `${path.parse(mainFileName).name}.js`;

    replaceInFile('Dockerfile', [
      ['dist/bot.js', `dist/${compiledName}`],
    ]);

    replaceInFile('README.md', [
      ['dist/bot.js', `dist/${compiledName}`],
      ['bot.ts', mainFileName],
    ]);

    const tsconfigPath = path.join(targetDir, 'tsconfig.json');

    if (fs.existsSync(tsconfigPath)) {
      const tsconfig = JSON.parse(
        fs.readFileSync(tsconfigPath, 'utf8'),
      );

      tsconfig.include = (tsconfig.include || []).map(item =>
        item === 'bot.ts' ? mainFileName : item,
      );

      fs.writeFileSync(
        tsconfigPath,
        `${JSON.stringify(tsconfig, null, 2)}\n`,
      );
    }

    return;
  }

  // Python's convenience runner and Docker entry point must use the renamed file.
  replaceInFile('Dockerfile', [['bot.py', mainFileName]]);
  replaceInFile('dev.py', [["'bot.py'", `'${mainFileName}'`]]);
  replaceInFile('README.md', [['bot.py', mainFileName]]);
}

function dirHasFiles(dir) {
  return fs.existsSync(dir) && fs.readdirSync(dir).length > 0;
}

/**
 * Builds the complete Forgecord environment file.
 */
function buildEnvContent(answers) {
  const bannerComment = BANNER_LINES.map(line => `# ${line}`).join('\n');

  return `# ====================================================================================
${bannerComment}
#
#  Forgecord Environment Configuration
# ====================================================================================

# Your Discord Bot Token
TOKEN=${answers.token || ''}

# Command prefix for your bot (e.g., !, $, ?)
PREFIX=${answers.prefix || '!'}

# Client ID of your bot (found in Discord Developer Portal)
ID=CLIENT_ID

# Comma-separated Discord user IDs allowed to use owner-only commands
OWNER_IDS=
SLASH_GUILD_IDS=

# Optional public links; blank values disable personal defaults
SUPPORT_SERVER_URL=
DEVELOPER_URL=
DEVELOPER_LABEL=Bot Developer
DEVELOPER_TEAM_LABEL=Development Team
STORE_URL=

# Optional encryption key; only set this if your application uses encrypted storage
REMEMBER_ENCRYPTION_KEY=

# Environment mode (development or production)
NODE_ENV=development
FORGECORD_VERSION=${PROJECT_VERSION}

# Logtail configuration (optional)
LOGTAIL_ENABLE=false

# Logtail source token (if LOGTAIL_ENABLE is true)
LOGTAIL_SOURCE_TOKEN=

# Logtail ingestion host (if LOGTAIL_ENABLE is true)
LOGTAIL_INGESTION_HOST=

# Forgecord Dashboard
DASHBOARD_ENABLED=${answers.wantsDashboard ? 'true' : 'false'}
DASHBOARD_PORT=3000
DASHBOARD_HOST=0.0.0.0
DASHBOARD_URL=
DASHBOARD_REDIRECT_URI=
DASHBOARD_COOKIE_SECURE=false
DISCORD_CLIENT_SECRET=
DASHBOARD_AUTO_BUILD=true
`;
}

function buildJsPackageJson({
  dirName,
  isTs,
  wantsDashboard,
  mainFileName,
}) {
  const dependencies = {
    'discord.js': '^14.21.0',
    chalk: '^4.1.2',
    'ascii-table': '^0.0.9',
    boxen: '^5.1.2',
    'gradient-string': '^2.0.2',
    dotenv: '^16.6.1',
    winston: '^3.17.0',
    'winston-daily-rotate-file': '^5.0.0',
    systeminformation: '^5.27.7',
    '@logtail/winston': '^0.5.4',
    '@logtail/node': '^0.5.4',
    express: '^4.21.2',
    ms: '^2.1.3',
    concurrently: '^9.1.2',
    'good.db': '^2.5.0',
  };

  if (!isTs) {
    dependencies['module-alias'] = '^2.2.3';
  }

  const compiledName = `${path.parse(mainFileName).name}.js`;

  const pkg = {
    name: dirName,
    version: '1.0.0',
    forgecordVersion: PROJECT_VERSION,
    description: `A Forgecord Discord bot${isTs ? ' (TypeScript)' : ''}`,
    main: isTs ? `dist/${compiledName}` : mainFileName,
    scripts: isTs
      ? {
          dev: `tsx watch ${mainFileName}`,
          build: 'tsc -p tsconfig.json',
          start: `node dist/${compiledName}`,
          test: 'vitest run',
        }
      : {
          start: `node ${mainFileName}`,
          test: 'vitest run',
        },
    engines: {
      node: '>=20.19.0',
    },
    dependencies,
  };

  if (!isTs) {
    pkg._moduleAliases = {
      '@base': 'src/Base',
      '@src': 'src',
      '@functions': 'src/functions',
      '@events': 'src/events',
      '@handlers': 'src/handlers',
      '@settings': 'settings',
      '@database': 'data',
    };
  }

  if (isTs) {
    pkg.devDependencies = {
      '@types/express': '^5.0.3',
      '@types/ms': '^2.1.0',
      typescript: '^5.8.3',
      tsx: '^4.19.4',
      '@types/node': '^22.15.30',
      '@types/gradient-string': '^1.1.6',
      vitest: '^2.1.9',
    };
  } else {
    pkg.devDependencies = {
      vitest: '^2.1.9',
    };
  }

  if (wantsDashboard) {
    pkg.scripts = {
      ...pkg.scripts,
      'dashboard:dev': 'npm --prefix dashboard run dev',
      'dashboard:build': 'npm --prefix dashboard run build',
      'dev:all':
        'npm run dashboard:build && concurrently -k "' +
        (isTs ? 'npm run dev' : 'npm start') +
        '" "npm run dashboard:dev"',
    };
  }

  return pkg;
}

function buildRequirementsTxt(_databaseType, wantsDashboard = false) {
  const lines = [
    'discord.py',
    'kivodb[mongodb,mysql]',
    'aiohttp',
    'rich',
    'python-dotenv',
    'logtail-python',
  ];

  if (wantsDashboard) {
    lines.push('fastapi', 'uvicorn[standard]');
  }

  return `${lines.join('\n')}\n`;
}

function buildDockerCompose(databaseType) {
  const services = {
    MONGODB: `    depends_on:
      - mongo
  mongo:
    image: mongo:7
    restart: unless-stopped
    volumes:
      - mongo-data:/data/db

volumes:
  mongo-data:
`,
    MYSQL: `    depends_on:
      - mysql
  mysql:
    image: mysql:8
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: change-this-root-password
      MYSQL_USER: forgecord
      MYSQL_PASSWORD: forgecord
      MYSQL_DATABASE: forgecord
    volumes:
      - mysql-data:/var/lib/mysql

volumes:
  mysql-data:
`,
  };

  const common = `services:
  bot:
    build: .
    restart: unless-stopped
    env_file:
      - .env
`;

  return common + (services[String(databaseType).toUpperCase()] || '');
}

function tryGitInit(targetDir, clack) {
  const gitCheck = spawnSync('git', ['--version'], {
    stdio: 'ignore',
  });

  if (gitCheck.status !== 0) {
    clack.log.warn(
      'git not found — skipping git init. Run `git init` yourself later if you want version control.',
    );
    return;
  }

  const init = spawnSync('git', ['init'], {
    cwd: targetDir,
    stdio: 'ignore',
  });

  if (init.status !== 0) return;

  spawnSync('git', ['add', '.'], {
    cwd: targetDir,
    stdio: 'ignore',
  });

  spawnSync('git', ['commit', '-m', 'Initial commit from forgecord'], {
    cwd: targetDir,
    stdio: 'ignore',
    env: {
      ...process.env,
      GIT_AUTHOR_NAME: process.env.GIT_AUTHOR_NAME || 'Forgecord',
      GIT_AUTHOR_EMAIL:
        process.env.GIT_AUTHOR_EMAIL || 'forgecord@example.com',
      GIT_COMMITTER_NAME: process.env.GIT_COMMITTER_NAME || 'Forgecord',
      GIT_COMMITTER_EMAIL:
        process.env.GIT_COMMITTER_EMAIL || 'forgecord@example.com',
    },
  });

  clack.log.success(
    'Initialized a git repository with an initial commit.',
  );
}

/**
 * Runs installation behind a spinner instead of printing npm/pip progress.
 */
function installDependencies(langChoice, targetDir, clack, wantsDashboard) {
  const spinner = clack.spinner();
  spinner.start('Installing packages');

  let result;

  if (langChoice.key === 'py') {
    const venvResult = spawnSync(
      'python3',
      ['-m', 'venv', 'venv'],
      {
        cwd: targetDir,
        stdio: 'pipe',
      },
    );

    if (venvResult.status !== 0) {
      spinner.error(
        'Could not create a virtualenv (is python3 installed?) — skipping dependency install.',
      );
      return false;
    }

    const pipBin =
      process.platform === 'win32'
        ? path.join('venv', 'Scripts', 'pip')
        : path.join('venv', 'bin', 'pip');

    result = spawnSync(
      pipBin,
      ['install', '-r', 'requirements.txt'],
      {
        cwd: targetDir,
        stdio: 'pipe',
      },
    );
  } else {
    result = spawnSync(
      'npm',
      ['install', '--no-audit', '--no-fund'],
      {
        cwd: targetDir,
        stdio: 'pipe',
        shell: process.platform === 'win32',
      },
    );
  }

  if (!result || result.status !== 0) {
    spinner.error(
      'Error installing packages — you can run the install command yourself later.',
    );

    const output =
      result && (result.stderr?.toString() || result.stdout?.toString());

    if (output) {
      process.stderr.write(`${chalk.dim(output.trim())}\n`);
    }

    return false;
  }

  if (wantsDashboard) {
    spinner.message('Installing dashboard packages');

    result = spawnSync(
      'npm',
      ['install', '--no-audit', '--no-fund'],
      {
        cwd: path.join(targetDir, 'dashboard'),
        stdio: 'pipe',
        shell: process.platform === 'win32',
      },
    );

    if (!result || result.status !== 0) {
      spinner.error(
        'Dashboard packages failed to install — run `cd dashboard && npm install` later.',
      );

      const output =
        result && (result.stderr?.toString() || result.stdout?.toString());

      if (output) {
        process.stderr.write(`${chalk.dim(output.trim())}\n`);
      }

      return false;
    }
  }

  spinner.stop('Packages installed');
  return true;
}

function printSummary(
  clack,
  langChoice,
  targetArg,
  installed,
  databaseType,
  wantsDashboard,
  mainFileName,
) {
  const runCmd = {
    js: 'npm start',
    ts: 'npm run dev',
    py:
      process.platform === 'win32'
        ? `venv\\Scripts\\python ${mainFileName}`
        : `venv/bin/python ${mainFileName}`,
  }[langChoice.key];

  const installCmd = {
    js: 'npm install',
    ts: 'npm install',
    py:
      process.platform === 'win32'
        ? 'python -m venv venv && venv\\Scripts\\pip install -r requirements.txt'
        : 'python -m venv venv && venv/bin/pip install -r requirements.txt',
  }[langChoice.key];

  const configFile =
    langChoice.key === 'py'
      ? 'settings/config.py'
      : `settings/config.${langChoice.key}`;

  const lines = [
    `${chalk.cyan('cd')} ${targetArg}`,
    ...(installed
      ? []
      : [
          `${chalk.cyan(installCmd)}  ${chalk.dim('install dependencies')}`,
        ]),
    `${chalk.cyan(runCmd)}  ${chalk.dim('start your bot')}`,
    ...(wantsDashboard
      ? langChoice.key === 'py'
        ? [
            `${chalk.cyan('python dev.py')}  ${chalk.dim('start bot + dashboard together')}`,
          ]
        : [
            `${chalk.cyan('npm run dev:all')}  ${chalk.dim('start bot + dashboard together')}`,
            `${chalk.cyan('npm run dashboard:build')}  ${chalk.dim('build the dashboard for production')}`,
          ]
      : []),
    '',
    `Edit ${chalk.yellow('.env')} with your bot token and other app secrets`,
    `Database driver: ${chalk.yellow(databaseType)}`,
    `Adjust ${chalk.yellow(configFile)} for embed colors, links, owners`,
    `Or run with Docker: ${chalk.cyan('docker compose up --build')}`,
  ];

  clack.note(lines.join('\n'), 'Next steps');
  clack.outro(chalk.green('Happy hacking! 🎉'));
}

function printHelp(isBareInvocation = false) {
  const title = chalk.bold.cyan('Forgecord CLI');

  console.log(`\n${title}`);

  if (isBareInvocation) {
    console.log(chalk.white('\nWelcome to Forgecord!'));
    console.log(
      `Run ${chalk.cyan('forgecord --help')} or ${chalk.cyan('forgecord -h')} to see available commands.`,
    );
    console.log(
      `Run ${chalk.cyan('forgecord <project-name>')} to create a new bot.\n`,
    );
    return;
  }

  console.log(
    chalk.dim(
      'Create and manage Discord bot projects in JavaScript, TypeScript, or Python.\n',
    ),
  );

  console.log(chalk.bold('Usage'));
  console.log('  forgecord [project-name] [options]');
  console.log(
    '  forgecord add <command|event|plugin|component> [--lang=js|ts|py]',
  );
  console.log('  forgecord doctor [--lang=js|ts|py]');
  console.log('  forgecord --help | -h | -help\n');

  console.log(chalk.bold('Commands'));
  console.log('  add command       Generate a command handler');
  console.log('  add event         Generate an event handler');
  console.log('  add plugin        Generate a plugin');
  console.log('  add component     Generate a component handler');
  console.log('  doctor            Check a Forgecord project configuration\n');

  console.log(chalk.bold('Project options'));
  console.log('  --lang=<language>       js, ts, typescript, py, python');
  console.log('  --database=<driver>     JSON, Sqlite, MONGODB, MySQL');
  console.log('  --dashboard             Include the dashboard');
  console.log('  --no-dashboard          Skip the dashboard');
  console.log('  --entry=<filename>      Set the main entry filename');
  console.log('  --yes, -y               Use defaults without prompts');
  console.log('  --no-git                Do not initialize a Git repository');
  console.log('  --no-install            Do not install dependencies\n');

  console.log(chalk.dim('Examples'));
  console.log('  npx forgecord');
  console.log('  npx forgecord my-bot --lang=js --database=JSON');
  console.log('  forgecord add command --lang=ts');
  console.log('  forgecord doctor');
  console.log('  forgecord --help\n');
}

/**
 * Minimal colors for the help screens, so help works without loading
 * dependencies or requiring an interactive terminal.
 */
function setupPlainChalk() {
  const identity = value => value;

  chalk = {
    bold: Object.assign(identity, {
      cyan: identity,
    }),
    cyan: identity,
    white: identity,
    dim: identity,
    yellow: identity,
    red: identity,
    green: identity,
  };
}

/**
 * CLI entry point.
 *
 * Behavior:
 * - `forgecord` with no arguments: show the welcome message.
 * - `npx forgecord` with no arguments: start the interactive project setup.
 * - Explicit help flags: show the full help page.
 * - Other arguments: run the corresponding command or generator.
 */
async function main() {
  const rawArgs = process.argv.slice(2);
  const subcommand = rawArgs[0];

  const helpFlags = new Set([
    '-h',
    '--help',
    '-help',
    'help',
  ]);

  const helpRequested = rawArgs.some(arg => helpFlags.has(arg));

  // Explicit help always displays the full help page.
  if (helpRequested) {
    setupPlainChalk();
    printHelp(false);
    return;
  }

  // For an interactive `npx forgecord` invocation, continue into setup.
  // For a directly invoked executable named `forgecord` with no arguments,
  // show the short welcome screen.
  //
  // npm_execpath is set by npm/npx, allowing us to distinguish the invocation.
  const invokedThroughNpm =
    Boolean(process.env.npm_execpath) ||
    Boolean(process.env.npm_command);

  if (rawArgs.length === 0 && !invokedThroughNpm) {
    setupPlainChalk();
    printHelp(true);
    return;
  }

  const chalkModule = await import('chalk');
  chalk = chalkModule.default || chalkModule;

  const clack = await import('@clack/prompts');

  const gradientModule = await import('gradient-string');
  gradient = gradientModule.default || gradientModule;

  forgecordGradient = gradient(['#4b6cb7', '#182848']);

  if (subcommand === 'add') {
    const kind = rawArgs[1];

    if (!['command', 'event', 'plugin', 'component'].includes(kind)) {
      throw new Error(
        'Usage: forgecord add <command|event|plugin|component> [--lang=js|ts|py]',
      );
    }

    await runAddGenerator(clack, kind, rawArgs.slice(2), chalk);
    return;
  }

  if (subcommand === 'doctor') {
    await runDoctor(clack, rawArgs.slice(1));
    return;
  }

  const flags = parseArgs(rawArgs);

  // An interactive flow requires a real TTY. In CI or piped environments,
  // proceed with defaults instead of waiting for interactive input.
  if (!flags.yes && !process.stdin.isTTY) {
    console.log(
      chalk.yellow(
        'Non-interactive terminal detected — proceeding with --yes defaults.',
      ),
    );

    console.log(
      chalk.dim(
        'Pass a directory, --lang, --database, --entry, --no-git, and --no-install for scripted runs.\n',
      ),
    );

    flags.yes = true;
  }

  printBanner();

  clack.intro(chalk.bgCyan.black(' forgecord '));

  // --- language ------------------------------------------------------------

  let langKey =
    flags.lang && LANG_ALIASES[flags.lang]
      ? LANG_ALIASES[flags.lang]
      : null;

  if (!langKey && flags.yes) {
    langKey = 'js';
  }

  if (!langKey) {
    const picked = await clack.select({
      message: 'Which language do you want to use?',
      options: Object.values(LANGUAGES).map(language => ({
        value: language.key,
        label: language.label,
        hint: language.hint,
      })),
    });

    if (clack.isCancel(picked)) {
      clack.cancel('Cancelled — nothing was written.');
      return;
    }

    langKey = picked;
  }

  const langChoice = LANGUAGES[langKey];

  // --- target directory ----------------------------------------------------

  let targetArg = flags.dir;

  if (!targetArg && !flags.yes) {
    const answer = await clack.text({
      message: 'Project directory',
      placeholder: '. (current directory)',
    });

    if (clack.isCancel(answer)) {
      clack.cancel('Cancelled — nothing was written.');
      return;
    }

    targetArg = answer.trim() || '.';
  }

  if (!targetArg) {
    targetArg = flags.yes ? 'my-forgecord-bot' : '.';
  }

  // --- main file -----------------------------------------------------------

  let requestedMainFile = flags.entry || DEFAULT_MAIN_FILES[langKey];

  if (!flags.yes && !flags.entry) {
    const entryAnswer = await clack.text({
      message: 'Main file name',
      placeholder: DEFAULT_MAIN_FILES[langKey],
      initialValue: DEFAULT_MAIN_FILES[langKey],

      validate(value) {
        try {
          normalizeMainFileName(value, langKey);
          return undefined;
        } catch (error) {
          return error.message;
        }
      },
    });

    if (clack.isCancel(entryAnswer)) {
      clack.cancel('Cancelled — nothing was written.');
      return;
    }

    requestedMainFile = entryAnswer;
  }

  const mainFileName = normalizeMainFileName(
    requestedMainFile,
    langKey,
  );

  const targetDir = path.resolve(process.cwd(), targetArg);

  if (targetArg !== '.' && dirHasFiles(targetDir)) {
    if (flags.yes) {
      console.log(
        chalk.red(
          `\n"${targetArg}" already exists and isn't empty — refusing to overwrite in --yes mode.`,
        ),
      );
      return;
    }

    const overwrite = await clack.confirm({
      message: `"${targetArg}" already exists and isn't empty. Overwrite files inside it?`,
      initialValue: false,
    });

    if (clack.isCancel(overwrite) || !overwrite) {
      clack.cancel('Aborted — nothing was written.');
      return;
    }
  }

  // --- optional questions --------------------------------------------------

  const selectedDatabaseType = flags.database
    ? DATABASE_TYPES[flags.database]
    : null;

  if (flags.database && !selectedDatabaseType) {
    throw new Error(
      `Unsupported database type "${flags.database}". Choose JSON, Sqlite, MONGODB, or MySQL.`,
    );
  }

  const answers = {
    token: '',
    prefix: '',
    databaseType: selectedDatabaseType || 'JSON',
    wantsDashboard: flags.dashboard === true,
  };

  if (flags.dashboard === null && !flags.yes) {
    const dashboard = await clack.confirm({
      message: 'Include a Forgecord Dashboard?',
      initialValue: true,
    });

    if (clack.isCancel(dashboard)) {
      clack.cancel('Cancelled — nothing was written.');
      return;
    }

    answers.wantsDashboard = dashboard;
  }

  let shouldInstall = !flags.noInstall;

  if (!flags.yes && !flags.database) {
    const databaseType = await clack.select({
      message: 'Which database driver do you want to use?',
      options: [
        {
          value: 'JSON',
          label: 'JSON file',
          hint: 'local file; no external service required',
        },
        {
          value: 'Sqlite',
          label: 'SQLite',
          hint: 'local database file; no external service required',
        },
        {
          value: 'MONGODB',
          label: 'MongoDB',
          hint: 'remote/document database',
        },
        {
          value: 'MySQL',
          label: 'MySQL',
          hint: 'remote relational database',
        },
      ],
      initialValue: 'JSON',
    });

    if (clack.isCancel(databaseType)) {
      clack.cancel('Cancelled — nothing was written.');
      return;
    }

    answers.databaseType = databaseType;

    clack.log.step(
      `A few optional questions. The bot token and app settings go in .env; database settings live in ${mainFileName}.`,
    );

    const token = await clack.text({
      message: 'Bot Token',
      placeholder: 'skip for now',
    });

    if (clack.isCancel(token)) {
      clack.cancel('Cancelled — nothing was written.');
      return;
    }

    answers.token = token;

    const prefix = await clack.text({
      message: 'Command Prefix',
      placeholder: '!',
    });

    if (clack.isCancel(prefix)) {
      clack.cancel('Cancelled — nothing was written.');
      return;
    }

    answers.prefix = prefix;

    const install = await clack.confirm({
      message: 'Install dependencies now?',
      initialValue: true,
    });

    if (clack.isCancel(install)) {
      clack.cancel('Cancelled — nothing was written.');
      return;
    }

    shouldInstall = install;
  }

  // --- copy template -------------------------------------------------------

  const sourceDir = path.join(TEMPLATES_ROOT, langChoice.key);

  const skip =
    langChoice.key === 'py'
      ? new Set(['requirements.txt'])
      : new Set(['package.json', 'package-lock.json']);

  copyDir(sourceDir, targetDir, skip);

  if (answers.wantsDashboard) {
    copyDir(
      path.join(TEMPLATES_ROOT, 'dashboard-template'),
      path.join(targetDir, 'dashboard'),
    );

    const backendDir = path.join(targetDir, 'src', 'dashboard');

    copyDir(
      path.join(TEMPLATES_ROOT, `dashboard-backend-${langChoice.key}`),
      backendDir,
    );
  }

  const dirName = path.basename(targetDir);

  configureMainFile(targetDir, langChoice.key, mainFileName);

  const botConfigFile = path.join(targetDir, mainFileName);
  const botSource = fs.readFileSync(botConfigFile, 'utf8');

  const selectedSource =
    langChoice.key === 'py'
      ? botSource.replace(
          /(["']database_type["']\s*:\s*)(["'])[^"']*\2(?=,\s*#\s*@forgecord-database-type)/,
          `$1"${answers.databaseType}"`,
        )
      : botSource.replace(
          /(database_type:\s*)(['"])[^'"]*\2(?=,\s*\/\/\s*@forgecord-database-type)/,
          `$1$2${answers.databaseType}$2`,
        );

  fs.writeFileSync(botConfigFile, selectedSource);

  if (langChoice.key === 'py') {
    fs.writeFileSync(
      path.join(targetDir, 'requirements.txt'),
      buildRequirementsTxt(
        answers.databaseType,
        answers.wantsDashboard,
      ),
    );
  } else {
    const pkg = buildJsPackageJson({
      dirName,
      isTs: langChoice.key === 'ts',
      wantsDashboard: answers.wantsDashboard,
      mainFileName,
    });

    fs.writeFileSync(
      path.join(targetDir, 'package.json'),
      `${JSON.stringify(pkg, null, 2)}\n`,
    );
  }

  fs.writeFileSync(
    path.join(targetDir, '.env'),
    buildEnvContent(answers),
  );

  fs.writeFileSync(
    path.join(targetDir, 'docker-compose.yml'),
    buildDockerCompose(answers.databaseType),
  );

  clack.log.success(
    `Created .env and configured ${answers.databaseType} in ${mainFileName}.`,
  );

  if (!flags.noGit) {
    tryGitInit(targetDir, clack);
  }

  let installed = false;

  if (shouldInstall) {
    installed = installDependencies(
      langChoice,
      targetDir,
      clack,
      answers.wantsDashboard,
    );
  }

  printSummary(
    clack,
    langChoice,
    targetArg,
    installed,
    answers.databaseType,
    answers.wantsDashboard,
    mainFileName,
  );
}

if (require.main === module) {
  main().catch(error => {
    console.error('forgecord failed:', error);
    process.exit(1);
  });
}

module.exports = {
  printHelp,
  parseArgs,
  commandTemplate,
  eventTemplate,
  componentTemplate,
  pluginTemplate,
  safeIdentifier,
  slug,
};
