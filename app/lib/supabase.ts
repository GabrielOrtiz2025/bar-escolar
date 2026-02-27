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
  fecha: string
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
  numero_comprobante?: string
  comprobante_url?: string
  notas?: string
  fecha: string
  created_at: string
  alumno?: Alumno
}

// Función helper para formatear montos en dólares
export function formatDolar(monto: number): string {
  return `$${monto.toFixed(2)}`
}

// Alias para compatibilidad
export const formatUSD = formatDolar

// Función helper para obtener el código del alumno
export function getCodigoAlumno(alumno: Alumno): string {
  return `${alumno.nivel}${alumno.paralelo}`
}

// Función helper para obtener el nombre completo del alumno
export function getNombreCompleto(alumno: Alumno): string {
  return `${alumno.nombre} ${alumno.apellido}`
}

// Función helper para obtener el identificador completo del alumno
export function getIdentificadorCompleto(alumno: Alumno): string {
  return `${alumno.nivel}${alumno.paralelo} - ${alumno.nombre} ${alumno.apellido}`
}
