'use client'

import { useEffect, useState } from 'react'
import { supabase, formatDolar, formatFecha, type Precio } from '../lib/supabase'

export default function PreciosPage() {
  const [precios, setPrecios] = useState<Precio[]>([])
  const [historial, setHistorial] = useState<Precio[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ tipo_menu: 'Almuerzo', monto: '' })
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [exito, setExito] = useState('')

  async function cargar() {
    const [{ data: vigentes }, { data: todos }] = await Promise.all([
      supabase.from('precios').select('*').is('vigente_hasta', null).order('tipo_menu'),
      supabase.from('precios').select('*').not('vigente_hasta', 'is', null).order('vigente_hasta', { ascending: false }).limit(20),
    ])
    if (vigentes) setPrecios(vigentes)
    if (todos) setHistorial(todos)
    setLoading(false)
  }

  useEffect(() => { cargar() }, [])

  async function actualizarPrecio(e: React.FormEvent) {
    e.preventDefault()
    setError(''); setExito('')
    if (!form.monto || isNaN(Number(form.monto)) || Number(form.monto) <= 0) { setError('Ingresá un monto válido'); return }
    setGuardando(true)

    const hoy = new Date().toISOString().split('T')[0]

    // Cerrar el precio vigente actual
    const precioActual = precios.find(p => p.tipo_menu === form.tipo_menu)
    if (precioActual) {
      await supabase.from('precios').update({ vigente_hasta: hoy }).eq('id', precioActual.id)
    }

    // Crear nuevo precio
    const { error: insertError } = await supabase.from('precios').insert({
      tipo_menu: form.tipo_menu,
      monto: Number(form.monto),
      vigente_desde: hoy,
    })

    if (insertError) { setError('Error: ' + insertError.message); setGuardando(false); return }

    setExito(`Precio de ${form.tipo_menu} actualizado a ${formatDolar(Number(form.monto))}`)
    setForm({ ...form, monto: '' })
    setGuardando(false)
    cargar()
  }

  if (loading) return <div className="flex items-center justify-center h-64"><p className="font-display font-bold text-xl animate-pulse">Cargando...</p></div>

  return (
    <div className="p-8 animate-in max-w-2xl">
      <h1 className="font-display font-black text-3xl tracking-tight mb-2">Precios del Menú</h1>
      <p className="text-black/50 mb-8">Actualizá los precios sin afectar el historial de cobros pasados</p>

      {/* Precios vigentes */}
      <h2 className="font-display font-bold text-lg mb-4">Precios vigentes hoy</h2>
      <div className="grid grid-cols-2 gap-4 mb-8">
        {precios.map(p => (
          <div key={p.id} className="card border-2 border-semaforo-green">
            <div className="text-2xl mb-2">{p.tipo_menu === 'Almuerzo' ? '🍱' : '🥪'}</div>
            <div className="font-display font-black text-2xl text-semaforo-green">{formatDolar(p.monto)}</div>
            <div className="text-black/50 text-sm mt-1">{p.tipo_menu}</div>
            <div className="text-black/30 text-xs mt-1">Desde {formatFecha(p.vigente_desde)}</div>
          </div>
        ))}
      </div>

      {/* Actualizar precio */}
      <h2 className="font-display font-bold text-lg mb-4">Actualizar precio</h2>
      <form onSubmit={actualizarPrecio} className="card flex flex-col gap-4 mb-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-sm text-yellow-700">
          ⚠️ Al actualizar el precio, los cobros anteriores <strong>no se modifican</strong>. Solo los cobros futuros usarán el nuevo precio.
        </div>
        <div>
          <label className="block text-xs font-bold text-black/50 uppercase tracking-wide mb-2">Tipo de menú</label>
          <select className="input" value={form.tipo_menu} onChange={e => setForm({ ...form, tipo_menu: e.target.value })}>
            <option>Almuerzo</option>
            <option>Lunch</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-black/50 uppercase tracking-wide mb-2">Nuevo precio en USD</label>
          <input type="number" step="0.01" min="0" placeholder="0.00" className="input text-2xl font-bold"
            value={form.monto} onChange={e => setForm({ ...form, monto: e.target.value })} />
        </div>
        {error && <p className="text-semaforo-red text-sm bg-semaforo-red-light rounded-xl px-4 py-3">{error}</p>}
        {exito && <p className="text-semaforo-green text-sm bg-semaforo-green-light rounded-xl px-4 py-3">✅ {exito}</p>}
        <button type="submit" className="btn-primary" disabled={guardando}>
          {guardando ? '⏳ Guardando...' : '💲 Actualizar precio'}
        </button>
      </form>

      {/* Historial */}
      {historial.length > 0 && (
        <>
          <h2 className="font-display font-bold text-lg mb-4">Historial de precios</h2>
          <div className="card overflow-hidden p-0">
            {historial.map((p, i) => (
              <div key={p.id} className={`flex items-center gap-4 px-6 py-3 text-sm ${i < historial.length - 1 ? 'border-b border-black/5' : ''} opacity-60`}>
                <span>{p.tipo_menu === 'Almuerzo' ? '🍱' : '🥪'}</span>
                <span className="flex-1">{p.tipo_menu}</span>
                <span className="font-semibold">{formatDolar(p.monto)}</span>
                <span className="text-black/40">{formatFecha(p.vigente_desde)} → {p.vigente_hasta ? formatFecha(p.vigente_hasta) : '—'}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
