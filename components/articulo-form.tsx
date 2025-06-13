"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { X, Save, Loader2 } from "lucide-react"
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

interface ArticuloCreacionFormProps {
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
      // En caso de error, usar todos los proveedores
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

      // Cargar proveedores filtrados para edición
      cargarProveedoresFiltrados(articulo.codArticulo)
    } else {
      // Para creación, usar todos los proveedores
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="bg-gray-800 border-gray-700 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-white">{articulo ? "Editar Artículo" : "Agregar Artículo"}</CardTitle>
          <Button variant="ghost" size="sm" onClick={onCancel} className="text-gray-400 hover:text-white">
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Información Básica */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white border-b border-gray-700 pb-2">Información Básica</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nombreArt" className="text-white">
                    Nombre del Artículo <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="nombreArt"
                    value={formData.nombreArt}
                    onChange={(e) => handleInputChange("nombreArt", e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="modeloInventario" className="text-white">
                    Modelo de Inventario <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.modeloInventario}
                    onValueChange={(value) => handleInputChange("modeloInventario", value)}
                  >
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                      <SelectValue placeholder="Seleccionar modelo" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-700 border-gray-600">
                      <SelectItem value="LOTEFIJO" className="text-white hover:bg-gray-600">
                        Lote Fijo
                      </SelectItem>
                      <SelectItem value="INTERVALOFIJO" className="text-white hover:bg-gray-600">
                        Intervalo Fijo
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="descripArt" className="text-white">
                  Descripción <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="descripArt"
                  value={formData.descripArt}
                  onChange={(e) => handleInputChange("descripArt", e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="proveedorPredeterminadoId" className="text-white">
                  Proveedor Predeterminado <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={
                    formData.proveedorPredeterminado !== null ? String(formData.proveedorPredeterminado.codProveedor) : "none"
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
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">Proveedor</SelectTrigger>

                  <SelectContent className="bg-gray-700 border-gray-600 text-white">
                    <SelectItem value="none">-- Ninguno --</SelectItem>
                    {(articulo ? proveedoresFiltrados : proveedores).map((p) => (
                      <SelectItem key={p.codProveedor} value={String(p.codProveedor)}>
                        {p.nombreProveedor}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Costos y Stock */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="demandaAnual" className="text-white">
                  Demanda Anual <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="demandaAnual"
                  type="number"
                  min={0}
                  value={formData.demandaAnual}
                  onChange={(e) => handleInputChange("demandaAnual", Number(e.target.value))}
                  className="bg-gray-700 border-gray-600 text-white"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stockActual" className="text-white">
                  Stock Actual <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="stockActual"
                  type="number"
                  min={0}
                  value={formData.stockActual}
                  onChange={(e) => handleInputChange("stockActual", Number(e.target.value))}
                  className="bg-gray-700 border-gray-600 text-white"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="inventarioMax" className="text-white">
                  Inventario Máximo <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="inventarioMax"
                  type="number"
                  min={0}
                  value={formData.inventarioMax}
                  onChange={(e) => handleInputChange("inventarioMax", Number(e.target.value))}
                  className="bg-gray-700 border-gray-600 text-white"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="stockSeguridad" className="text-white">
                Stock Seguridad <span className="text-red-500">*</span>
              </Label>
              <Input
                id="stockSeguridad"
                type="number"
                min={0}
                value={formData.stockSeguridad}
                onChange={(e) => handleInputChange("stockSeguridad", Number(e.target.value))}
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="costoCompra" className="text-white">
                  Costo Compra
                </Label>
                <Input
                  id="costoCompra"
                  type="number"
                  min={0}
                  step={0.01}
                  value={formData.costoCompra}
                  onChange={(e) => handleInputChange("costoCompra", Number(e.target.value))}
                  className="bg-gray-700 border-gray-600 text-white"
                  required
                  disabled
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cgi" className="text-white">
                  CGI
                </Label>
                <Input
                  id="cgi"
                  type="number"
                  min={0}
                  step={0.01}
                  value={formData.cgi}
                  onChange={(e) => handleInputChange("cgi", Number(e.target.value))}
                  className="bg-gray-700 border-gray-600 text-white"
                  required
                  disabled
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="costoAlmacenamiento" className="text-white">
                  Costo Almacenamiento
                </Label>
                <Input
                  id="costoAlmacenamiento"
                  type="number"
                  min={0}
                  step={0.01}
                  value={formData.costoAlmacenamiento}
                  onChange={(e) => handleInputChange("costoAlmacenamiento", Number(e.target.value))}
                  className="bg-gray-700 border-gray-600 text-white"
                  required
                  disabled
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="loteOptimo" className="text-white">
                  Lote Óptimo
                </Label>
                <Input
                  id="loteOptimo"
                  type="number"
                  min={0}
                  value={formData.loteOptimo}
                  onChange={(e) => handleInputChange("loteOptimo", Number(e.target.value))}
                  className="bg-gray-700 border-gray-600 text-white"
                  required
                  disabled
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="puntoPedido" className="text-white">
                  Punto de Pedido
                </Label>
                <Input
                  id="puntoPedido"
                  type="number"
                  min={0}
                  value={formData.puntoPedido}
                  onChange={(e) => handleInputChange("puntoPedido", Number(e.target.value))}
                  className="bg-gray-700 border-gray-600 text-white"
                  required
                  disabled
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="costoPedido" className="text-white">
                  Costo Pedido
                </Label>
                <Input
                  id="costoPedido"
                  type="number"
                  min={0}
                  step={0.01}
                  value={formData.costoPedido}
                  onChange={(e) => handleInputChange("costoPedido", Number(e.target.value))}
                  className="bg-gray-700 border-gray-600 text-white"
                  required
                  disabled
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 text-white">
              <Button type="button" variant="ghost" onClick={onCancel} disabled={loading}>
                Cancelar
              </Button>
              <Button
                className="bg-red-600 hover:bg-red-700"
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
