import type { ComponentData } from '../types/component';
export type { ComponentData } from '../types/component';

const baseComponent: ComponentData = {
  name: '',
  enabled: true,
  botPermissions: [],
  userPermissions: [],
  action: async () => {},
};

export default baseComponent;
