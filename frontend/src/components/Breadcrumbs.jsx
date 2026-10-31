import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

export default function Breadcrumbs() {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter(x => x);

  // Don't show breadcrumbs on home/dashboard
  if (pathnames.length === 0 || location.pathname === '/dashboard') {
    return null;
  }

  // Friendly names for routes
  const routeNames = {
    'my-space': 'My Space',
    'ai-insights': 'AI Insights',
    'patient-monitor': 'Patient Monitor',
    'care-guide': 'Care Guide',
    'continuity-bridge': 'Continuity Bridge',
    'memory-vault': 'Memory Vault'
  };

  return (
    <nav className="flex items-center space-x-2 text-base text-[var(--text-600)] mb-6 font-medium" aria-label="Breadcrumb">
      <Link 
        to="/" 
        className="flex items-center space-x-1.5 hover:text-aura-forest transition-colors text-base"
        aria-label="Home"
      >
        <Home className="w-5 h-5" />
        <span>Home</span>
      </Link>
      
      {pathnames.map((name, idx) => {
        const path = `/${pathnames.slice(0, idx + 1).join('/')}`;
        const isLast = idx === pathnames.length - 1;
        const displayName = routeNames[name] || name.replace(/-/g, ' ').replace(/^\w/, c => c.toUpperCase());

        return (
          <div key={path} className="flex items-center space-x-2">
            <ChevronRight className="w-5 h-5 text-[var(--text-400)]" aria-hidden="true" />
            {isLast ? (
              <span className="text-[var(--text-900)] font-semibold text-base" aria-current="page">
                {displayName}
              </span>
            ) : (
              <Link 
                to={path} 
                className="hover:text-aura-forest transition-colors text-base"
              >
                {displayName}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}
