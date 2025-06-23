"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { X, ShoppingCart, Loader2, Package, User, Calculator, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

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
  stockActual: number
  loteOptimo: number
  puntoPedido: number
  inventarioMax: number
  proveedorPredeterminado: Proveedor | null
  modeloInventario: string
}

interface ArticuloProveedorInfo {
  proveedor: Proveedor
  precioUnitario: number
  demoraEntregaDias: number
}

interface OrdenCompraActiva {
  numOC: number
  estado: {
    nombreEstadoOC: string
  }
}

interface OrdenCompraDialogProps {
  articulo: Articulo
  onSave: () => void
  onCancel: () => void
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api"

export function OrdenCompraDialog({ articulo, onSave, onCancel }: OrdenCompraDialogProps) {
  const [cantidad, setCantidad] = useState(articulo.loteOptimo)
  const [proveedoresInfo, setProveedoresInfo] = useState<ArticuloProveedorInfo[]>([])
  const [selectedProviderInfo, setSelectedProviderInfo] = useState<ArticuloProveedorInfo | null>(null)
  const [selectedProviderCode, setSelectedProviderCode] = useState<string>("")
  const [ordenesActivas, setOrdenesActivas] = useState<OrdenCompraActiva[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingInitialData, setLoadingInitialData] = useState(true)
  const [error, setError] = useState<string>("")
  const [showConfirmation, setShowConfirmation] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    async function fetchInitialData() {
      setLoadingInitialData(true)
      try {
        const response = await fetch(`${API_BASE_URL}/articulos-proveedores/articulo/${articulo.codArticulo}`)

        if (response.ok) {
          const dataFromApi: any[] = await response.json()

          // Mapear la nueva estructura de la API a la que espera el componente (ArticuloProveedorInfo)
          const processedData: ArticuloProveedorInfo[] = dataFromApi.map(item => ({
            proveedor: item.proveedorDTOOutput,
            precioUnitario: item.precioUnitario ?? 0,
            demoraEntregaDias: item.demoraEntregaDias ?? 0,
          }))

          // Filtrar cualquier proveedor nulo o incompleto
          const validProviders = processedData.filter(p => p && p.proveedor)
          setProveedoresInfo(validProviders)

          // Seleccionar el proveedor predeterminado de forma segura
          let initialProvider: ArticuloProveedorInfo | undefined | null = null
          if (articulo.proveedorPredeterminado) {
            initialProvider = validProviders.find(
              (p: ArticuloProveedorInfo) => p.proveedor.codProveedor === articulo.proveedorPredeterminado?.codProveedor
            )
          }
          // Si no hay predeterminado o no se encontró, seleccionar el primero de la lista
          if (!initialProvider && validProviders.length > 0) {
            initialProvider = validProviders[0]
          }

          if (initialProvider) {
            setSelectedProviderInfo(initialProvider)
            setSelectedProviderCode(initialProvider.proveedor.codProveedor.toString())
          } else {
            setSelectedProviderInfo(null)
            setSelectedProviderCode("")
          }
        }

        const ordenesResponse = await fetch(`${API_BASE_URL}/ordenes/articulo/${articulo.codArticulo}/activas`)
        if (ordenesResponse.ok) {
          const text = await ordenesResponse.text()
          if (text.trim()) {
            try {
              setOrdenesActivas(JSON.parse(text))
            } catch (parseError) {
              console.error("Error parsing JSON:", parseError)
              setOrdenesActivas([])
            }
          } else {
            // Respuesta vacía
            setOrdenesActivas([])
          }
        } else if (ordenesResponse.status === 204) {
          // Si la respuesta es 204 No Content, asumimos que no hay órdenes activas.
          setOrdenesActivas([])
        } else {
          // Para otros errores, también asumimos que no hay órdenes activas
          setOrdenesActivas([])
        }
      } catch (error) {
        console.error("Error fetching initial data:", error)
        toast({ title: "Error", description: "No se pudo cargar la información de la orden.", variant: "destructive" })
      } finally {
        setLoadingInitialData(false)
      }
    }

    fetchInitialData()
  }, [articulo.codArticulo, articulo.proveedorPredeterminado, toast])

  const precioUnitario = selectedProviderInfo?.precioUnitario || 0
  const montoTotal = cantidad * precioUnitario
  const stockResultante = articulo.stockActual + cantidad

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    
    if (!selectedProviderInfo) {
      toast({ title: "Error", description: "Debe seleccionar un proveedor.", variant: "destructive" })
      return
    }

    // Verificar si es modelo Lote Fijo y si la cantidad no alcanza el punto de pedido
    if (articulo.modeloInventario === "LOTEFIJO") {
      const stockResultante = articulo.stockActual + cantidad
      if (stockResultante <= articulo.puntoPedido) {
        setShowConfirmation(true)
        return
      }
    }

    // Si no necesita confirmación, proceder directamente
    await submitOrder()
  }

  const submitOrder = async () => {
    setLoading(true)
    try {
      const ordenCompraData = {
        cantidad: cantidad,
        codArticulo: articulo.codArticulo,
        codProveedor: selectedProviderInfo!.proveedor.codProveedor,
      }
      const response = await fetch(`${API_BASE_URL}/ordenes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ordenCompraData),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`)
      }
      toast({ title: "Éxito", description: "Orden de compra creada correctamente." })
      onSave()
    } catch (error) {
      console.error("Error creating orden compra:", error)
      const errorMessage = error instanceof Error ? error.message : "No se pudo crear la orden de compra."
      setError(errorMessage)
      toast({ title: "Error", description: errorMessage, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmOrder = async () => {
    setShowConfirmation(false)
    await submitOrder()
  }

  const handleCancelOrder = () => {
    setShowConfirmation(false)
  }

  const formatPrice = (price: number) => `$${price.toLocaleString("es-AR", { minimumFractionDigits: 2 })}`

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <Card className="bg-gray-800/95 backdrop-blur-md border-gray-700/50 w-full max-w-2xl max-h-[85vh] overflow-hidden shadow-2xl">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6 border-b border-gray-700/50">
          <CardTitle className="text-xl font-bold text-white flex items-center">
            <div className="w-8 h-8 bg-gradient-to-r from-red-600 to-red-700 rounded-lg flex items-center justify-center mr-3">
              <ShoppingCart className="w-4 h-4 text-white" />
            </div>
            Crear Orden de Compra
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onCancel} className="text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-full">
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="p-6 overflow-y-auto max-h-[calc(85vh-120px)]">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-2 pb-3 border-b border-gray-700/30">
                <div className="w-6 h-6 bg-blue-600/20 rounded-lg flex items-center justify-center"><Package className="w-3 h-3 text-blue-400" /></div>
                <h3 className="text-lg font-semibold text-white">Información del Artículo</h3>
              </div>
              <div className="bg-gray-700/30 backdrop-blur-sm rounded-xl p-4 space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex justify-between"><span className="text-gray-400 font-medium">Artículo:</span><span className="text-white font-semibold">{articulo.nombreArt}</span></div>
                  <div className="flex justify-between"><span className="text-gray-400 font-medium">Código:</span><span className="text-white">#{articulo.codArticulo}</span></div>
                  <div className="flex justify-between"><span className="text-gray-400 font-medium">Stock Actual:</span><span className="text-white font-bold">{articulo.stockActual}</span></div>
                  <div className="flex justify-between"><span className="text-gray-400 font-medium">Punto de Pedido:</span><span className="text-yellow-400 font-bold">{articulo.puntoPedido}</span></div>
                  <div className="flex justify-between"><span className="text-gray-400 font-medium">Lote Óptimo:</span><span className="text-green-400 font-bold">{articulo.loteOptimo}</span></div>
                  <div className="flex justify-between"><span className="text-gray-400 font-medium">Modelo:</span><span className="text-white">{articulo.modeloInventario === "LOTEFIJO" ? "Lote Fijo" : "Intervalo Fijo"}</span></div>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center space-x-2 pb-3 border-b border-gray-700/30">
                <div className="w-6 h-6 bg-green-600/20 rounded-lg flex items-center justify-center"><User className="w-3 h-3 text-green-400" /></div>
                <h3 className="text-lg font-semibold text-white">Proveedor</h3>
              </div>
              {loadingInitialData ? (
                <div className="text-center p-4"><Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" /><p className="text-sm text-gray-400 mt-2">Cargando datos...</p></div>
              ) : (
                <div className="space-y-3">
                  <Label htmlFor="proveedor" className="text-gray-300 font-medium ">Seleccionar Proveedor</Label>
                  <Select
                    value={selectedProviderCode}
                    onValueChange={(newCode) => {
                      setSelectedProviderCode(newCode)
                      const newSelected = proveedoresInfo.find(p => p.proveedor.codProveedor.toString() === newCode)
                      setSelectedProviderInfo(newSelected || null)
                    }}
                    disabled={proveedoresInfo.length === 0}
                  >
                    <SelectTrigger className="bg-gray-700/50 backdrop-blur-sm border-gray-600/50 text-white focus:border-red-500 focus:ring-red-500/20 h-12">
                      <SelectValue placeholder="Seleccionar un proveedor" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700 backdrop-blur-md text-white">
                      {proveedoresInfo.map((info) => (
                        <SelectItem key={info.proveedor.codProveedor} value={info.proveedor.codProveedor.toString()}>
                          {info.proveedor.nombreProveedor}
                          {info.proveedor.codProveedor === articulo.proveedorPredeterminado?.codProveedor && " (Predeterminado)"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedProviderInfo && (
                    <div className="text-xs text-gray-400 pt-2">
                      Precio: {formatPrice(selectedProviderInfo.precioUnitario)} • Demora: {selectedProviderInfo.demoraEntregaDias} días
                    </div>
                  )}
                </div>
              )}
            </div>
            {ordenesActivas.length > 0 && (
              <Alert variant="destructive" className="bg-yellow-900/50 border-yellow-700 text-yellow-300">
                <AlertTriangle className="h-4 w-4 !text-yellow-400" /><AlertTitle>Atención: Órdenes Activas</AlertTitle>
                <AlertDescription>
                  Este artículo ya tiene {ordenesActivas.length} orden(es) de compra activa(s):
                  <ul className="list-disc pl-5 mt-2">{ordenesActivas.map(o => <li key={o.numOC}>OC #{o.numOC} - Estado: {o.estado.nombreEstadoOC}</li>)}</ul>
                </AlertDescription>
              </Alert>
            )}
            {error && (
              <Alert variant="destructive" className="bg-red-900/50 border-red-700 text-red-300">
                <AlertTriangle className="h-4 w-4 !text-red-400" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 pb-3 border-b border-gray-700/30">
                <div className="w-6 h-6 bg-purple-600/20 rounded-lg flex items-center justify-center"><Calculator className="w-3 h-3 text-purple-400" /></div>
                <h3 className="text-lg font-semibold text-white">Detalles de la Orden</h3>
              </div>
              <div className="space-y-4">
                <div className="space-y-3">
                  <Label htmlFor="cantidad" className="text-gray-300 font-medium">Cantidad a Ordenar</Label>
                  <Input id="cantidad" type="number" min="1" value={cantidad} onChange={(e) => setCantidad(Number.parseInt(e.target.value) || 0)} className="bg-gray-700/50 backdrop-blur-sm border-gray-600/50 text-white focus:border-red-500 focus:ring-red-500/20 h-12" required />
                </div>
                <div className="bg-gradient-to-r from-gray-700/30 to-gray-600/30 backdrop-blur-sm rounded-xl p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex justify-between"><span className="text-gray-400 font-medium">Cantidad:</span><span className="text-white font-bold">{cantidad} unidades</span></div>
                    <div className="flex justify-between"><span className="text-gray-400 font-medium">Precio Unitario:</span><span className="text-white font-bold">{formatPrice(precioUnitario)}</span></div>
                  </div>
                  <div className="border-t border-gray-600/50 pt-4">
                    <div className="flex justify-between items-center text-lg"><span className="text-gray-300 font-semibold">Total:</span><span className="text-red-400 font-bold text-xl">{formatPrice(montoTotal)}</span></div>
                    <div className="flex justify-between items-center mt-2"><span className="text-gray-400 font-medium">Stock Resultante:</span><span className={`font-bold ${stockResultante <= articulo.puntoPedido ? 'text-red-400' : 'text-green-400'}`}>{stockResultante} unidades</span></div>
                    {articulo.modeloInventario === "LOTEFIJO" && stockResultante <= articulo.puntoPedido && (
                      <div className="mt-3 p-2 bg-yellow-900/30 border border-yellow-700/50 rounded-md">
                        <div className="flex items-center text-yellow-300 text-sm">
                          <AlertTriangle className="w-4 h-4 mr-2 text-yellow-400" />
                          <span>⚠️ Esta orden requerirá confirmación (no supera el punto de pedido)</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-700/30">
              <Button type="button" variant="ghost" onClick={onCancel} className="text-gray-400 hover:text-white hover:bg-gray-700/50">Cancelar</Button>
              <Button type="submit" disabled={loading} className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg">
                {loading ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creando...</>) : (<> <ShoppingCart className="w-4 h-4 mr-2" /> Crear Orden </>)}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Popup de confirmación */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
          <Card className="bg-gray-800/95 backdrop-blur-md border-gray-700/50 w-full max-w-md shadow-2xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6 border-b border-gray-700/50">
              <CardTitle className="text-lg font-bold text-white flex items-center">
                <div className="w-8 h-8 bg-gradient-to-r from-yellow-600 to-yellow-700 rounded-lg flex items-center justify-center mr-3">
                  <AlertTriangle className="w-4 h-4 text-white" />
                </div>
                Confirmar Orden
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <Alert variant="destructive" className="bg-yellow-900/50 border-yellow-700 text-yellow-300 mb-4">
                <AlertTriangle className="h-4 w-4 !text-yellow-400" />
                <AlertTitle>Atención</AlertTitle>
                <AlertDescription>
                  Con esta orden, el stock resultante ({stockResultante} unidades) 
                  no superará el punto de pedido ({articulo.puntoPedido} unidades) para el modelo Lote Fijo.
                  <br /><br />
                  ¿Desea continuar con la orden de todas formas?
                </AlertDescription>
              </Alert>
              
              <div className="flex justify-end space-x-3">
                <Button
                  variant="ghost"
                  onClick={handleCancelOrder}
                  className="text-gray-400 hover:text-white hover:bg-gray-700/50"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleConfirmOrder}
                  className="bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800 text-white shadow-lg"
                >
                  Confirmar Orden
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
