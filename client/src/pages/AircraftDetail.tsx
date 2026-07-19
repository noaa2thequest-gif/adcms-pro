import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertTriangle, ArrowLeft, Edit2 } from "lucide-react";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function AircraftDetail() {
  const [, navigate] = useLocation();
  const [aircraftId, setAircraftId] = useState<number | null>(null);

  // Extract aircraft ID from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    if (id) {
      setAircraftId(parseInt(id));
    }
  }, []);

  const { data: aircraft, isLoading: loadingAircraft } = trpc.aircraft.get.useQuery(
    { id: aircraftId || 0 },
    { enabled: aircraftId !== null }
  );

  const { data: defects } = trpc.defect.list.useQuery({ aircraftId: aircraftId || undefined });
  const { data: cabinDefects } = trpc.cabinDefect.list.useQuery({ aircraftId: aircraftId || undefined });

  const updateAircraftMutation = trpc.aircraft.updateStatus.useMutation();

  const [editStatusOpen, setEditStatusOpen] = useState(false);
  const [newStatus, setNewStatus] = useState("SERVICEABLE");

  const handleUpdateStatus = async () => {
    if (!aircraftId) return;

    try {
      await updateAircraftMutation.mutateAsync({
        id: aircraftId,
        status: newStatus as "SERVICEABLE" | "DEFERRED" | "AOG",
      });
      toast.success("Aircraft status updated");
      setEditStatusOpen(false);
    } catch (error) {
      toast.error("Failed to update aircraft status");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "SERVICEABLE":
        return "bg-green-100 text-green-800";
      case "DEFERRED":
        return "bg-yellow-100 text-yellow-800";
      case "AOG":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getDefectStatusColor = (status: string) => {
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

  if (!aircraft) {
    return (
      <div className="p-8">
        <Button variant="outline" onClick={() => navigate("/fleet")} className="mb-4 gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Fleet
        </Button>
        <div className="text-center py-12">
          <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Aircraft not found</p>
        </div>
      </div>
    );
  }

  const openDefects = defects?.filter((d: any) => d.status === "OPEN") || [];
  const deferredDefects = defects?.filter((d: any) => d.status === "DEFERRED") || [];
  const closedDefects = defects?.filter((d: any) => d.status === "CLOSED") || [];
  const openCabinDefects = cabinDefects?.filter((c: any) => !c.isMel) || [];
  const melCabinDefects = cabinDefects?.filter((c: any) => c.isMel) || [];

  return (
    <div className="p-8">
      <Button variant="outline" onClick={() => navigate("/fleet")} className="mb-6 gap-2">
        <ArrowLeft className="w-4 h-4" />
        Back to Fleet
      </Button>

      {/* Aircraft Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-4xl font-bold">{aircraft.registration}</h1>
            <p className="text-lg text-gray-600 mt-2">{aircraft.model}</p>
          </div>
          <Dialog open={editStatusOpen} onOpenChange={setEditStatusOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Edit2 className="w-4 h-4" />
                Update Status
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Update Aircraft Status</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={newStatus} onValueChange={setNewStatus}>
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SERVICEABLE">Serviceable</SelectItem>
                      <SelectItem value="DEFERRED">Deferred</SelectItem>
                      <SelectItem value="AOG">AOG (Aircraft on Ground)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setEditStatusOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleUpdateStatus}>
                    Save Changes
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Aircraft Info Cards */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Status</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge className={getStatusColor(aircraft.status)}>
                {aircraft.status}
              </Badge>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Location</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold">{aircraft.location || "N/A"}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Total Defects</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold">{defects?.length || 0}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Defects Summary */}
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

      {/* Defects Section */}
      <div className="space-y-8">
        {/* Open Defects */}
        {openDefects.length > 0 && (
          <div>
            <h2 className="text-2xl font-semibold mb-4">Open Defects ({openDefects.length})</h2>
            <div className="space-y-3">
              {openDefects.map((defect: any) => (
                <Card key={defect.id} className="border-red-200">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{defect.description}</CardTitle>
                        <p className="text-sm text-gray-600 mt-2">
                          Source: <span className="font-medium">{defect.source}</span>
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Reported: {new Date(defect.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge className={getDefectStatusColor(defect.status)}>
                        {defect.status}
                      </Badge>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Deferred Defects */}
        {deferredDefects.length > 0 && (
          <div>
            <h2 className="text-2xl font-semibold mb-4">Deferred Defects ({deferredDefects.length})</h2>
            <div className="space-y-3">
              {deferredDefects.map((defect: any) => (
                <Card key={defect.id} className="border-yellow-200">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{defect.description}</CardTitle>
                        <p className="text-sm text-gray-600 mt-2">
                          Source: <span className="font-medium">{defect.source}</span>
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Reported: {new Date(defect.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge className={getDefectStatusColor(defect.status)}>
                        {defect.status}
                      </Badge>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Closed Defects */}
        {closedDefects.length > 0 && (
          <div>
            <h2 className="text-2xl font-semibold mb-4">Closed Defects ({closedDefects.length})</h2>
            <div className="space-y-3">
              {closedDefects.map((defect: any) => (
                <Card key={defect.id} className="border-green-200 opacity-75">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{defect.description}</CardTitle>
                        <p className="text-sm text-gray-600 mt-2">
                          Source: <span className="font-medium">{defect.source}</span>
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Reported: {new Date(defect.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge className={getDefectStatusColor(defect.status)}>
                        {defect.status}
                      </Badge>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Cabin Defects */}
        {openCabinDefects.length > 0 && (
          <div>
            <h2 className="text-2xl font-semibold mb-4">Cabin Defects ({openCabinDefects.length})</h2>
            <div className="space-y-3">
              {openCabinDefects.map((defect: any) => (
                <Card key={defect.id} className="border-blue-200">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{defect.description}</CardTitle>
                        {defect.area && (
                          <p className="text-sm text-gray-600 mt-2">
                            Area: <span className="font-medium">{defect.area}</span>
                          </p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          Reported: {new Date(defect.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant="outline">Cabin</Badge>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* MEL Cabin Defects */}
        {melCabinDefects.length > 0 && (
          <div>
            <h2 className="text-2xl font-semibold mb-4">MEL Items (from Cabin) ({melCabinDefects.length})</h2>
            <div className="space-y-3">
              {melCabinDefects.map((defect: any) => (
                <Card key={defect.id} className="border-purple-200">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{defect.description}</CardTitle>
                        {defect.area && (
                          <p className="text-sm text-gray-600 mt-2">
                            Area: <span className="font-medium">{defect.area}</span>
                          </p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          Reported: {new Date(defect.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge className="bg-purple-100 text-purple-800">MEL Item</Badge>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        )}

        {defects && defects.length === 0 && cabinDefects && cabinDefects.length === 0 && (
          <div className="text-center py-12">
            <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No defects recorded for this aircraft</p>
          </div>
        )}
      </div>
    </div>
  );
}
