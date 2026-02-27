'use client'
import { useEffect, useState, useRef } from 'react'
import { supabase, formatUSD, hoy, type SaldoAlumno, type Producto } from '../lib/supabase'

export default function ConsumosPage() {
  const [busqueda, setBusqueda] = useState('')
  const [resultados, setResultados] = useState<SaldoAlumno[]>([])
  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState<SaldoAlumno | null>(null)
  const [productos, setProductos] = useState<Producto[]>([])
  const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null)
  const [montoCustom, setMontoCustom] = useState('')
  const [confirmado, setConfirmado] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [mostrarAlerta, setMostrarAlerta] = useState(false)
  const [consumosHoy, setConsumosHoy] = useState<any[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    supabase.from('productos').select('*').eq('activo', true).order('orden')
      .then(({ data }) => { if (data) setProductos(data) })
    cargarConsumosHoy()
  }, [])

  async function cargarConsumosHoy() {
    const { data } = await supabase
      .from('consumos')
      .select('*, alumnos(nombre, apellido, nivel, paralelo)')
      .eq('fecha', hoy())
      .order('created_at', { ascending: false })
    if (data) setConsumosHoy(data)
  }

  useEffect(() => {
    if (busqueda.length < 2) { setResultados([]); return }
    const timeout = setTimeout(async () => {
      const { data } = await supabase
        .from('saldos')
        .select('*')
        .or(`nombre.ilike.%${busqueda}%,apellido.ilike.%${busqueda}%,nivel.ilike.%${busqueda}%,paralelo.ilike.%${busqueda}%`)
        .eq('activo', true)
        .limit(8)
      if (data) setResultados(data)
    }, 200)
    return () => clearTimeout(timeout)
  }, [busqueda])

  function seleccionarAlumno(a: SaldoAlumno) {
    setAlumnoSeleccionado(a)
    setResultados([])
    setBusqueda('')
    setProductoSeleccionado(null)
    setMontoCustom('')
    setConfirmado(false)
    if (a.alergias) setMostrarAlerta(true)
    inputRef.current?.blur()
  }

  function cancelar() {
    setAlumnoSeleccionado(null)
    setProductoSeleccionado(null)
    setMontoCustom('')
    setConfirmado(false)
    setMostrarAlerta(false)
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  async function registrarConsumo() {
    if (!alumnoSeleccionado || !productoSeleccionado) return
    const monto = montoCustom ? parseFloat(montoCustom) : productoSeleccionado.precio
    if (!monto || monto <= 0) { alert('Ingresá el precio del producto'); return }
    if (alumnoSeleccionado.saldo_actual < monto) {
      if (!confirm(`⚠️ ${alumnoSeleccionado.nombre} tiene saldo insuficiente (${formatUSD(alumnoSeleccionado.saldo_actual)}). ¿Registrar igual?`)) return
    }
    setGuardando(true)
    const { error } = await supabase.from('consumos').insert({
      alumno_id: alumnoSeleccionado.id,
      producto_id: productoSeleccionado.id,
      producto_nombre: productoSeleccionado.nombre,
      monto,
      fecha: hoy(),
    })
    if (error) { alert('Error: ' + error.message); setGuardando(false); return }
    setConfirmado(true)
    setGuardando(false)
    cargarConsumosHoy()
  }

  const monto = montoCustom ? parseFloat(montoCustom) : (productoSeleccionado?.precio || 0)

  return (
    <div className="p-6 fade-in max-w-2xl">
      <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: 'Syne' }}>Registrar Consumo</h1>
      <p className="text-gray-500 text-sm mb-6">
        {new Date().toLocaleDateString('es-EC', { weekday: 'long', day: 'numeric', month: 'long' })}
      </p>

      {/* Búsqueda predictiva */}
      {!alumnoSeleccionado && (
        <div className="relative mb-6">
          <label className="label">Buscar alumno</label>
          <input
            ref={inputRef}
            autoFocus
            className="input text-lg pr-10"
            placeholder="Ej: 9B Jeremias..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
          />
          <span className="absolute right-4 top-[42px] text-gray-400 text-lg">🔍</span>

          {resultados.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border-2 border-gray-200 rounded-2xl shadow-lg overflow-hidden">
              {resultados.map(a => (
                <button
                  key={a.id}
                  onClick={() => seleccionarAlumno(a)}
                  className="w-full text-left px-5 py-3.5 hover:bg-[#f4f1eb] transition-colors flex items-center gap-3 border-b border-gray-100 last:border-0"
                >
                  <div className="w-10 h-10 rounded-full bg-[#e8f5ec] flex items-center justify-center font-bold text-[#2d8a4e]">
                    {a.nombre[0]}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold">{a.nombre} {a.apellido}</div>
                    <div className="text-sm text-gray-400">{a.nivel}° {a.paralelo} · Saldo: <span className={a.saldo_actual > 0 ? 'text-[#2d8a4e]' : 'text-[#c0392b]'}>{formatUSD(a.saldo_actual)}</span></div>
                  </div>
                  {a.alergias && <span className="text-orange-500 text-lg">⚠️</span>}
                </button>
              ))}
            </div>
          )}
          {busqueda.length >= 2 && resultados.length === 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border-2 border-gray-200 rounded-2xl p-4 text-center text-gray-400">
              No se encontraron alumnos
            </div>
          )}
        </div>
      )}

      {/* Alerta de alergia */}
      {mostrarAlerta && alumnoSeleccionado?.alergias && (
        <div className="bg-orange-50 border-2 border-orange-400 rounded-2xl p-4 mb-4 flex gap-3 items-start">
          <span className="text-2xl">⚠️</span>
          <div className="flex-1">
            <p className="font-bold text-orange-600">¡Atención! Este niño tiene alergias</p>
            <p className="text-orange-500 mt-0.5">{alumnoSeleccionado.alergias}</p>
          </div>
          <button onClick={() => setMostrarAlerta(false)} className="text-orange-400 hover:text-orange-600 text-xl">✕</button>
        </div>
      )}

      {/* Alumno seleccionado */}
      {alumnoSeleccionado && !confirmado && (
        <div className="fade-in">
          <div className="card border-2 border-[#2d8a4e] mb-5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-[#e8f5ec] flex items-center justify-center text-2xl font-bold text-[#2d8a4e]">
                {alumnoSeleccionado.nombre[0]}
              </div>
              <div className="flex-1">
                <div className="font-bold text-lg">{alumnoSeleccionado.nombre} {alumnoSeleccionado.apellido}</div>
                <div className="text-gray-500 text-sm">{alumnoSeleccionado.nivel}° {alumnoSeleccionado.paralelo}</div>
              </div>
              <div className="text-right">
                <div className={`font-bold text-xl ${alumnoSeleccionado.saldo_actual > 0 ? 'text-[#2d8a4e]' : 'text-[#c0392b]'}`}>
                  {formatUSD(alumnoSeleccionado.saldo_actual)}
                </div>
                <div className="text-gray-400 text-xs">Saldo disponible</div>
              </div>
            </div>
          </div>

          {/* Selección de producto */}
          <label className="label">¿Qué consumió?</label>
          <div className="grid grid-cols-2 gap-3 mb-5">
            {productos.map(p => (
              <button
                key={p.id}
                onClick={() => { setProductoSeleccionado(p); setMontoCustom('') }}
                className={`rounded-2xl p-4 text-left border-2 transition-all active:scale-95
                  ${productoSeleccionado?.id === p.id
                    ? 'border-[#e85d2f] bg-orange-50'
                    : 'border-gray-200 bg-white hover:border-gray-400'}`}
              >
                <div className="font-semibold text-sm">{p.nombre}</div>
                <div className="text-gray-400 text-xs mt-0.5">{p.precio > 0 ? formatUSD(p.precio) : 'Sin precio'}</div>
              </button>
            ))}
          </div>

          {/* Precio custom */}
          {productoSeleccionado && (
            <div className="mb-5 fade-in">
              <label className="label">Precio (USD)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="input text-2xl font-bold"
                placeholder={productoSeleccionado.precio > 0 ? String(productoSeleccionado.precio) : '0.00'}
                value={montoCustom}
                onChange={e => setMontoCustom(e.target.value)}
              />
              {productoSeleccionado.precio > 0 && !montoCustom && (
                <p className="text-gray-400 text-xs mt-1">Usando precio por defecto: {formatUSD(productoSeleccionado.precio)}</p>
              )}
            </div>
          )}

          {/* Acciones */}
          <div className="flex gap-3">
            <button onClick={cancelar} className="btn-outline flex-1">Cancelar</button>
            <button
              onClick={registrarConsumo}
              disabled={!productoSeleccionado || guardando || monto <= 0}
              className="btn-green flex-1 text-lg"
            >
              {guardando ? '⏳ Registrando...' : `✅ Confirmar ${monto > 0 ? formatUSD(monto) : ''}`}
            </button>
          </div>
        </div>
      )}

      {/* Éxito */}
      {confirmado && alumnoSeleccionado && (
        <div className="card text-center border-2 border-[#2d8a4e] fade-in">
          <div className="text-5xl mb-3">✅</div>
          <h2 className="font-bold text-xl mb-1">Consumo registrado</h2>
          <p className="text-gray-500 mb-4">
            <strong>{alumnoSeleccionado.nombre} {alumnoSeleccionado.apellido}</strong> — {productoSeleccionado?.nombre} — {formatUSD(monto)}
          </p>
          <button onClick={cancelar} className="btn-green w-full text-lg pulse-orange">
            ➕ Registrar otro alumno
          </button>
        </div>
      )}

      {/* Consumos del día */}
      {consumosHoy.length > 0 && (
        <div className="mt-8">
          <h2 className="font-bold text-base mb-3 text-gray-600">Registrados hoy ({consumosHoy.length})</h2>
          <div className="flex flex-col gap-2">
            {consumosHoy.map((c: any) => (
              <div key={c.id} className="bg-white rounded-xl px-4 py-3 flex items-center gap-3 border border-gray-200">
                <span className="text-lg">🍱</span>
                <div className="flex-1 text-sm">
                  <span className="font-semibold">{c.alumnos?.nombre} {c.alumnos?.apellido}</span>
                  <span className="text-gray-400"> · {c.producto_nombre}</span>
                </div>
                <span className="font-bold text-[#2d8a4e] text-sm">{formatUSD(c.monto)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

