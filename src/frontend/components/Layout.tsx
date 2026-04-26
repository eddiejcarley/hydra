import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function SvgIcon({ d, className = 'w-[18px] h-[18px]' }: { d: string; className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  );
}

const PATHS = {
  dashboard: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
  inventory: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
  sales:     'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  fuel:      'M3 10h2l2 9h10l2-9h2M8 10V6a4 4 0 018 0v4',
  store:     'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
  settings:  'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z',
  bell:      'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9',
};

type NavSingle = { type: 'single'; label: string; to: string; icon: keyof typeof PATHS };
type NavGroup  = { type: 'group';  label: string; icon: keyof typeof PATHS; items: { to: string; label: string }[]; defaultOpen?: boolean };
type NavSection = NavSingle | NavGroup;

const SECTIONS: NavSection[] = [
  { type: 'single', label: 'Dashboard',  to: '/',              icon: 'dashboard' },
  { type: 'group',  label: 'Inventory',  icon: 'inventory', defaultOpen: true,
    items: [{ to: '/inventory', label: 'Items' }, { to: '/pos', label: 'POs' }] },
  { type: 'group',  label: 'Sales',      icon: 'sales',
    items: [{ to: '/reconciliation', label: 'Reconciliation' }] },
  { type: 'single', label: 'Fuel',       to: '/fuel',          icon: 'fuel' },
  { type: 'group',  label: 'Store Mgmt', icon: 'store', defaultOpen: true,
    items: [{ to: '/price-book', label: 'Price Book' }, { to: '/promotions', label: 'Promotions' }] },
  { type: 'single', label: 'Settings',   to: '/settings',      icon: 'settings' },
];

export default function Layout() {
  const { user, logout } = useAuth();

  const initialOpen = new Set(
    SECTIONS.filter((s): s is NavGroup => s.type === 'group' && !!s.defaultOpen).map((s) => s.label)
  );
  const [open, setOpen] = useState<Set<string>>(initialOpen);

  const toggle = (label: string) =>
    setOpen((prev) => { const n = new Set(prev); n.has(label) ? n.delete(label) : n.add(label); return n; });

  const dateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-56 bg-white border-r border-gray-200 flex flex-col shrink-0">
        {/* Brand */}
        <div className="px-4 py-4 border-b border-gray-100 flex items-center gap-2.5">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div className="leading-tight">
            <p className="text-sm font-bold text-blue-700">Hydra</p>
            <p className="text-[10px] text-gray-400">Back Office Software</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 overflow-y-auto space-y-0.5 px-2">
          {SECTIONS.map((section) => {
            if (section.type === 'single') {
              return (
                <NavLink
                  key={section.to}
                  to={section.to}
                  end={section.to === '/'}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors ${
                      isActive ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`
                  }
                >
                  <SvgIcon d={PATHS[section.icon]} />
                  {section.label}
                </NavLink>
              );
            }

            const isOpen = open.has(section.label);
            return (
              <div key={section.label}>
                <button
                  onClick={() => toggle(section.label)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-md text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                >
                  <span className="flex items-center gap-2.5">
                    <SvgIcon d={PATHS[section.icon]} />
                    {section.label}
                  </span>
                  <svg className={`w-3.5 h-3.5 transition-transform text-gray-400 ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {isOpen && (
                  <div className="ml-8 mt-0.5 space-y-0.5">
                    {section.items.map((item) => (
                      <NavLink
                        key={item.label}
                        to={item.to}
                        className={({ isActive }) =>
                          `block px-3 py-1.5 text-[13px] rounded-md transition-colors ${
                            isActive ? 'text-blue-700 font-medium bg-blue-50' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                          }`
                        }
                      >
                        {item.label}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* User */}
        <div className="px-4 py-3 border-t border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
              {user?.username?.[0]?.toUpperCase() ?? 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-gray-800 truncate">{user?.username}</p>
              <p className="text-[10px] text-gray-400 capitalize">{user?.role?.toLowerCase()}</p>
            </div>
          </div>
          <button onClick={logout} className="text-xs text-gray-400 hover:text-red-500 transition-colors">
            Sign out
          </button>
        </div>
      </aside>

      {/* Right panel */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0">
          <div>
            <p className="text-sm font-semibold text-gray-900">{user?.store?.name ?? 'Hydra Back Office'}</p>
            <p className="text-[11px] text-gray-400">{dateStr}</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-1.5 rounded-full hover:bg-gray-100 transition-colors text-gray-500">
              <SvgIcon d={PATHS.bell} className="w-5 h-5" />
            </button>
            <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
              {user?.username?.[0]?.toUpperCase() ?? 'U'}
            </div>
            <div className="pl-1">
              <p className="text-[11px] font-medium text-gray-700 capitalize">{user?.role?.toLowerCase()}</p>
              <p className="text-[10px] text-gray-400">{user?.username}</p>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
