import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Ticket, PlusCircle, Users, BarChart2,
  ChevronDown, Menu, X, LogOut, Zap, AlertTriangle,
  Tag, Shield, ClipboardList, ListOrdered, UsersRound,
} from 'lucide-react'
import { cn } from '@/utils'
import { useAuth } from '@/features/auth'
import { Avatar } from '@/components/ui/Avatar'
import { RoleBadge } from '@/components/ui/Badge'
import { NotificationBell, useSSENotifications } from '@/features/notifications'

const NAV_ITEMS = {
  user: [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'My Tickets', path: '/tickets',   icon: Ticket },
    { label: 'New Ticket', path: '/tickets/create', icon: PlusCircle },
  ],
  support_agent: [
    { label: 'Dashboard',      path: '/dashboard',          icon: LayoutDashboard },
    { label: 'My Tickets',     path: '/tickets',             icon: Ticket },
    { label: 'Open Queue',     path: '/tickets/queue',       icon: ListOrdered },
    { label: 'Escalated',      path: '/tickets/escalated',  icon: AlertTriangle }
  ],
  team_lead: [
    { label: 'Dashboard',        path: '/dashboard',            icon: LayoutDashboard },
    { label: 'All Tickets',      path: '/tickets',              icon: Ticket },
    { label: 'Team Tickets',     path: '/tickets/team',         icon: UsersRound },
    { label: 'Unassigned',       path: '/tickets/unassigned',   icon: ClipboardList },
    { label: 'Escalated',        path: '/tickets/escalated',    icon: AlertTriangle },
    { label: 'Analytics',        path: '/analytics',            icon: BarChart2 },
  ],
  admin: [
    { label: 'Dashboard',     path: '/dashboard',         icon: LayoutDashboard },
    { label: 'All Tickets',   path: '/tickets',           icon: Ticket },
    { label: 'Escalated',     path: '/tickets/escalated', icon: AlertTriangle },
    { label: 'Teams',         path: '/teams',             icon: UsersRound },
    { label: 'SLA Config',    path: '/sla-config',        icon: Shield },
    { label: 'Keyword Rules', path: '/keyword-rules',     icon: Tag },
    { label: 'Analytics',     path: '/analytics',         icon: BarChart2 },
  ],
}

function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const location = useLocation()
  const navigate  = useNavigate()
  const { user, logout } = useAuth()
  const role     = user?.role || 'user'
  const navItems = NAV_ITEMS[role] || NAV_ITEMS.user

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={onClose} />
      )}
      <aside className={cn(
        'fixed top-0 left-0 z-40 h-screen w-64 bg-white border-r border-gray-200 flex flex-col transition-transform duration-200',
        'lg:translate-x-0 lg:static lg:z-auto',
        open ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-gray-900 text-lg tracking-tight">Ticketing Genie</span>
          </div>
          <button onClick={onClose} className="lg:hidden text-gray-400 hover:text-gray-600 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          <p className="px-3 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Menu</p>
          {navItems.map((item) => {
            const Icon   = item.icon
            const active = location.pathname === item.path ||
              (item.path !== '/dashboard' && location.pathname.startsWith(item.path))
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={cn('sidebar-link', active && 'active')}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-gray-100 p-4">
          {user && (
            <div className="flex items-center gap-3 mb-3">
              <Avatar name={user.email} size="md" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{user.email}</p>
                <RoleBadge role={user.role} className="mt-0.5" />
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  )
}

function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const { user } = useAuth()
  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-20">
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
      >
        <Menu className="w-5 h-5" />
      </button>
      <div className="flex-1" />
      <div className="flex items-center gap-2">
        <NotificationBell />
        {user && (
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 cursor-pointer">
            <Avatar name={user.email} size="sm" />
            <span className="hidden sm:block text-sm font-medium text-gray-700 max-w-[140px] truncate">
              {user.email}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
          </div>
        )}
      </div>
    </header>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  useSSENotifications()   // open SSE connection for the session
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}