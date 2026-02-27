'use client'
import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function NuevoAlumno() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    nivel: '', paralelo: '', nombre: '', apellido: '',
    alergias: '', requiere_factura: false,
    representante_nombre: '', representante_telefono: '',
    modalidad_pago: 'mensual',
  })

  function set(k: string, v: any) { setForm(f => ({ ...f, [k]: v })) }

  async function guardar(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!form.nivel || !form.paralelo || !form.nombre || !form.apellido) {
      setError('Nivel, paralelo, nombre y apellido son obligatorios')
      return
    }
    setLoading(true)
    const { error: err } = await supabase.from('alumnos').insert({
      nivel: form.nivel.trim(),
      paralelo: form.paralelo.trim().toUpperCase(),
      nombre: form.nombre.trim(),
      apellido: form.apellido.trim(),
      alergias: form.alergias.trim() || null,
      requiere_factura: form.requiere_factura,
      representante_nombre: form.representante_nombre.trim() || null,
      representante_telefono: form.representante_telefono.trim() || null,
      modalidad_pago: form.modalidad_pago,
    })
    if (err) { setError(err.message); setLoading(false); return }
    router.push('/alumnos')
  }

  return (
    <div className="p-6 max-w-lg fade-in">
      <Link href="/alumnos" className="text-gray-400 text-sm hover:text-black mb-5 inline-block">← Volver</Link>
      <h1 className="text-2xl font-bold mb-6" style={{ fontFamily: 'Syne' }}>Nuevo Alumno</h1>

      <form onSubmit={guardar} className="flex flex-col gap-5">
        {/* Identificación */}
        <div className="card">
          <h3 className="font-bold mb-4">📋 Datos del alumno</h3>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="label">Nivel *</label>
              <input className="input" placeholder="Ej: 9" value={form.nivel} onChange={e => set('nivel', e.target.value)} />
            </div>
            <div>
              <label className="label">Paralelo *</label>
              <input className="input" placeholder="Ej: B" value={form.paralelo} onChange={e => set('paralelo', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="label">Nombre *</label>
              <input className="input" placeholder="Jeremías" value={form.nombre} onChange={e => set('nombre', e.target.value)} />
            </div>
            <div>
              <label className="label">Apellido *</label>
              <input className="input" placeholder="Ortiz" value={form.apellido} onChange={e => set('apellido', e.target.value)} />
            </div>
          </div>
          {form.nivel && form.paralelo && form.nombre && form.apellido && (
            <div className="bg-[#f4f1eb] rounded-xl px-4 py-2 text-sm text-gray-500">
              Código: <strong className="text-black">{form.nivel}{form.paralelo} — {form.nombre} {form.apellido}</strong>
            </div>
          )}
        </div>

        {/* Alergias */}
        <div className="card">
          <h3 className="font-bold mb-4">⚠️ Alergias alimentarias</h3>
          <input className="input" placeholder="Ej: maní, gluten, lactosa (dejar vacío si no tiene)" value={form.alergias} onChange={e => set('alergias', e.target.value)} />
        </div>

        {/* Representante */}
        <div className="card">
          <h3 className="font-bold mb-4">👨‍👩‍👧 Datos del representante</h3>
          <div className="mb-3">
            <label className="label">Nombre del representante</label>
            <input className="input" placeholder="Ej: María Ortiz" value={form.representante_nombre} onChange={e => set('representante_nombre', e.target.value)} />
          </div>
          <div>
            <label className="label">Teléfono de contacto</label>
            <input className="input" placeholder="Ej: 0991234567" value={form.representante_telefono} onChange={e => set('representante_telefono', e.target.value)} />
          </div>
        </div>

        {/* Facturación y pago */}
        <div className="card">
          <h3 className="font-bold mb-4">💲 Facturación y pago</h3>
          <div className="mb-4">
            <label className="label">Modalidad de pago</label>
            <select className="input" value={form.modalidad_pago} onChange={e => set('modalidad_pago', e.target.value)}>
              <option value="diario">Diario</option>
              <option value="quincenal">Quincenal</option>
              <option value="mensual">Mensual</option>
            </select>
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <div className={`w-12 h-6 rounded-full transition-colors ${form.requiere_factura ? 'bg-[#2d8a4e]' : 'bg-gray-300'}`}
              onClick={() => set('requiere_factura', !form.requiere_factura)}>
              <div className={`w-6 h-6 bg-white rounded-full shadow transition-transform ${form.requiere_factura ? 'translate-x-6' : 'translate-x-0'}`} />
            </div>
            <span className="font-medium">Requiere factura</span>
          </label>
        </div>

        {error && <p className="bg-[#fdecea] text-[#c0392b] rounded-xl px-4 py-3 text-sm">{error}</p>}

        <button type="submit" className="btn-green py-5 text-lg" disabled={loading}>
          {loading ? '⏳ Guardando...' : '✅ Guardar alumno'}
        </button>
      </form>
    </div>
  )
}
