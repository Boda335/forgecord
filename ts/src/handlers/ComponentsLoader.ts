import { BaseLoader } from '../core/BaseLoader';
import { ValidationError } from '../core/errors';
import { COMPONENTS_DIR } from '../core/paths';
import type { NexusClient } from '../types/client';
import type { ComponentData } from '../Base/baseComponent';

class ComponentsLoader extends BaseLoader<ComponentData> {
  constructor(client: NexusClient) {
    super(client, {
      name: 'Interaction Handlers',
      dir: COMPONENTS_DIR,
      tableHeadings: ['File', 'Status'],
    });
  }

  validate(component: ComponentData, filePath: string): void {
    if (!component || typeof component !== 'object') {
      throw new ValidationError('Component export must be an object', { filePath });
    }
    if (!component.name || typeof component.name !== 'string') {
      throw new ValidationError('Component is missing a valid "name" string', { filePath });
    }
    if (typeof component.action !== 'function') {
      throw new ValidationError(`Component "${component.name}" is missing an action() function`, { filePath });
    }
  }

  onLoad(component: ComponentData): string[] {
    this.client.ComponentsAction.set(component.name, component);
    return [];
  }
}

export default function loadComponents(client: NexusClient) {
  return new ComponentsLoader(client).load();
}
