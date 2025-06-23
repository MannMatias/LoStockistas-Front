"use client"

import type React from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ShoppingCart, X, Save, Loader2 } from "lucide-react"
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { API_BASE_URL } from "@/app/page"

interface VentaFormProps {
  onCancel: () => void
  onSuccess: () => void
  articulos: { codArticulo: number; nombreArt: string }[]
}

const VentaForm: React.FC<VentaFormProps> = ({ onCancel, onSuccess, articulos }) => {
  const [formData, setFormData] = useState({
    codArticulo: articulos.length > 0 ? articulos[0].codArticulo : 0,
    cantidadVendida: 1,
  })
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleInputChange = (name: string, value: any) => {
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  const handleSubmit = async (e: any) => {
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
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      onSuccess()
    } catch (error) {
      console.error("Error al registrar la venta:", error)
      toast({
        title: "Error",
        description: "No se pudo registrar la venta",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <Card className="bg-gray-800/95 backdrop-blur-md border-gray-700/50 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6 border-b border-gray-700/50">
          <CardTitle className="text-xl font-bold text-white flex items-center">
            <div className="w-8 h-8 bg-gradient-to-r from-red-600 to-red-700 rounded-lg flex items-center justify-center mr-3">
              <ShoppingCart className="w-4 h-4 text-white" />
            </div>
            Registrar Venta
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
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="codArticulo" className="text-gray-300 font-medium">
                  Artículo <span className="text-red-400">*</span>
                </Label>
                <Select
                  value={formData.codArticulo.toString()}
                  onValueChange={(value) => handleInputChange("codArticulo", Number.parseInt(value))}
                >
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
                        {articulo.nombreArt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label htmlFor="cantidadVendida" className="text-gray-300 font-medium">
                  Cantidad Vendida <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="cantidadVendida"
                  type="number"
                  min={1}
                  value={formData.cantidadVendida}
                  onChange={(e) => handleInputChange("cantidadVendida", Number(e.target.value))}
                  className="bg-gray-700/50 backdrop-blur-sm border-gray-600/50 text-white focus:border-red-500 focus:ring-red-500/20 h-12"
                  required
                />
              </div>
            </div>

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
                type="submit"
                disabled={loading}
                className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg"
              >
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

export default VentaForm
