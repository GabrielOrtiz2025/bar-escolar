'use client'
import { useEffect, useState } from 'react'
import { supabase, formatUSD, type SaldoAlumno } from '../lib/supabase'
import Link from 'next/link'

export default function AlumnosPage() {
  const [alumnos, setAlumnos] = useState<SaldoAlumno[]>([])
  const [busqueda, setBusqueda] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('saldos').select('*').eq('activo', true).order('nivel').order('paralelo').order('apellido')
      .then(({ data }) => { if (data) setAlumnos(data); setLoading(false) })
  }, [])

  const filtrados = alumnos.filter(a =>
    `${a.nivel}${a.paralelo} ${a.nombre} ${a.apellido}`.toLowerCase().includes(busqueda.toLowerCase())
  )

  if (loading) return <div className="flex items-center justify-center h-64"><p className="font-bold animate-pulse">Cargando...</p></div>

  return (
    <div className="p-6 fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Syne' }}>Alumnos</h1>
          <p className="text-gray-500 text-sm">{alumnos.length} alumnos activos</p>
        </div>
        <Link href="/alumnos/nuevo">
          <button className="btn-primary">+ Nuevo alumno</button>
        </Link>
      </div>

      <input className="input mb-5" placeholder="🔍 Buscar por nombre, paralelo..." value={busqueda} onChange={e => setBusqueda(e.target.value)} />

      <div className="flex flex-col gap-2">
        {filtrados.map(a => {
          const color = a.saldo_actual <= 0 ? 'border-[#c0392b]' : a.saldo_actual < 10 ? 'border-[#d4920a]' : 'border-gray-200'
          const badge = a.saldo_actual <= 0 ? 'badge-red' : a.saldo_actual < 10 ? 'badge-yellow' : 'badge-green'
          return (
            <Link key={a.id} href={`/alumnos/${a.id}`}>
              <div className={`bg-white rounded-2xl px-5 py-4 border-2 ${color} flex items-center gap-4 hover:shadow-md transition-all cursor-pointer`}>
                <div className="w-11 h-11 rounded-full bg-[#e8f5ec] flex items-center justify-center font-bold text-[#2d8a4e] flex-shrink-0">
                  {a.nombre[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold">{a.nombre} {a.apellido}</div>
                  <div className="text-gray-400 text-xs">{a.nivel}° {a.paralelo} {a.alergias ? '· ⚠️ ' + a.alergias : ''}</div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {a.requiere_factura && <span className="badge-blue text-xs">🧾 Factura</span>}
                  <span className={badge}>{formatUSD(a.saldo_actual)}</span>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
