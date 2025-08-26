// frontend/src/app/(protected)/layout.tsx

'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { MainLayout } from '@/components/layout/MainLayout';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    // Si no está cargando y no hay usuario, redirigir al login
    if (!loading && !user && !isRedirecting) {
      setIsRedirecting(true);
      router.push('/login');
    }
  }, [user, loading, router, isRedirecting]);

  // Si está cargando o redirigiendo, mostrar spinner
  if (loading || (!user && !loading)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">
            {isRedirecting ? 'Redirigiendo al login...' : 'Cargando...'}
          </p>
        </div>
      </div>
    );
  }

  // Si no hay usuario después de cargar, no renderizar nada (ya se está redirigiendo)
  if (!user) {
    return null;
  }

  // Usuario autenticado, renderizar el layout
  return <MainLayout>{children}</MainLayout>;
}