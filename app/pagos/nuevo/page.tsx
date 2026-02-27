'use client'
import { useEffect, useState, Suspense } from 'react'
import { supabase, formatUSD, type SaldoAlumno } from '../../lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

export default function NuevoPagoWrapper() {
  return <Suspense fallback={<div className="flex items-center justify-center h-64"><p className="font-bold animate-pulse">Cargando...</p></div>}><NuevoPago /></Suspense>
}

function NuevoPago() {
  const router = useRouter()
  const params = useSearchParams()
  const alumnoParam = params.get('alumno')

  const [alumnos, setAlumnos] = useState<SaldoAlumno[]>([])
  const [busqueda, setBusqueda] = useState('')
  const [resultados, setResultados] = useState<SaldoAlumno[]>([])
  const [alumnoSel, setAlumnoSel] = useState<SaldoAlumno | null>(null)
  const [form, setForm] = useState({ monto: '', metodo: 'transferencia', numero_comprobante: '', notas: '' })
  const [archivo, setArchivo] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [exito, setExito] = useState(false)
  const [error, setError] = useState('')

  function set(k: string, v: any) { setForm(f => ({ ...f, [k]: v })) }

  useEffect(() => {
    if (alumnoParam) {
      supabase.from('saldos').select('*').eq('id', alumnoParam).single()
        .then(({ data }) => { if (data) setAlumnoSel(data) })
    }
  }, [alumnoParam])

  useEffect(() => {
    if (busqueda.length < 2) { setResultados([]); return }
    const t = setTimeout(async () => {
      const { data } = await supabase.from('saldos').select('*')
        .or(`nombre.ilike.%${busqueda}%,apellido.ilike.%${busqueda}%,nivel.ilike.%${busqueda}%`)
        .eq('activo', true).limit(6)
      if (data) setResultados(data)
    }, 200)
    return () => clearTimeout(t)
  }, [busqueda])

  async function guardar(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!alumnoSel) { setError('Seleccioná un alumno'); return }
    if (!form.monto || Number(form.monto) <= 0) { setError('Ingresá un monto válido'); return }
    setLoading(true)

    let comprobante_url = null
    if (archivo) {
      const ext = archivo.name.split('.').pop()
      const path = `comprobantes/${alumnoSel.id}/${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage.from('comprobantes').upload(path, archivo)
      if (upErr) { setError('Error al subir comprobante: ' + upErr.message); setLoading(false); return }
      const { data: urlData } = supabase.storage.from('comprobantes').getPublicUrl(path)
      comprobante_url = urlData.publicUrl
    }

    const { error: err } = await supabase.from('pagos').insert({
      alumno_id: alumnoSel.id,
      monto: Number(form.monto),
      metodo: form.metodo,
      numero_comprobante: form.numero_comprobante || null,
      comprobante_url,
      notas: form.notas || null,
    })
    if (err) { setError(err.message); setLoading(false); return }
    setExito(true)
    setLoading(false)
  }

  if (exito && alumnoSel) return (
    <div className="p-6 fade-in max-w-md">
      <div className="card text-center border-2 border-[#2d8a4e]">
        <div className="text-5xl mb-3">✅</div>
        <h2 className="font-bold text-xl mb-2">Pago registrado</h2>
        <p className="text-gray-500 mb-1"><strong>{formatUSD(Number(form.monto))}</strong> acreditados a <strong>{alumnoSel.nombre} {alumnoSel.apellido}</strong></p>
        <p className="text-gray-400 text-sm mb-6">Método: {form.metodo === 'efectivo' ? '💵 Efectivo' : '🏦 Transferencia'}</p>
        <div className="flex gap-3">
          <button className="btn-outline flex-1" onClick={() => { setExito(false); setAlumnoSel(null); setForm({ monto: '', metodo: 'transferencia', numero_comprobante: '', notas: '' }); setArchivo(null) }}>+ Otro pago</button>
          <Link href="/alumnos" className="flex-1"><button className="btn-primary w-full">Ver alumnos</button></Link>
        </div>
      </div>
    </div>
  )

  return (
    <div className="p-6 max-w-lg fade-in">
      <Link href="/alumnos" className="text-gray-400 text-sm hover:text-black mb-5 inline-block">← Volver</Link>
      <h1 className="text-2xl font-bold mb-6" style={{ fontFamily: 'Syne' }}>Registrar Pago</h1>

      <form onSubmit={guardar} className="flex flex-col gap-5">
        {/* Alumno */}
        <div className="card">
          <h3 className="font-bold mb-4">👧 Alumno</h3>
          {!alumnoSel ? (
            <div className="relative">
              <input className="input" placeholder="Buscar por nombre o paralelo..." value={busqueda} onChange={e => setBusqueda(e.target.value)} />
              {resultados.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border-2 border-gray-200 rounded-2xl shadow-lg overflow-hidden">
                  {resultados.map(a => (
                    <button key={a.id} type="button" onClick={() => { setAlumnoSel(a); setResultados([]); setBusqueda('') }}
                      className="w-full text-left px-4 py-3 hover:bg-[#f4f1eb] flex items-center gap-3 border-b border-gray-100 last:border-0">
                      <div className="w-9 h-9 rounded-full bg-[#e8f5ec] flex items-center justify-center font-bold text-[#2d8a4e]">{a.nombre[0]}</div>
                      <div>
                        <div className="font-semibold text-sm">{a.nombre} {a.apellido}</div>
                        <div className="text-xs text-gray-400">{a.nivel}° {a.paralelo} · {formatUSD(a.saldo_actual)}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-[#e8f5ec] flex items-center justify-center font-bold text-[#2d8a4e]">{alumnoSel.nombre[0]}</div>
              <div className="flex-1">
                <div className="font-semibold">{alumnoSel.nombre} {alumnoSel.apellido}</div>
                <div className="text-sm text-gray-400">{alumnoSel.nivel}° {alumnoSel.paralelo} · Saldo actual: {formatUSD(alumnoSel.saldo_actual)}</div>
              </div>
              <button type="button" onClick={() => setAlumnoSel(null)} className="text-gray-400 hover:text-black">✕</button>
            </div>
          )}
        </div>

        {/* Monto y método */}
        <div className="card">
          <h3 className="font-bold mb-4">💰 Monto y método de pago</h3>
          <div className="mb-4">
            <label className="label">Monto (USD) *</label>
            <input type="number" step="0.01" min="0" placeholder="0.00" className="input text-3xl font-bold" value={form.monto} onChange={e => set('monto', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {['efectivo', 'transferencia'].map(m => (
              <button type="button" key={m} onClick={() => set('metodo', m)}
                className={`rounded-2xl py-4 font-semibold border-2 transition-all capitalize ${form.metodo === m ? 'border-[#e85d2f] bg-orange-50 text-[#e85d2f]' : 'border-gray-200 bg-white text-gray-500'}`}>
                {m === 'efectivo' ? '💵 Efectivo' : '🏦 Transferencia'}
              </button>
            ))}
          </div>
        </div>

        {/* Comprobante (solo transferencia) */}
        {form.metodo === 'transferencia' && (
          <div className="card fade-in">
            <h3 className="font-bold mb-4">🧾 Comprobante de transferencia</h3>
            <div className="mb-3">
              <label className="label">Número de comprobante</label>
              <input className="input" placeholder="Ej: 0045678901" value={form.numero_comprobante} onChange={e => set('numero_comprobante', e.target.value)} />
            </div>
            <label className="label">Adjuntar imagen del comprobante</label>
            <label className="block border-2 border-dashed border-gray-200 rounded-xl p-5 text-center cursor-pointer hover:border-[#e85d2f] transition-colors">
              <input type="file" accept="image/*,.pdf" className="hidden" onChange={e => setArchivo(e.target.files?.[0] || null)} />
              {archivo ? (
                <div><div className="text-2xl mb-1">📎</div><div className="text-sm font-semibold text-[#2d8a4e]">{archivo.name}</div></div>
              ) : (
                <div><div className="text-2xl mb-1">📷</div><div className="text-sm text-gray-400">Tap para adjuntar foto o PDF</div></div>
              )}
            </label>
          </div>
        )}

        {/* Notas */}
        <div>
          <label className="label">Notas (opcional)</label>
          <input className="input" placeholder="Ej: Pago febrero" value={form.notas} onChange={e => set('notas', e.target.value)} />
        </div>

        {error && <p className="bg-[#fdecea] text-[#c0392b] rounded-xl px-4 py-3 text-sm">{error}</p>}
        <button type="submit" className="btn-green py-5 text-lg" disabled={loading}>
          {loading ? '⏳ Registrando...' : '💳 ACREDITAR SALDO'}
        </button>
      </form>
    </div>
  )
}
