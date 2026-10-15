import { Icon, type IconName } from '../Icon';

export function StatCard({ icon, label, value, detail, tone = 'violet' }: {
  icon: IconName; label: string; value: string | number; detail: string; tone?: 'violet'|'green'|'blue';
}) {
  return <article className="stat-card">
    <div className={`stat-icon ${tone}`}><Icon name={icon} size={18} /></div>
    <div className="stat-copy"><span>{label}</span><strong>{value}</strong><small>{detail}</small></div>
  </article>;
}
