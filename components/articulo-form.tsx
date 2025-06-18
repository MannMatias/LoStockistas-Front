"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { X, Save, Loader2, Package, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"

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
  cgi: number
  loteOptimo: number
  puntoPedido: number
  inventarioMax: number
  stockSeguridad: number
  modeloInventario: "LOTEFIJO" | "INTERVALOFIJO"
  proveedorPredeterminado?: Proveedor
}

interface ArticuloFormProps {
  articulo?: Articulo | null
  proveedores: Proveedor[]
  onSave: () => void
  onCancel: () => void
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api"

export function ArticuloForm({ articulo, proveedores, onSave, onCancel }: ArticuloFormProps) {
  const [formData, setFormData] = useState({
    nombreArt: "",
    descripArt: "",
    demandaAnual: 0,
    costoAlmacenamiento: 0,
    costoPedido: 0,
    costoCompra: 0,
    stockActual: 0,
    cgi: 0,
    loteOptimo: 0,
    puntoPedido: 0,
    inventarioMax: 0,
    stockSeguridad: 0,
    modeloInventario: "LOTEFIJO" as "LOTEFIJO" | "INTERVALOFIJO",
    proveedorPredeterminado: null as Proveedor | null,
  })

  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const [proveedoresFiltrados, setProveedoresFiltrados] = useState<Proveedor[]>([])

  const cargarProveedoresFiltrados = async (articuloId: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/articulos/${articuloId}/proveedores`)
      if (response.ok) {
        const proveedoresRelacionados = await response.json()
        setProveedoresFiltrados(proveedoresRelacionados)
      }
    } catch (error) {
      console.error("Error cargando proveedores filtrados:", error)
      setProveedoresFiltrados(proveedores)
    }
  }

  useEffect(() => {
    if (articulo) {
      setFormData({
        nombreArt: articulo.nombreArt,
        descripArt: articulo.descripArt,
        demandaAnual: articulo.demandaAnual,
        costoAlmacenamiento: articulo.costoAlmacenamiento,
        costoPedido: articulo.costoPedido,
        costoCompra: articulo.costoCompra,
        stockActual: articulo.stockActual,
        cgi: articulo.cgi,
        loteOptimo: articulo.loteOptimo,
        puntoPedido: articulo.puntoPedido,
        inventarioMax: articulo.inventarioMax,
        stockSeguridad: articulo.stockSeguridad,
        modeloInventario: articulo.modeloInventario,
        proveedorPredeterminado: articulo.proveedorPredeterminado ?? null,
      })

      cargarProveedoresFiltrados(articulo.codArticulo)
    } else {
      setProveedoresFiltrados(proveedores)
    }
  }, [articulo, proveedores])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = articulo ? `${API_BASE_URL}/articulos/${articulo.codArticulo}` : `${API_BASE_URL}/articulos`
      const method = articulo ? "PUT" : "POST"

      const payload: any = {
        nombreArt: formData.nombreArt,
        descripArt: formData.descripArt,
        demandaAnual: formData.demandaAnual,
        stockActual: formData.stockActual,
        inventarioMax: formData.inventarioMax,
        stockSeguridad: formData.stockSeguridad,
        modeloInventario: formData.modeloInventario,
        proveedorPredeterminado: formData.proveedorPredeterminado,
      }

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`)

      toast({
        title: "Éxito",
        description: articulo ? "Artículo actualizado correctamente" : "Artículo creado correctamente",
      })

      onSave()
    } catch (error) {
      console.error("Error saving articulo:", error)
      toast({
        title: "Error",
        description: "No se pudo guardar el artículo",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <Card className="bg-gray-800/95 backdrop-blur-md border-gray-700/50 w-full max-w-5xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6 border-b border-gray-700/50">
          <CardTitle className="text-xl font-bold text-white flex items-center">
            <div className="w-8 h-8 bg-gradient-to-r from-red-600 to-red-700 rounded-lg flex items-center justify-center mr-3">
              <Package className="w-4 h-4 text-white" />
            </div>
            {articulo ? "Editar Artículo" : "Agregar Artículo"}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-full"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Información Básica */}
            <div className="space-y-6">
              <div className="flex items-center space-x-2 pb-3 border-b border-gray-700/30">
                <div className="w-6 h-6 bg-red-600/20 rounded-lg flex items-center justify-center">
                  <Package className="w-3 h-3 text-red-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Información Básica</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="nombreArt" className="text-gray-300 font-medium">
                    Nombre del Artículo <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    id="nombreArt"
                    value={formData.nombreArt}
                    onChange={(e) => handleInputChange("nombreArt", e.target.value)}
                    className="bg-gray-700/50 backdrop-blur-sm border-gray-600/50 text-white focus:border-red-500 focus:ring-red-500/20 h-12"
                    required
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="modeloInventario" className="text-gray-300 font-medium">
                    Modelo de Inventario <span className="text-red-400">*</span>
                  </Label>
                  <Select
                    value={formData.modeloInventario}
                    onValueChange={(value) => handleInputChange("modeloInventario", value)}
                  >
                    <SelectTrigger className="bg-gray-700/50 backdrop-blur-sm border-gray-600/50 text-white focus:border-red-500 focus:ring-red-500/20 h-12">
                      <SelectValue placeholder="Seleccionar modelo" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700 backdrop-blur-md">
                      <SelectItem value="LOTEFIJO" className="text-white hover:bg-gray-700/50">
                        Lote Fijo
                      </SelectItem>
                      <SelectItem value="INTERVALOFIJO" className="text-white hover:bg-gray-700/50">
                        Intervalo Fijo
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="descripArt" className="text-gray-300 font-medium">
                  Descripción <span className="text-red-400">*</span>
                </Label>
                <Textarea
                  id="descripArt"
                  value={formData.descripArt}
                  onChange={(e) => handleInputChange("descripArt", e.target.value)}
                  className="bg-gray-700/50 backdrop-blur-sm border-gray-600/50 text-white focus:border-red-500 focus:ring-red-500/20 min-h-[100px]"
                  rows={3}
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="proveedorPredeterminadoId" className="text-gray-300 font-medium">
                  Proveedor Predeterminado <span className="text-red-400">*</span>
                </Label>
                <Select
                  value={
                    formData.proveedorPredeterminado !== null
                      ? String(formData.proveedorPredeterminado.codProveedor)
                      : "none"
                  }
                  onValueChange={(value) => {
                    const selectedProveedor =
                      value === "none" ? null : proveedores.find((p) => p.codProveedor === Number(value)) || null
                    setFormData((prev) => ({
                      ...prev,
                      proveedorPredeterminado: selectedProveedor,
                    }))
                  }}
                  required
                >
                  <SelectTrigger className="bg-gray-700/50 backdrop-blur-sm border-gray-600/50 text-white focus:border-red-500 focus:ring-red-500/20 h-12">
                    <SelectValue placeholder="Seleccionar proveedor" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700 backdrop-blur-md">
                    <SelectItem value="none" className="text-white hover:bg-gray-700/50">
                      -- Ninguno --
                    </SelectItem>
                    {(articulo ? proveedoresFiltrados : proveedores).map((p) => (
                      <SelectItem
                        key={p.codProveedor}
                        value={String(p.codProveedor)}
                        className="text-white hover:bg-gray-700/50"
                      >
                        {p.nombreProveedor}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Stock y Parámetros */}
            <div className="space-y-6">
              <div className="flex items-center space-x-2 pb-3 border-b border-gray-700/30">
                <div className="w-6 h-6 bg-blue-600/20 rounded-lg flex items-center justify-center">
                  <Package className="w-3 h-3 text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Stock y Parámetros</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="demandaAnual" className="text-gray-300 font-medium">
                    Demanda Anual <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    id="demandaAnual"
                    type="number"
                    min={0}
                    value={formData.demandaAnual}
                    onChange={(e) => handleInputChange("demandaAnual", Number(e.target.value))}
                    className="bg-gray-700/50 backdrop-blur-sm border-gray-600/50 text-white focus:border-red-500 focus:ring-red-500/20 h-12"
                    required
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="stockActual" className="text-gray-300 font-medium">
                    Stock Actual <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    id="stockActual"
                    type="number"
                    min={0}
                    value={formData.stockActual}
                    onChange={(e) => handleInputChange("stockActual", Number(e.target.value))}
                    className="bg-gray-700/50 backdrop-blur-sm border-gray-600/50 text-white focus:border-red-500 focus:ring-red-500/20 h-12"
                    required
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="inventarioMax" className="text-gray-300 font-medium">
                    Inventario Máximo <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    id="inventarioMax"
                    type="number"
                    min={0}
                    value={formData.inventarioMax}
                    onChange={(e) => handleInputChange("inventarioMax", Number(e.target.value))}
                    className="bg-gray-700/50 backdrop-blur-sm border-gray-600/50 text-white focus:border-red-500 focus:ring-red-500/20 h-12"
                    required
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="stockSeguridad" className="text-gray-300 font-medium">
                  Stock Seguridad <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="stockSeguridad"
                  type="number"
                  min={0}
                  value={formData.stockSeguridad}
                  onChange={(e) => handleInputChange("stockSeguridad", Number(e.target.value))}
                  className="bg-gray-700/50 backdrop-blur-sm border-gray-600/50 text-white focus:border-red-500 focus:ring-red-500/20 h-12"
                />
              </div>
            </div>

            {/* Costos (Solo lectura) */}
            <div className="space-y-6">
              <div className="flex items-center space-x-2 pb-3 border-b border-gray-700/30">
                <div className="w-6 h-6 bg-yellow-600/20 rounded-lg flex items-center justify-center">
                  <Settings className="w-3 h-3 text-yellow-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Costos (Calculados Automáticamente)</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="costoCompra" className="text-gray-300 font-medium">
                    Costo Compra
                  </Label>
                  <Input
                    id="costoCompra"
                    type="number"
                    min={0}
                    step={0.01}
                    value={formData.costoCompra}
                    onChange={(e) => handleInputChange("costoCompra", Number(e.target.value))}
                    className="bg-gray-600/30 border-gray-600/30 text-gray-400 h-12"
                    required
                    disabled
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="cgi" className="text-gray-300 font-medium">
                    CGI
                  </Label>
                  <Input
                    id="cgi"
                    type="number"
                    min={0}
                    step={0.01}
                    value={formData.cgi}
                    onChange={(e) => handleInputChange("cgi", Number(e.target.value))}
                    className="bg-gray-600/30 border-gray-600/30 text-gray-400 h-12"
                    required
                    disabled
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="costoAlmacenamiento" className="text-gray-300 font-medium">
                    Costo Almacenamiento
                  </Label>
                  <Input
                    id="costoAlmacenamiento"
                    type="number"
                    min={0}
                    step={0.01}
                    value={formData.costoAlmacenamiento}
                    onChange={(e) => handleInputChange("costoAlmacenamiento", Number(e.target.value))}
                    className="bg-gray-600/30 border-gray-600/30 text-gray-400 h-12"
                    required
                    disabled
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="loteOptimo" className="text-gray-300 font-medium">
                    Lote Óptimo
                  </Label>
                  <Input
                    id="loteOptimo"
                    type="number"
                    min={0}
                    value={formData.loteOptimo}
                    onChange={(e) => handleInputChange("loteOptimo", Number(e.target.value))}
                    className="bg-gray-600/30 border-gray-600/30 text-gray-400 h-12"
                    required
                    disabled
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="puntoPedido" className="text-gray-300 font-medium">
                    Punto de Pedido
                  </Label>
                  <Input
                    id="puntoPedido"
                    type="number"
                    min={0}
                    value={formData.puntoPedido}
                    onChange={(e) => handleInputChange("puntoPedido", Number(e.target.value))}
                    className="bg-gray-600/30 border-gray-600/30 text-gray-400 h-12"
                    required
                    disabled
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="costoPedido" className="text-gray-300 font-medium">
                    Costo Pedido
                  </Label>
                  <Input
                    id="costoPedido"
                    type="number"
                    min={0}
                    step={0.01}
                    value={formData.costoPedido}
                    onChange={(e) => handleInputChange("costoPedido", Number(e.target.value))}
                    className="bg-gray-600/30 border-gray-600/30 text-gray-400 h-12"
                    required
                    disabled
                  />
                </div>
              </div>
            </div>

            {/* Botones */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-700/30">
              <Button
                type="button"
                variant="ghost"
                onClick={onCancel}
                disabled={loading}
                className="text-gray-400 hover:text-white hover:bg-gray-700/50"
              >
                Cancelar
              </Button>
              <Button
                className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg"
                type="submit"
                disabled={loading || formData.stockActual <= 0}
              >
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Guardar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
