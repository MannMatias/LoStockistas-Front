"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Calendar, Package, User } from "lucide-react"

interface Articulo {
  codArticulo: number
  nombreArt: string
  descripArt: string
  proveedorPredeterminado: {
    nombreProveedor: string
  }
}

interface Venta {
  codVenta: number
  cantProducto: number
  fechaVenta: string
  articulo: Articulo
}

interface VentaDetalleDialogProps {
  venta: Venta | null
  open: boolean
  onClose: () => void
}

export function VentaDetalleDialog({ venta, open, onClose }: VentaDetalleDialogProps) {
  if (!venta) return null

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-gray-800 text-white border-gray-700 max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white">Venta #{venta.codVenta}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center text-gray-300">
                <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                <span className="font-semibold">Fecha de Venta:</span>
                <span className="ml-2">{formatDate(venta.fechaVenta)}</span>
              </div>
              <div className="flex items-center text-gray-300">
                <Package className="w-4 h-4 mr-2 text-gray-400" />
                <span className="font-semibold">Artículo:</span>
                <span className="ml-2">{venta.articulo.nombreArt}</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center text-gray-300">
                <User className="w-4 h-4 mr-2 text-gray-400" />
                <span className="font-semibold">Proveedor:</span>
                <span className="ml-2">{venta.articulo.proveedorPredeterminado.nombreProveedor}</span>
              </div>
              <div className="flex items-center text-green-400 font-bold">
                <span>Cantidad:</span>
                <span className="ml-2">{venta.cantProducto} unidades</span>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <h3 className="font-semibold mb-2 text-gray-300">Detalle de la Venta</h3>
            <div className="rounded border border-gray-700 overflow-hidden">
              <Table>
                <TableHeader className="bg-gray-900">
                  <TableRow className="border-gray-700">
                    <TableHead className="text-gray-400">Artículo</TableHead>
                    <TableHead className="text-gray-400">Código</TableHead>
                    <TableHead className="text-gray-400 text-right">Cantidad</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow className="border-gray-700">
                    <TableCell className="font-medium">{venta.articulo.nombreArt}</TableCell>
                    <TableCell>{venta.articulo.codArticulo}</TableCell>
                    <TableCell className="text-right">{venta.cantProducto}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="mt-4 p-4 bg-gray-900 rounded-md border border-gray-700">
            <h4 className="font-semibold text-gray-300 mb-2">Descripción del Artículo</h4>
            <p className="text-gray-400 text-sm">{venta.articulo.descripArt || "Sin descripción disponible"}</p>
          </div>
        </div>

        <div className="flex justify-end mt-4 space-x-2">
          <Button variant="outline" className="border-gray-700 text-white hover:bg-gray-700" onClick={onClose}>
            Cerrar
          </Button>
          <Button className="bg-red-600 hover:bg-red-700">Imprimir Factura</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
