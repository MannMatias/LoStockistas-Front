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

interface Stats {
  totalOrdenes: number
  ordenesPendientes: number
  ordenesCompletadas: number
  ordenesEnProceso: number
  totalVentas: number
  montoTotalVentas: number
  montoTotalOrdenes: number
}

// Configuración de la API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "localhost:8080/api"

export default function OrdenesVentasPage() {
  const [activeTab, setActiveTab] = useState("ordenes")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedEstado, setSelectedEstado] = useState("Todos")
  const [ordenesCompra, setOrdenesCompra] = useState<OrdenCompra[]>([])
  const [ventas, setVentas] = useState<Venta[]>([])
  const [estadosOC, setEstadosOC] = useState<EstadoOC[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<Stats>({
    totalOrdenes: 0,
    ordenesPendientes: 0,
    ordenesCompletadas: 0,
    ordenesEnProceso: 0,
    totalVentas: 0,
    montoTotalVentas: 0,
    montoTotalOrdenes: 0,
  })
  const { toast } = useToast()

  // Función para obtener todas las órdenes de compra
  const fetchOrdenesCompra = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_BASE_URL}/ordenes`)

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      const data: OrdenCompra[] = await response.json()
      setOrdenesCompra(data)
      updateStats(data, ventas)
    } catch (error) {
      console.error("Error fetching ordenes de compra:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar las órdenes de compra",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Función para obtener todas las ventas
  const fetchVentas = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_BASE_URL}/ventas`)

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      const data: Venta[] = await response.json()
      setVentas(data)
      updateStats(ordenesCompra, data)
    } catch (error) {
      console.error("Error fetching ventas:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar las ventas",
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

  // Actualizar estadísticas
  const updateStats = (ordenes: OrdenCompra[], ventasData: Venta[]) => {
    const totalOrdenes = ordenes.length
    const ordenesPendientes = ordenes.filter((o) => o.estado.nombreEstadoOC === "Pendiente").length
    const ordenesCompletadas = ordenes.filter((o) => o.estado.nombreEstadoOC === "Completada").length
    const ordenesEnProceso = ordenes.filter((o) => o.estado.nombreEstadoOC === "En Proceso").length
    const totalVentas = ventasData.length
    const montoTotalVentas = ventasData.reduce(
      (total, v) => total + v.cantProducto * v.articulo.costoCompra * 1.3, // Asumiendo un margen del 30%
      0,
    )
    const montoTotalOrdenes = ordenes.reduce((total, o) => total + o.montoCompra, 0)

    setStats({
      totalOrdenes,
      ordenesPendientes,
      ordenesCompletadas,
      ordenesEnProceso,
      totalVentas,
      montoTotalVentas,
      montoTotalOrdenes,
    })
  }

  // Filtrar órdenes de compra
  const filteredOrdenes = ordenesCompra.filter((orden) => {
    const matchesSearch =
      orden.numOC.toString().includes(searchTerm) ||
      orden.proveedor.nombreProveedor.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesEstado = selectedEstado === "Todos" || orden.estado.nombreEstadoOC === selectedEstado
    return matchesSearch && matchesEstado
  })

  // Filtrar ventas
  const filteredVentas = ventas.filter((venta) => {
    return (
      venta.codVenta.toString().includes(searchTerm) ||
      venta.articulo.nombreArt.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case "Completada":
        return "bg-green-500"
      case "Pendiente":
        return "bg-yellow-500"
      case "En Proceso":
        return "bg-blue-500"
      case "Cancelada":
        return "bg-red-500"
      default:
        return "bg-gray-500"
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
    fetchOrdenesCompra()
    fetchVentas()
    fetchEstadosOC()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-red-500" />
          <p className="text-gray-400">Cargando datos...</p>
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
                  <ClipboardList className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-xl font-bold">Órdenes de Compra y Ventas</h1>
              </div>
            </div>
        {/* Botón que redirige a /ordenes-ventas */}
            <Button className="bg-white border-gray-700 text-gray-800 hover:bg-gray-700" onClick={() => window.location.href = '/' }>
             Visualizar Articulos
            </Button>
          </div>
        </div>

      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="flex flex-wrap gap-4 mb-6 justify-between">
          <Card className="bg-gray-800 border-gray-700 w-full">
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
          <TabsList className="bg-gray-800 border-gray-700 tex">
            <TabsTrigger value="ordenes" className="data-[state=active]:bg-red-600 
                                                    data-[state=active]:text-white 
                                                    data-[state=active]:hover:bg-red-700
                                                    data-[state=inactive]:hover:bg-gray-500
                                                    data-[state=inactive]:hover:text-gray-800">
              Órdenes de Compra
            </TabsTrigger>
            <TabsTrigger value="ventas" className=" data-[state=active]:bg-red-600 
                                                    data-[state=active]:text-white 
                                                    data-[state=active]:hover:bg-red-700                                         
                                                    data-[state=inactive]:hover:bg-gray-500
                                                    data-[state=inactive]:hover:text-gray-800">
              Ventas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ordenes" className="mt-4">
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
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border bg-background hover:text-accent-foreground h-10 px-4 py-2 border-gray-700 text-gray-800 hover:bg-gray-700"
                onClick={fetchOrdenesCompra}
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
                      <TableHead className="text-gray-400">Entrega Estimada</TableHead>
                      <TableHead className="text-gray-400">Cantidad</TableHead>
                      <TableHead className="text-gray-400 text-right">Monto</TableHead>
                      <TableHead className="text-gray-400 w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrdenes.length > 0 ? (
                      filteredOrdenes.map((orden) => (
                        <TableRow key={orden.numOC} className="border-gray-700 hover:bg-gray-700">
                          <TableCell className="font-medium text-white">#{orden.numOC}</TableCell>
                          <TableCell>{orden.proveedor.nombreProveedor}</TableCell>
                          <TableCell>
                            <Badge className={`${getEstadoColor(orden.estado.nombreEstadoOC)} text-white`}>
                              {orden.estado.nombreEstadoOC}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatDate(orden.fechaCreacion)}</TableCell>
                          <TableCell>{formatDate(orden.fechaEntregaEstimada)}</TableCell>
                          <TableCell>{orden.cantArt}</TableCell>
                          <TableCell className="text-right font-semibold text-red-400">
                            {formatPrice(orden.montoCompra)}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-gray-400 hover:text-white"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent className="bg-gray-800 border-gray-700">
                                <DropdownMenuItem className="text-white hover:bg-gray-700">
                                  Ver Detalles
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-white hover:bg-gray-700">
                                  Cambiar Estado
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow className="border-gray-700 ">
                        <TableCell colSpan={8} className="h-24 text-center text-gray-400 hover:bg-gray-700 bg-gray-800">
                          No se encontraron órdenes de compra
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ventas" className="mt-4">
            {/* Filters for Ventas */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar ventas por número o artículo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                />
              </div>

              <Button variant="outline" className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border bg-background hover:text-accent-foreground h-10 px-4 py-2 border-gray-700 text-gray-800 hover:bg-gray-700" onClick={fetchVentas}>
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
                        const precioUnitario = venta.articulo.costoCompra * 1.3 // Asumiendo un margen del 30%
                        const total = venta.cantProducto * precioUnitario

                        return (
                          <TableRow key={venta.codVenta} className="border-gray-700 hover:bg-gray-700">
                            <TableCell className="font-medium text-white">#{venta.codVenta}</TableCell>
                            <TableCell>{venta.articulo.nombreArt}</TableCell>
                            <TableCell>{venta.articulo.codArticulo}</TableCell>
                            <TableCell>{formatDate(venta.fechaVenta)}</TableCell>
                            <TableCell>{venta.cantProducto}</TableCell>
                            <TableCell>{formatPrice(precioUnitario)}</TableCell>
                            <TableCell className="text-right font-semibold text-green-400">
                              {formatPrice(total)}
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 text-gray-400 hover:text-white"
                                  >
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="bg-gray-800 border-gray-700">
                                  <DropdownMenuItem className="text-white hover:bg-gray-700">
                                    Ver Detalles
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="text-white hover:bg-gray-700">
                                    Imprimir Factura
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        )
                      })
                    ) : (
                      <TableRow className="border-gray-700">
                        <TableCell colSpan={8} className="h-24 text-center text-gray-400 hover:bg-gray-700 bg-gray-800">
                          No se encontraron ventas
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
