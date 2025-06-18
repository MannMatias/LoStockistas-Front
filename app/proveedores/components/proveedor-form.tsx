"use client"

import type React from "react"

import { useState } from "react"
import { X, Save, Loader2, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface Articulo {
  codArticulo: number
  nombreArt: string
  descripArt: string
  demandaAnual: number
  costoAlmacenamiento: number
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

interface ArticuloProveedorDTO {
  codArticulo: number
  precioUnitario: number
  cargosPedido: number
  demoraEntregaDias: number
}

interface ProveedorFormProps {
  onSave: () => void
  onCancel: () => void
  articulos: Articulo[]
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api"

export function ProveedorForm({ onSave, onCancel, articulos }: ProveedorFormProps) {
  const [formData, setFormData] = useState({
    nombre: "",
    correo: "",
    telefono: "",
    direccion: "",
    intervaloReposicion: "",
  })

  const [articulosSeleccionados, setArticulosSeleccionados] = useState<ArticuloProveedorDTO[]>([])
  const [selectedArticulo, setSelectedArticulo] = useState<number | null>(null)
  const [precioUnitario, setPrecioUnitario] = useState<number>(0)
  const [cargosPedido, setCargosPedido] = useState<number>(0)
  const [demoraEntrega, setDemoraEntrega] = useState<number>(0)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleAddArticulo = () => {
    if (!selectedArticulo) {
      toast({
        title: "Error",
        description: "Debe seleccionar un artículo",
        variant: "destructive",
      })
      return
    }

    if (precioUnitario <= 0) {
      toast({
        title: "Error",
        description: "El precio unitario debe ser mayor a 0",
        variant: "destructive",
      })
      return
    }

    if (articulosSeleccionados.some((a) => a.codArticulo === selectedArticulo)) {
      toast({
        title: "Error",
        description: "Este artículo ya ha sido agregado",
        variant: "destructive",
      })
      return
    }

    const nuevoArticulo: ArticuloProveedorDTO = {
      codArticulo: selectedArticulo,
      precioUnitario: precioUnitario,
      cargosPedido: cargosPedido,
      demoraEntregaDias: demoraEntrega,
    }

    setArticulosSeleccionados([...articulosSeleccionados, nuevoArticulo])
    setSelectedArticulo(null)
    setPrecioUnitario(0)
    setCargosPedido(0)
    setDemoraEntrega(0)
  }

  const handleRemoveArticulo = (codArticulo: number) => {
    setArticulosSeleccionados(articulosSeleccionados.filter((a) => a.codArticulo !== codArticulo))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    if (articulosSeleccionados.length === 0) {
      toast({
        title: "Error",
        description: "Debe agregar al menos un artículo",
        variant: "destructive",
      })
      setLoading(false)
      return
    }

    try {
      const payload = {
        nombre: formData.nombre,
        correo: formData.correo,
        telefono: formData.telefono,
        direccion: formData.direccion,
        articulos: articulosSeleccionados,
        intervaloReposicion: formData.intervaloReposicion,
      }

      const response = await fetch(`${API_BASE_URL}/proveedores`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || `Error ${response.status}: ${response.statusText}`)
      }

      toast({
        title: "Éxito",
        description: "Proveedor creado correctamente",
      })

      onSave()
    } catch (error) {
      console.error("Error saving proveedor:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo guardar el proveedor",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getArticuloNombre = (codArticulo: number) => {
    const articulo = articulos.find((a) => a.codArticulo === codArticulo)
    return articulo ? articulo.nombreArt : `Artículo #${codArticulo}`
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="bg-gray-800 border-gray-700 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-white">Agregar Proveedor</CardTitle>
          <Button variant="ghost" size="sm" onClick={onCancel} className="text-gray-400 hover:text-white">
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Información Básica */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white border-b border-gray-700 pb-2">
                Información del Proveedor
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre" className="text-white">
                    Nombre del Proveedor
                  </Label>
                  <Input
                    id="nombre"
                    value={formData.nombre}
                    onChange={(e) => handleInputChange("nombre", e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="correo" className="text-white">
                    Correo Electrónico
                  </Label>
                  <Input
                    id="correo"
                    type="email"
                    value={formData.correo}
                    onChange={(e) => handleInputChange("correo", e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="telefono" className="text-white">
                    Teléfono
                  </Label>
                  <Input
                    id="telefono"
                    type="number"
                    value={formData.telefono}
                    onChange={(e) => handleInputChange("telefono", e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="direccion" className="text-white">
                    Dirección
                  </Label>
                  <Input
                    id="direccion"
                    value={formData.direccion}
                    onChange={(e) => handleInputChange("direccion", e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
              </div>
            </div>
            <div className="space-y-4">
              {/** Intervalo de reposición */}
              <div className="space-y-2">
                <Label htmlFor="intervaloReposicion" className="text-white">
                  Intervalo de reposición
                </Label>
                <Input
                  id="intervaloReposicion"
                  type="number"
                  min={0}
                  value={formData.intervaloReposicion}
                  onChange={(e) => handleInputChange("intervaloReposicion", e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                />  
              </div>
            </div>

            {/* Artículos */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white border-b border-gray-700 pb-2">
                Artículos del Proveedor
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                <div className="space-y-2 md:col-span-2">
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
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="demoraEntrega" className="text-white">
                    Demora (días)
                  </Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="demoraEntrega"
                      type="number"
                      min={0}
                      value={demoraEntrega}
                      onChange={(e) => setDemoraEntrega(Number(e.target.value))}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                    <Button
                      type="button"
                      onClick={handleAddArticulo}
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Tabla de artículos seleccionados */}
              {articulosSeleccionados.length > 0 && (
                <div className="mt-4">
                  <Table>
                    <TableHeader className="bg-gray-800">
                      <TableRow className="border-gray-700 hover:bg-gray-700">
                        <TableHead className="text-gray-400">Artículo</TableHead>
                        <TableHead className="text-gray-400">Precio Unitario</TableHead>
                        <TableHead className="text-gray-400">Cargos Pedido</TableHead>
                        <TableHead className="text-gray-400">Demora (días)</TableHead>
                        <TableHead className="text-gray-400 w-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {articulosSeleccionados.map((articulo) => (
                        <TableRow key={articulo.codArticulo} className="border-gray-700 hover:bg-gray-700">
                          <TableCell className="font-medium text-white">
                            {getArticuloNombre(articulo.codArticulo)}
                          </TableCell>
                          <TableCell className="text-white">
                            ${articulo.precioUnitario.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell className="text-white">
                            ${articulo.cargosPedido.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell className="text-white">{articulo.demoraEntregaDias} días</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveArticulo(articulo.codArticulo)}
                              className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-transparent"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-2 text-white">
              <Button type="button" variant="ghost" onClick={onCancel} disabled={loading}>
                Cancelar
              </Button>
              <Button className="" type="submit" disabled={loading}>
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
