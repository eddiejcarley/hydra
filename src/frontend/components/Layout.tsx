import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV = [
  { to: '/', label: 'Dashboard', icon: '▦' },
  { to: '/price-book', label: 'Price Book', icon: '◈' },
  { to: '/inventory', label: 'Inventory', icon: '⊟' },
  { to: '/fuel', label: 'Fuel', icon: '⬡' },
  { to: '/promotions', label: 'Promotions', icon: '◇' },
  { to: '/reconciliation', label: 'Reconciliation', icon: '⊞' },
  { to: '/pos', label: 'POS Import', icon: '↑' },
];

export default function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-56 bg-gray-900 text-white flex flex-col">
        <div className="px-5 py-4 border-b border-gray-700">
          <h1 className="text-lg font-bold tracking-wide text-white">Hydra</h1>
          <p className="text-xs text-gray-400 truncate">{user?.store?.name ?? user?.storeId}</p>
        </div>

        <nav className="flex-1 py-4 overflow-y-auto">
          {NAV.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-5 py-2.5 text-sm transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`
              }
            >
              <span className="text-base w-5 text-center">{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="px-5 py-4 border-t border-gray-700">
          <p className="text-xs text-gray-400 mb-2">{user?.username} · {user?.role}</p>
          <button
            onClick={logout}
            className="w-full text-left text-xs text-gray-400 hover:text-white transition-colors"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
