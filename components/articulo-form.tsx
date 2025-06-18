"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { X, Save, Loader2, Package, Settings } from 'lucide-react'
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
  stockActual: number
  fechaHoraBajaArticulo?: string
  inventarioMax: number
  stockSeguridad: number
  nivelServicio: number
  desviacionEstandar: number
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
    stockActual: 0,
    inventarioMax: 0,
    stockSeguridad: 0,
    nivelServicio: 0,
    desviacionEstandar: 0,
    modeloInventario: "LOTEFIJO" as "LOTEFIJO" | "INTERVALOFIJO" ,
    proveedorPredeterminado: null as Proveedor | null,
    archivo: null as File | null,
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
        stockActual: articulo.stockActual,
        inventarioMax: articulo.inventarioMax,
        stockSeguridad: articulo.stockSeguridad,
        nivelServicio: articulo.nivelServicio ?? 0,
        desviacionEstandar: articulo.desviacionEstandar ?? 0,
        modeloInventario: articulo.modeloInventario,
        proveedorPredeterminado: articulo.proveedorPredeterminado ?? null,
        archivo: null,
      })

      cargarProveedoresFiltrados(articulo.codArticulo)
    } else {
      setProveedoresFiltrados(proveedores)
    }
  }, [articulo, proveedores])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null
    setFormData((prev) => ({ ...prev, archivo: file }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (articulo) {
        // Edición - usar JSON
        const url = `${API_BASE_URL}/articulos/${articulo.codArticulo}`
        const payload = {
          nombreArt: formData.nombreArt,
          descripArt: formData.descripArt,
          demandaAnual: formData.demandaAnual,
          stockActual: formData.stockActual,
          inventarioMax: formData.inventarioMax,
          stockSeguridad: formData.stockSeguridad,
          nivelServicio: formData.nivelServicio,
          desviacionEstandar: formData.desviacionEstandar,
          modeloInventario: formData.modeloInventario,
          proveedorPredeterminado: formData.proveedorPredeterminado,
        }

        const response = await fetch(url, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })

        if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`)
      } else {
        // Creación - usar FormData para imagen
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

        const response = await fetch(`${API_BASE_URL}/articulos/con-imagen`, { 
          method: "POST", 
          body: fd 
        })
        
        if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

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
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="nivelServicio" className="text-gray-300 font-medium">
                    Nivel de Servicio %
                  </Label>
                  <Input
                    id="nivelServicio"
                    type="number"
                    min={0}
                    max={100}
                    value={formData.nivelServicio}
                    onChange={(e) => handleInputChange("nivelServicio", Number(e.target.value))}
                    className="bg-gray-700/50 backdrop-blur-sm border-gray-600/50 text-white focus:border-red-500 focus:ring-red-500/20 h-12"
                    required
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="desviacionEstandar" className="text-gray-300 font-medium">
                    Desviación Estándar
                  </Label>
                  <Input
                    id="desviacionEstandar"
                    type="number"
                    min={0}
                    value={formData.desviacionEstandar}
                    onChange={(e) => handleInputChange("desviacionEstandar", Number(e.target.value))}
                    className="bg-gray-700/50 backdrop-blur-sm border-gray-600/50 text-white focus:border-red-500 focus:ring-red-500/20 h-12"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Imagen */}
            <div className="space-y-6">
              <div className="flex items-center space-x-2 pb-3 border-b border-gray-700/30">
                <div className="w-6 h-6 bg-green-600/20 rounded-lg flex items-center justify-center">
                  <Package className="w-3 h-3 text-green-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Imagen</h3>
              </div>

              {!articulo && (
                <div className="space-y-3">
                  <Label htmlFor="archivo" className="text-gray-300 font-medium">
                    Imagen del Artículo
                  </Label>
                  <Input
                    id="archivo"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="bg-gray-700/50 backdrop-blur-sm border-gray-600/50 text-white focus:border-red-500 focus:ring-red-500/20 h-12 file:bg-red-600 file:text-white file:border-0 file:rounded-md file:px-4 file:py-2 file:mr-4"
                  />
                </div>
              )}
              
              {articulo && (
                <div className="text-gray-400 text-sm">
                  La imagen no se puede modificar durante la edición
                </div>
              )}
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
