import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, AlertTriangle, Edit2, Lock } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";

export default function MccCenter() {
  const { user } = useAuth();
  const { data: aircraft, isLoading: loadingAircraft } = trpc.aircraft.list.useQuery();
  const { data: defects, refetch: refetchDefects } = trpc.defect.list.useQuery({});

  const updateDefectMutation = trpc.defect.update.useMutation();

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedDefectId, setSelectedDefectId] = useState<number | null>(null);
  const [editStatus, setEditStatus] = useState("OPEN");
  const [editDescription, setEditDescription] = useState("");

  const isMccEngineer = user?.role === "mcc" || user?.role === "admin";

  const handleUpdateDefect = async () => {
    if (!selectedDefectId) {
      toast.error("No defect selected");
      return;
    }

    try {
      await updateDefectMutation.mutateAsync({
        id: selectedDefectId,
        status: editStatus as "OPEN" | "CLOSED" | "DEFERRED",
        description: editDescription || undefined,
      });
      toast.success("Defect updated successfully");
      setEditDialogOpen(false);
      refetchDefects();
    } catch (error) {
      toast.error("Failed to update defect");
    }
  };

  const getAircraftName = (aircraftId: number) => {
    return aircraft?.find((a: any) => a.id === aircraftId)?.registration || "Unknown";
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "OPEN":
        return "bg-red-100 text-red-800";
      case "CLOSED":
        return "bg-green-100 text-green-800";
      case "DEFERRED":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loadingAircraft) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!isMccEngineer) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Access Denied
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Only MCC Engineers and Admins can access this section.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const openDefects = defects?.filter((d: any) => d.status === "OPEN") || [];
  const deferredDefects = defects?.filter((d: any) => d.status === "DEFERRED") || [];
  const closedDefects = defects?.filter((d: any) => d.status === "CLOSED") || [];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">MCC Center</h1>
        <p className="text-gray-600 mt-2">Maintenance Control Center - Defect coordination and status management</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-red-600">Open Defects</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">{openDefects.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-yellow-600">Deferred</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-yellow-600">{deferredDefects.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-green-600">Closed</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{closedDefects.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Defects by Status */}
      <div className="space-y-8">
        {/* Open Defects */}
        {openDefects.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Open Defects ({openDefects.length})</h2>
            <div className="space-y-3">
              {openDefects.map((defect: any) => (
                <Card key={defect.id} className="border-red-200">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{defect.description}</CardTitle>
                        <p className="text-sm text-gray-600 mt-2">
                          Aircraft: <span className="font-medium">{getAircraftName(defect.aircraftId)}</span>
                        </p>
                        <p className="text-sm text-gray-600">
                          Source: <span className="font-medium">{defect.source}</span>
                        </p>
                      </div>
                      <Badge className={getStatusBadgeColor(defect.status)}>
                        {defect.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Dialog open={editDialogOpen && selectedDefectId === defect.id} onOpenChange={(open) => {
                      setEditDialogOpen(open);
                      if (open) {
                        setSelectedDefectId(defect.id);
                        setEditStatus(defect.status);
                        setEditDescription(defect.description);
                      }
                    }}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-2">
                          <Edit2 className="w-4 h-4" />
                          Update Status
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Update Defect Status</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="status">Status</Label>
                            <Select value={editStatus} onValueChange={setEditStatus}>
                              <SelectTrigger id="status">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="OPEN">Open</SelectItem>
                                <SelectItem value="DEFERRED">Deferred</SelectItem>
                                <SelectItem value="CLOSED">Closed</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                              id="description"
                              value={editDescription}
                              onChange={(e) => setEditDescription(e.target.value)}
                              className="min-h-20"
                            />
                          </div>
                          <div className="flex gap-2 justify-end">
                            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                              Cancel
                            </Button>
                            <Button onClick={handleUpdateDefect}>
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

        {/* Deferred Defects */}
        {deferredDefects.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Deferred Defects ({deferredDefects.length})</h2>
            <div className="space-y-3">
              {deferredDefects.map((defect: any) => (
                <Card key={defect.id} className="border-yellow-200">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{defect.description}</CardTitle>
                        <p className="text-sm text-gray-600 mt-2">
                          Aircraft: <span className="font-medium">{getAircraftName(defect.aircraftId)}</span>
                        </p>
                        <p className="text-sm text-gray-600">
                          Source: <span className="font-medium">{defect.source}</span>
                        </p>
                      </div>
                      <Badge className={getStatusBadgeColor(defect.status)}>
                        {defect.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Dialog open={editDialogOpen && selectedDefectId === defect.id} onOpenChange={(open) => {
                      setEditDialogOpen(open);
                      if (open) {
                        setSelectedDefectId(defect.id);
                        setEditStatus(defect.status);
                        setEditDescription(defect.description);
                      }
                    }}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-2">
                          <Edit2 className="w-4 h-4" />
                          Update Status
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Update Defect Status</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="status">Status</Label>
                            <Select value={editStatus} onValueChange={setEditStatus}>
                              <SelectTrigger id="status">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="OPEN">Open</SelectItem>
                                <SelectItem value="DEFERRED">Deferred</SelectItem>
                                <SelectItem value="CLOSED">Closed</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                              id="description"
                              value={editDescription}
                              onChange={(e) => setEditDescription(e.target.value)}
                              className="min-h-20"
                            />
                          </div>
                          <div className="flex gap-2 justify-end">
                            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                              Cancel
                            </Button>
                            <Button onClick={handleUpdateDefect}>
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

        {/* Closed Defects */}
        {closedDefects.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Closed Defects ({closedDefects.length})</h2>
            <div className="space-y-3">
              {closedDefects.map((defect: any) => (
                <Card key={defect.id} className="border-green-200 opacity-75">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{defect.description}</CardTitle>
                        <p className="text-sm text-gray-600 mt-2">
                          Aircraft: <span className="font-medium">{getAircraftName(defect.aircraftId)}</span>
                        </p>
                        <p className="text-sm text-gray-600">
                          Source: <span className="font-medium">{defect.source}</span>
                        </p>
                      </div>
                      <Badge className={getStatusBadgeColor(defect.status)}>
                        {defect.status}
                      </Badge>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        )}

        {defects && defects.length === 0 && (
          <div className="text-center py-12">
            <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No defects to manage</p>
          </div>
        )}
      </div>
    </div>
  );
}
