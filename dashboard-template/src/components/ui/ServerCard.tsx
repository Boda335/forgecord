import type { DiscordServer } from '../../types';
import { Icon } from '../Icon';

export function ServerCard({ server }: { server: DiscordServer }) {
  const icon = server.icon ? `https://cdn.discordapp.com/icons/${server.id}/${server.icon}.png?size=128` : null;
  return <button className="server-card-new">
    <div className="server-card-icon">{icon ? <img src={icon} alt="" loading="lazy" /> : <span>{server.name.slice(0,1).toUpperCase()}</span>}</div>
    <div className="server-card-copy"><strong>{server.name}</strong><span>{server.owner ? 'Owner' : 'Member'} <i /> Discord server</span></div>
    <span className="server-card-arrow"><Icon name="chevron" size={16} /></span>
  </button>;
}
