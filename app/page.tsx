"use client"

import { useState, useEffect } from "react"
import {
  Search,
  Plus,
  MoreHorizontal,
  Package,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  ShoppingCart,
  DollarSign,
  Link,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { ArticuloForm } from "@/components/articulo-form"
import { ArticuloCreacion } from "@/components/articulo-creacion"
import VentaForm from "@/components/venta-form"
import { OrdenCompraDialog } from "@/components/orden-compra-dialog"

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
  costoCompra: number
  stockActual: number
  costoPedido: number
  fechaHoraBajaArticulo?: string
  cgi: number
  loteOptimo: number
  puntoPedido: number
  inventarioMax: number
  stockSeguridad: number
  urlImagen?: string
  modeloInventario: "LOTEFIJO" | "INTERVALOFIJO"
  proveedorPredeterminado: Proveedor
  desviacionEstandar: number
  nivelServicio: number
}

interface InventoryStats {
  totalArticulos: number
  stockNormal: number
  stockBajo: number
  sinStock: number
  valorTotalInventario: number
}

// Configuración de la API
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api"

export default function InventoryManagement() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedModelo, setSelectedModelo] = useState("Todos")
  const [articulos, setArticulos] = useState<Articulo[]>([])
  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<InventoryStats>({
    totalArticulos: 0,
    stockNormal: 0,
    stockBajo: 0,
    sinStock: 0,
    valorTotalInventario: 0,
  })
  const [showArticuloForm, setShowArticuloForm] = useState(false)
  const [editingArticulo, setEditingArticulo] = useState<Articulo | null>(null)
  const [showOrdenCompra, setShowOrdenCompra] = useState(false)
  const [selectedArticulo, setSelectedArticulo] = useState<Articulo | null>(null)
  const [lightboxImage, setLightboxImage] = useState<string | null>(null)
  const [showVentaForm, setShowVentaForm] = useState(false)
  const [showArticuloCreacion, setShowArticuloCreacion] = useState(false)
  const { toast } = useToast()

  // Función genérica para obtener artículos
  const fetchArticulos = async (endpoint = "articulos") => {
    try {
      setLoading(true)
      const response = await fetch(`${API_BASE_URL}/${endpoint}`)

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      const data: Articulo[] = await response.json()
      setArticulos(data)
      updateStats(data)
    } catch (error) {
      console.error(`Error fetching ${endpoint}:`, error)
      toast({
        title: "Error",
        description: `No se pudieron cargar los artículos`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Función para actualizar todos los artículos
  const refreshArticulos = () => {
    if (selectedModelo === "CRITICO") {
      fetchArticulos("articulos/stock-critico")
    } else if (selectedModelo === "PUNTOPEDIDO") {
      fetchArticulos("articulos/punto-pedido")
    } else {
      fetchArticulos()
    }
  }

  // Función para obtener proveedores
  const fetchProveedores = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/proveedores`)
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }
      const data = await response.json()
      setProveedores(data)
    } catch (error) {
      console.error("Error fetching proveedores:", error)
    }
  }

  // Función para eliminar artículo (baja lógica)
  const deleteArticulo = async (codArticulo: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/articulos/${codArticulo}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Error al eliminar el artículo")
      }

      toast({
        title: "Éxito",
        description: "Artículo eliminado correctamente",
      })

      refreshArticulos()
    } catch (error) {
      console.error("Error deleting articulo:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar el artículo",
        variant: "destructive",
      })
    }
  }

  // Función para actualizar stock
  const updateStock = async (codArticulo: number, newStock: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/articulos/${codArticulo}/stock`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ stockActual: newStock }),
      })

      if (!response.ok) {
        throw new Error("Error al actualizar el stock")
      }

      toast({
        title: "Éxito",
        description: "Stock actualizado correctamente",
      })

      refreshArticulos()
    } catch (error) {
      console.error("Error updating stock:", error)
      toast({
        title: "Error",
        description: "No se pudo actualizar el stock",
        variant: "destructive",
      })
    }
  }

  // Determinar status basado en stock y punto de pedido
  const getStockStatus = (articulo: Articulo): "normal" | "bajo" | "critico" | "sin-stock" => {
    if (articulo.stockActual === 0) return "sin-stock"
    if (articulo.stockActual <= articulo.puntoPedido) return "critico"
    if (articulo.stockActual <= articulo.stockSeguridad) return "bajo"
    return "normal"
  }

  // Actualizar estadísticas
  const updateStats = (articulosList: Articulo[]) => {
    const totalArticulos = articulosList.length
    const stockNormal = articulosList.filter((a) => getStockStatus(a) === "normal").length
    const stockBajo = articulosList.filter((a) => ["bajo", "critico"].includes(getStockStatus(a))).length
    const sinStock = articulosList.filter((a) => getStockStatus(a) === "sin-stock").length
    const valorTotalInventario = articulosList.reduce((total, a) => total + a.stockActual * a.costoCompra, 0)

    setStats({ totalArticulos, stockNormal, stockBajo, sinStock, valorTotalInventario })
  }

  // Filtrar artículos - por búsqueda de texto y modelo cuando sea necesario
  const filteredArticulos = articulos.filter((articulo) => {
    const matchesSearch =
      articulo.nombreArt.toLowerCase().includes(searchTerm.toLowerCase()) ||
      articulo.codArticulo.toString().includes(searchTerm)
    
    // Aplicar filtro de modelo solo para LOTEFIJO e INTERVALOFIJO
    const matchesModelo = 
      selectedModelo === "Todos" || 
      selectedModelo === "CRITICO" || 
      selectedModelo === "PUNTOPEDIDO" || 
      articulo.modeloInventario === selectedModelo
    
    return matchesSearch && matchesModelo
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "normal":
        return "bg-green-600"
      case "bajo":
        return "bg-yellow-600"
      case "critico":
        return "bg-orange-600"
      case "sin-stock":
        return "bg-red-600"
      default:
        return "bg-gray-600"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "normal":
        return "Stock Normal"
      case "bajo":
        return "Stock Bajo"
      case "critico":
        return "Stock Crítico"
      case "sin-stock":
        return "Sin Stock"
      case "puntopedido":
        return "Punto Pedido"
      default:
        return "Desconocido"
    }
  }

  const formatPrice = (price: number) => {
    if (price === null) return "$0"

    return `$${price.toLocaleString("es-AR", { minimumFractionDigits: 2 })}`
  }

  // Cargar datos al montar el componente
  useEffect(() => {
    fetchArticulos()
    fetchProveedores()
  }, [])

  // Handler genérico para cerrar modales y actualizar datos
  const handleModalClose = (setter: (value: boolean) => void, resetValue?: any) => {
    setter(false)
    if (resetValue !== undefined) {
      resetValue(null)
    }
    refreshArticulos()
  }

  const handleArticuloSaved = () => {
    handleModalClose(setShowArticuloForm, setEditingArticulo)
  }
  const handleVentaSaved = () => {
    // Aquí podrías necesitar manejar el cierre del formulario de venta si lo controlabas con estado local
  }
  const handleOrdenCompraCreated = () => handleModalClose(setShowOrdenCompra, setSelectedArticulo)

  const handleOpenArticuloForm = () => {
    setEditingArticulo(null)
    setShowArticuloForm(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-gray-300 border-t-red-600 rounded-full animate-spin mx-auto mb-6"></div>
            <div
              className="absolute inset-0 w-20 h-20 border-4 border-transparent border-t-red-500 rounded-full animate-spin mx-auto"
              style={{ animationDirection: "reverse", animationDuration: "1.5s" }}
            ></div>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Cargando Inventario</h2>
          <p className="text-gray-400">Preparando tu dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800/95 backdrop-blur-md border-b border-gray-700 sticky top-0 z-40">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-r from-red-600 to-red-700 rounded-xl flex items-center justify-center shadow-lg">
                  <Package className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">Gestión de Inventario</h1>
                  <p className="text-gray-400 text-sm">Sistema inteligente de control</p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Button
                className="bg-gray-700 hover:bg-gray-600 border-gray-600 text-white transition-all duration-200"
                onClick={() => (window.location.href = "/ordenes-ventas")}
              >
                <Eye className="w-4 h-4 mr-2" />
                Ver Órdenes
              </Button>
              <Button
                className="bg-gray-700 hover:bg-gray-600 border-gray-600 text-white transition-all duration-200"
                onClick={() => (window.location.href = "/proveedores")}
              >
                <Link className="w-4 h-4 mr-2" />
                Proveedores
              </Button>
              <Button
                onClick={() => setShowVentaForm(true)}
                className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg transition-all duration-200"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nueva Venta
              </Button>

              <Button
                className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg transition-all duration-200"
                onClick={() => setShowArticuloCreacion(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Artículo
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card className="bg-gray-800 border-gray-700 hover:bg-gray-750 transition-all duration-300 group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Total Artículos</CardTitle>
              <div className="p-2 bg-gray-600/20 rounded-lg group-hover:bg-gray-600/30 transition-colors">
                <Package className="h-5 w-5 text-purple-300" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white mb-1">{stats.totalArticulos}</div>
              <p className="text-xs text-gray-400">Total Productos Registrados</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700 hover:bg-gray-750 transition-all duration-300 group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-200">Stock Normal</CardTitle>
              <div className="p-2 bg-green-500/20 rounded-lg group-hover:bg-green-500/30 transition-colors">
                <CheckCircle className="h-5 w-5 text-green-300" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-400 mb-1">{stats.stockNormal}</div>
              <p className="text-xs text-green-200">Buen Estado</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700 hover:bg-gray-750 transition-all duration-300 group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-yellow-200">Stock Bajo</CardTitle>
              <div className="p-2 bg-yellow-500/20 rounded-lg group-hover:bg-yellow-500/30 transition-colors">
                <AlertTriangle className="h-5 w-5 text-yellow-300" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-400 mb-1">{stats.stockBajo}</div>
              <p className="text-xs text-yellow-200">Requieren Atención</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700 hover:bg-gray-750 transition-all duration-300 group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-red-200">Sin Stock</CardTitle>
              <div className="p-2 bg-red-500/20 rounded-lg group-hover:bg-red-500/30 transition-colors">
                <TrendingUp className="h-5 w-5 text-red-300" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-400 mb-1">{stats.sinStock}</div>
              <p className="text-xs text-red-200">Productos Agotados</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700 hover:bg-gray-750 transition-all duration-300 group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-200">Valor Total</CardTitle>
              <div className="p-2 bg-blue-500/20 rounded-lg group-hover:bg-blue-500/30 transition-colors">
                <DollarSign className="h-5 w-5 text-blue-300" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-400 mb-1">{formatPrice(stats.valorTotalInventario)}</div>
              <p className="text-xs text-blue-200">Valor Total del Inventario</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col lg:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Buscar artículos por nombre o código..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 h-12 bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-red-500 focus:ring-red-500/20"
            />
          </div>

          <Select
            value={selectedModelo}
            onValueChange={(value) => {
              setSelectedModelo(value)
              if (value === "CRITICO") {
                fetchArticulos("articulos/stock-critico")
              } else if (value === "PUNTOPEDIDO") {
                fetchArticulos("articulos/punto-pedido")
              } else if (value === "LOTEFIJO" || value === "INTERVALOFIJO") {
                fetchArticulos()
              } else {
                fetchArticulos()
              }
            }}
          >
            <SelectTrigger className="w-full lg:w-64 h-12 bg-gray-800 border-gray-700 text-white">
              <SelectValue placeholder="Seleccionar filtros" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="Todos" className="text-white hover:bg-slate-700">
                Todos los Artículos
              </SelectItem>
              <SelectItem value="LOTEFIJO" className="text-white hover:bg-slate-700">
                Lote Fijo
              </SelectItem>
              <SelectItem value="INTERVALOFIJO" className="text-white hover:bg-slate-700">
                Intervalo Fijo
              </SelectItem>
              <SelectItem value="CRITICO" className="text-white hover:bg-slate-700">
                Stock Seguridad
              </SelectItem>
              <SelectItem value="PUNTOPEDIDO" className="text-white hover:bg-slate-700">
                Punto Pedido
              </SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            className="h-12 bg-gray-800 border-gray-700 text-white hover:bg-gray-700 transition-all duration-200"
            onClick={refreshArticulos}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualizar
          </Button>
        </div>

        {/* Articles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredArticulos.map((articulo) => {
            const status = getStockStatus(articulo)
            const needsReorder = articulo.proveedorPredeterminado !== null

            return (
              <Card
                key={articulo.codArticulo}
                className="bg-gray-800 border-gray-700 hover:bg-gray-750 hover:border-red-500/50 transition-all duration-300 group overflow-hidden shadow-lg hover:shadow-xl"
              >
                {articulo.urlImagen ? (
                  <div
                    className="relative h-48 overflow-hidden bg-white cursor-pointer"
                    onClick={() => articulo.urlImagen && setLightboxImage(articulo.urlImagen)}
                  >
                    <img
                      src={articulo.urlImagen}
                      alt={articulo.nombreArt}
                      className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 right-3 z-10">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 bg-black/10 backdrop-blur-sm text-gray-800 hover:bg-black/20 rounded-full border border-gray-800/20"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-slate-800 border-slate-700">
                          <DropdownMenuItem
                            className="text-white hover:bg-slate-700"
                            onClick={(e) => {
                              e.stopPropagation()
                              setEditingArticulo(articulo)
                              setShowArticuloForm(true)
                            }}
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-white hover:bg-slate-700"
                            onClick={(e) => {
                              e.stopPropagation()
                              const newStock = prompt("Nuevo stock:", articulo.stockActual.toString())
                              if (newStock && !isNaN(Number(newStock))) {
                                updateStock(articulo.codArticulo, Number(newStock))
                              }
                            }}
                          >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Actualizar Stock
                          </DropdownMenuItem>
                          {needsReorder && (
                            <DropdownMenuItem
                              className="text-blue-400 hover:bg-slate-700"
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedArticulo(articulo)
                                setShowOrdenCompra(true)
                              }}
                            >
                              <ShoppingCart className="w-4 h-4 mr-2" />
                              Crear Orden de Compra
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            className="text-red-400 hover:bg-slate-700"
                            onClick={(e) => {
                              e.stopPropagation()
                              if (confirm("¿Estás seguro de que quieres eliminar este artículo?")) {
                                deleteArticulo(articulo.codArticulo)
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ) : (
                  <div className="relative h-48 bg-gradient-to-br from-gray-700/50 to-gray-600/50 flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-600/30 to-gray-500/30" />
                    <div className="relative z-10 flex flex-col items-center">
                      <div className="w-16 h-16 bg-gray-600/50 rounded-full flex items-center justify-center mb-2 backdrop-blur-sm">
                        <Package className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-xs text-gray-400 font-medium">Sin imagen</p>
                    </div>
                    <div className="absolute top-3 right-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 bg-black/40 backdrop-blur-sm text-white hover:bg-black/60 rounded-full border border-white/20"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-slate-800 border-slate-700">
                          <DropdownMenuItem
                            className="text-white hover:bg-slate-700"
                            onClick={(e) => {
                              e.stopPropagation()
                              setEditingArticulo(articulo)
                              setShowArticuloForm(true)
                            }}
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          {needsReorder && (
                            <DropdownMenuItem
                              className="text-blue-400 hover:bg-slate-700"
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedArticulo(articulo)
                                setShowOrdenCompra(true)
                              }}
                            >
                              <ShoppingCart className="w-4 h-4 mr-2" />
                              Crear Orden de Compra
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            className="text-red-400 hover:bg-slate-700"
                            onClick={(e) => {
                              e.stopPropagation()
                              if (confirm("¿Estás seguro de que quieres eliminar este artículo?")) {
                                deleteArticulo(articulo.codArticulo)
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                )}

                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-bold text-lg text-white line-clamp-2 mb-1">{articulo.nombreArt}</h3>
                      <p className="text-sm text-gray-400">Código: #{articulo.codArticulo}</p>
                    </div>

                    <div className="flex items-center justify-between">
                      <Badge className={`${getStatusColor(status)} text-white text-xs px-3 py-1 font-medium`}>
                        {getStatusText(status)}
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Proveedor:</span>
                        <span className="text-white font-medium">
                          {articulo.proveedorPredeterminado
                            ? articulo.proveedorPredeterminado.nombreProveedor
                            : "Sin Proveedor"}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Modelo:</span>
                        <span className="text-white font-medium">
                          {articulo.modeloInventario === "LOTEFIJO" ? "Lote Fijo" : "Intervalo Fijo"}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="bg-gray-700/50 rounded-lg p-3">
                        <div className="text-gray-400 text-xs mb-1">Stock Actual</div>
                        <div className="text-white font-bold text-lg">{articulo.stockActual}</div>
                      </div>
                      <div className="bg-gray-700/50 rounded-lg p-3">
                        <div className="text-gray-400 text-xs mb-1">Punto Pedido</div>
                        <div className="text-white font-bold text-lg">{articulo.puntoPedido}</div>
                      </div>
                      <div className="bg-gray-700/50 rounded-lg p-3">
                        <div className="text-gray-400 text-xs mb-1">Lote Óptimo</div>
                        <div className="text-white font-bold text-lg">{articulo.loteOptimo}</div>
                      </div>
                      <div className="bg-gray-700/50 rounded-lg p-3">
                        <div className="text-gray-400 text-xs mb-1">Stock Máx</div>
                        <div className="text-white font-bold text-lg">{articulo.inventarioMax}</div>
                      </div>
                    </div>

                    {/* Agregar este nuevo grid después del anterior */}
                    <div className="grid grid-cols-2 gap-3 text-sm mt-3">
                      <div className="bg-gray-700/50 rounded-lg p-3">
                        <div className="text-gray-400 text-xs mb-1">Nivel Servicio</div>
                        <div className="text-white font-bold text-lg">{articulo.nivelServicio*100}%</div>
                      </div>
                      <div className="bg-gray-700/50 rounded-lg p-3">
                        <div className="text-gray-400 text-xs mb-1">Desv. Estándar</div>
                        <div className="text-white font-bold text-lg">{articulo.desviacionEstandar}</div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-white/10">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                            {formatPrice(articulo.costoCompra)}
                          </div>
                          <div className="text-xs text-gray-400">
                            Valor en stock: {formatPrice(articulo.stockActual * articulo.costoCompra)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {filteredArticulos.length === 0 && !loading && (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Package className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">No se encontraron artículos</h3>
            <p className="text-gray-400 mb-6">Intenta ajustar los filtros de búsqueda o agrega nuevos productos</p>
            <Button
              onClick={handleOpenArticuloForm}
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Agregar Primer Artículo
            </Button>
          </div>
        )}
      </div>

      {/* Articulo Form Modal */}
      {showArticuloForm && (
        <ArticuloForm
          articulo={editingArticulo}
          proveedores={proveedores}
          onSave={handleArticuloSaved}
          onCancel={() => {
            setShowArticuloForm(false)
            setEditingArticulo(null)
          }}
        />
      )}

      {showArticuloCreacion && (
        <ArticuloCreacion onSave={handleArticuloSaved} onCancel={() => setShowArticuloCreacion(false)} />
      )}

      {/* Venta Form Modal (necesitará su propio estado si se usa) */}
      {showVentaForm && (
        <VentaForm articulos={articulos} onSuccess={() => setShowVentaForm(false)} onCancel={() => setShowVentaForm(false)} />
      )}

      {/* Orden Compra Dialog */}
      {showOrdenCompra && selectedArticulo && (
        <OrdenCompraDialog
          articulo={selectedArticulo}
          onSave={handleOrdenCompraCreated}
          onCancel={() => {
            setShowOrdenCompra(false)
            setSelectedArticulo(null)
          }}
        />
      )}

      {/* Lightbox Modal */}
      {lightboxImage && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[100]"
          onClick={() => setLightboxImage(null)}
        >
          <img
            src={lightboxImage}
            alt="Vista ampliada"
            className="max-w-4xl max-h-[90vh] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking the image itself
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLightboxImage(null)}
            className="absolute top-4 right-4 text-white hover:text-white hover:bg-white/20 rounded-full h-10 w-10"
          >
            <X className="h-6 w-6" />
          </Button>
        </div>
      )}
    </div>
  )
}
