import type { BaseEvent } from '../types/event';
export type { BaseEvent } from '../types/event';

const baseEvent: BaseEvent = {
  name: 'clientReady',
  target: 'client',
  once: false,
  execute: async () => {},
};

export default baseEvent;
