'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Package,
  Users,
  Ruler,
  ShoppingCart,
  FileText,
  Settings,
  LogOut,
  User,
  RefreshCw,
  Boxes,
  ShoppingBag,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Clientes', href: '/clientes', icon: Users },
  { name: 'Pedidos', href: '/pedidos', icon: FileText },
  { name: 'Productos', href: '/productos', icon: Package },
  { name: 'Stock', href: '/productos-unidades', icon: Boxes },
  { name: 'Órdenes', href: '/ordenes-compra', icon: ShoppingCart },
  { name: 'Conversiones', href: '/conversiones', icon: RefreshCw },
  { name: 'Compras', href: '/compras', icon: ShoppingBag },
];

export function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white shadow-sm border-b">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-8">
              <Link href="/" className="text-xl font-bold text-gray-900">
                Verdulería System
              </Link>
              
              {/* Navigation */}
              <nav className="hidden md:flex items-center gap-6">
                {navigation.map((item) => {
                  const isActive = pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        'flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary',
                        isActive ? 'text-primary' : 'text-gray-600'
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* User menu */}
            <div className="flex items-center gap-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <User className="h-4 w-4" />
                    {user?.username}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/configuracion">
                      <Settings className="mr-2 h-4 w-4" />
                      Configuración
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={logout} className="text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    Cerrar Sesión
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 container mx-auto px-4 py-6">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-auto">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h4 className="text-lg font-semibold mb-3">Verdulería System</h4>
              <p className="text-gray-400 text-sm">
                Sistema integral de gestión para distribución mayorista de frutas y verduras.
              </p>
            </div>
          </div>
          <hr className="border-gray-800 my-6" />
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-400 text-sm">
              &copy; 2025 Verdulería System - Panel de Administración
            </p>
            <a 
              href="https://simpleapps.com.ar" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors flex items-center gap-1 text-sm"
            >
              <span className="opacity-70">powered by</span>
              <span className="font-mono font-bold text-base">&lt;s/a&gt;</span>
              <span className="font-medium">Simple Apps</span>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}