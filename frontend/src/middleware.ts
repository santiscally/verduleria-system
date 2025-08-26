// frontend/src/middleware.ts

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Solo redirigir si estamos intentando acceder a la raíz sin ninguna ruta
  if (request.nextUrl.pathname === '/') {
    // Verificar si hay token en las cookies
    const token = request.cookies.get('token')?.value;
    
    // Si no hay token, redirigir al login
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

// Configurar en qué rutas se ejecuta el middleware
export const config = {
  matcher: [
    // Solo ejecutar en la raíz y rutas protegidas específicas
    '/',
    '/clientes/:path*',
    '/productos/:path*',
    '/pedidos/:path*',
    '/compras/:path*',
    '/remitos/:path*',
    '/conversiones/:path*',
    '/productos-unidades/:path*',
    '/unidades-medida/:path*',
    '/ordenes-compra/:path*',
  ],
};