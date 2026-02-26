'use client'

import { useEffect, useState } from 'react'
import { supabase, getSemaforo, formatDolar, type SaldoAlumno, type Precio } from '../lib/supabase'
import Link from 'next/link'

export default function DashboardPage() {
  const [saldos, setSaldos] = useState<SaldoAlumno[]>([])
  const [precioActual, setPrecioActual] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [hoy] = useState(new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' }))

  useEffect(() => {
    async function cargarDatos() {
      // Cargar saldos
      const { data: saldosData } = await supabase
        .from('saldos')
        .select('*')
        .eq('activo', true)
        .order('nombre')

      // Cargar precio vigente
      const { data: precioData } = await supabase
        .from('precios')
        .select('*')
        .eq('tipo_menu', 'Almuerzo')
        .is('vigente_hasta', null)
        .single()

      if (saldosData) setSaldos(saldosData)
      if (precioData) setPrecioActual(precioData.monto)
      setLoading(false)
    }
    cargarDatos()
  }, [])

  const ok = saldos.filter(s => getSemaforo(s.saldo_actual, precioActual) === 'green')
  const bajo = saldos.filter(s => getSemaforo(s.saldo_actual, precioActual) === 'yellow')
  const sinCredito = saldos.filter(s => getSemaforo(s.saldo_actual, precioActual) === 'red')

  if (loading) return <LoadingScreen />

  return (
    <div className="p-8 animate-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display font-black text-3xl tracking-tight mb-1">Buenos días 👋</h1>
        <p className="text-black/50 capitalize">{hoy} · Precio almuerzo: <strong className="text-black">{formatDolar(precioActual)}</strong></p>
      </div>

      {/* Semáforo stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total alumnos" value={saldos.length} color="blue" />
        <StatCard label="Saldo OK" value={ok.length} color="green" />
        <StatCard label="Saldo bajo" value={bajo.length} color="yellow" />
        <StatCard label="Sin crédito" value={sinCredito.length} color="red" />
      </div>

      {/* Alertas */}
      {sinCredito.length > 0 && (
        <div className="bg-semaforo-red-light border-l-4 border-semaforo-red rounded-xl p-4 mb-4 flex gap-3 items-start">
          <span className="text-xl">🔴</span>
          <div>
            <p className="font-semibold text-semaforo-red text-sm">Sin crédito — No debitar</p>
            <p className="text-semaforo-red/80 text-sm mt-0.5">
              {sinCredito.map(s => s.nombre).join(', ')}
            </p>
          </div>
        </div>
      )}
      {bajo.length > 0 && (
        <div className="bg-semaforo-yellow-light border-l-4 border-semaforo-yellow rounded-xl p-4 mb-6 flex gap-3 items-start">
          <span className="text-xl">⚠️</span>
          <div>
            <p className="font-semibold text-semaforo-yellow text-sm">Saldo bajo — Avisar a los padres</p>
            <p className="text-semaforo-yellow/80 text-sm mt-0.5">
              {bajo.map(s => s.nombre).join(', ')}
            </p>
          </div>
        </div>
      )}

      {/* Acciones rápidas */}
      <h2 className="font-display font-bold text-lg mb-4">Acciones del día</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link href="/pase-lista">
          <ActionCard icon="✅" title="Pase de Lista" desc="Marcar consumos del día" color="green" />
        </Link>
        <Link href="/pagos/nuevo">
          <ActionCard icon="💳" title="Registrar Pago" desc="Acreditar saldo a un alumno" color="blue" />
        </Link>
        <Link href="/reportes">
          <ActionCard icon="📄" title="Generar Reporte" desc="Estado de cuenta en PDF" color="orange" />
        </Link>
      </div>
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  const colors: Record<string, string> = {
    blue: 'text-blue-600',
    green: 'text-semaforo-green',
    yellow: 'text-semaforo-yellow',
    red: 'text-semaforo-red',
  }
  return (
    <div className="card text-center">
      <div className={`font-display font-black text-4xl ${colors[color]}`}>{value}</div>
      <div className="text-black/40 text-xs uppercase tracking-wide mt-1">{label}</div>
    </div>
  )
}

function ActionCard({ icon, title, desc, color }: { icon: string; title: string; desc: string; color: string }) {
  const colors: Record<string, string> = {
    green: 'hover:border-semaforo-green hover:bg-semaforo-green-light',
    blue: 'hover:border-blue-400 hover:bg-blue-50',
    orange: 'hover:border-brand-orange hover:bg-orange-50',
  }
  return (
    <div className={`card border-2 border-transparent cursor-pointer transition-all duration-200 ${colors[color]}`}>
      <div className="text-3xl mb-3">{icon}</div>
      <div className="font-display font-bold text-base">{title}</div>
      <div className="text-black/50 text-sm mt-1">{desc}</div>
    </div>
  )
}

function LoadingScreen() {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <div className="text-4xl mb-4 animate-pulse">🍱</div>
        <p className="font-display font-bold text-xl">Cargando...</p>
      </div>
    </div>
  )
}
