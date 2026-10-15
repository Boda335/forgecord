import { Icon } from '../components/Icon';
import { navigate } from '../router';

export function NotFoundPage() {
  return (
    <div className="site-shell centered-page">
      <section className="state-card">
        <div className="empty-icon"><Icon name="globe" size={22} /></div>
        <span className="eyebrow">404</span>
        <strong>Page not found</strong>
        <span>The page you requested does not exist.</span>
        <button className="button button-primary" onClick={() => navigate('/')}>Back home</button>
      </section>
    </div>
  );
}
