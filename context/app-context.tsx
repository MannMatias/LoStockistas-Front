"use client"

import { createContext, useContext, useState, ReactNode } from "react"

// Definir una interfaz para el objeto Articulo
// Asegúrate de que esta interfaz coincida con la estructura de tus datos de artículo
interface Articulo {
  codArticulo: number
  nombreArt: string
  // Añade aquí todas las demás propiedades del artículo que necesites
  [key: string]: any // Permite otras propiedades
}

interface AppContextType {
  isVentaFormOpen: boolean
  isArticuloFormOpen: boolean
  isProveedorFormOpen: boolean
  editingArticulo: Articulo | null
  openVentaForm: (articulo: Articulo) => void
  closeVentaForm: () => void
  openArticuloForm: (articulo?: Articulo) => void
  closeArticuloForm: () => void
  openProveedorForm: () => void
  closeProveedorForm: () => void
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: ReactNode }) {
  const [isVentaFormOpen, setIsVentaFormOpen] = useState(false)
  const [isArticuloFormOpen, setIsArticuloFormOpen] = useState(false)
  const [isProveedorFormOpen, setIsProveedorFormOpen] = useState(false)
  const [editingArticulo, setEditingArticulo] = useState<Articulo | null>(null)

  const openVentaForm = (articulo: Articulo) => {
    setEditingArticulo(articulo)
    setIsVentaFormOpen(true)
  }

  const closeVentaForm = () => {
    setEditingArticulo(null)
    setIsVentaFormOpen(false)
  }

  const openArticuloForm = (articulo?: Articulo) => {
    setEditingArticulo(articulo || null)
    setIsArticuloFormOpen(true)
  }

  const closeArticuloForm = () => {
    setEditingArticulo(null)
    setIsArticuloFormOpen(false)
  }

  const openProveedorForm = () => {
    setIsProveedorFormOpen(true)
  }

  const closeProveedorForm = () => {
    setIsProveedorFormOpen(false)
  }

  const value = {
    isVentaFormOpen,
    isArticuloFormOpen,
    isProveedorFormOpen,
    editingArticulo,
    openVentaForm,
    closeVentaForm,
    openArticuloForm,
    closeArticuloForm,
    openProveedorForm,
    closeProveedorForm,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useAppContext() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppProvider")
  }
  return context
} 