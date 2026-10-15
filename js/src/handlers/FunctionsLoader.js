'use strict';
const BaseLoader = require('../core/BaseLoader');
const { ValidationError } = require('../core/errors');
const { FUNCTIONS_DIR } = require('../core/paths');
const path = require('path');

class FunctionsLoader extends BaseLoader {
  constructor(client) {
    super(client, {
      name: 'Functions',
      dir: FUNCTIONS_DIR,
      tableHeadings: ['Function File', 'Status'],
    });
  }

  validate(fn, filePath) {
    if (typeof fn !== 'function') {
      throw new ValidationError('Function file must export a function', { filePath });
    }
  }

  onLoad(fn, filePath) {
    this.client.functions.set(path.basename(filePath, '.js'), fn);
    return [];
  }
}

/**
 * @param {import('./Nexus')} client
 */
module.exports = client => new FunctionsLoader(client).load();
