"use client"

import type * as React from "react"
import { Eye, ShoppingCart, Package } from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  onShowVentaForm: () => void
}

const navigationItems = [
  {
    title: "Visualizar Órdenes",
    url: "/ordenes-ventas",
    icon: Eye,
    description: "Ver todas las órdenes de venta",
  },
  {
    title: "Visualizar Proveedores",
    url: "/proveedores",
    icon: Package,
    description: "Gestionar proveedores",
  },
]

export function AppSidebar({ onShowVentaForm, ...props }: AppSidebarProps) {
  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center space-x-2 px-2 py-1">
              <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-sm">Gestión</span>
                <span className="text-xs text-muted-foreground">Inventario</span>
              </div>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navegación</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url} className="flex items-center space-x-3">
                      <item.icon className="w-4 h-4" />
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{item.title}</span>
                        <span className="text-xs text-muted-foreground">{item.description}</span>
                      </div>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Acciones Rápidas</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={onShowVentaForm}>
                  <ShoppingCart className="w-4 h-4" />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">Nueva Venta</span>
                    <span className="text-xs text-muted-foreground">Registrar venta de productos</span>
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  )
}
