"use client"

import type React from "react"
import { useState } from "react"
import { X, Save, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"

interface ArticuloVenta {
  codArticulo: number
  nombreArt: string
}

interface VentaFormProps {
  articulos: ArticuloVenta[]
  onSuccess: () => void
  onCancel: () => void
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api"

export function VentaForm({ articulos, onSuccess, onCancel }: VentaFormProps) {
  const [formData, setFormData] = useState({
    codArticulo: 0,
    cantidadVendida: 1,
  })
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch(`${API_BASE_URL}/ventas/ventas`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || "Error al registrar venta")
      }

      toast({
        title: "✅ Venta registrada",
        description: "La venta se registró correctamente.",
      })

      onSuccess()
    } catch (error: any) {
      toast({
        title: "❌ Error",
        description: error.message || "No se pudo registrar la venta",
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
      <Card className="bg-gray-800 border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-white">Registrar Venta</CardTitle>
          <Button variant="ghost" size="sm" onClick={onCancel} className="text-gray-400 hover:text-white">
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="codArticulo" className="text-white">Artículo</Label>
                <Select
                  value={formData.codArticulo.toString()}
                  onValueChange={(value) => handleInputChange("codArticulo", parseInt(value))}
                >
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue placeholder="Seleccionar artículo" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    {articulos.map((articulo) => (
                      <SelectItem
                        key={articulo.codArticulo}
                        value={articulo.codArticulo.toString()}
                        className="text-white hover:bg-gray-600"
                      >
                        {articulo.nombreArt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cantidadVendida" className="text-white">Cantidad Vendida</Label>
                <Input
                  id="cantidadVendida"
                  type="number"
                  min={1}
                  value={formData.cantidadVendida}
                  onChange={(e) => handleInputChange("cantidadVendida", Number(e.target.value))}
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
                Registrar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
