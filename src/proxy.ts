import { NextResponse, type NextRequest } from "next/server"

const PROTECTED_ROUTES = ["/dashboard", "/profile"]
const AUTH_ROUTES = ["/login", "/register"]

function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some((route) => pathname.startsWith(route))
}

function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.some((route) => pathname.startsWith(route))
}

/**
 * Middleware de Next.js (Edge Runtime).
 *
 * IMPORTANTE: Solo verifica la EXISTENCIA de la cookie refresh_token,
 * no valida el JWT (eso lo hace el backend en cada request).
 *
 * La validación real ocurre en el AuthContext al montar la app,
 * que hace un refresh silencioso para obtener el access_token.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const hasSession = request.cookies.has("refresh_token")

  // Redirigir a /login si ruta protegida sin sesión
  if (isProtectedRoute(pathname) && !hasSession) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("redirect", pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Redirigir a /dashboard si ya autenticado intenta ir a /login o /register
  if (isAuthRoute(pathname) && hasSession) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Excluir: archivos estáticos, imágenes, API routes
     * Incluir: todas las rutas de página
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
