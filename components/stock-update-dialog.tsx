import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Package } from "lucide-react"

interface StockUpdateDialogProps {
  open: boolean
  articulo: { nombreArt: string; stockActual: number }
  onSave: (newStock: number) => void
  onCancel: () => void
}

export function StockUpdateDialog({ open, articulo, onSave, onCancel }: StockUpdateDialogProps) {
  const [stock, setStock] = useState(articulo?.stockActual || 0)
  const [error, setError] = useState("")

  const handleSave = () => {
    if (isNaN(stock) || stock < 0) {
      setError("El stock debe ser un número positivo")
      return
    }
    setError("")
    onSave(stock)
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800/95 backdrop-blur-md border-gray-700/50 w-full max-w-md shadow-2xl rounded-lg">
        <div className="flex items-center justify-between p-6 border-b border-gray-700/50">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-gradient-to-r from-red-600 to-red-700 rounded-lg flex items-center justify-center mr-3">
              <Package className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white">Actualizar Stock</h2>
          </div>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="space-y-3">
            <Label className="text-gray-300 font-medium">
              Artículo
            </Label>
            <div className="text-white font-semibold bg-gray-700/50 backdrop-blur-sm border border-gray-600/50 rounded-md px-3 py-2">
              {articulo.nombreArt}
            </div>
          </div>
          
          <div className="space-y-3">
            <Label className="text-gray-300 font-medium">
              Nuevo Stock <span className="text-red-400">*</span>
            </Label>
            <Input
              type="number"
              min={0}
              value={stock}
              onChange={e => setStock(Number(e.target.value))}
              className="bg-gray-700/50 backdrop-blur-sm border-gray-600/50 text-white focus:border-red-500 focus:ring-red-500/20 h-12"
              placeholder="Ingrese el nuevo stock"
            />
            {error && <div className="text-red-400 text-sm">{error}</div>}
          </div>
        </div>
        
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-700/30">
          <Button
            variant="ghost"
            onClick={onCancel}
            className="text-gray-400 hover:text-white hover:bg-gray-700/50"
          >
            Cancelar
          </Button>
          <Button
            className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg"
            onClick={handleSave}
          >
            Guardar
          </Button>
        </div>
      </div>
    </div>
  )
} 