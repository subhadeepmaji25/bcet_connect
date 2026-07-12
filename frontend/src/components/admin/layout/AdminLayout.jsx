import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import {
  LayoutDashboard,
  Users,
  CheckSquare,
  ShieldAlert,
  Radio,
  FileClock,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { useState } from 'react';

const ADMIN_LINKS = [
  { path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/admin/users', label: 'User Management', icon: Users },
  { path: '/admin/approvals', label: 'Approval Center', icon: CheckSquare },
  { path: '/admin/moderation', label: 'Moderation Center', icon: ShieldAlert },
  { path: '/admin/broadcast', label: 'Broadcast', icon: Radio },
  { path: '/admin/audit-logs', label: 'Audit Logs', icon: FileClock },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:flex-shrink-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col">
          <div className="h-16 flex items-center px-6 bg-slate-950 border-b border-slate-800">
            <h1 className="text-lg font-bold text-white tracking-wide">BCET Admin</h1>
            <button 
              onClick={() => setSidebarOpen(false)}
              className="ml-auto lg:hidden text-slate-400 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
            {ADMIN_LINKS.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                className={({ isActive }) =>
                  `flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'bg-indigo-600 text-white'
                      : 'hover:bg-slate-800 hover:text-white'
                  }`
                }
              >
                <link.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="p-4 bg-slate-950 border-t border-slate-800">
            <div className="flex items-center mb-4 px-2">
              <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold mr-3 uppercase">
                {user?.username?.charAt(0) || 'A'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user?.username || 'Admin'}</p>
                <p className="text-xs text-slate-500 truncate">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex w-full items-center px-3 py-2 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-colors"
            >
              <LogOut className="mr-3 h-5 w-5" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header (Mobile mainly) */}
        <header className="bg-white shadow-sm lg:hidden">
          <div className="flex items-center h-16 px-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-slate-500 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
            >
              <span className="sr-only">Open sidebar</span>
              <Menu size={24} />
            </button>
            <h1 className="ml-4 text-lg font-bold text-slate-900">BCET Admin</h1>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 relative z-0 overflow-y-auto focus:outline-none">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
