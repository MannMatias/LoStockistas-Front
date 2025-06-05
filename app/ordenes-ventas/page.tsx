"use client"
import { useState, useEffect } from "react"
import {
  Search,
  Filter,
  MoreHorizontal,
  AlertTriangle,
  CheckCircle,
  Loader2,
  ShoppingCart,
  DollarSign,
  ClipboardList,
  Tag,
  ArrowLeft,
  Package,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Trash2, Check } from "lucide-react";

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

interface EstadoOC {
  codEstadoOC: number
  nombreEstadoOC: string
}

interface DetalleOrdenCompra {
  numDetalleOC: number
  subTotal: number
  articuloProveedor: {
    id: number
    demoraEntrega: number
    precioUnitario: number
    cargosPedido: number
    articulo: Articulo
    proveedor: Proveedor
  }
}

interface OrdenCompra {
  numOC: number
  cantArt: number
  montoCompra: number
  fechaCreacion: string
  fechaEntregaEstimada: string
  estado: EstadoOC
  proveedor: Proveedor
  detalles: DetalleOrdenCompra[]
}

interface Venta {
  codVenta: number
  cantProducto: number
  fechaVenta: string
  articulo: Articulo
}

interface ArticleStats {
  totalOrdenes: number
  ordenesPendientes: number
  ordenesCompletadas: number
  totalVentas: number
  montoTotalVentas: number
  montoTotalOrdenes: number
}

// Configuración de la API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api"

