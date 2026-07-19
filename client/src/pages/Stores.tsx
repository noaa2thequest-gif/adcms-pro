import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, AlertTriangle, Plus, Edit2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Stores() {
  const { data: spareParts, isLoading: loadingSpareParts, refetch: refetchSpareParts } = trpc.sparePart.list.useQuery();

  const createSparePartMutation = trpc.sparePart.create.useMutation();
  const updateSparePartMutation = trpc.sparePart.update.useMutation();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedPartId, setSelectedPartId] = useState<number | null>(null);

  const [partCode, setPartCode] = useState("");
  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState("0");
  const [location, setLocation] = useState("");
  const [minStock, setMinStock] = useState("0");

  const handleCreateSparePart = async () => {
    if (!partCode.trim() || !description.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      await createSparePartMutation.mutateAsync({
        partCode,
        description,
        quantity: parseInt(quantity) || 0,
        location: location || undefined,
        minStock: parseInt(minStock) || 0,
      });
      toast.success("Spare part added successfully");
      setPartCode("");
      setDescription("");
      setQuantity("0");
      setLocation("");
      setMinStock("0");
      setCreateDialogOpen(false);
      refetchSpareParts();
    } catch (error) {
      toast.error("Failed to create spare part");
    }
  };

  const handleUpdateSparePart = async () => {
    if (!selectedPartId) {
      toast.error("No part selected");
      return;
    }

    try {
      await updateSparePartMutation.mutateAsync({
        id: selectedPartId,
        quantity: parseInt(quantity) || 0,
        location: location || undefined,
        minStock: parseInt(minStock) || 0,
      });
      toast.success("Spare part updated successfully");
      setEditDialogOpen(false);
      refetchSpareParts();
    } catch (error) {
      toast.error("Failed to update spare part");
    }
  };

  const getLowStockColor = (quantity: number, minStock: number) => {
    if (quantity === 0) return "bg-red-100 text-red-800";
    if (quantity <= minStock) return "bg-orange-100 text-orange-800";
    return "bg-green-100 text-green-800";
  };

  if (loadingSpareParts) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  const outOfStock = spareParts?.filter((p: any) => p.quantity === 0) || [];
  const lowStock = spareParts?.filter((p: any) => p.quantity > 0 && p.quantity <= (p.minStock || 2)) || [];
  const inStock = spareParts?.filter((p: any) => p.quantity > (p.minStock || 2)) || [];

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Stores & Inventory</h1>
          <p className="text-gray-600 mt-2">Manage spare parts and inventory levels</p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Add Spare Part
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Spare Part</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="partCode">Part Code *</Label>
                <Input
                  id="partCode"
                  placeholder="e.g., ABC-123-456"
                  value={partCode}
                  onChange={(e) => setPartCode(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the spare part..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="min-h-20"
                />
              </div>
              <div>
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  placeholder="0"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  placeholder="Storage location..."
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="minStock">Minimum Stock Level</Label>
                <Input
                  id="minStock"
                  type="number"
                  placeholder="0"
                  value={minStock}
                  onChange={(e) => setMinStock(e.target.value)}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateSparePart}>
                  Add Part
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-green-600">In Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{inStock.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-orange-600">Low Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-orange-600">{lowStock.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-red-600">Out of Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">{outOfStock.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Spare Parts by Stock Level */}
      <div className="space-y-8">
        {/* Out of Stock */}
        {outOfStock.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              Out of Stock ({outOfStock.length})
            </h2>
            <div className="space-y-3">
              {outOfStock.map((part: any) => (
                <Card key={part.id} className="border-red-200 bg-red-50">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{part.partCode}</CardTitle>
                        <p className="text-sm text-gray-600 mt-2">{part.description}</p>
                        {part.location && (
                          <p className="text-xs text-gray-500 mt-1">Location: {part.location}</p>
                        )}
                      </div>
                      <Badge className={getLowStockColor(part.quantity, part.minStock)}>
                        {part.quantity} in stock
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Dialog open={editDialogOpen && selectedPartId === part.id} onOpenChange={(open) => {
                      setEditDialogOpen(open);
                      if (open) {
                        setSelectedPartId(part.id);
                        setQuantity(part.quantity.toString());
                        setLocation(part.location || "");
                        setMinStock(part.minStock.toString());
                      }
                    }}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-2">
                          <Edit2 className="w-4 h-4" />
                          Edit
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit Spare Part</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="quantity">Quantity</Label>
                            <Input
                              id="quantity"
                              type="number"
                              value={quantity}
                              onChange={(e) => setQuantity(e.target.value)}
                            />
                          </div>
                          <div>
                            <Label htmlFor="location">Location</Label>
                            <Input
                              id="location"
                              value={location}
                              onChange={(e) => setLocation(e.target.value)}
                            />
                          </div>
                          <div>
                            <Label htmlFor="minStock">Minimum Stock Level</Label>
                            <Input
                              id="minStock"
                              type="number"
                              value={minStock}
                              onChange={(e) => setMinStock(e.target.value)}
                            />
                          </div>
                          <div className="flex gap-2 justify-end">
                            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                              Cancel
                            </Button>
                            <Button onClick={handleUpdateSparePart}>
                              Save Changes
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Low Stock */}
        {lowStock.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              Low Stock ({lowStock.length})
            </h2>
            <div className="space-y-3">
              {lowStock.map((part: any) => (
                <Card key={part.id} className="border-orange-200 bg-orange-50">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{part.partCode}</CardTitle>
                        <p className="text-sm text-gray-600 mt-2">{part.description}</p>
                        {part.location && (
                          <p className="text-xs text-gray-500 mt-1">Location: {part.location}</p>
                        )}
                      </div>
                      <Badge className={getLowStockColor(part.quantity, part.minStock)}>
                        {part.quantity} in stock
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Dialog open={editDialogOpen && selectedPartId === part.id} onOpenChange={(open) => {
                      setEditDialogOpen(open);
                      if (open) {
                        setSelectedPartId(part.id);
                        setQuantity(part.quantity.toString());
                        setLocation(part.location || "");
                        setMinStock(part.minStock.toString());
                      }
                    }}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-2">
                          <Edit2 className="w-4 h-4" />
                          Edit
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit Spare Part</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="quantity">Quantity</Label>
                            <Input
                              id="quantity"
                              type="number"
                              value={quantity}
                              onChange={(e) => setQuantity(e.target.value)}
                            />
                          </div>
                          <div>
                            <Label htmlFor="location">Location</Label>
                            <Input
                              id="location"
                              value={location}
                              onChange={(e) => setLocation(e.target.value)}
                            />
                          </div>
                          <div>
                            <Label htmlFor="minStock">Minimum Stock Level</Label>
                            <Input
                              id="minStock"
                              type="number"
                              value={minStock}
                              onChange={(e) => setMinStock(e.target.value)}
                            />
                          </div>
                          <div className="flex gap-2 justify-end">
                            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                              Cancel
                            </Button>
                            <Button onClick={handleUpdateSparePart}>
                              Save Changes
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* In Stock */}
        {inStock.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">In Stock ({inStock.length})</h2>
            <div className="space-y-3">
              {inStock.map((part: any) => (
                <Card key={part.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{part.partCode}</CardTitle>
                        <p className="text-sm text-gray-600 mt-2">{part.description}</p>
                        {part.location && (
                          <p className="text-xs text-gray-500 mt-1">Location: {part.location}</p>
                        )}
                      </div>
                      <Badge className={getLowStockColor(part.quantity, part.minStock)}>
                        {part.quantity} in stock
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Dialog open={editDialogOpen && selectedPartId === part.id} onOpenChange={(open) => {
                      setEditDialogOpen(open);
                      if (open) {
                        setSelectedPartId(part.id);
                        setQuantity(part.quantity.toString());
                        setLocation(part.location || "");
                        setMinStock(part.minStock.toString());
                      }
                    }}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-2">
                          <Edit2 className="w-4 h-4" />
                          Edit
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit Spare Part</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="quantity">Quantity</Label>
                            <Input
                              id="quantity"
                              type="number"
                              value={quantity}
                              onChange={(e) => setQuantity(e.target.value)}
                            />
                          </div>
                          <div>
                            <Label htmlFor="location">Location</Label>
                            <Input
                              id="location"
                              value={location}
                              onChange={(e) => setLocation(e.target.value)}
                            />
                          </div>
                          <div>
                            <Label htmlFor="minStock">Minimum Stock Level</Label>
                            <Input
                              id="minStock"
                              type="number"
                              value={minStock}
                              onChange={(e) => setMinStock(e.target.value)}
                            />
                          </div>
                          <div className="flex gap-2 justify-end">
                            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                              Cancel
                            </Button>
                            <Button onClick={handleUpdateSparePart}>
                              Save Changes
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {spareParts && spareParts.length === 0 && (
          <div className="text-center py-12">
            <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No spare parts in inventory</p>
          </div>
        )}
      </div>
    </div>
  );
}
