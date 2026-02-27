'use client'

import { useEffect, useState, Suspense } from 'react'
import { supabase, formatDolar, type Alumno } from '../../lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

export default function NuevoPagoPageWrapper() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64"><p className="font-bold text-xl animate-pulse">Cargando...</p></div>}>
      <NuevoPagoPage />
    </Suspense>
  )
}

function NuevoPagoPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const alumnoPreseleccionado = searchParams.get('alumno')

  const [alumnos, setAlumnos] = useState<Alumno[]>([])
  const [loading, setLoading] = useState(false)
  const [cargandoAlumnos, setCargandoAlumnos] = useState(true)
  const [form, setForm] = useState({ alumno_id: alumnoPreseleccionado || '', monto: '', notas: '' })
  const [archivo, setArchivo] = useState<File | null>(null)
  const [error, setError] = useState('')
  const [exito, setExito] = useState(false)

  useEffect(() => {
    supabase.from('alumnos').select('*').eq('activo', true).order('nombre')
      .then(({ data }) => { if (data) setAlumnos(data); setCargandoAlumnos(false) })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!form.alumno_id) { setError('Seleccioná un alumno'); return }
    if (!form.monto || isNaN(Number(form.monto)) || Number(form.monto) <= 0) { setError('Ingresá un monto válido'); return }
    setLoading(true)

    let comprobante_url = null

    // Subir comprobante si hay archivo
    if (archivo) {
      const ext = archivo.name.split('.').pop()
      const fileName = `comprobantes/${form.alumno_id}/${Date.now()}.${ext}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('comprobantes')
        .upload(fileName, archivo)

      if (uploadError) { setError('Error al subir el comprobante: ' + uploadError.message); setLoading(false); return }

      const { data: urlData } = supabase.storage.from('comprobantes').getPublicUrl(fileName)
      comprobante_url = urlData.publicUrl
    }

    const { error: insertError } = await supabase.from('pagos').insert({
      alumno_id: form.alumno_id,
      monto: Number(form.monto),
      notas: form.notas || null,
      comprobante_url,
    })

    if (insertError) { setError('Error al registrar: ' + insertError.message); setLoading(false); return }

    setExito(true)
    setLoading(false)
  }

  const alumnoSeleccionado = alumnos.find(a => a.id === form.alumno_id)

  if (exito) {
    return (
      <div className="p-8 flex items-center justify-center min-h-96 animate-in">
        <div className="card text-center max-w-sm">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="font-display font-black text-2xl mb-2">Pago registrado</h2>
          <p className="text-black/50 mb-2">
            <strong>{formatDolar(Number(form.monto))}</strong> acreditados a{' '}
            <strong>{alumnoSeleccionado?.nombre}</strong>
          </p>
          <p className="text-black/40 text-sm mb-6">El saldo se actualizó automáticamente.</p>
          <div className="flex gap-3">
            <button className="btn-outline flex-1" onClick={() => { setExito(false); setForm({ alumno_id: '', monto: '', notas: '' }); setArchivo(null) }}>
              + Otro pago
            </button>
            <Link href="/pagos" className="flex-1">
              <button className="btn-primary w-full">Ver pagos</button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 animate-in max-w-lg">
      <Link href="/pagos" className="text-black/40 text-sm hover:text-black mb-6 inline-block">← Volver</Link>
      <h1 className="font-display font-black text-3xl tracking-tight mb-8">Registrar Pago</h1>

      <form onSubmit={handleSubmit} className="card flex flex-col gap-5">
        {/* Alumno */}
        <div>
          <label className="block text-xs font-bold text-black/50 uppercase tracking-wide mb-2">Alumno *</label>
          {cargandoAlumnos ? (
            <div className="input text-black/30">Cargando alumnos...</div>
          ) : (
            <select className="input" value={form.alumno_id} onChange={e => setForm({ ...form, alumno_id: e.target.value })}>
              <option value="">— Seleccioná un alumno —</option>
              {alumnos.map(a => (
                <option key={a.id} value={a.id}>{a.nombre} — {a.grado}</option>
              ))}
            </select>
          )}
        </div>

        {/* Monto */}
        <div>
          <label className="block text-xs font-bold text-black/50 uppercase tracking-wide mb-2">Monto en USD *</label>
          <input
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            className="input text-2xl font-bold"
            value={form.monto}
            onChange={e => setForm({ ...form, monto: e.target.value })}
          />
        </div>

        {/* Notas */}
        <div>
          <label className="block text-xs font-bold text-black/50 uppercase tracking-wide mb-2">Notas (opcional)</label>
          <input className="input" placeholder="Ej: Transferencia febrero" value={form.notas} onChange={e => setForm({ ...form, notas: e.target.value })} />
        </div>

        {/* Comprobante */}
        <div>
          <label className="block text-xs font-bold text-black/50 uppercase tracking-wide mb-2">Comprobante (opcional)</label>
          <label className="block border-2 border-dashed border-black/15 rounded-xl p-6 text-center cursor-pointer hover:border-brand-orange transition-colors">
            <input type="file" accept="image/*,.pdf" className="hidden" onChange={e => setArchivo(e.target.files?.[0] || null)} />
            {archivo ? (
              <div>
                <div className="text-2xl mb-1">📎</div>
                <div className="text-sm font-semibold text-semaforo-green">{archivo.name}</div>
                <div className="text-xs text-black/40 mt-1">Tap para cambiar</div>
              </div>
            ) : (
              <div>
                <div className="text-2xl mb-1">📷</div>
                <div className="text-sm text-black/40">Tap para adjuntar foto o PDF del comprobante</div>
              </div>
            )}
          </label>
        </div>

        {error && <p className="text-semaforo-red text-sm bg-semaforo-red-light rounded-xl px-4 py-3">{error}</p>}

        <button type="submit" className="btn-green py-5 text-lg" disabled={loading}>
          {loading ? '⏳ Registrando...' : '💳 ACREDITAR SALDO'}
        </button>
      </form>
    </div>
  )
}
