"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { X, Save, Loader2, ShoppingCart } from "lucide-react"
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
  stockActual: number
  costoCompra: number
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
    codProveedor: "",
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

  // Actualizar precio cuando se selecciona un artículo
  useEffect(() => {
    if (selectedArticulo) {
      setFormData((prev) => ({
        ...prev,
        precioUnitario: selectedArticulo.costoCompra,
      }))
    }
  }, [selectedArticulo])

  const fetchArticulos = async () => {
    try {
      setFetchingArticulos(true)
      const response = await fetch(`${API_BASE_URL}/articulos`)
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
      console.error("Error registering sale:", error)
      toast({
        title: "Error",
        description: "No se pudo registrar la Orden",
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
  const handleProveedorChange = (value: string) => {
    setFormData((prev) => ({ ...prev, codProveedor: value }))
  }
  const handleInputChange = (field: string, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="bg-gray-800 border-gray-700 w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-white flex items-center">
            <ShoppingCart className="w-5 h-5 mr-2 text-red-500" />
            Registrar Orden
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent>
          {fetchingArticulos ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-red-500" />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="articulo" className="text-white">
                    Artículo <span className="text-red-500">*</span>
                  </Label>
                  <Select value={formData.codArticulo} onValueChange={handleArticuloChange} required>
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                      <SelectValue placeholder="Seleccionar artículo" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-700 border-gray-600 text-white">
                      {articulos.map((articulo) => (
                        <SelectItem
                          key={articulo.codArticulo}
                          value={articulo.codArticulo.toString()}
                          className="text-white hover:bg-gray-600"
                        >
                          {articulo.nombreArt} - Stock: {articulo.stockActual}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedArticulo && (
                  <div className="p-3 bg-gray-700 rounded-md text-sm">
                    <p className="text-gray-300">
                      <span className="font-semibold">Descripción:</span> {selectedArticulo.descripArt}
                    </p>
                    <p className="text-gray-300">
                      <span className="font-semibold">Stock disponible:</span> {selectedArticulo.stockActual}
                    </p>
                    <p className="text-gray-300">
                      <span className="font-semibold">Precio unitario:</span> $
                      {selectedArticulo.costoCompra.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="cantidad" className="text-white">
                    Cantidad <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="cantidad"
                    type="number"
                    min={1}
                    value={formData.cantidad}
                    onChange={(e) => handleInputChange("cantidad", Number.parseInt(e.target.value))}
                    className="bg-gray-700 border-gray-600 text-white"
                    required
                  />
                </div>
              



                {selectedArticulo && formData.cantidad > 0 && (
                  <div className="p-3 bg-gray-700 rounded-md">
                    <p className="text-white font-semibold">
                      Total: $


                      {(selectedArticulo.costoCompra * formData.cantidad).toLocaleString("es-AR", {
                        minimumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-2 text-white">
                <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
                  Cancelar
                </Button>
                <Button className="bg-red-600 hover:bg-red-700" type="submit" disabled={loading}>
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
