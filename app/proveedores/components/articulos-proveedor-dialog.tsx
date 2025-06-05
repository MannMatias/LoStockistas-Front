"use client"

import { X, CheckCircle, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"

interface Proveedor {
  codProveedor: number
  nombreProveedor: string
  direccionProveedor: string
  telefonoProveedor: string
  emailProveedor: string
}

interface ArticuloProveedorResponse {
  codArticulo: number
  nombreArticulo: string
  esPredeterminado: boolean
}

interface ArticulosProveedorDialogProps {
  proveedor: Proveedor
  articulos: ArticuloProveedorResponse[]
  onClose: () => void
  onDelete: (codArticulo: number) => void
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api"

export function ArticulosProveedorDialog({ proveedor, articulos, onClose, onDelete }: ArticulosProveedorDialogProps) {
  const { toast } = useToast()

  const handleDelete = async (codArticulo: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/articulos-proveedores/${proveedor.codProveedor}/${codArticulo}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      toast({
        title: "Éxito",
        description: "Artículo eliminado correctamente del proveedor",
      })

      onDelete(codArticulo)
    } catch (error) {
      console.error("Error deleting articulo-proveedor:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar el artículo del proveedor",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="bg-gray-800 border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-white">Artículos del Proveedor: {proveedor.nombreProveedor}</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader className="bg-gray-800">
              <TableRow className="border-gray-700 hover:bg-gray-700">
                <TableHead className="text-gray-400">Código</TableHead>
                <TableHead className="text-gray-400">Nombre</TableHead>
                <TableHead className="text-gray-400 text-right">Estado</TableHead>
                <TableHead className="text-gray-400 text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {articulos.map((articulo) => (
                <TableRow key={articulo.codArticulo} className="border-gray-700 hover:bg-gray-700">
                  <TableCell className="font-medium text-white">#{articulo.codArticulo}</TableCell>
                  <TableCell className="text-white">{articulo.nombreArticulo}</TableCell>
                  <TableCell className="text-right">
                    {articulo.esPredeterminado ? (
                      <Badge className="bg-green-600 text-white">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Predeterminado
                      </Badge>
                    ) : (
                      <Badge className="bg-gray-600 text-white">Asociado</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-400 hover:text-red-500"
                      onClick={() => handleDelete(articulo.codArticulo)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="mt-6 flex justify-end">
            <Button onClick={onClose}>Cerrar</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
