"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { X, Save, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
  stockSeguridadLF: number
  stockSeguridadIF: number
  modeloInventario: "LOTEFIJO" | "INTERVALOFIJO"
  proveedorPredeterminado: Proveedor
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
    stockSeguridadLF: 0,
    stockSeguridadIF: 0,
    modeloInventario: "LOTEFIJO" as "LOTEFIJO" | "INTERVALOFIJO",
    proveedorPredeterminadoId: 0,
  })

  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

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
        stockSeguridadLF: articulo.stockSeguridadLF,
        stockSeguridadIF: articulo.stockSeguridadIF,
        modeloInventario: articulo.modeloInventario,
        proveedorPredeterminadoId: articulo.proveedorPredeterminado.codProveedor,
      })
    }
  }, [articulo])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = articulo
        ? `${API_BASE_URL}/articulos/${articulo.codArticulo}`
        : `${API_BASE_URL}/articulos`

      const method = articulo ? "PUT" : "POST"

      // Encontrar el proveedor completo para enviarlo como objeto
      const proveedorSeleccionado = proveedores.find(
        (p) => p.codProveedor === formData.proveedorPredeterminadoId
      )

      if (!proveedorSeleccionado) {
        toast({
          title: "Error",
          description: "Debe seleccionar un proveedor válido",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      const payload = {
        ...formData,
        proveedorPredeterminado: {
          codProveedor: proveedorSeleccionado.codProveedor,
          nombreProveedor: proveedorSeleccionado.nombreProveedor,
          direccionProveedor: proveedorSeleccionado.direccionProveedor,
          telefonoProveedor: proveedorSeleccionado.telefonoProveedor,
          emailProveedor: proveedorSeleccionado.emailProveedor,
        },
      }

      // Eliminar el campo proveedorPredeterminadoId para evitar confusión
 //     delete payload.proveedorPredeterminadoId

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      toast({
        title: "Éxito",
        description: articulo
          ? "Artículo actualizado correctamente"
          : "Artículo creado correctamente",
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
          <CardTitle className="text-white">
            {articulo ? "Editar Artículo" : "Agregar Artículo"}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onCancel} className="text-gray-400 hover:text-white">
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Información Básica */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white border-b border-gray-700 pb-2">
                Información Básica
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nombreArt" className="text-white">
                    Nombre del Artículo
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
                    Modelo de Inventario
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
                  Descripción
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
                  Proveedor Predeterminado
                </Label>
                <Select
                  value={formData.proveedorPredeterminadoId.toString()}
                  onValueChange={(value) =>
                    handleInputChange("proveedorPredeterminadoId", Number.parseInt(value))
                  }
                >
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue placeholder="Seleccionar proveedor" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    {proveedores.map((proveedor) => (
                      <SelectItem
                        key={proveedor.codProveedor}
                        value={proveedor.codProveedor.toString()}
                        className="text-white hover:bg-gray-600"
                      >
                        {proveedor.nombreProveedor}
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
                  Demanda Anual
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
                />
              </div>
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
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stockActual" className="text-white">
                  Stock Actual
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
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="inventarioMax" className="text-white">
                  Inventario Máximo
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="stockSeguridadLF" className="text-white">
                  Stock Seguridad Lote Fijo
                </Label>
                <Input
                  id="stockSeguridadLF"
                  type="number"
                  min={0}
                  value={formData.stockSeguridadLF}
                  onChange={(e) => handleInputChange("stockSeguridadLF", Number(e.target.value))}
                  className="bg-gray-700 border-gray-600 text-white"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="stockSeguridadIF" className="text-white">
                  Stock Seguridad Intervalo Fijo
                </Label>
                <Input
                  id="stockSeguridadIF"
                  type="number"
                  min={0}
                  value={formData.stockSeguridadIF}
                  onChange={(e) => handleInputChange("stockSeguridadIF", Number(e.target.value))}
                  className="bg-gray-700 border-gray-600 text-white"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="ghost" onClick={onCancel} disabled={loading}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
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
