"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { X, Save, Loader2, ShoppingCart, Package, DollarSign } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

interface Articulo {
  codArticulo: number
  nombreArt: string
  descripArt: string
  demandaAnual: number
  costoAlmacenamiento: number
  costoPedido: number
  costoCompra: number
  stockActual: number
  fechaHoraBajaArticulo: string | null
  loteOptimo: number
  puntoPedido: number
  inventarioMax: number
  stockSeguridad: number
  modeloInventario: string
  proveedorPredeterminado: {
    codProveedor: number
    nombreProveedor: string
    direccionProveedor: string
    telefonoProveedor: string
    emailProveedor: string
    fechaHoraBajaProveedor: string | null
  }
  cgi: number
}

interface OrdenFormProps {
  onClose: () => void
  articulos?: Articulo[]
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api"

export default function OrdenForm({ onClose, articulos: propArticulos }: OrdenFormProps) {
  const [formData, setFormData] = useState({
    codArticulo: "",
    cantidad: 1,
  })
  const [articulos, setArticulos] = useState<Articulo[]>(propArticulos || [])
  const [selectedArticulo, setSelectedArticulo] = useState<Articulo | null>(null)
  const [loading, setLoading] = useState(false)
  const [fetchingArticulos, setFetchingArticulos] = useState(!propArticulos)
  const { toast } = useToast()

  // Fetch artículos si no se proporcionaron como prop
  useEffect(() => {
    if (!propArticulos) {
      fetchArticulos()
    }
  }, [propArticulos])

  const fetchArticulos = async () => {
    try {
      setFetchingArticulos(true)
      const response = await fetch(`${API_BASE_URL}/articulos/con-proveedor`)
      if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`)
      const data = await response.json()
      setArticulos(data.filter((a: Articulo) => a.stockActual > 0))
    } catch (error) {
      console.error("Error fetching articulos:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los artículos",
        variant: "destructive",
      })
    } finally {
      setFetchingArticulos(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedArticulo) {
      toast({
        title: "Error",
        description: "Debe seleccionar un artículo",
        variant: "destructive",
      })
      return
    }
    if (formData.cantidad <= 0) {
      toast({
        title: "Error",
        description: "La cantidad debe ser mayor a cero",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`${API_BASE_URL}/ordenes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          codArticulo: Number.parseInt(formData.codArticulo),
          cantidad: formData.cantidad,
        }),
      })

      if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`)

      toast({
        title: "Éxito",
        description: "Orden registrada correctamente",
      })

      onClose()
    } catch (error) {
      console.error("Error registering order:", error)
      toast({
        title: "Error",
        description: "No se pudo registrar la orden",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleArticuloChange = (value: string) => {
    setFormData((prev) => ({ ...prev, codArticulo: value }))
    const articulo = articulos.find((a) => a.codArticulo === Number.parseInt(value))
    setSelectedArticulo(articulo || null)
  }

  const handleInputChange = (field: string, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <Card className="bg-gray-800/95 backdrop-blur-md border-gray-700/50 w-full max-w-lg shadow-2xl">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6 border-b border-gray-700/50">
          <CardTitle className="text-xl font-bold text-white flex items-center">
            <div className="w-8 h-8 bg-gradient-to-r from-red-600 to-red-700 rounded-lg flex items-center justify-center mr-3">
              <ShoppingCart className="w-4 h-4 text-white" />
            </div>
            Registrar Orden
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-full"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="p-6">
          {fetchingArticulos ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="relative">
                <div className="w-12 h-12 border-4 border-gray-300 border-t-red-600 rounded-full animate-spin mb-4"></div>
              </div>
              <p className="text-gray-400">Cargando artículos...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="articulo" className="text-gray-300 font-medium">
                    Artículo <span className="text-red-400">*</span>
                  </Label>
                  <Select value={formData.codArticulo} onValueChange={handleArticuloChange} required>
                    <SelectTrigger className="bg-gray-700/50 backdrop-blur-sm border-gray-600/50 text-white focus:border-red-500 focus:ring-red-500/20 h-12">
                      <SelectValue placeholder="Seleccionar artículo" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700 backdrop-blur-md">
                      {articulos.map((articulo) => (
                        <SelectItem
                          key={articulo.codArticulo}
                          value={articulo.codArticulo.toString()}
                          className="text-white hover:bg-gray-700/50 focus:bg-gray-700/50"
                        >
                          <div className="flex justify-between items-center w-full">
                            <span>{articulo.nombreArt}</span>
                            <span className="text-gray-400 text-sm ml-2">Stock: {articulo.stockActual}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedArticulo && (
                  <div className="bg-gray-700/30 backdrop-blur-sm rounded-xl p-4 space-y-3">
                    <div className="flex items-center space-x-2 pb-2 border-b border-gray-600/30">
                      <div className="w-5 h-5 bg-blue-600/20 rounded flex items-center justify-center">
                        <Package className="w-3 h-3 text-blue-400" />
                      </div>
                      <span className="text-white font-medium">Detalles del Artículo</span>
                    </div>

                    <div className="grid grid-cols-1 gap-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Descripción:</span>
                        <span className="text-white">{selectedArticulo.descripArt}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Stock disponible:</span>
                        <span className="text-green-400 font-semibold">{selectedArticulo.stockActual}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Proveedor:</span>
                        <span className="text-white">{selectedArticulo.proveedorPredeterminado.nombreProveedor}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Precio unitario:</span>
                        <span className="text-white font-semibold">
                          ${selectedArticulo.costoCompra.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <Label htmlFor="cantidad" className="text-gray-300 font-medium">
                    Cantidad <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    id="cantidad"
                    type="number"
                    min={1}
                    max={selectedArticulo?.stockActual || undefined}
                    value={formData.cantidad}
                    onChange={(e) => handleInputChange("cantidad", Number.parseInt(e.target.value))}
                    className="bg-gray-700/50 backdrop-blur-sm border-gray-600/50 text-white focus:border-red-500 focus:ring-red-500/20 h-12"
                    required
                  />
                  {selectedArticulo && (
                    <p className="text-xs text-gray-400">
                      Máximo disponible:{" "}
                      <span className="text-green-400 font-semibold">{selectedArticulo.stockActual} unidades</span>
                    </p>
                  )}
                </div>

                {selectedArticulo && formData.cantidad > 0 && (
                  <div className="bg-gradient-to-r from-gray-700/30 to-gray-600/30 backdrop-blur-sm rounded-xl p-4">
                    <div className="flex items-center space-x-2 pb-2 border-b border-gray-600/30 mb-3">
                      <div className="w-5 h-5 bg-green-600/20 rounded flex items-center justify-center">
                        <DollarSign className="w-3 h-3 text-green-400" />
                      </div>
                      <span className="text-white font-medium">Resumen</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Total a pagar:</span>
                      <span className="text-red-400 font-bold text-xl">
                        $
                        {(selectedArticulo.costoCompra * formData.cantidad).toLocaleString("es-AR", {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-700/30">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={onClose}
                  disabled={loading}
                  className="text-gray-400 hover:text-white hover:bg-gray-700/50"
                >
                  Cancelar
                </Button>
                <Button
                  className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Registrar Orden
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
