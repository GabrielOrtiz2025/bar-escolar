'use client'
import './globals.css'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const nav = [
  { href: '/dashboard', icon: '📊', label: 'Inicio' },
  { href: '/consumos', icon: '🍱', label: 'Registrar Consumo' },
  { href: '/alumnos', icon: '👧', label: 'Alumnos' },
  { href: '/pagos/nuevo', icon: '💳', label: 'Registrar Pago' },
  { href: '/reportes', icon: '📄', label: 'Reportes' },
  { href: '/productos', icon: '🛒', label: 'Productos' },
]

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="flex min-h-screen">
        <aside className="w-52 bg-[#111] flex flex-col fixed inset-y-0 left-0 z-50 shadow-xl">
          <div className="px-5 py-5 border-b border-white/10">
            <div className="font-bold text-white text-lg" style={{ fontFamily: 'Syne, sans-serif' }}>
              Bar<span className="text-[#e85d2f]">Escolar</span>
            </div>
            <div className="text-white/30 text-xs mt-0.5">
              {new Date().toLocaleDateString('es-EC', { weekday: 'long', day: 'numeric', month: 'short' })}
            </div>
          </div>
          <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
            {nav.map(item => <NavLink key={item.href} {...item} />)}
          </nav>
          <div className="px-5 py-3 border-t border-white/10">
            <p className="text-white/20 text-xs">v2.0</p>
          </div>
        </aside>
        <main className="flex-1 ml-52 min-h-screen bg-[#f4f1eb]">
          {children}
        </main>
      </body>
    </html>
  )
}

function NavLink({ href, icon, label }: { href: string; icon: string; label: string }) {
  const path = usePathname()
  const active = path === href || path.startsWith(href + '/')
  return (
    <Link href={href} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all
      ${active ? 'bg-[#e85d2f]/20 text-[#e85d2f] font-semibold' : 'text-white/50 hover:text-white hover:bg-white/5'}`}>
      <span>{icon}</span><span>{label}</span>
    </Link>
  )
}
