'use client'

import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function NuevoAlumnoPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ nombre: '', grado: '', alergias: '' })
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nombre || !form.grado) { setError('Nombre y grado son obligatorios'); return }
    setLoading(true)
    const { error: err } = await supabase.from('alumnos').insert({
      nombre: form.nombre.trim(),
      grado: form.grado.trim(),
      alergias: form.alergias.trim() || null,
    })
    if (err) { setError('Error al guardar: ' + err.message); setLoading(false); return }
    router.push('/alumnos')
  }

  return (
    <div className="p-8 animate-in max-w-lg">
      <Link href="/alumnos" className="text-black/40 text-sm hover:text-black mb-6 inline-block">← Volver</Link>
      <h1 className="font-display font-black text-3xl tracking-tight mb-8">Nuevo Alumno</h1>

      <form onSubmit={handleSubmit} className="card flex flex-col gap-5">
        <div>
          <label className="block text-xs font-bold text-black/50 uppercase tracking-wide mb-2">Nombre completo *</label>
          <input className="input" placeholder="Ej: Lucas García" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} />
        </div>
        <div>
          <label className="block text-xs font-bold text-black/50 uppercase tracking-wide mb-2">Grado *</label>
          <input className="input" placeholder="Ej: 4to A" value={form.grado} onChange={e => setForm({ ...form, grado: e.target.value })} />
        </div>
        <div>
          <label className="block text-xs font-bold text-black/50 uppercase tracking-wide mb-2">Alergias / restricciones (opcional)</label>
          <input className="input" placeholder="Ej: maní, gluten" value={form.alergias} onChange={e => setForm({ ...form, alergias: e.target.value })} />
        </div>
        {error && <p className="text-semaforo-red text-sm bg-semaforo-red-light rounded-xl px-4 py-3">{error}</p>}
        <button type="submit" className="btn-green" disabled={loading}>
          {loading ? 'Guardando...' : '✅ Guardar alumno'}
        </button>
      </form>
    </div>
  )
}
