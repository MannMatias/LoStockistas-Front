"use client"

import { useState, useEffect } from "react"
import { Search, Plus, Filter, MoreHorizontal, Users, Loader2, LinkIcon, Trash2, PackageOpen, UserMinus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ProveedorForm } from "./components/proveedor-form"
import { ArticuloProveedorForm } from "./components/articulo-proveedor-form"
import { ArticulosProveedorDialog } from "./components/articulos-proveedor-dialog"

interface Proveedor {
  codProveedor: number
  nombreProveedor: string
  direccionProveedor: string
  telefonoProveedor: string
  emailProveedor: string
}

interface Articulo {
  codArticulo: number
  nombreArt: string
  descripArt: string
  demandaAnual: number
  costoAlmacenamiento: number
  costoPedido: number
  costoCompra: number
  stockActual: number
  fechaHoraBajaArticulo?: string
  cgi: number
  loteOptimo: number
  puntoPedido: number
  inventarioMax: number
  stockSeguridadLF: number
  stockSeguridadIF: number
  modeloInventario: "LOTEFIJO" | "INTERVALOFIJO"
  proveedorPredeterminado: Proveedor
}

interface ArticuloProveedorResponse {
  codArticulo: number
  nombreArticulo: string
  esPredeterminado: boolean
}

// Configuración de la API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api"

