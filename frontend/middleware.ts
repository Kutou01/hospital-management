import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    // Obtener la URL actual
    const url = request.nextUrl.clone();
    const { pathname } = url;

    // Si es una ruta de API o archivos estáticos, permitir sin redirección
    if (
        pathname.startsWith('/_next') ||
        pathname.startsWith('/api') ||
        pathname.includes('.') ||
        pathname.startsWith('/favicon.ico')
    ) {
        return NextResponse.next();
    }

    // Redireccionar rutas de autenticación a la nueva estructura si es necesario
    if (pathname === '/login') {
        url.pathname = '/auth/login';
        return NextResponse.redirect(url);
    }

    if (pathname === '/register') {
        url.pathname = '/auth/register';
        return NextResponse.redirect(url);
    }

    // Chuyển hướng /auth/booking sang /patient/booking
    if (pathname === '/auth/booking') {
        url.pathname = '/patient/booking';
        return NextResponse.redirect(url);
    }

    // Chuyển hướng /bypass-login sang /auth/login?mode=bypass
    if (pathname === '/bypass-login') {
        url.pathname = '/auth/login';
        url.searchParams.set('mode', 'bypass');
        return NextResponse.redirect(url);
    }

    // Chuyển hướng /admin-login sang /direct-login
    if (pathname === '/admin-login') {
        url.pathname = '/direct-login';
        return NextResponse.redirect(url);
    }

    return NextResponse.next();
}

// Configurar las rutas que deben ser procesadas por el middleware
export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
}; 