export default function ArticleOrdersSalesPage() {
  const [currentView, setCurrentView] = useState<"articles" | "details">("articles")
  const [selectedArticle, setSelectedArticle] = useState<Articulo | null>(null)
  const [activeTab, setActiveTab] = useState("ordenes")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedEstado, setSelectedEstado] = useState("Todos")
  const [selectedModelo, setSelectedModelo] = useState("Todos")

  // Data states
  const [articulos, setArticulos] = useState<Articulo[]>([])
  const [ordenesCompra, setOrdenesCompra] = useState<OrdenCompra[]>([])
  const [ventas, setVentas] = useState<Venta[]>([])
  const [estadosOC, setEstadosOC] = useState<EstadoOC[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<ArticleStats>({
    totalOrdenes: 0,
    ordenesPendientes: 0,
    ordenesCompletadas: 0,
    totalVentas: 0,
    montoTotalVentas: 0,
    montoTotalOrdenes: 0,
  })

  const { toast } = useToast()

  const [articleOrdersCounts, setArticleOrdersCounts] = useState<Record<number, number>>({})
  const [articleSalesCounts, setArticleSalesCounts] = useState<Record<number, number>>({})
  const [loadingCounts, setLoadingCounts] = useState(false)

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

      // Obtener contadores de órdenes y ventas
      fetchArticlesCounts(data)
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
      const eliminarOrden = async (numOC: number) => {
      await fetch(`/api/ordenes/${numOC}/cancelar`, { method: "DELETE" });
      // fetchOrdenes(); // Recargá la lista si tenés esta función
    };

    const marcarComoEnviada = async (numOC: number) => {
      await fetch(`/api/ordenes/${numOC}/enviar`, { method: "PUT" });
      // fetchOrdenes();
    };

    const finalizarOrden = async (numOC: number) => {
      await fetch(`/api/ordenes/${numOC}/finalizar`, { method: "PUT" });
      // fetchOrdenes();
    };

  // Función para obtener órdenes de un artículo específico
  const fetchOrdenesArticulo = async (articuloId: number) => {
    try {
      setLoading(true)
      const response = await fetch(`${API_BASE_URL}/ordenes/articulo/${articuloId}`)

      if (!response.ok) {
        if (response.status === 404) {
          setOrdenesCompra([])
          return
        }
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      const data: OrdenCompra[] = await response.json()
      setOrdenesCompra(data)
    } catch (error) {
      console.error("Error fetching ordenes del artículo:", error)
      setOrdenesCompra([])
      toast({
        title: "Error",
        description: "No se pudieron cargar las órdenes del artículo",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Función para obtener ventas de un artículo específico
  const fetchVentasArticulo = async (articuloId: number) => {
    try {
      setLoading(true)
      const response = await fetch(`${API_BASE_URL}/ventas/articulo/${articuloId}`)

      if (!response.ok) {
        if (response.status === 404) {
          setVentas([])
          return
        }
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      const data: Venta[] = await response.json()
      setVentas(data)
    } catch (error) {
      console.error("Error fetching ventas del artículo:", error)
      setVentas([])
      toast({
        title: "Error",
        description: "No se pudieron cargar las ventas del artículo",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Función para obtener estados de OC
  const fetchEstadosOC = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/estados-oc`)
      if (response.ok) {
        const data: EstadoOC[] = await response.json()
        setEstadosOC(data)
      }
    } catch (error) {
      console.error("Error fetching estados OC:", error)
    }
  }

  // Función para obtener contadores de órdenes y ventas para todos los artículos
  const fetchArticlesCounts = async (articulos: Articulo[]) => {
    try {
      setLoadingCounts(true)
      const ordersCounts: Record<number, number> = {}
      const salesCounts: Record<number, number> = {}

      // Procesar en lotes para evitar demasiadas requests simultáneas
      const batchSize = 5
      for (let i = 0; i < articulos.length; i += batchSize) {
        const batch = articulos.slice(i, i + batchSize)

        await Promise.all(
          batch.map(async (articulo) => {
            try {
              // Obtener órdenes
              const ordenesResponse = await fetch(`${API_BASE_URL}/ordenes/${articulo.codArticulo}`)
              if (ordenesResponse.ok) {
                const ordenesData = await ordenesResponse.json()
                ordersCounts[articulo.codArticulo] = Array.isArray(ordenesData) ? ordenesData.length : 0
              } else {
                ordersCounts[articulo.codArticulo] = 0
              }

              // Obtener ventas
              const ventasResponse = await fetch(`${API_BASE_URL}/ventas/articulo/${articulo.codArticulo}`)
              if (ventasResponse.ok) {
                const ventasData = await ventasResponse.json()
                salesCounts[articulo.codArticulo] = Array.isArray(ventasData) ? ventasData.length : 0
              } else {
                salesCounts[articulo.codArticulo] = 0
              }
            } catch (error) {
              console.error(`Error fetching counts for article ${articulo.codArticulo}:`, error)
              ordersCounts[articulo.codArticulo] = 0
              salesCounts[articulo.codArticulo] = 0
            }
          }),
        )
      }

      setArticleOrdersCounts(ordersCounts)
      setArticleSalesCounts(salesCounts)
    } catch (error) {
      console.error("Error fetching articles counts:", error)
    } finally {
      setLoadingCounts(false)
    }
  }

  // Manejar selección de artículo
  const handleArticleSelect = async (articulo: Articulo) => {
    setSelectedArticle(articulo)
    setCurrentView("details")
    setLoading(true)

    // Cargar datos del artículo seleccionado
    await Promise.all([fetchOrdenesArticulo(articulo.codArticulo), fetchVentasArticulo(articulo.codArticulo)])

    setLoading(false)
  }

  // Volver a la vista de artículos
  const handleBackToArticles = () => {
    setCurrentView("articles")
    setSelectedArticle(null)
    setOrdenesCompra([])
    setVentas([])
    setSearchTerm("")
    setSelectedEstado("Todos")
  }

  // Actualizar estadísticas del artículo seleccionado
  useEffect(() => {
    if (selectedArticle && ordenesCompra.length >= 0 && ventas.length >= 0) {
      const totalOrdenes = ordenesCompra.length
      const ordenesPendientes = ordenesCompra.filter((o) => o.estado.nombreEstadoOC === "Pendiente").length
      const ordenesCompletadas = ordenesCompra.filter((o) => o.estado.nombreEstadoOC === "Completada").length
      const totalVentas = ventas.length
      const montoTotalVentas = ventas.reduce((total, v) => total + v.cantProducto * v.articulo.costoCompra * 1.3, 0)
      const montoTotalOrdenes = ordenesCompra.reduce((total, o) => total + o.montoCompra, 0)

      setStats({
        totalOrdenes,
        ordenesPendientes,
        ordenesCompletadas,
        totalVentas,
        montoTotalVentas,
        montoTotalOrdenes,
      })
    }
  }, [selectedArticle, ordenesCompra, ventas])

  // Filtrar artículos
  const filteredArticulos = articulos.filter((articulo) => {
    const matchesSearch =
      articulo.nombreArt.toLowerCase().includes(searchTerm.toLowerCase()) ||
      articulo.codArticulo.toString().includes(searchTerm)
    const matchesModelo = selectedModelo === "Todos" || articulo.modeloInventario === selectedModelo
    return matchesSearch && matchesModelo
  })

  // Filtrar órdenes de compra
  const filteredOrdenes = Array.isArray(ordenesCompra)
    ? ordenesCompra.filter((orden) => {
      const safeSearchTerm = searchTerm?.toLowerCase() || ""

      const matchesSearch =
        orden.numOC.toString().includes(safeSearchTerm) ||
        orden.proveedor?.nombreProveedor?.toLowerCase().includes(safeSearchTerm)

      const matchesEstado =
        selectedEstado === "Todos" || orden.estado?.nombreEstadoOC === selectedEstado

      return matchesSearch && matchesEstado
    })
    : []

  // Filtrar ventas
  const filteredVentas = ventas.filter((venta) => {
    return venta.codVenta.toString().includes(searchTerm)
  })

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case "COMPLETADA":
        return "bg-green-500"
      case "PENDIENTE":
        return "bg-yellow-500"
      case "EN PROCESO":
        return "bg-blue-500"
      case "CANCELADA":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const getStockStatus = (articulo: Articulo): "normal" | "bajo" | "critico" | "sin-stock" => {
    if (articulo.stockActual === 0) return "sin-stock"
    if (articulo.stockActual <= articulo.puntoPedido) return "critico"
    if (articulo.stockActual <= articulo.puntoPedido * 1.5) return "bajo"
    return "normal"
  }

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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  // Cargar datos al montar el componente
  useEffect(() => {
    fetchArticulos()
    fetchEstadosOC()
  }, [])

  if (loading && currentView === "articles") {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-red-500" />
          <p className="text-gray-400">Cargando artículos...</p>
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
              {currentView === "details" && (
                <Button variant="ghost" onClick={handleBackToArticles} className="text-gray-400 hover:text-white">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Volver
                </Button>
              )}
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                  {currentView === "articles" ? (
                    <Package className="w-5 h-5 text-white" />
                  ) : (
                    <ClipboardList className="w-5 h-5 text-white" />
                  )}
                </div>
                <h1 className="text-xl font-bold">
                  {currentView === "articles"
                    ? "Seleccionar Artículo"
                    : `Órdenes y Ventas - ${selectedArticle?.nombreArt}`}
                </h1>
              </div>
            </div>

            {currentView === "articles" && (
              <Button
                className="bg-white border-gray-700 text-gray-800 hover:bg-gray-700"
                onClick={() => (window.location.href = "/")}
              >
                Gestión de Inventario
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {currentView === "articles" ? (
          // Vista de selección de artículos
          <>
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
                onClick={() => {
                  fetchArticulos()
                }}
                disabled={loading || loadingCounts}
              >
                <Filter className="w-4 h-4 mr-2" />
                {loading || loadingCounts ? "Cargando..." : "Actualizar"}
              </Button>
            </div>

            {/* Articles Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredArticulos.map((articulo) => {
                const status = getStockStatus(articulo)

                return (
                  <Card
                    key={articulo.codArticulo}
                    className="bg-gray-800 border-gray-700 hover:border-red-600 transition-colors cursor-pointer"
                    onClick={() => handleArticleSelect(articulo)}
                  >
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-sm text-white line-clamp-2">{articulo.nombreArt}</h3>
                            <p className="text-xs text-gray-400 mt-1">Código: {articulo.codArticulo}</p>
                          </div>
                        </div>

                        <div className="text-xs text-gray-400">
                          <p>Proveedor: {articulo.proveedorPredeterminado.nombreProveedor}</p>
                          <p>Modelo: {articulo.modeloInventario === "LOTEFIJO" ? "Lote Fijo" : "Intervalo Fijo"}</p>
                        </div>

                        <div className="flex items-center justify-between">
                          <Badge variant="secondary" className={`${getStatusColor(status)} text-white text-xs`}>
                            {getStatusText(status)}
                          </Badge>
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
                        </div>

                        <div className="pt-2 border-t border-gray-700">
                          <div className="text-lg font-bold text-red-400">{formatPrice(articulo.costoCompra)}</div>
                          <div className="text-xs text-gray-400">
                            Valor en stock: {formatPrice(articulo.stockActual * articulo.costoCompra)}
                          </div>
                        </div>

                        <Button className="w-full bg-red-600 hover:bg-red-700 text-white">
                          Ver Órdenes y Ventas
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {filteredArticulos.length === 0 && (
              <div className="text-center py-12">
                <Package className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-400 mb-2">No se encontraron artículos</h3>
                <p className="text-gray-500">Intenta ajustar los filtros de búsqueda</p>
              </div>
            )}
          </>
        ) : (
          // Vista de detalles de órdenes y ventas
          <>
            {/* Article Info Card */}
            {selectedArticle && (
              <Card className="bg-gray-800 border-gray-700 mb-6">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-white">{selectedArticle.nombreArt}</h2>
                      <p className="text-gray-400">Código: {selectedArticle.codArticulo}</p>
                      <p className="text-gray-400">Stock Actual: {selectedArticle.stockActual}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-red-400">{formatPrice(selectedArticle.costoCompra)}</p>
                      <p className="text-sm text-gray-400">
                        Proveedor: {selectedArticle.proveedorPredeterminado.nombreProveedor}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Stats Cards */}
            <div className="flex flex-wrap gap-4 mb-6 justify-between">
              <Card className="bg-gray-800 border-gray-700 flex-1">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-300">Total Órdenes</CardTitle>
                  <ShoppingCart className="h-4 w-4 text-gray-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">{stats.totalOrdenes}</div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700 flex-1">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-300">Órdenes Completadas</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-500">{stats.ordenesCompletadas}</div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700 flex-1">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-300">Órdenes Pendientes</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-500">{stats.ordenesPendientes}</div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700 flex-1">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-300">Total Ventas</CardTitle>
                  <Tag className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-500">{stats.totalVentas}</div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700 flex-1">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-300">Valor Total</CardTitle>
                  <DollarSign className="h-4 w-4 text-gray-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-bold text-gray-500">
                    {formatPrice(stats.montoTotalVentas - stats.montoTotalOrdenes)}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
              <TabsList className="bg-gray-800 border-gray-700">
                <TabsTrigger
                  value="ordenes"
                  className="data-[state=active]:bg-red-600 data-[state=active]:text-white data-[state=active]:hover:bg-red-700 data-[state=inactive]:hover:bg-gray-500 data-[state=inactive]:hover:text-gray-800"
                >
                  Órdenes de Compra
                </TabsTrigger>
                <TabsTrigger
                  value="ventas"
                  className="data-[state=active]:bg-red-600 data-[state=active]:text-white data-[state=active]:hover:bg-red-700 data-[state=inactive]:hover:bg-gray-500 data-[state=inactive]:hover:text-gray-800"
                >
                  Ventas
                </TabsTrigger>
              </TabsList>

              <TabsContent value="ordenes" className="mt-4">
                {loading ? (
                  <div className="text-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-red-500" />
                    <p className="text-gray-400">Cargando órdenes...</p>
                  </div>
                ) : (
                  <>
                    {/* Filters for Ordenes */}
                    <div className="flex flex-col sm:flex-row gap-4 mb-6">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          placeholder="Buscar órdenes por número o proveedor..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                        />
                      </div>

                      <Select value={selectedEstado} onValueChange={setSelectedEstado}>
                        <SelectTrigger className="w-full sm:w-48 bg-gray-800 border-gray-700 text-white">
                          <SelectValue placeholder="Estado" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-700">
                          <SelectItem value="Todos" className="text-white hover:bg-gray-700">
                            Todos
                          </SelectItem>
                          {estadosOC.map((estado) => (
                            <SelectItem
                              key={estado.codEstadoOC}
                              value={estado.nombreEstadoOC}
                              className="text-white hover:bg-gray-700"
                            >
                              {estado.nombreEstadoOC}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Button
                        variant="outline"
                        className="border-gray-700 text-gray-800 hover:bg-gray-700"
                        onClick={() => selectedArticle && fetchOrdenesArticulo(selectedArticle.codArticulo)}
                      >
                        <Filter className="w-4 h-4 mr-2" />
                        Actualizar
                      </Button>
                    </div>

                    {/* Ordenes Table */}
                    <Card className="bg-gray-800 border-gray-700">
                      <CardContent className="p-0">
                        <Table>
                          <TableHeader className="bg-gray-800">
                            <TableRow className="border-gray-700 hover:bg-gray-700">
                              <TableHead className="text-gray-400">Nº Orden</TableHead>
                              <TableHead className="text-gray-400">Proveedor</TableHead>
                              <TableHead className="text-gray-400">Estado</TableHead>
                              <TableHead className="text-gray-400">Fecha Creación</TableHead>
                              <TableHead className="text-gray-400">Cantidad</TableHead>
                              <TableHead className="text-gray-400 text-right">Monto</TableHead>
                              <TableHead className="text-gray-400 w-32 text-center">Acciones</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredOrdenes.length > 0 ? (
                              filteredOrdenes.map((orden) => (
                                <TableRow key={orden.numOC} className="border-gray-700 hover:bg-gray-700">
                                  <TableCell className="font-medium text-white">#{orden.numOC}</TableCell>
                                  <TableCell className="font-medium text-white">{orden.proveedor.nombreProveedor}</TableCell>
                                  <TableCell>
                                    <Badge className={`${getEstadoColor(orden.estado.nombreEstadoOC)} text-white`}>
                                      {orden.estado.nombreEstadoOC}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="font-medium text-white">{formatDate(orden.fechaCreacion)}</TableCell>
                                  <TableCell className="font-medium text-white">{orden.cantArt}</TableCell>
                                  <TableCell className="text-right font-semibold text-red-400">
                                    {formatPrice(orden.montoCompra)}
                                  </TableCell>
                                  <TableCell className="flex justify-center gap-2">
                                    {/* Botón Eliminar */}
                                    <button
                                      className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-full"
                                      onClick={() => eliminarOrden(orden.numOC)}
                                      title="Eliminar orden"
                                    >
                                      <Trash2 size={16} />
                                    </button>

                                    {/* Botón Enviar */}
                                    <button
                                      className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full"
                                      onClick={() => marcarComoEnviada(orden.numOC)}
                                      title="Marcar como enviada"
                                    >
                                      <ShoppingCart size={16} />
                                    </button>

                                    {/* Botón Finalizar */}
                                    <button
                                      className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-full"
                                      onClick={() => finalizarOrden(orden.numOC)}
                                      title="Finalizar orden"
                                    >
                                      <Check size={16} />
                                    </button>
                                  </TableCell>
                                </TableRow>
                              ))
                            ) : (
                              <TableRow className="border-gray-700">
                                <TableCell
                                  colSpan={8}
                                  className="h-24 text-center text-gray-400 hover:bg-gray-700 bg-gray-800"
                                >
                                  No se encontraron órdenes de compra para este artículo
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  </>
                )}
              </TabsContent>

              <TabsContent value="ventas" className="mt-4">
                {loading ? (
                  <div className="text-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-red-500" />
                    <p className="text-gray-400">Cargando ventas...</p>
                  </div>
                ) : (
                  <>
                    {/* Filters for Ventas */}
                    <div className="flex flex-col sm:flex-row gap-4 mb-6">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          placeholder="Buscar ventas por número..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                        />
                      </div>

                      <Button
                        variant="outline"
                        className="border-gray-700 text-gray-800 hover:bg-gray-700"
                        onClick={() => selectedArticle && fetchVentasArticulo(selectedArticle.codArticulo)}
                      >
                        <Filter className="w-4 h-4 mr-2" />
                        Actualizar
                      </Button>
                    </div>

                    {/* Ventas Table */}
                    <Card className="bg-gray-800 border-gray-700">
                      <CardContent className="p-0">
                        <Table>
                          <TableHeader className="bg-gray-800">
                            <TableRow className="border-gray-700 hover:bg-gray-700">
                              <TableHead className="text-gray-400">Nº Venta</TableHead>
                              <TableHead className="text-gray-400">Artículo</TableHead>
                              <TableHead className="text-gray-400">Código</TableHead>
                              <TableHead className="text-gray-400">Fecha</TableHead>
                              <TableHead className="text-gray-400">Cantidad</TableHead>
                              <TableHead className="text-gray-400">Precio Unitario</TableHead>
                              <TableHead className="text-gray-400 text-right">Total</TableHead>
                              <TableHead className="text-gray-400 w-10"></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredVentas.length > 0 ? (
                              filteredVentas.map((venta) => {
                                const precioUnitario = venta.articulo.costoCompra * 1.3
                                const total = venta.cantProducto * precioUnitario

                                return (
                                  <TableRow key={venta.codVenta} className="border-gray-700 hover:bg-gray-700">
                                    <TableCell className="font-medium text-white">#{venta.codVenta}</TableCell>
                                    <TableCell className="font-medium text-white">{venta.articulo.nombreArt}</TableCell>
                                    <TableCell className="font-medium text-white">{venta.articulo.codArticulo}</TableCell>
                                    <TableCell className="font-medium text-white">{formatDate(venta.fechaVenta)}</TableCell>
                                    <TableCell className="font-medium text-white">{venta.cantProducto}</TableCell>
                                    <TableCell className="font-medium text-white">{formatPrice(precioUnitario)}</TableCell>
                                    <TableCell className="text-right font-semibold text-green-400">
                                      {formatPrice(total)}
                                    </TableCell>
                                    <TableCell>

                                    </TableCell>
                                  </TableRow>
                                )
                              })
                            ) : (
                              <TableRow className="border-gray-700">
                                <TableCell
                                  colSpan={8}
                                  className="h-24 text-center text-gray-400 hover:bg-gray-700 bg-gray-800"
                                >
                                  No se encontraron ventas para este artículo
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  </>
                )}
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </div>
  )
}
