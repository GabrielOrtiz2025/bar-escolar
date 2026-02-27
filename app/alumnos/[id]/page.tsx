'use client'
import { useEffect, useState } from 'react'
import { supabase, formatUSD, formatFecha, type SaldoAlumno, type Consumo, type Pago } from '../../lib/supabase'
import Link from 'next/link'
import { useParams } from 'next/navigation'

export default function AlumnoDetail() {
  const { id } = useParams()
  const [alumno, setAlumno] = useState<SaldoAlumno | null>(null)
  const [consumos, setConsumos] = useState<Consumo[]>([])
  const [pagos, setPagos] = useState<Pago[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function cargar() {
      const [{ data: a }, { data: c }, { data: p }] = await Promise.all([
        supabase.from('saldos').select('*').eq('id', id).single(),
        supabase.from('consumos').select('*').eq('alumno_id', id).order('fecha', { ascending: false }).limit(50),
        supabase.from('pagos').select('*').eq('alumno_id', id).order('fecha', { ascending: false }).limit(50),
      ])
      if (a) setAlumno(a)
      if (c) setConsumos(c)
      if (p) setPagos(p)
      setLoading(false)
    }
    cargar()
  }, [id])

  if (loading) return <div className="flex items-center justify-center h-64"><p className="font-bold animate-pulse">Cargando...</p></div>
  if (!alumno) return <div className="p-6"><p>Alumno no encontrado</p></div>

  const semaforoColor = alumno.saldo_actual <= 0 ? 'border-[#c0392b] bg-[#fdecea]' : alumno.saldo_actual < 10 ? 'border-[#d4920a] bg-[#fef8e7]' : 'border-[#2d8a4e] bg-[#e8f5ec]'
  const semaforoText = alumno.saldo_actual <= 0 ? 'text-[#c0392b]' : alumno.saldo_actual < 10 ? 'text-[#d4920a]' : 'text-[#2d8a4e]'

  const historial = [
    ...consumos.map(c => ({ fecha: c.fecha, tipo: 'consumo' as const, detalle: c.producto_nombre, monto: c.monto, extra: '' })),
    ...pagos.map(p => ({ fecha: p.fecha.split('T')[0], tipo: 'pago' as const, detalle: p.metodo === 'efectivo' ? '💵 Efectivo' : '🏦 Transferencia', monto: p.monto, extra: p.numero_comprobante || '' })),
  ].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())

  return (
    <div className="p-6 fade-in">
      <Link href="/alumnos" className="text-gray-400 text-sm hover:text-black mb-5 inline-block">← Volver a alumnos</Link>

      {/* Ficha */}
      <div className={`card border-2 ${semaforoColor} mb-5`}>
        <div className="flex items-start gap-5">
          <div className="w-16 h-16 rounded-2xl bg-white/60 flex items-center justify-center text-3xl font-bold text-gray-600 flex-shrink-0">
            {alumno.nombre[0]}
          </div>
          <div className="flex-1">
            <h1 className="font-bold text-2xl">{alumno.nombre} {alumno.apellido}</h1>
            <p className="text-gray-500 text-sm">{alumno.nivel}° {alumno.paralelo} · Pago {alumno.modalidad_pago}</p>
            {alumno.alergias && <p className="text-orange-500 text-sm mt-1">⚠️ Alergia: {alumno.alergias}</p>}
            {alumno.requiere_factura && <span className="badge-blue text-xs mt-1 inline-block">🧾 Requiere factura</span>}
          </div>
          <div className="text-right flex-shrink-0">
            <div className={`font-bold text-3xl ${semaforoText}`}>{formatUSD(alumno.saldo_actual)}</div>
            <div className="text-gray-400 text-xs mt-1">Saldo disponible</div>
          </div>
        </div>

        {/* Representante */}
        {(alumno.representante_nombre || alumno.representante_telefono) && (
          <div className="mt-4 pt-4 border-t border-black/10 flex gap-6 text-sm">
            {alumno.representante_nombre && (
              <div><span className="text-gray-400">Representante: </span><strong>{alumno.representante_nombre}</strong></div>
            )}
            {alumno.representante_telefono && (
              <a href={`tel:${alumno.representante_telefono}`} className="text-[#2563eb] font-semibold hover:underline">
                📞 {alumno.representante_telefono}
              </a>
            )}
          </div>
        )}
      </div>

      {/* Acciones */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <Link href={`/pagos/nuevo?alumno=${id}`}>
          <button className="btn-green py-3 px-5">💳 Recargar saldo</button>
        </Link>
        <Link href={`/reportes?alumno=${id}`}>
          <button className="btn-outline py-3 px-5">📄 Ver reporte PDF</button>
        </Link>
        <Link href="/consumos">
          <button className="btn-outline py-3 px-5">🍱 Registrar consumo</button>
        </Link>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="card text-center">
          <div className="font-bold text-xl text-[#2d8a4e]">{formatUSD(alumno.total_pagado)}</div>
          <div className="text-xs text-gray-400 mt-1">Total acreditado</div>
        </div>
        <div className="card text-center">
          <div className="font-bold text-xl text-[#c0392b]">{formatUSD(alumno.total_consumido)}</div>
          <div className="text-xs text-gray-400 mt-1">Total consumido</div>
        </div>
      </div>

      {/* Historial */}
      <h2 className="font-bold mb-3">Historial de movimientos</h2>
      <div className="card p-0 overflow-hidden">
        {historial.length === 0 && <p className="text-gray-400 text-center py-8">Sin movimientos aún</p>}
        {historial.map((item, i) => (
          <div key={i} className={`flex items-center gap-4 px-5 py-3.5 ${i < historial.length - 1 ? 'border-b border-gray-100' : ''}`}>
            <span className="text-xl">{item.tipo === 'pago' ? '💳' : '🍱'}</span>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm">{item.tipo === 'pago' ? 'Recarga — ' + item.detalle : item.detalle}</div>
              <div className="text-gray-400 text-xs">{formatFecha(item.fecha)}{item.extra ? ' · #' + item.extra : ''}</div>
            </div>
            <div className={`font-bold ${item.tipo === 'pago' ? 'text-[#2d8a4e]' : 'text-[#c0392b]'}`}>
              {item.tipo === 'pago' ? '+' : '-'}{formatUSD(item.monto)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
