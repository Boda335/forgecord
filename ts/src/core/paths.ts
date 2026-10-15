import path from 'path';

const candidateRoot = path.resolve(__dirname, '..', '..');
const isBuilt = path.basename(candidateRoot) === 'dist';
export const ROOT_DIR = isBuilt ? path.resolve(candidateRoot, '..') : candidateRoot;
export const RUNTIME_SRC_DIR = isBuilt ? path.join(ROOT_DIR, 'dist', 'src') : path.join(ROOT_DIR, 'src');

export const COMMANDS_DIR = path.join(RUNTIME_SRC_DIR, 'Commands');
export const EVENTS_DIR = path.join(RUNTIME_SRC_DIR, 'events');
export const COMPONENTS_DIR = path.join(RUNTIME_SRC_DIR, 'ComponentsAction');
export const FUNCTIONS_DIR = path.join(RUNTIME_SRC_DIR, 'functions');
export const PLUGINS_DIR = path.join(RUNTIME_SRC_DIR, 'plugins');
export const ERRORS_DIR = path.join(ROOT_DIR, 'errors');
