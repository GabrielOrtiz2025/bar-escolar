'use client'

import { useEffect, useState } from 'react'
import { supabase, getSemaforo, formatDolar, type SaldoAlumno, type Precio } from '../lib/supabase'

type AlumnoConEstado = SaldoAlumno & { marcado: boolean; ausente: boolean }

export default function PaseListaPage() {
  const [alumnos, setAlumnos] = useState<AlumnoConEstado[]>([])
  const [precio, setPrecio] = useState<Precio | null>(null)
  const [loading, setLoading] = useState(true)
  const [confirmando, setConfirmando] = useState(false)
  const [confirmado, setConfirmado] = useState(false)
  const [filtroGrado, setFiltroGrado] = useState('Todos')

  const hoy = new Date().toISOString().split('T')[0]

  useEffect(() => {
    async function cargar() {
      const [{ data: saldosData }, { data: precioData }, { data: consumosHoy }] = await Promise.all([
        supabase.from('saldos').select('*').eq('activo', true).order('grado').order('nombre'),
        supabase.from('precios').select('*').eq('tipo_menu', 'Almuerzo').is('vigente_hasta', null).single(),
        supabase.from('consumos').select('alumno_id').eq('fecha', hoy),
      ])

      const yaRegistrados = new Set((consumosHoy || []).map((c: any) => c.alumno_id))

      if (saldosData) {
        setAlumnos(saldosData.map((a: SaldoAlumno) => ({
          ...a,
          marcado: !yaRegistrados.has(a.id), // pre-marcar si no tiene consumo hoy
          ausente: false,
        })))
      }
      if (precioData) setPrecio(precioData)
      setLoading(false)

      if (yaRegistrados.size > 0) setConfirmado(true)
    }
    cargar()
  }, [])

  function toggleAlumno(id: string) {
    setAlumnos(prev => prev.map(a => a.id === id ? { ...a, marcado: !a.marcado, ausente: false } : a))
  }

  function toggleAusente(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    setAlumnos(prev => prev.map(a => a.id === id ? { ...a, ausente: !a.ausente, marcado: false } : a))
  }

  function marcarTodos() {
    setAlumnos(prev => prev.map(a => ({ ...a, marcado: true, ausente: false })))
  }

  function limpiarTodos() {
    setAlumnos(prev => prev.map(a => ({ ...a, marcado: false, ausente: false })))
  }

  async function confirmarPase() {
    if (!precio) return
    setConfirmando(true)

    const presentes = alumnos.filter(a => a.marcado)
    const ausentes = alumnos.filter(a => a.ausente)

    const registros = [
      ...presentes.map(a => ({
        alumno_id: a.id,
        fecha: hoy,
        tipo_menu: 'Almuerzo',
        monto_cobrado: precio.monto,
        ausente: false,
      })),
      ...ausentes.map(a => ({
        alumno_id: a.id,
        fecha: hoy,
        tipo_menu: 'Almuerzo',
        monto_cobrado: 0,
        ausente: true,
      })),
    ]

    if (registros.length > 0) {
      const { error } = await supabase.from('consumos').insert(registros)
      if (error) { alert('Error: ' + error.message); setConfirmando(false); return }
    }

    setConfirmando(false)
    setConfirmado(true)
  }

  const grados = ['Todos', ...Array.from(new Set(alumnos.map(a => a.grado))).sort()]
  const filtrados = alumnos.filter(a => filtroGrado === 'Todos' || a.grado === filtroGrado)
  const totalMarcados = alumnos.filter(a => a.marcado).length
  const totalAusentes = alumnos.filter(a => a.ausente).length
  const totalCobro = totalMarcados * (precio?.monto || 0)

  if (loading) return <div className="flex items-center justify-center h-64"><p className="font-display font-bold text-xl animate-pulse">Cargando lista...</p></div>

  if (confirmado) {
    return (
      <div className="p-8 flex items-center justify-center min-h-96 animate-in">
        <div className="card text-center max-w-md">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="font-display font-black text-2xl mb-2">Pase confirmado</h2>
          <p className="text-black/50 mb-6">El cobro del día fue registrado correctamente.</p>
          <div className="bg-semaforo-green-light rounded-xl p-4 mb-6">
            <div className="font-display font-black text-3xl text-semaforo-green">{formatDolar(totalCobro)}</div>
            <div className="text-semaforo-green/70 text-sm mt-1">Total debitado hoy a {totalMarcados} alumnos</div>
          </div>
          <button className="btn-outline w-full" onClick={() => setConfirmado(false)}>Ver o modificar la lista</button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 animate-in">
      <div className="mb-6">
        <h1 className="font-display font-black text-3xl tracking-tight mb-1">Pase de Lista</h1>
        <p className="text-black/50">
          {new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })} ·
          {' '}Precio: <strong className="text-black">{formatDolar(precio?.monto || 0)}</strong>
        </p>
      </div>

      {/* Resumen */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <div className="bg-semaforo-green-light text-semaforo-green rounded-xl px-4 py-2 font-bold text-sm">
          ✅ {totalMarcados} presentes
        </div>
        <div className="bg-black/5 rounded-xl px-4 py-2 font-bold text-sm text-black/50">
          🏠 {totalAusentes} ausentes
        </div>
        <div className="bg-brand-ink text-white rounded-xl px-4 py-2 font-bold text-sm ml-auto">
          Total: {formatDolar(totalCobro)}
        </div>
      </div>

      {/* Acciones masivas */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <button className="btn-green py-3 px-5 text-sm" onClick={marcarTodos}>✅ Todos presentes</button>
        <button className="btn-outline py-3 px-5 text-sm" onClick={limpiarTodos}>❌ Limpiar</button>
        <div className="flex gap-2 ml-auto flex-wrap">
          {grados.map(g => (
            <button key={g} onClick={() => setFiltroGrado(g)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${filtroGrado === g ? 'bg-brand-ink text-white' : 'bg-white text-black/60 hover:bg-brand-cream border border-black/10'}`}>
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* Lista */}
      <div className="flex flex-col gap-2 mb-8">
        {filtrados.map(alumno => {
          const semaforo = getSemaforo(alumno.saldo_actual, precio?.monto || 0)
          const saldoBajo = semaforo !== 'green'
          return (
            <div
              key={alumno.id}
              onClick={() => !alumno.ausente && toggleAlumno(alumno.id)}
              className={`flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all duration-150 select-none
                ${alumno.marcado ? 'border-semaforo-green bg-semaforo-green-light' : ''}
                ${alumno.ausente ? 'border-black/10 bg-black/3 opacity-50 cursor-default' : ''}
                ${!alumno.marcado && !alumno.ausente ? 'border-black/10 bg-white hover:border-black/20' : ''}
              `}
            >
              {/* Check circle */}
              <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-bold flex-shrink-0 transition-all
                ${alumno.marcado ? 'bg-semaforo-green border-semaforo-green text-white' : 'border-black/20 text-transparent'}`}>
                ✓
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-base leading-tight">{alumno.nombre}</div>
                <div className="text-black/40 text-xs">{alumno.grado}</div>
                {alumno.alergias && <div className="text-orange-500 text-xs mt-0.5">⚠️ {alumno.alergias}</div>}
              </div>

              {/* Saldo */}
              <div className={`text-sm font-bold ${semaforo === 'green' ? 'text-semaforo-green' : semaforo === 'yellow' ? 'text-semaforo-yellow' : 'text-semaforo-red'}`}>
                {formatDolar(alumno.saldo_actual)}
              </div>

              {/* Botón ausente */}
              <button
                onClick={(e) => toggleAusente(alumno.id, e)}
                className={`text-xs px-3 py-1.5 rounded-lg font-semibold flex-shrink-0 transition-all
                  ${alumno.ausente ? 'bg-semaforo-red text-white' : 'bg-black/5 text-black/40 hover:bg-semaforo-red-light hover:text-semaforo-red'}`}
              >
                {alumno.ausente ? 'Faltó ✓' : 'Falta'}
              </button>
            </div>
          )
        })}
      </div>

      {/* Confirmar */}
      <div className="sticky bottom-6">
        <button
          onClick={confirmarPase}
          disabled={confirmando || (totalMarcados === 0 && totalAusentes === 0)}
          className="btn-green w-full py-5 text-lg"
        >
          {confirmando ? '⏳ Registrando...' : `⚡ CONFIRMAR COBRO — ${formatDolar(totalCobro)}`}
        </button>
      </div>
    </div>
  )
}
