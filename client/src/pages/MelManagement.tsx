import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, AlertTriangle, Clock, CheckCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function MelManagement() {
  const { data: aircraft, isLoading: loadingAircraft } = trpc.aircraft.list.useQuery();
  const { data: melItems, refetch: refetchMelItems } = trpc.mel.list.useQuery({});
  const { data: allDefects } = trpc.defect.list.useQuery({});

  const updateMelMutation = trpc.mel.update.useMutation();

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedMelId, setSelectedMelId] = useState<number | null>(null);
  const [editCategory, setEditCategory] = useState("A");
  const [editReference, setEditReference] = useState("");
  const [editPlacard, setEditPlacard] = useState(false);

  const handleEditMel = async () => {
    if (!selectedMelId) {
      toast.error("No MEL item selected");
      return;
    }

    try {
      await updateMelMutation.mutateAsync({
        id: selectedMelId,
        category: editCategory as "A" | "B" | "C" | "D" | "Connection 1" | "Connection 2",
        reference: editReference || undefined,
        placardRequired: editPlacard,
      });
      toast.success("MEL item updated successfully");
      setEditDialogOpen(false);
      refetchMelItems();
    } catch (error) {
      toast.error("Failed to update MEL item");
    }
  };

  const getAircraftName = (defectId: number) => {
    const defect = allDefects?.find((d: any) => d.id === defectId);
    if (!defect) return "Unknown";
    const aircraft_item = aircraft?.find((a: any) => a.id === defect.aircraftId);
    return aircraft_item?.registration || "Unknown";
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "A":
        return "bg-red-100 text-red-800";
      case "B":
        return "bg-orange-100 text-orange-800";
      case "C":
        return "bg-yellow-100 text-yellow-800";
      case "D":
        return "bg-green-100 text-green-800";
      case "Connection 1":
      case "Connection 2":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const isExpired = (expiryDate: string | null) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  const getDaysUntilExpiry = (expiryDate: string | null) => {
    if (!expiryDate) return null;
    const now = new Date();
    const expiry = new Date(expiryDate);
    const days = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  if (loadingAircraft) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  const expiredItems = melItems?.filter((m: any) => isExpired(m.expiryDate)) || [];
  const expiringItems = melItems?.filter((m: any) => {
    const days = getDaysUntilExpiry(m.expiryDate);
    return days !== null && days > 0 && days <= 7;
  }) || [];
  const activeItems = melItems?.filter((m: any) => {
    const days = getDaysUntilExpiry(m.expiryDate);
    return days === null || days > 7;
  }) || [];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">MEL Management</h1>
        <p className="text-gray-600 mt-2">Track and manage deferred maintenance items</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Active Items</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{activeItems.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-orange-600">Expiring Soon</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-orange-600">{expiringItems.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-red-600">Expired</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">{expiredItems.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* MEL Items by Status */}
      <div className="space-y-8">
        {/* Expired Items */}
        {expiredItems.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              Expired Items ({expiredItems.length})
            </h2>
            <div className="space-y-3">
              {expiredItems.map((item: any) => (
                <Card key={item.id} className="border-red-200 bg-red-50">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <Badge className={getCategoryColor(item.category)}>
                          {item.category}
                        </Badge>
                        {item.reference && (
                          <p className="text-sm text-gray-600 mt-2">Ref: {item.reference}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-red-600 font-semibold">
                          Expired: {new Date(item.expiryDate).toLocaleDateString()}
                        </p>
                        {item.placardRequired && (
                          <Badge className="mt-2 bg-red-600">Placard Required</Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Dialog open={editDialogOpen && selectedMelId === item.id} onOpenChange={(open) => {
                      setEditDialogOpen(open);
                      if (open) {
                        setSelectedMelId(item.id);
                        setEditCategory(item.category);
                        setEditReference(item.reference || "");
                        setEditPlacard(item.placardRequired === 1);
                      }
                    }}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit MEL Item</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="category">Category</Label>
                            <Select value={editCategory} onValueChange={setEditCategory}>
                              <SelectTrigger id="category">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="A">Category A (Immediate)</SelectItem>
                                <SelectItem value="B">Category B (3 Days)</SelectItem>
                                <SelectItem value="C">Category C (10 Days)</SelectItem>
                                <SelectItem value="D">Category D (120 Days)</SelectItem>
                                <SelectItem value="Connection 1">Conn 1 (Next Flight)</SelectItem>
                                <SelectItem value="Connection 2">Conn 2 (3 Flights)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="reference">Reference</Label>
                            <Input
                              id="reference"
                              placeholder="MEL reference..."
                              value={editReference}
                              onChange={(e) => setEditReference(e.target.value)}
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id="placard"
                              checked={editPlacard}
                              onChange={(e) => setEditPlacard(e.target.checked)}
                            />
                            <Label htmlFor="placard">Placard Required</Label>
                          </div>
                          <div className="flex gap-2 justify-end">
                            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                              Cancel
                            </Button>
                            <Button onClick={handleEditMel}>
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

        {/* Expiring Soon */}
        {expiringItems.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-orange-600" />
              Expiring Soon ({expiringItems.length})
            </h2>
            <div className="space-y-3">
              {expiringItems.map((item: any) => (
                <Card key={item.id} className="border-orange-200 bg-orange-50">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <Badge className={getCategoryColor(item.category)}>
                          {item.category}
                        </Badge>
                        {item.reference && (
                          <p className="text-sm text-gray-600 mt-2">Ref: {item.reference}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-orange-600 font-semibold">
                          Expires in {getDaysUntilExpiry(item.expiryDate)} days
                        </p>
                        {item.placardRequired && (
                          <Badge className="mt-2 bg-orange-600">Placard Required</Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Dialog open={editDialogOpen && selectedMelId === item.id} onOpenChange={(open) => {
                      setEditDialogOpen(open);
                      if (open) {
                        setSelectedMelId(item.id);
                        setEditCategory(item.category);
                        setEditReference(item.reference || "");
                        setEditPlacard(item.placardRequired === 1);
                      }
                    }}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit MEL Item</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="category">Category</Label>
                            <Select value={editCategory} onValueChange={setEditCategory}>
                              <SelectTrigger id="category">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="A">Category A (Immediate)</SelectItem>
                                <SelectItem value="B">Category B (3 Days)</SelectItem>
                                <SelectItem value="C">Category C (10 Days)</SelectItem>
                                <SelectItem value="D">Category D (120 Days)</SelectItem>
                                <SelectItem value="Connection 1">Conn 1 (Next Flight)</SelectItem>
                                <SelectItem value="Connection 2">Conn 2 (3 Flights)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="reference">Reference</Label>
                            <Input
                              id="reference"
                              placeholder="MEL reference..."
                              value={editReference}
                              onChange={(e) => setEditReference(e.target.value)}
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id="placard"
                              checked={editPlacard}
                              onChange={(e) => setEditPlacard(e.target.checked)}
                            />
                            <Label htmlFor="placard">Placard Required</Label>
                          </div>
                          <div className="flex gap-2 justify-end">
                            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                              Cancel
                            </Button>
                            <Button onClick={handleEditMel}>
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

        {/* Active Items */}
        {activeItems.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Active Items ({activeItems.length})
            </h2>
            <div className="space-y-3">
              {activeItems.map((item: any) => (
                <Card key={item.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <Badge className={getCategoryColor(item.category)}>
                          {item.category}
                        </Badge>
                        {item.reference && (
                          <p className="text-sm text-gray-600 mt-2">Ref: {item.reference}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-600">
                          Expires: {new Date(item.expiryDate).toLocaleDateString()}
                        </p>
                        {item.placardRequired && (
                          <Badge className="mt-2">Placard Required</Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Dialog open={editDialogOpen && selectedMelId === item.id} onOpenChange={(open) => {
                      setEditDialogOpen(open);
                      if (open) {
                        setSelectedMelId(item.id);
                        setEditCategory(item.category);
                        setEditReference(item.reference || "");
                        setEditPlacard(item.placardRequired === 1);
                      }
                    }}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit MEL Item</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="category">Category</Label>
                            <Select value={editCategory} onValueChange={setEditCategory}>
                              <SelectTrigger id="category">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="A">Category A (Immediate)</SelectItem>
                                <SelectItem value="B">Category B (3 Days)</SelectItem>
                                <SelectItem value="C">Category C (10 Days)</SelectItem>
                                <SelectItem value="D">Category D (120 Days)</SelectItem>
                                <SelectItem value="Connection 1">Conn 1 (Next Flight)</SelectItem>
                                <SelectItem value="Connection 2">Conn 2 (3 Flights)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="reference">Reference</Label>
                            <Input
                              id="reference"
                              placeholder="MEL reference..."
                              value={editReference}
                              onChange={(e) => setEditReference(e.target.value)}
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id="placard"
                              checked={editPlacard}
                              onChange={(e) => setEditPlacard(e.target.checked)}
                            />
                            <Label htmlFor="placard">Placard Required</Label>
                          </div>
                          <div className="flex gap-2 justify-end">
                            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                              Cancel
                            </Button>
                            <Button onClick={handleEditMel}>
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

        {melItems && melItems.length === 0 && (
          <div className="text-center py-12">
            <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No MEL items</p>
          </div>
        )}
      </div>
    </div>
  );
}
