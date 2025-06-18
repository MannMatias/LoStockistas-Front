"use client"

import type React from "react"
import { useState } from "react"
import { X, ShoppingCart, Loader2, Package, User, Calculator } from "lucide-react"
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
  costoPedido: number
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

  const montoTotal = cantidad * articulo.costoPedido
  const stockResultante = articulo.stockActual + cantidad

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const ordenCompraData = {
        cantArt: cantidad,
        codArticulo: articulo.codArticulo,
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <Card className="bg-gray-800/95 backdrop-blur-md border-gray-700/50 w-full max-w-2xl max-h-[85vh] overflow-hidden shadow-2xl">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6 border-b border-gray-700/50">
          <CardTitle className="text-xl font-bold text-white flex items-center">
            <div className="w-8 h-8 bg-gradient-to-r from-red-600 to-red-700 rounded-lg flex items-center justify-center mr-3">
              <ShoppingCart className="w-4 h-4 text-white" />
            </div>
            Crear Orden de Compra
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

        <CardContent className="p-6 overflow-y-auto max-h-[calc(85vh-120px)]">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Información del Artículo */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 pb-3 border-b border-gray-700/30">
                <div className="w-6 h-6 bg-blue-600/20 rounded-lg flex items-center justify-center">
                  <Package className="w-3 h-3 text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Información del Artículo</h3>
              </div>

              <div className="bg-gray-700/30 backdrop-blur-sm rounded-xl p-4 space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex justify-between">
                    <span className="text-gray-400 font-medium">Artículo:</span>
                    <span className="text-white font-semibold">{articulo.nombreArt}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 font-medium">Código:</span>
                    <span className="text-white">#{articulo.codArticulo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 font-medium">Stock Actual:</span>
                    <span className="text-white font-bold">{articulo.stockActual}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 font-medium">Punto de Pedido:</span>
                    <span className="text-yellow-400 font-bold">{articulo.puntoPedido}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 font-medium">Lote Óptimo:</span>
                    <span className="text-green-400 font-bold">{articulo.loteOptimo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 font-medium">Costo Unitario:</span>
                    <span className="text-white font-bold">{formatPrice(articulo.costoPedido)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Información del Proveedor */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 pb-3 border-b border-gray-700/30">
                <div className="w-6 h-6 bg-green-600/20 rounded-lg flex items-center justify-center">
                  <User className="w-3 h-3 text-green-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Proveedor</h3>
              </div>

              <div className="bg-gray-700/30 backdrop-blur-sm rounded-xl p-4 space-y-3">
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400 font-medium">Nombre:</span>
                    <span className="text-white font-semibold">{articulo.proveedorPredeterminado.nombreProveedor}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 font-medium">Email:</span>
                    <span className="text-blue-400">{articulo.proveedorPredeterminado.emailProveedor}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 font-medium">Teléfono:</span>
                    <span className="text-white">{articulo.proveedorPredeterminado.telefonoProveedor}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Detalles de la Orden */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 pb-3 border-b border-gray-700/30">
                <div className="w-6 h-6 bg-purple-600/20 rounded-lg flex items-center justify-center">
                  <Calculator className="w-3 h-3 text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Detalles de la Orden</h3>
              </div>

              <div className="space-y-4">
                <div className="space-y-3">
                  <Label htmlFor="cantidad" className="text-gray-300 font-medium">
                    Cantidad a Ordenar
                  </Label>
                  <Input
                    id="cantidad"
                    type="number"
                    min="1"
                    value={cantidad}
                    onChange={(e) => setCantidad(Number.parseInt(e.target.value) || 0)}
                    className="bg-gray-700/50 backdrop-blur-sm border-gray-600/50 text-white focus:border-red-500 focus:ring-red-500/20 h-12"
                    required
                  />

                </div>

                <div className="bg-gradient-to-r from-gray-700/30 to-gray-600/30 backdrop-blur-sm rounded-xl p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex justify-between">
                      <span className="text-gray-400 font-medium">Cantidad:</span>
                      <span className="text-white font-bold">{cantidad} unidades</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400 font-medium">Precio Unitario:</span>
                      <span className="text-white font-bold">{formatPrice(articulo.costoPedido)}</span>
                    </div>
                  </div>

                  <div className="border-t border-gray-600/50 pt-4">
                    <div className="flex justify-between items-center text-lg">
                      <span className="text-gray-300 font-semibold">Total:</span>
                      <span className="text-red-400 font-bold text-xl">{formatPrice(montoTotal)}</span>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-gray-400 font-medium">Stock Resultante:</span>
                      <span className="text-green-400 font-bold">{stockResultante} unidades</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Botones */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-700/30">
              <Button
                type="button"
                variant="ghost"
                onClick={onCancel}
                className="text-gray-400 hover:text-white hover:bg-gray-700/50"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg"
              >
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
