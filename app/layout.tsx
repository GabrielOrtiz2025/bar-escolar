'use client'

import './globals.css'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import clsx from 'clsx'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/alumnos', label: 'Alumnos', icon: '👧' },
  { href: '/pase-lista', label: 'Pase de Lista', icon: '✅' },
  { href: '/pagos', label: 'Pagos', icon: '💳' },
  { href: '/reportes', label: 'Reportes', icon: '📄' },
  { href: '/precios', label: 'Precios', icon: '💲' },
]

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <div className="flex min-h-screen">
          {/* Sidebar */}
          <aside className="w-56 bg-[#0d0d0d] flex flex-col fixed inset-y-0 left-0 z-50">
            {/* Logo */}
            <div className="px-5 py-6 border-b border-white/10">
              <span className="font-display font-black text-xl text-white tracking-tight">
                Bar<span className="text-[#e85d2f]">Escolar</span>
              </span>
            </div>

            {/* Nav links */}
            <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
              {navItems.map((item) => (
                <NavItem key={item.href} {...item} />
              ))}
            </nav>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-white/10">
              <p className="text-white/30 text-xs">Sistema de gestión</p>
            </div>
          </aside>

          {/* Main content */}
          <main className="flex-1 ml-56 min-h-screen bg-[#f5f0e8]">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}

function NavItem({ href, label, icon }: { href: string; label: string; icon: string }) {
  const pathname = usePathname()
  const isActive = pathname === href || pathname.startsWith(href + '/')

  return (
    <Link
      href={href}
      className={clsx(
        'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150',
        isActive
          ? 'bg-[#e85d2f]/20 text-[#e85d2f] font-semibold'
          : 'text-white/50 hover:text-white hover:bg-white/8'
      )}
    >
      <span className="text-base">{icon}</span>
      <span className="font-sans">{label}</span>
    </Link>
  )
}
