'use client'
import { useEffect, useState } from 'react'
import { supabase, formatUSD, type Producto } from '../lib/supabase'

export default function ProductosPage() {
  const [productos, setProductos] = useState<Producto[]>([])
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [nuevoNombre, setNuevoNombre] = useState('')
  const [nuevoPrecio, setNuevoPrecio] = useState('')
  const [mostrarForm, setMostrarForm] = useState(false)
  const [loading, setLoading] = useState(false)

  async function cargar() {
    const { data } = await supabase.from('productos').select('*').order('orden')
    if (data) setProductos(data)
  }

  useEffect(() => { cargar() }, [])

  async function agregar(e: React.FormEvent) {
    e.preventDefault()
    if (!nuevoNombre) return
    setLoading(true)
    await supabase.from('productos').insert({ nombre: nuevoNombre.trim(), precio: Number(nuevoPrecio) || 0, orden: productos.length + 1 })
    setNuevoNombre(''); setNuevoPrecio(''); setMostrarForm(false); setLoading(false)
    cargar()
  }

  async function actualizarPrecio(id: string, precio: number) {
    await supabase.from('productos').update({ precio }).eq('id', id)
    setEditandoId(null)
    cargar()
  }

  async function toggleActivo(id: string, activo: boolean) {
    await supabase.from('productos').update({ activo: !activo }).eq('id', id)
    cargar()
  }

  return (
    <div className="p-6 max-w-lg fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Syne' }}>Productos del menú</h1>
          <p className="text-gray-500 text-sm">Editá nombres y precios según temporada</p>
        </div>
        <button className="btn-primary py-3 px-5" onClick={() => setMostrarForm(!mostrarForm)}>+ Agregar</button>
      </div>

      {/* Form nuevo producto */}
      {mostrarForm && (
        <form onSubmit={agregar} className="card border-2 border-[#e85d2f] mb-5 fade-in">
          <h3 className="font-bold mb-4">Nuevo producto</h3>
          <div className="mb-3">
            <label className="label">Nombre del producto *</label>
            <input className="input" placeholder="Ej: Menú del día" autoFocus value={nuevoNombre} onChange={e => setNuevoNombre(e.target.value)} />
          </div>
          <div className="mb-4">
            <label className="label">Precio (USD)</label>
            <input type="number" step="0.01" min="0" placeholder="0.00" className="input" value={nuevoPrecio} onChange={e => setNuevoPrecio(e.target.value)} />
          </div>
          <div className="flex gap-3">
            <button type="button" className="btn-outline flex-1" onClick={() => setMostrarForm(false)}>Cancelar</button>
            <button type="submit" className="btn-green flex-1" disabled={loading}>{loading ? 'Guardando...' : '✅ Guardar'}</button>
          </div>
        </form>
      )}

      {/* Lista de productos */}
      <div className="flex flex-col gap-3">
        {productos.map(p => (
          <div key={p.id} className={`card border-2 ${p.activo ? 'border-gray-200' : 'border-gray-100 opacity-50'}`}>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="font-semibold">{p.nombre}</div>
                {editandoId === p.id ? (
                  <div className="flex gap-2 mt-2">
                    <input
                      type="number" step="0.01" min="0"
                      className="input py-2 text-lg font-bold w-36"
                      defaultValue={p.precio}
                      id={`precio-${p.id}`}
                      autoFocus
                    />
                    <button className="btn-green py-2 px-4 text-sm"
                      onClick={() => {
                        const val = (document.getElementById(`precio-${p.id}`) as HTMLInputElement).value
                        actualizarPrecio(p.id, Number(val))
                      }}>✅</button>
                    <button className="btn-outline py-2 px-4 text-sm" onClick={() => setEditandoId(null)}>✕</button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[#2d8a4e] font-bold">{p.precio > 0 ? formatUSD(p.precio) : 'Sin precio'}</span>
                    <button onClick={() => setEditandoId(p.id)} className="text-xs text-gray-400 hover:text-black underline">editar precio</button>
                  </div>
                )}
              </div>
              <button
                onClick={() => toggleActivo(p.id, p.activo)}
                className={`text-sm px-3 py-1.5 rounded-xl font-semibold transition-colors ${p.activo ? 'bg-[#e8f5ec] text-[#2d8a4e] hover:bg-[#fdecea] hover:text-[#c0392b]' : 'bg-gray-100 text-gray-400 hover:bg-[#e8f5ec] hover:text-[#2d8a4e]'}`}
              >
                {p.activo ? '✅ Activo' : '❌ Inactivo'}
              </button>
            </div>
          </div>
        ))}
      </div>

      <p className="text-gray-400 text-xs mt-4 text-center">Los precios actualizados no afectan registros anteriores</p>
    </div>
  )
}

