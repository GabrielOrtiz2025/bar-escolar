'use client'
import { useEffect, useState, Suspense } from 'react'
import { supabase, formatUSD, formatFecha, type SaldoAlumno } from '../lib/supabase'
import { useSearchParams } from 'next/navigation'

export default function ReportesWrapper() {
  return <Suspense fallback={<div className="flex items-center justify-center h-64"><p className="font-bold animate-pulse">Cargando...</p></div>}><ReportesPage /></Suspense>
}

type Movimiento = { fecha: string; concepto: string; debito: number; credito: number; saldo: number }

function ReportesPage() {
  const params = useSearchParams()
  const [alumnos, setAlumnos] = useState<SaldoAlumno[]>([])
  const [alumnoId, setAlumnoId] = useState(params.get('alumno') || '')
  const [desde, setDesde] = useState(() => { const d = new Date(); d.setDate(1); return d.toISOString().split('T')[0] })
  const [hasta, setHasta] = useState(() => new Date().toISOString().split('T')[0])
  const [movimientos, setMovimientos] = useState<Movimiento[]>([])
  const [alumnoInfo, setAlumnoInfo] = useState<SaldoAlumno | null>(null)
  const [loading, setLoading] = useState(false)
  const [generado, setGenerado] = useState(false)

  useEffect(() => {
    supabase.from('saldos').select('*').eq('activo', true).order('apellido')
      .then(({ data }) => { if (data) setAlumnos(data) })
  }, [])

  async function generar() {
    if (!alumnoId) { alert('Seleccioná un alumno'); return }
    setLoading(true); setGenerado(false)
    const [{ data: a }, { data: c }, { data: p }] = await Promise.all([
      supabase.from('saldos').select('*').eq('id', alumnoId).single(),
      supabase.from('consumos').select('*').eq('alumno_id', alumnoId).gte('fecha', desde).lte('fecha', hasta).order('fecha'),
      supabase.from('pagos').select('*').eq('alumno_id', alumnoId).gte('fecha', desde).lte('fecha', hasta).order('fecha'),
    ])
    if (a) setAlumnoInfo(a)
    const todos = [
      ...(c || []).map((x: any) => ({ fecha: x.fecha, concepto: '🍱 ' + x.producto_nombre, debito: x.monto, credito: 0, _ts: new Date(x.fecha).getTime() })),
      ...(p || []).map((x: any) => ({ fecha: x.fecha.split('T')[0], concepto: x.metodo === 'efectivo' ? '💵 Pago efectivo' : '🏦 Transferencia' + (x.numero_comprobante ? ' #' + x.numero_comprobante : ''), debito: 0, credito: x.monto, _ts: new Date(x.fecha).getTime() })),
    ].sort((a, b) => a._ts - b._ts)
    let saldo = 0
    setMovimientos(todos.map(m => { saldo += m.credito - m.debito; return { fecha: m.fecha, concepto: m.concepto, debito: m.debito, credito: m.credito, saldo } }))
    setLoading(false); setGenerado(true)
  }

  const alumnoSel = alumnos.find(a => a.id === alumnoId)

  return (
    <div className="p-6 fade-in">
      <h1 className="text-2xl font-bold mb-6" style={{ fontFamily: 'Syne' }}>Reportes</h1>

      {/* Filtros */}
      <div className="card mb-5">
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>
            <label className="label">Alumno</label>
            <select className="input" value={alumnoId} onChange={e => { setAlumnoId(e.target.value); setGenerado(false) }}>
              <option value="">— Seleccioná —</option>
              {alumnos.map(a => <option key={a.id} value={a.id}>{a.nivel}° {a.paralelo} — {a.nombre} {a.apellido}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Desde</label>
            <input type="date" className="input" value={desde} onChange={e => { setDesde(e.target.value); setGenerado(false) }} />
          </div>
          <div>
            <label className="label">Hasta</label>
            <input type="date" className="input" value={hasta} onChange={e => { setHasta(e.target.value); setGenerado(false) }} />
          </div>
        </div>
        <div className="flex gap-3">
          <button className="btn-primary" onClick={generar} disabled={loading}>{loading ? '⏳ Generando...' : '📊 Generar reporte'}</button>
          {generado && <button className="btn-outline" onClick={() => window.print()}>🖨️ Imprimir / PDF</button>}
        </div>
      </div>

      {/* Reporte */}
      {generado && alumnoInfo && (
        <div className="card fade-in">
          <div className="flex items-start justify-between mb-5 pb-5 border-b border-gray-100">
            <div>
              <h2 className="font-bold text-xl">{alumnoInfo.nombre} {alumnoInfo.apellido}</h2>
              <p className="text-gray-500 text-sm">{alumnoInfo.nivel}° {alumnoInfo.paralelo}</p>
              <p className="text-gray-400 text-xs mt-1">Período: {formatFecha(desde)} al {formatFecha(hasta)}</p>
              {alumnoInfo.requiere_factura && <span className="badge-blue text-xs mt-1 inline-block">🧾 Requiere factura</span>}
            </div>
            <div className="text-right">
              <div className={`font-bold text-2xl ${alumnoInfo.saldo_actual >= 0 ? 'text-[#2d8a4e]' : 'text-[#c0392b]'}`}>{formatUSD(alumnoInfo.saldo_actual)}</div>
              <div className="text-gray-400 text-xs">Saldo actual</div>
            </div>
          </div>

          {movimientos.length === 0
            ? <p className="text-center text-gray-400 py-8">Sin movimientos en este período</p>
            : <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#f4f1eb]">
                      <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase rounded-l-xl">Fecha</th>
                      <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase">Concepto</th>
                      <th className="text-right px-4 py-3 text-xs font-bold text-gray-500 uppercase">Débito</th>
                      <th className="text-right px-4 py-3 text-xs font-bold text-gray-500 uppercase">Crédito</th>
                      <th className="text-right px-4 py-3 text-xs font-bold text-gray-500 uppercase rounded-r-xl">Saldo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movimientos.map((m, i) => (
                      <tr key={i} className="border-b border-gray-50">
                        <td className="px-4 py-3 text-gray-400">{formatFecha(m.fecha)}</td>
                        <td className="px-4 py-3">{m.concepto}</td>
                        <td className="px-4 py-3 text-right text-[#c0392b] font-semibold">{m.debito > 0 ? `-${formatUSD(m.debito)}` : '—'}</td>
                        <td className="px-4 py-3 text-right text-[#2d8a4e] font-semibold">{m.credito > 0 ? `+${formatUSD(m.credito)}` : '—'}</td>
                        <td className="px-4 py-3 text-right font-bold">{formatUSD(m.saldo)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-[#e8f5ec]">
                      <td colSpan={4} className="px-4 py-3 font-bold">Saldo del período</td>
                      <td className="px-4 py-3 text-right font-bold text-[#2d8a4e] text-lg">
                        {movimientos.length > 0 ? formatUSD(movimientos[movimientos.length - 1].saldo) : formatUSD(0)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
          }
        </div>
      )}
    </div>
  )
}
