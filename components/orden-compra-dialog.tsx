"use client"

import type React from "react"

import { useState } from "react"
import { X, ShoppingCart, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
  stockActual: number
  loteOptimo: number
  puntoPedido: number
  inventarioMax: number
  costoCompra: number
  proveedorPredeterminado: Proveedor
}

interface OrdenCompraDialogProps {
  articulo: Articulo
  onSave: () => void
  onCancel: () => void
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api"

export function OrdenCompraDialog({ articulo, onSave, onCancel }: OrdenCompraDialogProps) {
  const [cantidad, setCantidad] = useState(articulo.loteOptimo)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const montoTotal = cantidad * articulo.costoCompra
  const stockResultante = articulo.stockActual + cantidad

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const ordenCompraData = {
        cantArt: cantidad,
        montoCompra: montoTotal,
        proveedor: {
          codProveedor: articulo.proveedorPredeterminado.codProveedor,
        },
        estado: {
          codEstadoOC: 1, // Asumiendo que 1 es "Pendiente"
        },
      }

      const response = await fetch(`${API_BASE_URL}/ordenes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(ordenCompraData),
      })

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      toast({
        title: "Éxito",
        description: "Orden de compra creada correctamente",
      })

      onSave()
    } catch (error) {
      console.error("Error creating orden compra:", error)
      toast({
        title: "Error",
        description: "No se pudo crear la orden de compra",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (price: number) => {
    return `$${price.toLocaleString("es-AR", { minimumFractionDigits: 2 })}`
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="bg-gray-800 border-gray-700 w-full max-w-2xl">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-white flex items-center">
            <ShoppingCart className="w-5 h-5 mr-2" />
            Crear Orden de Compra
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onCancel} className="text-gray-400 hover:text-white">
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Información del Artículo */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white border-b border-gray-700 pb-2">
                Información del Artículo
              </h3>
              <div className="bg-gray-700 p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-300">Artículo:</span>
                  <span className="text-white font-semibold">{articulo.nombreArt}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Código:</span>
                  <span className="text-white">{articulo.codArticulo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Stock Actual:</span>
                  <span className="text-white">{articulo.stockActual}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Punto de Pedido:</span>
                  <span className="text-white">{articulo.puntoPedido}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Lote Óptimo:</span>
                  <span className="text-white">{articulo.loteOptimo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Costo Unitario:</span>
                  <span className="text-white">{formatPrice(articulo.costoCompra)}</span>
                </div>
              </div>
            </div>

            {/* Información del Proveedor */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white border-b border-gray-700 pb-2">Proveedor</h3>
              <div className="bg-gray-700 p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-300">Nombre:</span>
                  <span className="text-white font-semibold">{articulo.proveedorPredeterminado.nombreProveedor}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Email:</span>
                  <span className="text-white">{articulo.proveedorPredeterminado.emailProveedor}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Teléfono:</span>
                  <span className="text-white">{articulo.proveedorPredeterminado.telefonoProveedor}</span>
                </div>
              </div>
            </div>

            {/* Detalles de la Orden */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white border-b border-gray-700 pb-2">Detalles de la Orden</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="cantidad" className="text-white">
                    Cantidad a Ordenar
                  </Label>
                  <Input
                    id="cantidad"
                    type="number"
                    min="1"
                    value={cantidad}
                    onChange={(e) => setCantidad(Number.parseInt(e.target.value) || 0)}
                    className="bg-gray-700 border-gray-600 text-white"
                    required
                  />
                  <p className="text-xs text-gray-400">Cantidad sugerida: {articulo.loteOptimo} unidades</p>
                </div>

                <div className="bg-gray-700 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Cantidad:</span>
                    <span className="text-white">{cantidad} unidades</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Precio Unitario:</span>
                    <span className="text-white">{formatPrice(articulo.costoCompra)}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-lg border-t border-gray-600 pt-2">
                    <span className="text-gray-300">Total:</span>
                    <span className="text-red-400">{formatPrice(montoTotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Stock Resultante:</span>
                    <span className="text-green-400">{stockResultante} unidades</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading} className="bg-red-600 hover:bg-red-700">
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creando...
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Crear Orden
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
