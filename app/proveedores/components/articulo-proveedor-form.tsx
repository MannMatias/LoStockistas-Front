"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { X, Save, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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
  fechaHoraBajaArticulo?: string
  cgi: number
  loteOptimo: number
  puntoPedido: number
  inventarioMax: number
  stockSeguridadLF: number
  stockSeguridadIF: number
  modeloInventario: "LOTEFIJO" | "INTERVALOFIJO"
  proveedorPredeterminado: {
    codProveedor: number
    nombreProveedor: string
  }
}

interface ArticuloProveedorFormProps {
  proveedor: Proveedor
  articulos: Articulo[]
  onSave: () => void
  onCancel: () => void
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api"

export function ArticuloProveedorForm({ proveedor, articulos, onSave, onCancel }: ArticuloProveedorFormProps) {
  const [selectedArticulo, setSelectedArticulo] = useState<number | null>(null)
  const [precioUnitario, setPrecioUnitario] = useState<number>(0)
  const [cargosPedido, setCargosPedido] = useState<number>(0)
  const [demoraEntrega, setDemoraEntrega] = useState<number>(0)
  const [loading, setLoading] = useState(false)
  const [articulosAsociados, setArticulosAsociados] = useState<number[]>([])
  const { toast } = useToast()

  useEffect(() => {
    const fetchArticulosAsociados = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/proveedores/${proveedor.codProveedor}/articulos`)
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`)
        }
        const data = await response.json()
        setArticulosAsociados(data.map((art: { codArticulo: number }) => art.codArticulo))
      } catch (error) {
        console.error("Error fetching articulos asociados:", error)
      }
    }

    fetchArticulosAsociados()
  }, [proveedor.codProveedor])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    if (!selectedArticulo) {
      toast({
        title: "Error",
        description: "Debe seleccionar un artículo",
        variant: "destructive",
      })
      setLoading(false)
      return
    }

    if (precioUnitario <= 0) {
      toast({
        title: "Error",
        description: "El precio unitario debe ser mayor a 0",
        variant: "destructive",
      })
      setLoading(false)
      return
    }

    try {
      const payload = {
        codArticulo: selectedArticulo,
        precioUnitario: precioUnitario,
        cargosPedido: cargosPedido,
        demoraEntregaDias: demoraEntrega,
      }

      const response = await fetch(`${API_BASE_URL}/articulos-proveedores/${proveedor.codProveedor}`, {
        method: "POST",
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
        description: "Artículo asociado correctamente al proveedor",
      })

      onSave()
    } catch (error) {
      console.error("Error saving articulo-proveedor:", error)
      toast({
        title: "Error",
        description: "No se pudo asociar el artículo al proveedor",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const articulosDisponibles = articulos.filter(
    (articulo) => !articulosAsociados.includes(articulo.codArticulo)
  )

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="bg-gray-800 border-gray-700 w-full max-w-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-white">Asociar Artículo a Proveedor</CardTitle>
          <Button variant="ghost" size="sm" onClick={onCancel} className="text-gray-400 hover:text-white">
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-white">Proveedor</Label>
                <div className="bg-gray-700 border border-gray-600 rounded-md p-2 text-white">
                  {proveedor.nombreProveedor}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="articulo" className="text-white">
                  Artículo
                </Label>
                <Select
                  value={selectedArticulo?.toString() || ""}
                  onValueChange={(v) => setSelectedArticulo(Number(v))}
                >
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue placeholder="Seleccionar artículo" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    {articulosDisponibles.map((articulo) => (
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
                <Label htmlFor="precioUnitario" className="text-white">
                  Precio Unitario
                </Label>
                <Input
                  id="precioUnitario"
                  type="number"
                  min={0}
                  step={0.01}
                  value={precioUnitario}
                  onChange={(e) => setPrecioUnitario(Number(e.target.value))}
                  className="bg-gray-700 border-gray-600 text-white"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cargosPedido" className="text-white">
                  Cargos Pedido
                </Label>
                <Input
                  id="cargosPedido"
                  type="number"
                  min={0}
                  step={0.01}
                  value={cargosPedido}
                  onChange={(e) => setCargosPedido(Number(e.target.value))}
                  className="bg-gray-700 border-gray-600 text-white"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="demoraEntrega" className="text-white">
                  Demora de Entrega (días)
                </Label>
                <Input
                  id="demoraEntrega"
                  type="number"
                  min={0}
                  value={demoraEntrega}
                  onChange={(e) => setDemoraEntrega(Number(e.target.value))}
                  className="bg-gray-700 border-gray-600 text-white"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 text-white">
              <Button type="button" variant="ghost" onClick={onCancel} disabled={loading}>
                Cancelar
              </Button>
              <Button className="bg-green-600 hover:bg-green-700" type="submit" disabled={loading}>
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
