import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

// ============ TIPOS ============

export type Alumno = {
  id: string
  nivel: string
  paralelo: string
  nombre: string
  apellido: string
  codigo: string
  alergias: string | null
  requiere_factura: boolean
  representante_nombre: string | null
  representante_telefono: string | null
  modalidad_pago: 'diario' | 'quincenal' | 'mensual'
  activo: boolean
  created_at: string
}

export type SaldoAlumno = Alumno & {
  total_pagado: number
  total_consumido: number
  saldo_actual: number
}

export type Producto = {
  id: string
  nombre: string
  precio: number
  activo: boolean
  orden: number
}

export type Consumo = {
  id: string
  alumno_id: string
  producto_id: string
  producto_nombre: string
  monto: number
  fecha: string
  created_at: string
}

export type Pago = {
  id: string
  alumno_id: string
  monto: number
  metodo: 'efectivo' | 'transferencia'
  numero_comprobante: string | null
  comprobante_url: string | null
  notas: string | null
  fecha: string
}

// ============ HELPERS ============

export function getSemaforo(saldo: number, precioPromedio: number = 5): 'green' | 'yellow' | 'red' {
  if (saldo <= 0) return 'red'
  if (saldo < precioPromedio * 3) return 'yellow'
  return 'green'
}

export function formatUSD(monto: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(monto)
}

export function formatFecha(fecha: string): string {
  return new Date(fecha + (fecha.includes('T') ? '' : 'T12:00:00')).toLocaleDateString('es-EC', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function hoy(): string {
  return new Date().toISOString().split('T')[0]
}

export function nombreCompleto(a: { nombre: string; apellido: string; nivel: string; paralelo: string }): string {
  return `${a.nivel}${a.paralelo} — ${a.nombre} ${a.apellido}`
}

