// frontend/src/app/not-found.tsx

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">
          Página no encontrada
        </h2>
        <p className="text-gray-600 mb-8">
          La página que buscas no existe. Serás redirigido al login en unos segundos...
        </p>
        <div className="space-x-4">
          <Button
            onClick={() => router.push('/login')}
            variant="default"
          >
            Ir al Login
          </Button>
          <Button
            onClick={() => router.push('/')}
            variant="outline"
          >
            Ir al Inicio
          </Button>
        </div>
      </div>
    </div>
  );
}