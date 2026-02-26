import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

// ============================================
// TIPOS DE DATOS — Espejo de tus tablas en Supabase
// ============================================

export type Alumno = {
  id: string
  nombre: string
  grado: string
  alergias: string | null
  activo: boolean
  created_at: string
}

export type SaldoAlumno = {
  id: string
  nombre: string
  grado: string
  alergias: string | null
  activo: boolean
  total_pagado: number
  total_consumido: number
  saldo_actual: number
}

export type Precio = {
  id: string
  tipo_menu: string
  monto: number
  vigente_desde: string
  vigente_hasta: string | null
  created_at: string
}

export type Consumo = {
  id: string
  alumno_id: string
  fecha: string
  tipo_menu: string
  monto_cobrado: number
  ausente: boolean
  created_at: string
}

export type Pago = {
  id: string
  alumno_id: string
  monto: number
  fecha: string
  comprobante_url: string | null
  notas: string | null
  created_at: string
}

// ============================================
// HELPERS
// ============================================

// Devuelve el color del semáforo según el saldo y el precio actual del menú
export function getSemaforo(saldo: number, precioMenu: number): 'green' | 'yellow' | 'red' {
  if (saldo <= 0) return 'red'
  if (saldo < precioMenu * 3) return 'yellow' // menos de 3 días de saldo
  return 'green'
}

// Formatea un número como moneda en dólares
export function formatDolar(monto: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(monto)
}

// Formatea una fecha legible en español
export function formatFecha(fecha: string): string {
  return new Date(fecha).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}
