"use client"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, Package, Truck, User } from "lucide-react"

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
  costoCompra: number
}

interface DetalleOrdenCompra {
  numDetalleOC: number
  subTotal: number
  cantidad: number
  articuloProveedor: {
    id: number
    demoraEntrega: number
    precioUnitario: number
    cargosPedido: number
    articulo: Articulo
    proveedor: Proveedor
  }
}

interface OrdenCompra {
  numOC: number
  cantidad: number
  montoCompra: number
  fechaCreacion: string
  fechaEntregaEstimada: string
  estado: {
    codEstadoOC: number
    nombreEstadoOC: string
  }
  proveedor: Proveedor
  detalles: DetalleOrdenCompra[]
}

interface OrdenDetalleDialogProps {
  orden: OrdenCompra | null
  open: boolean
  onClose: () => void
}

export function OrdenDetalleDialog({ orden, open, onClose }: OrdenDetalleDialogProps) {
  if (!orden) return null

  const formatPrice = (price: number) => {
    return `$${price.toLocaleString("es-AR", { minimumFractionDigits: 2 })}`
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case "Completada":
        return "bg-green-500"
      case "Pendiente":
        return "bg-yellow-500"
      case "En Proceso":
        return "bg-blue-500"
      case "Cancelada":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-gray-800 text-white border-gray-700 max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white">
            Orden de Compra #{orden.numOC}
            <Badge className={`${getEstadoColor(orden.estado.nombreEstadoOC)} ml-2 text-white`}>
              {orden.estado.nombreEstadoOC}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="space-y-2">
            <div className="flex items-center text-gray-300">
              <User className="w-4 h-4 mr-2 text-gray-400" />
              <span className="font-semibold">Proveedor:</span>
              <span className="ml-2">{orden.proveedor.nombreProveedor}</span>
            </div>
            <div className="flex items-center text-gray-300">
              <Calendar className="w-4 h-4 mr-2 text-gray-400" />
              <span className="font-semibold">Fecha de Creación:</span>
              <span className="ml-2">{formatDate(orden.fechaCreacion)}</span>
            </div>
            <div className="flex items-center text-gray-300">
              <Clock className="w-4 h-4 mr-2 text-gray-400" />
              <span className="font-semibold">Entrega Estimada:</span>
              <span className="ml-2">{formatDate(orden.fechaEntregaEstimada)}</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center text-gray-300">
              <Package className="w-4 h-4 mr-2 text-gray-400" />
              <span className="font-semibold">Cantidad de Artículos:</span>
              <span className="ml-2">{orden.cantidad}</span>
            </div>
            <div className="flex items-center text-gray-300">
              <Truck className="w-4 h-4 mr-2 text-gray-400" />
              <span className="font-semibold">Dirección de Entrega:</span>
              <span className="ml-2">{orden.proveedor.direccionProveedor}</span>
            </div>
            <div className="flex items-center text-red-400 font-bold">
              <span>Monto Total:</span>
              <span className="ml-2">{formatPrice(orden.montoCompra)}</span>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <h3 className="font-semibold mb-2 text-gray-300">Detalles de la Orden</h3>
          <div className="rounded border border-gray-700 overflow-hidden">
            <Table>
              <TableHeader className="bg-gray-900">
                <TableRow className="border-gray-700">
                  <TableHead className="text-gray-400">Artículo</TableHead>
                  <TableHead className="text-gray-400">Código</TableHead>
                  <TableHead className="text-gray-400 text-right">Cantidad</TableHead>
                  <TableHead className="text-gray-400 text-right">Precio Unitario</TableHead>
                  <TableHead className="text-gray-400 text-right">Subtotal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orden.detalles.map((detalle) => (
                  <TableRow key={detalle.numDetalleOC} className="border-gray-700">
                    <TableCell className="font-medium">{detalle.articuloProveedor.articulo.nombreArt}</TableCell>
                    <TableCell>{detalle.articuloProveedor.articulo.codArticulo}</TableCell>
                    <TableCell className="text-right">{detalle.cantidad}</TableCell>
                    <TableCell className="text-right">
                      {formatPrice(detalle.articuloProveedor.precioUnitario)}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-red-400">
                      {formatPrice(detalle.subTotal)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="flex justify-end mt-4 space-x-2">
          <Button variant="outline" className="border-gray-700 text-white hover:bg-gray-700" onClick={onClose}>
            Cerrar
          </Button>
          <Button className="bg-red-600 hover:bg-red-700">Imprimir Orden</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
