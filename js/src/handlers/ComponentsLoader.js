'use strict';
const BaseLoader = require('../core/BaseLoader');
const { ValidationError } = require('../core/errors');
const { COMPONENTS_DIR } = require('../core/paths');

class ComponentsLoader extends BaseLoader {
  constructor(client) {
    super(client, {
      name: 'Interaction Handlers',
      dir: COMPONENTS_DIR,
      tableHeadings: ['File', 'Status'],
    });
  }

  validate(component, filePath) {
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

  onLoad(component, filePath) {
    this.client.ComponentsAction.set(component.name, component);
    return [];
  }
}

/**
 * @param {import('./Nexus')} client
 */
module.exports = client => new ComponentsLoader(client).load();
