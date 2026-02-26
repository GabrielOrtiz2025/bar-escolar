'use client'

import { useEffect, useState } from 'react'
import { supabase, formatDolar, formatFecha, type Pago, type Alumno } from '../lib/supabase'
import Link from 'next/link'

type PagoConAlumno = Pago & { alumno_nombre: string; alumno_grado: string }

export default function PagosPage() {
  const [pagos, setPagos] = useState<PagoConAlumno[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function cargar() {
      const { data: pagosData } = await supabase
        .from('pagos')
        .select('*, alumnos(nombre, grado)')
        .order('fecha', { ascending: false })
        .limit(50)

      if (pagosData) {
        setPagos(pagosData.map((p: any) => ({
          ...p,
          alumno_nombre: p.alumnos?.nombre || 'Desconocido',
          alumno_grado: p.alumnos?.grado || '',
        })))
      }
      setLoading(false)
    }
    cargar()
  }, [])

  const totalMes = pagos
    .filter(p => new Date(p.fecha).getMonth() === new Date().getMonth())
    .reduce((sum, p) => sum + p.monto, 0)

  if (loading) return <div className="flex items-center justify-center h-64"><p className="font-display font-bold text-xl animate-pulse">Cargando...</p></div>

  return (
    <div className="p-8 animate-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display font-black text-3xl tracking-tight mb-1">Pagos</h1>
          <p className="text-black/50">Recargado este mes: <strong className="text-semaforo-green">{formatDolar(totalMes)}</strong></p>
        </div>
        <Link href="/pagos/nuevo">
          <button className="btn-green">+ Registrar pago</button>
        </Link>
      </div>

      <div className="card overflow-hidden p-0">
        {pagos.length === 0 && <p className="text-center text-black/30 py-12">Sin pagos registrados aún</p>}
        {pagos.map((pago, i) => (
          <div key={pago.id} className={`flex items-center gap-4 px-6 py-4 ${i < pagos.length - 1 ? 'border-b border-black/5' : ''}`}>
            <div className="w-10 h-10 bg-semaforo-green-light rounded-xl flex items-center justify-center text-lg">💳</div>
            <div className="flex-1">
              <div className="font-semibold">{pago.alumno_nombre}</div>
              <div className="text-black/40 text-xs">{pago.alumno_grado} · {formatFecha(pago.fecha)}</div>
              {pago.notas && <div className="text-black/50 text-xs mt-0.5 italic">{pago.notas}</div>}
            </div>
            <div className="font-display font-bold text-lg text-semaforo-green">+{formatDolar(pago.monto)}</div>
            {pago.comprobante_url && (
              <a href={pago.comprobante_url} target="_blank" rel="noopener noreferrer"
                className="text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors">
                📎 Ver
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
