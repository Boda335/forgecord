import path from 'path';
import { BaseLoader } from '../core/BaseLoader';
import { ValidationError } from '../core/errors';
import { FUNCTIONS_DIR } from '../core/paths';
import type { NexusClient } from '../types/client';
import type { AnyFunction } from '../types/function';

class FunctionsLoader extends BaseLoader<AnyFunction> {
  constructor(client: NexusClient) {
    super(client, {
      name: 'Functions',
      dir: FUNCTIONS_DIR,
      tableHeadings: ['Function File', 'Status'],
    });
  }

  validate(fn: AnyFunction, filePath: string): void {
    if (typeof fn !== 'function') {
      throw new ValidationError('Function file must export a function', { filePath });
    }
  }

  onLoad(fn: AnyFunction, filePath: string): string[] {
    this.client.functions.set(path.basename(filePath).replace(/\.(ts|js)$/, ''), fn);
    return [];
  }
}

export default function loadFunctions(client: NexusClient) {
  return new FunctionsLoader(client).load();
}
