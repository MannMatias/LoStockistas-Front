"use client"
import { useState, useEffect } from "react"
import {
  Search,
  Filter,
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Trash2, Check } from "lucide-react"

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
  proveedorPredeterminado?: Proveedor | null
  urlImagen?:  string 
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
  // Modificar el estado currentView para incluir el tipo de vista
  const [currentView, setCurrentView] = useState<"articles" | "orders" | "sales">("articles")
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
  const [loadingActions, setLoadingActions] = useState<Record<string, boolean>>({})

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
    setLoadingActions((prev) => ({ ...prev, [`eliminar-${numOC}`]: true }))
    try {
      const response = await fetch(`${API_BASE_URL}/ordenes/${numOC}/cancelar`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Error al eliminar la orden")
      }

      toast({
        title: "Éxito",
        description: "Orden cancelada correctamente",
      })

      if (selectedArticle) {
        await fetchOrdenesArticulo(selectedArticle.codArticulo)
      }
    } catch (error) {
      console.error("Error al eliminar la orden:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar la orden",
        variant: "destructive",
      })
    } finally {
      setLoadingActions((prev) => ({ ...prev, [`eliminar-${numOC}`]: false }))
    }
  }

  const marcarComoEnviada = async (numOC: number) => {
    setLoadingActions((prev) => ({ ...prev, [`enviar-${numOC}`]: true }))
    try {
      const response = await fetch(`${API_BASE_URL}/ordenes/${numOC}/enviar`, { method: "PUT" })
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      if (selectedArticle) {
        await fetchOrdenesArticulo(selectedArticle.codArticulo)
      }
    } catch (error) {
      console.error("Error al marcar como enviada:", error)
      toast({
        title: "Error",
        description: "No se pudo marcar como enviada",
        variant: "destructive",
      })
    } finally {
      setLoadingActions((prev) => ({ ...prev, [`enviar-${numOC}`]: false }))
    }
  }

  const finalizarOrden = async (numOC: number) => {
    setLoadingActions((prev) => ({ ...prev, [`finalizar-${numOC}`]: true }))
    try {
      const response = await fetch(`${API_BASE_URL}/ordenes/${numOC}/finalizar`, { method: "PUT" })
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      if (selectedArticle) {
        await fetchOrdenesArticulo(selectedArticle.codArticulo)
      }
    } catch (error) {
      console.error("Error al finalizar la orden:", error)
      toast({
        title: "Error",
        description: "No se pudo finalizar la orden",
        variant: "destructive",
      })
    } finally {
      setLoadingActions((prev) => ({ ...prev, [`finalizar-${numOC}`]: false }))
    }
  }

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

      // Procesar los datos para asegurar que cada orden tenga su proveedor asignado correctamente
      const ordenesProcesadas = data.map((orden) => {
        // Asumimos que la información del proveedor está en el primer detalle
        const proveedorDesdeDetalle =
          orden.detalles && orden.detalles.length > 0 && orden.detalles[0].articuloProveedor
            ? orden.detalles[0].articuloProveedor.proveedor
            : null

        return {
          ...orden,
          proveedor: orden.proveedor || proveedorDesdeDetalle || selectedArticle?.proveedorPredeterminado,
        }
      })

      setOrdenesCompra(ordenesProcesadas)
    } catch (error) {
      console.error("Error fetching ordenes:", error)
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

  // Modificar las funciones de manejo de selección de artículo para incluir el tipo de vista
  const handleArticleSelectOrders = async (articulo: Articulo) => {
    setSelectedArticle(articulo)
    setCurrentView("orders")
    setLoading(true)
    await fetchOrdenesArticulo(articulo.codArticulo)
    setLoading(false)
  }

  const handleArticleSelectSales = async (articulo: Articulo) => {
    setSelectedArticle(articulo)
    setCurrentView("sales")
    setLoading(true)
    await fetchVentasArticulo(articulo.codArticulo)
    setLoading(false)
  }

  // Modificar la función handleBackToArticles
  const handleBackToArticles = () => {
    setCurrentView("articles")
    setSelectedArticle(null)
    setOrdenesCompra([])
    setVentas([])
    setSearchTerm("")
    setSelectedEstado("Todos")
  }

  // Reemplazar la función handleArticleSelect existente with the new functions
  // Eliminar o comentar la función original handleArticleSelect
  // const handleArticleSelect = async (articulo: Articulo) => {
  //   setSelectedArticle(articulo)
  //   setCurrentView("details")
  //   setLoading(true)
  //   await Promise.all([fetchOrdenesArticulo(articulo.codArticulo), fetchVentasArticulo(articulo.codArticulo)])
  //   setLoading(false)
  // }

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

        const matchesEstado = selectedEstado === "Todos" || orden.estado?.nombreEstadoOC === selectedEstado

        return matchesSearch && matchesEstado
      })
    : []

  // Filtrar ventas
  const filteredVentas = ventas.filter((venta) => {
    return venta.codVenta.toString().includes(searchTerm)
  })

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case "FINALIZADA":
        return "bg-green-500"
      case "PENDIENTE":
        return "bg-yellow-500"
      case "ENVIADA":
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
    if (price === null) return "$0"
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
              {currentView !== "articles" && (
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
                {/* Modificar el título del header para mostrar "Órdenes - " o "Ventas - " según corresponda */}
                <h1 className="text-xl font-bold">
                  {currentView === "articles"
                    ? "Seleccionar Artículo"
                    : currentView === "orders"
                      ? `Órdenes - ${selectedArticle?.nombreArt}`
                      : `Ventas - ${selectedArticle?.nombreArt}`}
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
        {/* Reemplazar la sección de detalles (el else del currentView === "articles") con la nueva lógica */}
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
                          <p>Proveedor: {articulo.proveedorPredeterminado?.nombreProveedor ?? 'Sin Proveedor'}</p>
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

                        {/* Modificar los botones en la vista de artículos */}
                        <div className="flex gap-2">
                          <Button
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                            onClick={() => handleArticleSelectOrders(articulo)}
                          >
                            Ver Órdenes
                          </Button>
                          <Button
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                            onClick={() => handleArticleSelectSales(articulo)}
                          >
                            Ver Ventas
                          </Button>
                        </div>
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
        ) : currentView === "orders" ? (
          // Vista de órdenes
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
                        Proveedor: {selectedArticle.proveedorPredeterminado?.nombreProveedor ?? 'Sin Proveedor'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Stats Cards - Solo para órdenes */}
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
                  <CardTitle className="text-sm font-medium text-gray-300">Monto Total Órdenes</CardTitle>
                  <DollarSign className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-bold text-red-500">{formatPrice(stats.montoTotalOrdenes)}</div>
                </CardContent>
              </Card>
            </div>

            {/* Órdenes Content */}
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
                              <TableCell className="font-medium text-white">
                                {orden.proveedor.nombreProveedor}
                              </TableCell>
                              <TableCell>
                                <Badge className={`${getEstadoColor(orden.estado.nombreEstadoOC)} text-white`}>
                                  {orden.estado.nombreEstadoOC}
                                </Badge>
                              </TableCell>

                              <TableCell className="font-medium text-white">{orden.cantArt}</TableCell>
                              <TableCell className="text-right font-semibold text-red-400">
                                {formatPrice(orden.montoCompra)}
                              </TableCell>
                              <TableCell className="flex justify-center gap-2">
                                {/* Botón Eliminar */}
                                <button
                                 className={`bg-red-600 hover:bg-red-700 text-white p-2 rounded-full ${
                                    orden.estado.nombreEstadoOC !== "PENDIENTE" ? "opacity-50 cursor-not-allowed" : ""
                                  }`}
                                  onClick={() => eliminarOrden(orden.numOC)}
                                  title="Eliminar orden"
                                  disabled={loadingActions[`eliminar-${orden.numOC}`]}
                                >
                                  {loadingActions[`eliminar-${orden.numOC}`] ? (
                                    <Loader2 size={16} className="animate-spin" />
                                  ) : (
                                    <Trash2 size={16} />
                                  )}
                                </button>

                                {/* Botón Enviar */}
                                <button
                                  className={`bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full ${
                                    orden.estado.nombreEstadoOC !== "PENDIENTE" ? "opacity-50 cursor-not-allowed" : ""
                                  }`}
                                  onClick={() => marcarComoEnviada(orden.numOC)}
                                  title="Marcar como enviada"
                                  disabled={loadingActions[`enviar-${orden.numOC}`] || orden.estado.nombreEstadoOC !== "PENDIENTE"}
                                >
                                  {loadingActions[`enviar-${orden.numOC}`] ? (
                                    <Loader2 size={16} className="animate-spin" />
                                  ) : (
                                    <ShoppingCart size={16} />
                                  )}
                                </button>


                                {/* Botón Finalizar */}
                                <button
                                    className={`bg-green-600 hover:bg-green-700 text-white p-2 rounded-full ${
                                    orden.estado.nombreEstadoOC !== "ENVIADA" ? "opacity-50 cursor-not-allowed" : ""
                                  }`}
                                  onClick={() => finalizarOrden(orden.numOC)}
                                  title="Finalizar orden"
                                  disabled={loadingActions[`finalizar-${orden.numOC}`]}
                                >
                                  {loadingActions[`finalizar-${orden.numOC}`] ? (
                                    <Loader2 size={16} className="animate-spin" />
                                  ) : (
                                    <Check size={16} />
                                  )}
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
          </>
        ) : (
          // Vista de ventas
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
                        Proveedor: {selectedArticle.proveedorPredeterminado?.nombreProveedor ?? 'Sin Proveedor'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Stats Cards - Solo para ventas */}
            <div className="flex flex-wrap gap-4 mb-6 justify-between">
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
                  <CardTitle className="text-sm font-medium text-gray-300">Monto Total Ventas</CardTitle>
                  <DollarSign className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-bold text-green-500">{formatPrice(stats.montoTotalVentas)}</div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700 flex-1">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-300">Valor Promedio de Ventas</CardTitle>
                  <DollarSign className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-bold text-blue-500">
                    {stats.totalVentas > 0 ? formatPrice(stats.montoTotalVentas / stats.totalVentas) : formatPrice(0)}
                  </div>
                </CardContent>
              </Card>

              {/* <Card className="bg-gray-800 border-gray-700 flex-1">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-300">Ganancia Estimada</CardTitle>
                  <DollarSign className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-bold text-green-500">{formatPrice(stats.montoTotalVentas * 0.3)}</div>
                </CardContent>
              </Card> */}
            </div>

            {/* Ventas Content */}
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
                                <TableCell></TableCell>
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
          </>
        )}
      </div>
    </div>
  )
}
