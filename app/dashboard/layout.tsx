'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { DEMO_MODE, DEMO_PROFILE } from '@/lib/demo-data'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import {
  LayoutDashboard,
  FileText,
  BarChart3,
  PieChart,
  Settings,
  LogOut,
  Menu,
  User,
} from 'lucide-react'

const sidebarItems = [
  { label: 'Início', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Faturas', href: '/dashboard/faturas', icon: FileText },
  { label: 'Estado', href: '/dashboard/estado', icon: BarChart3 },
  { label: 'Relatórios', href: '/dashboard/relatorios', icon: PieChart },
  { label: 'Configurações', href: '/dashboard/configuracoes', icon: Settings },
]

const topNavItems = [
  { label: 'Seu Saldo', href: '/dashboard' },
  { label: 'Faturas', href: '/dashboard/faturas' },
  { label: 'Perfil', href: '/dashboard/configuracoes' },
]

function SidebarContent({
  pathname,
  onNavigate,
}: {
  pathname: string
  onNavigate: (href: string) => void
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 flex justify-center">
        <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/20">
          <span className="text-white text-2xl font-bold italic">S</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1 mt-2">
        {sidebarItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon
          return (
            <button
              key={item.href}
              onClick={() => onNavigate(item.href)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
              }`}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </button>
          )
        })}
      </nav>

      <Separator className="bg-gray-200 mx-3" />

      {/* Bottom: Configurações duplicate */}
      <div className="p-3">
        <button
          onClick={() => onNavigate('/dashboard/configuracoes')}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-all duration-200"
        >
          <Settings className="w-5 h-5" />
          Configurações
        </button>
      </div>
    </div>
  )
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [businessName, setBusinessName] = useState('')
  const [mobileOpen, setMobileOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    async function loadProfile() {
      if (DEMO_MODE) {
        setBusinessName(DEMO_PROFILE.business_name || '')
        return
      }
      try {
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data } = await supabase
            .from('profiles')
            .select('business_name')
            .eq('id', user.id)
            .single()
          if (data?.business_name) {
            setBusinessName(data.business_name)
          }
        }
      } catch (err) {
        console.error('Failed to load profile:', err)
      }
    }
    loadProfile()
  }, [])

  const handleNavigate = (href: string) => {
    router.push(href)
    setMobileOpen(false)
  }

  const handleLogout = async () => {
    if (!DEMO_MODE) {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      await supabase.auth.signOut()
    }
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-[#f5f7fa] flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-48 lg:flex-col lg:fixed lg:inset-y-0 bg-white border-r border-gray-200">
        <SidebarContent
          pathname={pathname}
          onNavigate={handleNavigate}
        />
      </aside>

      {/* Main area */}
      <div className="flex-1 lg:pl-48 flex flex-col">
        {/* Top Navigation Bar */}
        <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 h-14">
            {/* Left: Brand name (desktop) + mobile hamburger */}
            <div className="flex items-center gap-4">
              {/* Mobile hamburger */}
              <div className="lg:hidden">
                <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                  <SheetTrigger
                    render={
                      <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-800" />
                    }
                  >
                    <Menu className="w-5 h-5" />
                  </SheetTrigger>
                  <SheetContent side="left" className="w-48 bg-white border-gray-200 p-0">
                    <SidebarContent
                      pathname={pathname}
                      onNavigate={handleNavigate}
                    />
                  </SheetContent>
                </Sheet>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm font-bold italic">S</span>
                </div>
                <span className="text-lg font-bold text-gray-900">Saldo Certo</span>
              </div>
            </div>

            {/* Center/Right: Top nav links */}
            <nav className="hidden sm:flex items-center gap-6">
              {topNavItems.map((item) => {
                const isActive = pathname === item.href
                return (
                  <button
                    key={item.href}
                    onClick={() => handleNavigate(item.href)}
                    className={`text-sm font-medium transition-colors ${
                      isActive
                        ? 'text-blue-600'
                        : 'text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    {item.label}
                  </button>
                )
              })}
              <button
                onClick={handleLogout}
                className="text-sm font-medium text-gray-500 hover:text-red-500 transition-colors"
              >
                Sair
              </button>
            </nav>

            {/* Mobile: user icon */}
            <div className="sm:hidden flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={handleLogout} className="text-gray-500">
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
