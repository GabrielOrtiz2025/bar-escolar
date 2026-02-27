import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

// Tipos de datos
export interface Alumno {
  id: string
  nivel: string
  paralelo: string
  nombre: string
  apellido: string
  alergias?: string
  requiere_factura: boolean
  representante_nombre?: string
  representante_telefono?: string
  activo: boolean
  created_at: string
}

export interface Producto {
  id: string
  nombre: string
  precio: number
  activo: boolean
  created_at: string
}

export interface Consumo {
  id: string
  alumno_id: string
  producto_id: string
  producto_nombre?: string
  fecha: string
  monto: number
  monto_cobrado: number
  created_at: string
  alumno?: Alumno
  producto?: Producto
}

export interface Pago {
  id: string
  alumno_id: string
  monto: number
  tipo_pago: 'efectivo' | 'transferencia'
  metodo?: string
  numero_comprobante?: string
  comprobante_url?: string
  notas?: string
  fecha: string
  created_at: string
  alumno?: Alumno
}

export interface SaldoAlumno {
  alumno_id: string
  nombre_completo: string
  nivel: string
  paralelo: string
  total_pagado: number
  total_consumido: number
  saldo_actual: number
}

// Funciones helper
export function formatDolar(monto: number): string {
  return `$${monto.toFixed(2)}`
}

export const formatUSD = formatDolar

export function formatFecha(fecha: string | Date): string {
  const date = typeof fecha === 'string' ? new Date(fecha) : fecha
  return date.toLocaleDateString('es-EC', { 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit' 
  })
}

export function formatFechaHora(fecha: string | Date): string {
  const date = typeof fecha === 'string' ? new Date(fecha) : fecha
  return date.toLocaleString('es-EC', { 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function hoy(): string {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function getCodigoAlumno(alumno: Alumno): string {
  return `${alumno.nivel}${alumno.paralelo}`
}

export function getNombreCompleto(alumno: Alumno): string {
  return `${alumno.nombre} ${alumno.apellido}`
}

export function getIdentificadorCompleto(alumno: Alumno): string {
  return `${alumno.nivel}${alumno.paralelo} - ${alumno.nombre} ${alumno.apellido}`
}

export function getSemaforo(saldo: number): { color: string; texto: string; bgColor: string } {
  if (saldo <= 0) {
    return { 
      color: 'text-red-600', 
      texto: 'Sin crédito',
      bgColor: 'bg-red-50 border-red-200'
    }
  } else if (saldo <= 5) {
    return { 
      color: 'text-yellow-600', 
      texto: 'Saldo bajo',
      bgColor: 'bg-yellow-50 border-yellow-200'
    }
  } else {
    return { 
      color: 'text-green-600', 
      texto: 'Saldo OK',
      bgColor: 'bg-green-50 border-green-200'
    }
  }
}
