import { redirect } from "next/navigation"

/**
 * Ruta raíz — redirige siempre al login.
 * El middleware se encargará de redirigir al dashboard si hay sesión activa.
 */
export default function HomePage() {
  redirect("/login")
}