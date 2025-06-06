"use client"

import { useState, useEffect } from "react"
import {
  Search,
  Plus,
  Filter,
  MoreHorizontal,
  Package,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Loader2,
  ShoppingCart,
  DollarSign,
  Link,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { ArticuloForm } from "@/components/articulo-form"
import { VentaForm } from "@/components/venta-form"
import { OrdenCompraDialog } from "@/components/orden-compra-dialog"
import { set } from "date-fns"


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

interface InventoryStats {
  totalArticulos: number
  stockNormal: number
  stockBajo: number
  sinStock: number
  valorTotalInventario: number
}

// Configuración de la API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api"

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
  const [showVentaForm, setShowVentaForm] = useState(false);
  const { toast } = useToast()

  // Función para obtener todos los artículos
  const fetchArticulos = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_BASE_URL}/articulos`)

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      const data: Articulo[] = await response.json()
      setArticulos(data)
      updateStats(data)
    } catch (error) {
      console.error("Error fetching articulos:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los artículos",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Función para obtener proveedores
  const fetchProveedores = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/proveedores`);
      const text = await response.text();
      setProveedores(JSON.parse(text));
      try {
        const data = JSON.parse(text);
        // Usá data normalmente
      } catch (err) {
        console.error("JSON inválido:", text);
      }
    } catch (err) {
      console.error("Error fetch:", err);
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

      fetchArticulos() // Recargar artículos
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

      fetchArticulos() // Recargar artículos
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
    if (articulo.stockActual <= articulo.puntoPedido * 1.5) return "bajo"
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

  // Filtrar artículos
  const filteredArticulos = articulos.filter((articulo) => {
    const matchesSearch =
      articulo.nombreArt.toLowerCase().includes(searchTerm.toLowerCase()) ||
      articulo.codArticulo.toString().includes(searchTerm)
    const matchesModelo = selectedModelo === "Todos" || articulo.modeloInventario === selectedModelo
    return matchesSearch && matchesModelo
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "normal":
        return "bg-green-500"
      case "bajo":
        return "bg-yellow-500"
      case "critico":
        return "bg-orange-500"
      case "sin-stock":
        return "bg-red-500"
      default:
        return "bg-gray-500"
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
      default:
        return "Desconocido"
    }
  }

  const formatPrice = (price: number) => {
    return `$${price.toLocaleString("es-AR", { minimumFractionDigits: 2 })}`
  }

  // Cargar datos al montar el componente
  useEffect(() => {
    fetchArticulos()
    fetchProveedores()
  }, [])

  const handleArticuloSaved = () => {
    setShowArticuloForm(false)
    setEditingArticulo(null)
    fetchArticulos()
  }

  const handleVentaSaved = () => {
    setShowVentaForm(false)
    fetchArticulos()
  }


  const handleOrdenCompraCreated = () => {
    setShowOrdenCompra(false)
    setSelectedArticulo(null)
    fetchArticulos()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-red-500" />
          <p className="text-gray-400">Cargando inventario...</p>
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
                  <Package className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-xl font-bold text-white">Gestión de Inventario</h1>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {/* Botón que redirige a /ventordenes-as */}
              <Button className="bg-white border-gray-700 text-gray-800 hover:bg-gray-700" onClick={() => window.location.href = '/ordenes-ventas'}>
                Visualizar Ordenes
              </Button>
              <Button className="bg-white border-gray-700 text-gray-800 hover:bg-gray-700" onClick={() => window.location.href = '/proveedores'}>
                Visualizar Proveedores
              </Button>
              <Button
                onClick={() => setShowVentaForm(true)}
                className="bg-red-600 hover:bg-red-700 text-white ml-auto"
              >
                <Plus className="w-4 h-4 mr-2" />
                Agregar Venta
              </Button>

              {/* Botón para agregar artículo */}
              <Button className="bg-red-600 hover:bg-red-700" onClick={() => setShowArticuloForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Agregar Artículo
              </Button>
            </div>
          </div>
        </div>
      </header>
      <div className="container mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="flex flex-wrap gap-4 mb-6 justify-between" >
          <Card className="bg-gray-800 border-gray-700 w-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Total Artículos</CardTitle>
              <Package className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.totalArticulos}</div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700 flex-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Stock Normal</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">{stats.stockNormal}</div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700 flex-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Stock Bajo</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-500">{stats.stockBajo}</div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700 flex-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Sin Stock</CardTitle>
              <TrendingUp className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">{stats.sinStock}</div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700 flex-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Valor Total</CardTitle>
              <DollarSign className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold text-gray-500">{formatPrice(stats.valorTotalInventario)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar artículos por nombre o código..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-gray-800 border-gray-700 text-white placeholder-gray-400"
            />
          </div>

          <Select value={selectedModelo} onValueChange={setSelectedModelo}>
            <SelectTrigger className="w-full sm:w-48 bg-gray-800 border-gray-700 text-white">
              <SelectValue placeholder="Modelo de Inventario" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700">
              <SelectItem value="Todos" className="text-white hover:bg-gray-700">
                Todos
              </SelectItem>
              <SelectItem value="LOTEFIJO" className="text-white hover:bg-gray-700">
                Lote Fijo
              </SelectItem>
              <SelectItem value="INTERVALOFIJO" className="text-white hover:bg-gray-700">
                Intervalo Fijo
              </SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            className="border-gray-700 text-gray-800 hover:bg-gray-700"
            onClick={fetchArticulos}
          >
            <Filter className="w-4 h-4 mr-2" />
            Actualizar
          </Button>
        </div>

        {/* Articles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredArticulos.map((articulo) => {
            const status = getStockStatus(articulo)
            const needsReorder = articulo.stockActual <= articulo.puntoPedido

            return (
              <Card
                key={articulo.codArticulo}
                className="bg-gray-800 border-gray-700 hover:border-red-600 transition-colors"
              >
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-sm text-white line-clamp-2">{articulo.nombreArt}</h3>
                        <p className="text-xs text-gray-400 mt-1">Código: {articulo.codArticulo}</p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400 hover:text-white">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-gray-800 border-gray-700">
                          <DropdownMenuItem
                            className="text-white hover:bg-gray-700"
                            onClick={() => {
                              setEditingArticulo(articulo)
                              setShowArticuloForm(true)
                            }}
                          >
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-white hover:bg-gray-700"
                            onClick={() => {
                              const newStock = prompt("Nuevo stock:", articulo.stockActual.toString())
                              if (newStock && !isNaN(Number(newStock))) {
                                updateStock(articulo.codArticulo, Number(newStock))
                              }
                            }}
                          >
                            Actualizar Stock
                          </DropdownMenuItem>
                          {needsReorder && (
                            <DropdownMenuItem
                              className="text-blue-400 hover:bg-gray-700"
                              onClick={() => {
                                setSelectedArticulo(articulo)
                                setShowOrdenCompra(true)
                              }}
                            >
                              <ShoppingCart className="w-4 h-4 mr-2" />
                              Crear Orden
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            className="text-red-400 hover:bg-gray-700"
                            onClick={() => {
                              if (confirm("¿Estás seguro de que quieres eliminar este artículo?")) {
                                deleteArticulo(articulo.codArticulo)
                              }
                            }}
                          >
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="text-xs text-gray-400">
                    <p>Proveedor: {articulo.proveedorPredeterminado ? articulo.proveedorPredeterminado.nombreProveedor : 'Sin Proveedor'}</p>
                    <p>Modelo: {articulo.modeloInventario === "LOTEFIJO" ? "Lote Fijo" : "Intervalo Fijo"}</p>
                    </div>

                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className={`${getStatusColor(status)} text-white text-xs`}>
                        {getStatusText(status)}
                      </Badge>
                      {needsReorder && (
                        <Badge variant="secondary" className="bg-blue-600 text-white text-xs">
                          Reabastecer
                        </Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-gray-400">Stock: </span>
                        <span className="text-white font-semibold">{articulo.stockActual}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Punto Pedido: </span>
                        <span className="text-white">{articulo.puntoPedido}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Lote Óptimo: </span>
                        <span className="text-white">{articulo.loteOptimo}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Stock Max: </span>
                        <span className="text-white">{articulo.inventarioMax}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-gray-700">
                      <div className="text-lg font-bold text-red-400">{formatPrice(articulo.costoCompra)}</div>
                      <div className="text-xs text-gray-400">
                        Valor en stock: {formatPrice(articulo.stockActual * articulo.costoCompra)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {filteredArticulos.length === 0 && !loading && (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-400 mb-2">No se encontraron artículos</h3>
            <p className="text-gray-500">Intenta ajustar los filtros de búsqueda</p>
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

      {/* Venta Form Modal */}
      {
        showVentaForm && (
          <VentaForm
            articulos={articulos}
            onSuccess={handleVentaSaved}
            onCancel={() => setShowVentaForm(false)}
          />
        )
      }

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
    </div>
  )
}
