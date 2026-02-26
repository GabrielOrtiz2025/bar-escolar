'use client'

import { useEffect, useState } from 'react'
import { supabase, getSemaforo, formatDolar, formatFecha, type SaldoAlumno, type Consumo, type Pago } from '../../lib/supabase'
import Link from 'next/link'
import { useParams } from 'next/navigation'

export default function AlumnoDetailPage() {
  const { id } = useParams()
  const [alumno, setAlumno] = useState<SaldoAlumno | null>(null)
  const [consumos, setConsumos] = useState<Consumo[]>([])
  const [pagos, setPagos] = useState<Pago[]>([])
  const [precioMenu, setPrecioMenu] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function cargar() {
      const [{ data: a }, { data: c }, { data: p }, { data: pr }] = await Promise.all([
        supabase.from('saldos').select('*').eq('id', id).single(),
        supabase.from('consumos').select('*').eq('alumno_id', id).order('fecha', { ascending: false }).limit(30),
        supabase.from('pagos').select('*').eq('alumno_id', id).order('fecha', { ascending: false }).limit(30),
        supabase.from('precios').select('*').eq('tipo_menu', 'Almuerzo').is('vigente_hasta', null).single(),
      ])
      if (a) setAlumno(a)
      if (c) setConsumos(c)
      if (p) setPagos(p)
      if (pr) setPrecioMenu(pr.monto)
      setLoading(false)
    }
    cargar()
  }, [id])

  if (loading) return <div className="flex items-center justify-center h-64"><p className="font-display font-bold text-xl animate-pulse">Cargando...</p></div>
  if (!alumno) return <div className="p-8"><p>Alumno no encontrado</p></div>

  const semaforo = getSemaforo(alumno.saldo_actual, precioMenu)
  const semaforoLabel = { green: '🟢 Saldo OK', yellow: '🟡 Saldo bajo', red: '🔴 Sin crédito' }
  const semaforoBg = { green: 'bg-semaforo-green-light border-semaforo-green', yellow: 'bg-semaforo-yellow-light border-semaforo-yellow', red: 'bg-semaforo-red-light border-semaforo-red' }

  // Historial unificado
  const historial = [
    ...consumos.map(c => ({ fecha: c.fecha, tipo: 'consumo' as const, monto: c.monto_cobrado, detalle: c.ausente ? 'Inasistencia (sin cobro)' : c.tipo_menu, ausente: c.ausente })),
    ...pagos.map(p => ({ fecha: p.fecha.split('T')[0], tipo: 'pago' as const, monto: p.monto, detalle: 'Recarga de saldo', ausente: false })),
  ].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())

  return (
    <div className="p-8 animate-in">
      <Link href="/alumnos" className="text-black/40 text-sm hover:text-black mb-6 inline-block">← Volver a alumnos</Link>

      {/* Header del alumno */}
      <div className={`card border-2 ${semaforoBg[semaforo]} mb-6`}>
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-white/60 flex items-center justify-center text-3xl">👧</div>
          <div className="flex-1">
            <h1 className="font-display font-black text-2xl">{alumno.nombre}</h1>
            <p className="text-black/50">{alumno.grado}</p>
            {alumno.alergias && <p className="text-orange-600 text-sm mt-1">⚠️ {alumno.alergias}</p>}
          </div>
          <div className="text-right">
            <div className="font-display font-black text-3xl">{formatDolar(alumno.saldo_actual)}</div>
            <div className="text-sm font-semibold mt-1">{semaforoLabel[semaforo]}</div>
          </div>
        </div>
      </div>

      {/* Acciones */}
      <div className="flex gap-3 mb-8">
        <Link href={`/pagos/nuevo?alumno=${id}`}>
          <button className="btn-green">💳 Recargar saldo</button>
        </Link>
        <Link href={`/reportes?alumno=${id}`}>
          <button className="btn-outline">📄 Generar PDF</button>
        </Link>
      </div>

      {/* Historial */}
      <h2 className="font-display font-bold text-lg mb-4">Historial reciente</h2>
      <div className="card overflow-hidden p-0">
        {historial.length === 0 && (
          <p className="text-black/40 text-center py-8">Sin movimientos aún</p>
        )}
        {historial.map((item, i) => (
          <div key={i} className={`flex items-center gap-4 px-6 py-4 ${i < historial.length - 1 ? 'border-b border-black/5' : ''} ${item.ausente ? 'bg-black/2' : ''}`}>
            <span className="text-xl">{item.tipo === 'pago' ? '💳' : item.ausente ? '🏠' : '🍱'}</span>
            <div className="flex-1">
              <div className="font-semibold text-sm">{item.detalle}</div>
              <div className="text-black/40 text-xs">{formatFecha(item.fecha)}</div>
            </div>
            <div className={`font-bold text-base ${item.tipo === 'pago' ? 'text-semaforo-green' : item.ausente ? 'text-black/30' : 'text-semaforo-red'}`}>
              {item.tipo === 'pago' ? '+' : item.ausente ? '' : '-'}{formatDolar(item.monto)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
