'use client'
import { useEffect, useState } from 'react'
import { supabase, formatUSD, type SaldoAlumno } from '../lib/supabase'
import Link from 'next/link'

type Resumen = {
  efectivo: number
  transferencia: number
  total: number
  consumos: number
}

export default function Dashboard() {
  const [alumnos, setAlumnos] = useState<SaldoAlumno[]>([])
  const [hoy, setHoy] = useState<Resumen>({ efectivo: 0, transferencia: 0, total: 0, consumos: 0 })
  const [semana, setSemana] = useState<Resumen>({ efectivo: 0, transferencia: 0, total: 0, consumos: 0 })
  const [mes, setMes] = useState<Resumen>({ efectivo: 0, transferencia: 0, total: 0, consumos: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function cargar() {
      const ahora = new Date()
      const todayStr = ahora.toISOString().split('T')[0]

      // Inicio de semana (lunes)
      const diaSemana = ahora.getDay() || 7
      const lunes = new Date(ahora)
      lunes.setDate(ahora.getDate() - diaSemana + 1)
      const lunesStr = lunes.toISOString().split('T')[0]

      // Inicio de mes
      const inicioMes = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}-01`

      const [{ data: saldosData }, { data: consumosData }, { data: pagosData }] = await Promise.all([
        supabase.from('saldos').select('*').eq('activo', true),
        supabase.from('consumos').select('*').gte('fecha', inicioMes),
        supabase.from('pagos').select('*').gte('fecha', inicioMes),
      ])

      if (saldosData) setAlumnos(saldosData)

      const calcularResumen = (desde: string, hasta: string): Resumen => {
        const c = (consumosData || []).filter((x: any) => x.fecha >= desde && x.fecha <= hasta)
        const p = (pagosData || []).filter((x: any) => x.fecha.split('T')[0] >= desde && x.fecha.split('T')[0] <= hasta)
        const ef = p.filter((x: any) => x.metodo === 'efectivo').reduce((s: number, x: any) => s + x.monto, 0)
        const tr = p.filter((x: any) => x.metodo === 'transferencia').reduce((s: number, x: any) => s + x.monto, 0)
        return { efectivo: ef, transferencia: tr, total: ef + tr, consumos: c.length }
      }

      setHoy(calcularResumen(todayStr, todayStr))
      setSemana(calcularResumen(lunesStr, todayStr))
      setMes(calcularResumen(inicioMes, todayStr))
      setLoading(false)
    }
    cargar()
  }, [])

  const sinCredito = alumnos.filter(a => a.saldo_actual <= 0)
  const saldoBajo = alumnos.filter(a => a.saldo_actual > 0 && a.saldo_actual < 10)

  if (loading) return <Loading />

  const fechaHoy = new Date().toLocaleDateString('es-EC', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="p-8 fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-1" style={{ fontFamily: 'Syne' }}>Panel de Control</h1>
        <p className="text-gray-500 capitalize">{fechaHoy}</p>
      </div>

      {/* Alertas urgentes */}
      {sinCredito.length > 0 && (
        <div className="bg-[#fdecea] border-l-4 border-[#c0392b] rounded-2xl p-4 mb-4 flex gap-3">
          <span className="text-2xl">🔴</span>
          <div>
            <p className="font-bold text-[#c0392b]">Sin crédito — No registrar consumo</p>
            <p className="text-[#c0392b]/80 text-sm mt-0.5">{sinCredito.map(a => `${a.nombre} ${a.apellido}`).join(' · ')}</p>
          </div>
        </div>
      )}
      {saldoBajo.length > 0 && (
        <div className="bg-[#fef8e7] border-l-4 border-[#d4920a] rounded-2xl p-4 mb-6 flex gap-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <p className="font-bold text-[#d4920a]">Saldo bajo — Avisar a los padres</p>
            <p className="text-[#d4920a]/80 text-sm mt-0.5">{saldoBajo.map(a => `${a.nombre} ${a.apellido}`).join(' · ')}</p>
          </div>
        </div>
      )}

      {/* Acciones rápidas */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <Link href="/consumos">
          <div className="card border-2 border-transparent hover:border-[#2d8a4e] hover:bg-[#e8f5ec] cursor-pointer transition-all group">
            <div className="text-4xl mb-3">🍱</div>
            <div className="font-bold text-lg">Registrar Consumo</div>
            <div className="text-gray-500 text-sm mt-1">Buscar alumno y registrar qué comió hoy</div>
          </div>
        </Link>
        <Link href="/pagos/nuevo">
          <div className="card border-2 border-transparent hover:border-[#2563eb] hover:bg-[#eff6ff] cursor-pointer transition-all">
            <div className="text-4xl mb-3">💳</div>
            <div className="font-bold text-lg">Registrar Pago</div>
            <div className="text-gray-500 text-sm mt-1">Acreditar saldo en efectivo o transferencia</div>
          </div>
        </Link>
      </div>

      {/* Ingresos */}
      <h2 className="font-bold text-lg mb-4" style={{ fontFamily: 'Syne' }}>Ingresos por cobros</h2>
      <div className="grid grid-cols-3 gap-4 mb-8">
        <IngresoCard titulo="Hoy" data={hoy} />
        <IngresoCard titulo="Esta semana" data={semana} />
        <IngresoCard titulo="Este mes" data={mes} />
      </div>

      {/* Semáforo alumnos */}
      <h2 className="font-bold text-lg mb-4" style={{ fontFamily: 'Syne' }}>Estado de saldos</h2>
      <div className="grid grid-cols-3 gap-4">
        <div className="card text-center border-2 border-[#2d8a4e]">
          <div className="text-3xl font-bold text-[#2d8a4e]">{alumnos.filter(a => a.saldo_actual > 10).length}</div>
          <div className="text-sm text-gray-500 mt-1">🟢 Saldo OK</div>
        </div>
        <div className="card text-center border-2 border-[#d4920a]">
          <div className="text-3xl font-bold text-[#d4920a]">{saldoBajo.length}</div>
          <div className="text-sm text-gray-500 mt-1">🟡 Saldo bajo</div>
        </div>
        <div className="card text-center border-2 border-[#c0392b]">
          <div className="text-3xl font-bold text-[#c0392b]">{sinCredito.length}</div>
          <div className="text-sm text-gray-500 mt-1">🔴 Sin crédito</div>
        </div>
      </div>
    </div>
  )
}

function IngresoCard({ titulo, data }: { titulo: string; data: Resumen }) {
  return (
    <div className="card">
      <div className="font-bold text-sm text-gray-500 mb-3 uppercase tracking-wide">{titulo}</div>
      <div className="font-bold text-2xl mb-3">{formatUSD(data.total)}</div>
      <div className="flex flex-col gap-1.5 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500">💵 Efectivo</span>
          <span className="font-semibold text-[#2d8a4e]">{formatUSD(data.efectivo)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">🏦 Transferencia</span>
          <span className="font-semibold text-[#2563eb]">{formatUSD(data.transferencia)}</span>
        </div>
        <div className="flex justify-between border-t border-gray-100 pt-1.5 mt-0.5">
          <span className="text-gray-500">🍱 Consumos</span>
          <span className="font-semibold">{data.consumos}</span>
        </div>
      </div>
    </div>
  )
}

function Loading() {
  return <div className="flex items-center justify-center h-screen"><p className="font-bold text-xl animate-pulse">Cargando...</p></div>
}