export default function ProveedoresPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [articulos, setArticulos] = useState<Articulo[]>([])
  const [loading, setLoading] = useState(true)
  const [showProveedorForm, setShowProveedorForm] = useState(false)
  const [showArticuloProveedorForm, setShowArticuloProveedorForm] = useState(false)
  const [showArticulosProveedorDialog, setShowArticulosProveedorDialog] = useState(false)
  const [selectedProveedor, setSelectedProveedor] = useState<Proveedor | null>(null)
  const [articulosProveedor, setArticulosProveedor] = useState<ArticuloProveedorResponse[]>([])
  const { toast } = useToast()

  // Función para obtener todos los proveedores
  const fetchProveedores = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_BASE_URL}/proveedores`)

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      const data: Proveedor[] = await response.json()
      setProveedores(data)
    } catch (error) {
      console.error("Error fetching proveedores:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los proveedores",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Función para obtener todos los artículos
  const fetchArticulos = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/articulos`)

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      const data: Articulo[] = await response.json()
      setArticulos(data)
    } catch (error) {
      console.error("Error fetching articulos:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los artículos",
        variant: "destructive",
      })
    }
  }

  // Función para eliminar un proveedor
  const deleteProveedor = async (codProveedor: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/proveedores/${codProveedor}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || "Error al eliminar el proveedor")
      }

      toast({
        title: "Éxito",
        description: "Proveedor eliminado correctamente",
      })

      fetchProveedores() // Recargar proveedores
    } catch (error) {
      console.error("Error deleting proveedor:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo eliminar el proveedor",
        variant: "destructive",
      })
    }
  }

  // Función para obtener los artículos de un proveedor
  const fetchArticulosProveedor = async (codProveedor: number) => {
    try {
      setLoading(true)
      const response = await fetch(`${API_BASE_URL}/proveedores/${codProveedor}/articulos`)

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      const data: ArticuloProveedorResponse[] = await response.json()
      setArticulosProveedor(data)
      return data
    } catch (error) {
      console.error("Error fetching articulos del proveedor:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los artículos del proveedor",
        variant: "destructive",
      })
      return []
    } finally {
      setLoading(false)
    }
  }

  // Filtrar proveedores
  const filteredProveedores = proveedores.filter((proveedor) => {
    return (
      proveedor.nombreProveedor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      proveedor.emailProveedor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      proveedor.telefonoProveedor.includes(searchTerm)
    )
  })

  // Cargar datos al montar el componente
  useEffect(() => {
    fetchProveedores()
    fetchArticulos()
  }, [])

  const handleProveedorSaved = () => {
    setShowProveedorForm(false)
    fetchProveedores()
  }

  const handleArticuloProveedorSaved = () => {
    setShowArticuloProveedorForm(false)
    if (selectedProveedor) {
      fetchArticulosProveedor(selectedProveedor.codProveedor)
    }
  }

  const handleViewArticulos = async (proveedor: Proveedor) => {
    setSelectedProveedor(proveedor)
    const articulos = await fetchArticulosProveedor(proveedor.codProveedor)
    if (articulos.length > 0) {
      setShowArticulosProveedorDialog(true)
    } else {
      toast({
        title: "Información",
        description: "Este proveedor no tiene artículos asociados",
      })
    }
  }

  if (loading && proveedores.length === 0) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-red-500" />
          <p className="text-gray-400">Cargando proveedores...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-xl font-bold text-white">Gestión de Proveedores</h1>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                className="bg-white border-gray-700 text-gray-800 hover:bg-gray-700"
                onClick={() => (window.location.href = "/")}
              >
                Gestión de Inventario
              </Button>

              {/* Botón para agregar proveedor */}
              <Button className="bg-red-600 hover:bg-red-700" onClick={() => setShowProveedorForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Agregar Proveedor
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Stats Card */}
        <Card className="bg-gray-800 border-gray-700 mb-6">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Total Proveedores</CardTitle>
            <Users className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{proveedores.length}</div>
          </CardContent>
        </Card>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar proveedores por nombre, email o teléfono..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-gray-800 border-gray-700 text-white placeholder-gray-400"
            />
          </div>

          <Button
            variant="outline"
            className="border-gray-700 text-gray-800 hover:bg-gray-700"
            onClick={fetchProveedores}
          >
            <Filter className="w-4 h-4 mr-2" />
            Actualizar
          </Button>
        </div>

        {/* Proveedores Table */}
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-gray-800">
                <TableRow className="border-gray-700 hover:bg-gray-700">
                  <TableHead className="text-gray-400">Código</TableHead>
                  <TableHead className="text-gray-400">Nombre</TableHead>
                  <TableHead className="text-gray-400">Email</TableHead>
                  <TableHead className="text-gray-400">Teléfono</TableHead>
                  <TableHead className="text-gray-400">Dirección</TableHead>
                  <TableHead className="text-gray-400 text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProveedores.length > 0 ? (
                  filteredProveedores.map((proveedor) => (
                    <TableRow key={proveedor.codProveedor} className="border-gray-700 hover:bg-gray-700">
                      <TableCell className="font-medium text-white">#{proveedor.codProveedor}</TableCell>
                      <TableCell className="font-medium text-white">{proveedor.nombreProveedor}</TableCell>
                      <TableCell className="text-white">{proveedor.emailProveedor}</TableCell>
                      <TableCell className="text-white">{proveedor.telefonoProveedor}</TableCell>
                      <TableCell className="text-white">{proveedor.direccionProveedor || "-"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-10 border-gray-700 bg-green-500 hover:bg-green-700 text-gray-800 hover:text-white"
                            onClick={() => {
                              setSelectedProveedor(proveedor)
                              setShowArticuloProveedorForm(true)
                            }}
                          >
                            <LinkIcon className="h-4 w-4 mr-1" />
                            <span className="hidden sm:inline">Agregar Artículos</span>
                          </Button>
                          <Button

                            size="sm"
                            className="h-10 bg-yellow-400 hover:bg-yellow-700 text-gray-800 hover:text-white"
                            onClick={() => handleViewArticulos(proveedor)}
                          >
                            <PackageOpen className="h-4 w-4 mr-1" />
                            <span className="hidden sm:inline">Ver Artículos</span>
                          </Button>
                          
                              <Button
                                className="h-10 text-red-400 bg-red-500 hover:bg-red-700 hover:text-white text-gray-800"
                                onClick={() => {
                                  if (confirm("¿Estás seguro de que quieres eliminar este proveedor?")) {
                                    deleteProveedor(proveedor.codProveedor)
                                  }
                                }}
                              >
                                <UserMinus className="h-4 w-4 mr-2" />
                               Dar de Baja
                              </Button>
                        
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow className="border-gray-700">
                    <TableCell colSpan={6} className="h-24 text-center text-gray-400 hover:bg-gray-700 bg-gray-800">
                      {loading ? (
                        <div className="flex justify-center items-center">
                          <Loader2 className="h-6 w-6 animate-spin mr-2" />
                          Cargando proveedores...
                        </div>
                      ) : (
                        "No se encontraron proveedores"
                      )}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Proveedor Form Modal */}
      {showProveedorForm && (
        <ProveedorForm
          onSave={handleProveedorSaved}
          onCancel={() => setShowProveedorForm(false)}
          articulos={articulos}
        />
      )}

      {/* Articulo Proveedor Form Modal */}
      {showArticuloProveedorForm && selectedProveedor && (
        <ArticuloProveedorForm
          proveedor={selectedProveedor}
          articulos={articulos}
          onSave={handleArticuloProveedorSaved}
          onCancel={() => setShowArticuloProveedorForm(false)}
        />
      )}

      {/* Articulos Proveedor Dialog */}
      {showArticulosProveedorDialog && selectedProveedor && (
        <ArticulosProveedorDialog
          proveedor={selectedProveedor}
          articulos={articulosProveedor}
          onClose={() => setShowArticulosProveedorDialog(false)}
        />
      )}
    </div>
  )
}
