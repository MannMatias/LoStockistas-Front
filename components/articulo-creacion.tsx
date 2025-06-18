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
  //costoAlmacenamiento: number
  //costoPedido: number
  //costoCompra: number
  stockActual: number
  fechaHoraBajaArticulo?: string
  //cgi: number
  //loteOptimo: number
  //puntoPedido: number
  inventarioMax: number
  stockSeguridad: number
  nivelServicio: number
  desviacionEstandar: number
  modeloInventario: "LOTEFIJO" | "INTERVALOFIJO"
  //proveedorPredeterminado: Proveedor
}

interface ArticuloCreacionFormProps {
  articulo?: Articulo | null
  onSave: () => void
  onCancel: () => void
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api"

export function ArticuloCreacion({ articulo, onSave, onCancel }: ArticuloCreacionFormProps) {
  const [formData, setFormData] = useState({
    nombreArt: "",
    descripArt: "",
    demandaAnual: 0,
    stockActual: 0,
    inventarioMax: 0,
    stockSeguridad: 0,
    nivelServicio: 0,
    desviacionEstandar: 0,
    modeloInventario: "LOTEFIJO" as "LOTEFIJO" | "INTERVALOFIJO",
    archivo: null as File | null,
  })

  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (articulo) {
      setFormData({
        nombreArt: articulo.nombreArt,
        descripArt: articulo.descripArt,
        demandaAnual: articulo.demandaAnual,
        stockActual: articulo.stockActual,
        inventarioMax: articulo.inventarioMax,
        stockSeguridad: articulo.stockSeguridad,
        nivelServicio: articulo.nivelServicio ?? 0,
        desviacionEstandar: articulo.desviacionEstandar ?? 0,
        modeloInventario: articulo.modeloInventario,
        archivo: null,
      })
    }
  }, [articulo])

 // ← 1) handleInputChange A NIVEL DE COMPONENTE
  const handleInputChange = (field: keyof typeof formData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }))
  }

  // ← 2) handleFileChange A NIVEL DE COMPONENTE
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null
    setFormData(prev => ({ ...prev, archivo: file }))
  }

  // ← 3) handleSubmit A NIVEL DE COMPONENTE
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const fd = new FormData()
      fd.append("nombreArt", formData.nombreArt)
      fd.append("descripArt", formData.descripArt)
      fd.append("demandaAnual", String(formData.demandaAnual))
      fd.append("stockActual", String(formData.stockActual))
      fd.append("inventarioMax", String(formData.inventarioMax))
      fd.append("stockSeguridad", String(formData.stockSeguridad))
      fd.append("nivelServicio", String(formData.nivelServicio))
      fd.append("desviacionEstandar", String(formData.desviacionEstandar))
      fd.append("modeloInventario", formData.modeloInventario)
      if (formData.archivo) {
        fd.append("archivo", formData.archivo)
      }

      const response = await fetch(
        `${API_BASE_URL}/articulos/con-imagen`,
        { method: "POST", body: fd }
      )
      if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`)

      toast({ title: "Éxito", description: "Artículo creado correctamente" })
      onSave()
    } catch (error) {
      console.error("Error saving articulo:", error)
      toast({ title: "Error", description: "No se pudo guardar el artículo", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="bg-gray-800 border-gray-700 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex justify-between pb-4">
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
                    Nombre del Artículo *
                  </Label>
                  <Input
                    id="nombreArt"
                    value={formData.nombreArt}
                    onChange={e => handleInputChange("nombreArt", e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="modeloInventario" className="text-white">
                    Modelo de Inventario *
                  </Label>
                  <Select
                    value={formData.modeloInventario}
                    onValueChange={value => handleInputChange("modeloInventario", value)}
                  >
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                      <SelectValue placeholder="Seleccionar modelo" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-700 border-gray-600">
                      <SelectItem value="LOTEFIJO">Lote Fijo</SelectItem>
                      <SelectItem value="INTERVALOFIJO">Intervalo Fijo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="descripArt" className="text-white">
                  Descripción *
                </Label>
                <Textarea
                  id="descripArt"
                  value={formData.descripArt}
                  onChange={e => handleInputChange("descripArt", e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                  rows={3}
                  required
                />
              </div>
            </div>

            {/* Costos y Stock */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/** Demanda Anual */}
              <div className="space-y-2">
                <Label htmlFor="demandaAnual" className="text-white">
                  Demanda Anual *
                </Label>
                <Input
                  id="demandaAnual"
                  type="number"
                  min={0}
                  value={formData.demandaAnual}
                  onChange={e => handleInputChange("demandaAnual", Number(e.target.value))}
                  className="bg-gray-700 border-gray-600 text-white"
                  required
                />
              </div>
              {/** Stock Actual */}
              <div className="space-y-2">
                <Label htmlFor="stockActual" className="text-white">
                  Stock Actual *
                </Label>
                <Input
                  id="stockActual"
                  type="number"
                  min={0}
                  value={formData.stockActual}
                  onChange={e => handleInputChange("stockActual", Number(e.target.value))}
                  className="bg-gray-700 border-gray-600 text-white"
                  required
                />
              </div>
              {/** Inventario Máximo */}
              <div className="space-y-2">
                <Label htmlFor="inventarioMax" className="text-white">
                  Inventario Máximo *
                </Label>
                <Input
                  id="inventarioMax"
                  type="number"
                  min={0}
                  value={formData.inventarioMax}
                  onChange={e => handleInputChange("inventarioMax", Number(e.target.value))}
                  className="bg-gray-700 border-gray-600 text-white"
                  required
                />
              </div>
            </div>
            {/** Stock Seguridad */}
            <div className="space-y-2">
              <Label htmlFor="stockSeguridad" className="text-white">
                Stock Seguridad *
              </Label>
              <Input
                id="stockSeguridad"
                type="number"
                min={0}
                value={formData.stockSeguridad}
                onChange={e => handleInputChange("stockSeguridad", Number(e.target.value))}
                className="bg-gray-700 border-gray-600 text-white"
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nivelServicio" className="text-white">
                  Nivel de Servicio %
                </Label>
                <Input
                  id="nivelServicio"
                  type="number"
                  min={0}
                  max={100}
                  value={formData.nivelServicio}
                  onChange={e => handleInputChange("nivelServicio", Number(e.target.value))}
                  className="bg-gray-700 border-gray-600 text-white"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="desviacionEstandar" className="text-white">
                  Desviación Estándar
                </Label>
                <Input
                  id="desviacionEstandar"
                  type="number"
                  min={0}
                  value={formData.desviacionEstandar}
                  onChange={e => handleInputChange("desviacionEstandar", Number(e.target.value))}
                  className="bg-gray-700 border-gray-600 text-white"
                  required
                />
              </div>
            </div>

            {/** Campo de archivo */}
            <div className="space-y-2">
              <Label htmlFor="archivo" className="text-white">
                Imagen del Artículo
              </Label>
              <Input
                id="archivo"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>

            {/** Botones */}
            <div className="flex justify-end space-x-2 text-white">
              <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading || formData.stockActual <= 0}>
                {loading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
                Guardar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}