'use client'

import { useEffect, useState } from 'react'
import { supabase, formatDolar, formatFecha, type Alumno, type SaldoAlumno } from '../lib/supabase'
import { useSearchParams } from 'next/navigation'

type Movimiento = {
  fecha: string
  concepto: string
  debito: number
  credito: number
  saldo_acumulado: number
}

export default function ReportesPage() {
  const searchParams = useSearchParams()
  const alumnoParam = searchParams.get('alumno')

  const [alumnos, setAlumnos] = useState<Alumno[]>([])
  const [alumnoId, setAlumnoId] = useState(alumnoParam || '')
  const [desde, setDesde] = useState(() => {
    const d = new Date(); d.setDate(1)
    return d.toISOString().split('T')[0]
  })
  const [hasta, setHasta] = useState(() => new Date().toISOString().split('T')[0])
  const [movimientos, setMovimientos] = useState<Movimiento[]>([])
  const [alumnoInfo, setAlumnoInfo] = useState<SaldoAlumno | null>(null)
  const [loading, setLoading] = useState(false)
  const [generado, setGenerado] = useState(false)

  useEffect(() => {
    supabase.from('alumnos').select('*').eq('activo', true).order('nombre')
      .then(({ data }) => { if (data) setAlumnos(data) })
  }, [])

  async function generarReporte() {
    if (!alumnoId) { alert('Seleccioná un alumno'); return }
    setLoading(true)
    setGenerado(false)

    const [{ data: saldoData }, { data: consumosData }, { data: pagosData }] = await Promise.all([
      supabase.from('saldos').select('*').eq('id', alumnoId).single(),
      supabase.from('consumos').select('*').eq('alumno_id', alumnoId).gte('fecha', desde).lte('fecha', hasta).order('fecha'),
      supabase.from('pagos').select('*').eq('alumno_id', alumnoId).gte('fecha', desde).lte('fecha', hasta).order('fecha'),
    ])

    if (saldoData) setAlumnoInfo(saldoData)

    // Unificar y ordenar movimientos
    const todos = [
      ...(consumosData || []).map((c: any) => ({
        fecha: c.fecha,
        concepto: c.ausente ? '🏠 Inasistencia (sin cobro)' : `🍱 ${c.tipo_menu}`,
        debito: c.ausente ? 0 : c.monto_cobrado,
        credito: 0,
        _ts: new Date(c.fecha).getTime(),
      })),
      ...(pagosData || []).map((p: any) => ({
        fecha: p.fecha.split('T')[0],
        concepto: '💳 Recarga de saldo',
        debito: 0,
        credito: p.monto,
        _ts: new Date(p.fecha).getTime(),
      })),
    ].sort((a, b) => a._ts - b._ts)

    // Calcular saldo acumulado progresivo
    let saldo = 0
    const conSaldo: Movimiento[] = todos.map(m => {
      saldo += m.credito - m.debito
      return { fecha: m.fecha, concepto: m.concepto, debito: m.debito, credito: m.credito, saldo_acumulado: saldo }
    })

    setMovimientos(conSaldo)
    setLoading(false)
    setGenerado(true)
  }

  function imprimirPDF() {
    window.print()
  }

  const alumnoSeleccionado = alumnos.find(a => a.id === alumnoId)

  return (
    <div className="p-8 animate-in">
      <h1 className="font-display font-black text-3xl tracking-tight mb-2">Reportes PDF</h1>
      <p className="text-black/50 mb-8">Generá estados de cuenta para enviar a los padres</p>

      {/* Filtros */}
      <div className="card mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-xs font-bold text-black/50 uppercase tracking-wide mb-2">Alumno</label>
            <select className="input" value={alumnoId} onChange={e => { setAlumnoId(e.target.value); setGenerado(false) }}>
              <option value="">— Seleccioná —</option>
              {alumnos.map(a => <option key={a.id} value={a.id}>{a.nombre} — {a.grado}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-black/50 uppercase tracking-wide mb-2">Desde</label>
            <input type="date" className="input" value={desde} onChange={e => { setDesde(e.target.value); setGenerado(false) }} />
          </div>
          <div>
            <label className="block text-xs font-bold text-black/50 uppercase tracking-wide mb-2">Hasta</label>
            <input type="date" className="input" value={hasta} onChange={e => { setHasta(e.target.value); setGenerado(false) }} />
          </div>
        </div>
        <div className="flex gap-3">
          <button className="btn-primary" onClick={generarReporte} disabled={loading}>
            {loading ? '⏳ Generando...' : '📊 Generar reporte'}
          </button>
          {generado && (
            <button className="btn-outline" onClick={imprimirPDF}>🖨️ Imprimir / Guardar PDF</button>
          )}
        </div>
      </div>

      {/* Reporte generado */}
      {generado && alumnoInfo && (
        <div className="card" id="reporte-pdf">
          {/* Header del reporte */}
          <div className="flex items-start justify-between mb-6 pb-6 border-b border-black/10">
            <div>
              <h2 className="font-display font-black text-2xl mb-1">{alumnoInfo.nombre}</h2>
              <p className="text-black/50">{alumnoInfo.grado}</p>
              <p className="text-black/40 text-sm mt-1">
                Período: {formatFecha(desde)} al {formatFecha(hasta)}
              </p>
            </div>
            <div className="text-right">
              <div className="font-display font-black text-3xl">{formatDolar(alumnoInfo.saldo_actual)}</div>
              <div className="text-black/40 text-sm">Saldo actual</div>
            </div>
          </div>

          {/* Tabla de movimientos */}
          {movimientos.length === 0 ? (
            <p className="text-center text-black/30 py-8">Sin movimientos en este período</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-brand-cream">
                    <th className="text-left px-4 py-3 font-bold text-black/50 text-xs uppercase tracking-wide rounded-l-xl">Fecha</th>
                    <th className="text-left px-4 py-3 font-bold text-black/50 text-xs uppercase tracking-wide">Concepto</th>
                    <th className="text-right px-4 py-3 font-bold text-black/50 text-xs uppercase tracking-wide">Débito</th>
                    <th className="text-right px-4 py-3 font-bold text-black/50 text-xs uppercase tracking-wide">Crédito</th>
                    <th className="text-right px-4 py-3 font-bold text-black/50 text-xs uppercase tracking-wide rounded-r-xl">Saldo</th>
                  </tr>
                </thead>
                <tbody>
                  {movimientos.map((m, i) => (
                    <tr key={i} className={`border-b border-black/5 ${i % 2 === 0 ? '' : 'bg-black/1'}`}>
                      <td className="px-4 py-3 text-black/50">{formatFecha(m.fecha)}</td>
                      <td className="px-4 py-3">{m.concepto}</td>
                      <td className="px-4 py-3 text-right text-semaforo-red font-semibold">
                        {m.debito > 0 ? `-${formatDolar(m.debito)}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-right text-semaforo-green font-semibold">
                        {m.credito > 0 ? `+${formatDolar(m.credito)}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-right font-bold">{formatDolar(m.saldo_acumulado)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-semaforo-green-light">
                    <td colSpan={4} className="px-4 py-3 font-display font-bold">SALDO FINAL DEL PERÍODO</td>
                    <td className="px-4 py-3 text-right font-display font-black text-lg text-semaforo-green">
                      {movimientos.length > 0 ? formatDolar(movimientos[movimientos.length - 1].saldo_acumulado) : formatDolar(0)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
