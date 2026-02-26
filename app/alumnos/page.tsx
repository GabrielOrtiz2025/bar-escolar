'use client'

import { useEffect, useState } from 'react'
import { supabase, getSemaforo, formatDolar, type SaldoAlumno } from '../lib/supabase'
import Link from 'next/link'

export default function AlumnosPage() {
  const [alumnos, setAlumnos] = useState<SaldoAlumno[]>([])
  const [precioMenu, setPrecioMenu] = useState(0)
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [filtroGrado, setFiltroGrado] = useState('Todos')

  useEffect(() => {
    async function cargar() {
      const { data: saldosData } = await supabase.from('saldos').select('*').eq('activo', true).order('nombre')
      const { data: precioData } = await supabase.from('precios').select('*').eq('tipo_menu', 'Almuerzo').is('vigente_hasta', null).single()
      if (saldosData) setAlumnos(saldosData)
      if (precioData) setPrecioMenu(precioData.monto)
      setLoading(false)
    }
    cargar()
  }, [])

  const grados = ['Todos', ...Array.from(new Set(alumnos.map(a => a.grado))).sort()]
  const filtrados = alumnos
    .filter(a => filtroGrado === 'Todos' || a.grado === filtroGrado)
    .filter(a => a.nombre.toLowerCase().includes(busqueda.toLowerCase()))

  if (loading) return <div className="flex items-center justify-center h-64"><p className="font-display font-bold text-xl animate-pulse">Cargando alumnos...</p></div>

  return (
    <div className="p-8 animate-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display font-black text-3xl tracking-tight mb-1">Alumnos</h1>
          <p className="text-black/50">{alumnos.length} alumnos activos</p>
        </div>
        <Link href="/alumnos/nuevo">
          <button className="btn-primary">+ Nuevo alumno</button>
        </Link>
      </div>

      {/* Filtros */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <input
          type="text"
          placeholder="🔍 Buscar por nombre..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          className="input max-w-xs"
        />
        <div className="flex gap-2 flex-wrap">
          {grados.map(g => (
            <button
              key={g}
              onClick={() => setFiltroGrado(g)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                filtroGrado === g ? 'bg-brand-ink text-white' : 'bg-white text-black/60 hover:bg-brand-cream border border-black/10'
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* Grid de alumnos */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {filtrados.map(alumno => (
          <AlumnoCard key={alumno.id} alumno={alumno} precioMenu={precioMenu} />
        ))}
      </div>

      {filtrados.length === 0 && (
        <div className="text-center py-16 text-black/30">
          <div className="text-5xl mb-3">🔍</div>
          <p className="font-display font-bold">No se encontraron alumnos</p>
        </div>
      )}
    </div>
  )
}

function AlumnoCard({ alumno, precioMenu }: { alumno: SaldoAlumno; precioMenu: number }) {
  const semaforo = getSemaforo(alumno.saldo_actual, precioMenu)
  const borderColors = { green: 'border-semaforo-green', yellow: 'border-semaforo-yellow', red: 'border-semaforo-red' }
  const avatarColors = { green: 'bg-semaforo-green-light', yellow: 'bg-semaforo-yellow-light', red: 'bg-semaforo-red-light' }

  return (
    <Link href={`/alumnos/${alumno.id}`}>
      <div className={`card border-2 ${borderColors[semaforo]} cursor-pointer hover:-translate-y-1 transition-all duration-200 text-center`}>
        <div className={`w-12 h-12 rounded-full ${avatarColors[semaforo]} flex items-center justify-center text-2xl mx-auto mb-3`}>
          👧
        </div>
        <div className="font-display font-bold text-sm leading-tight mb-1">{alumno.nombre}</div>
        <div className="text-black/40 text-xs mb-3">{alumno.grado}</div>
        <span className={`badge-${semaforo} text-xs`}>{formatDolar(alumno.saldo_actual)}</span>
        {alumno.alergias && (
          <div className="mt-2 text-xs bg-orange-50 text-orange-600 rounded-lg px-2 py-1">
            ⚠️ {alumno.alergias}
          </div>
        )}
      </div>
    </Link>
  )
}
