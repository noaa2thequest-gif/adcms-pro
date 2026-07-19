import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, AlertTriangle, Plus, ArrowRight } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function CabinDefects() {
  const { data: aircraft, isLoading: loadingAircraft } = trpc.aircraft.list.useQuery();
  const { data: cabinDefects, refetch: refetchCabinDefects } = trpc.cabinDefect.list.useQuery({});

  const createCabinDefectMutation = trpc.cabinDefect.create.useMutation();
  const convertToMelMutation = trpc.cabinDefect.convertToMel.useMutation();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [convertDialogOpen, setConvertDialogOpen] = useState(false);
  const [selectedAircraftId, setSelectedAircraftId] = useState<string>("");
  const [selectedCabinDefectId, setSelectedCabinDefectId] = useState<number | null>(null);
  const [description, setDescription] = useState("");
  const [area, setArea] = useState("");
  const [melCategory, setMelCategory] = useState("A");
  const [melReference, setMelReference] = useState("");

  const handleCreateCabinDefect = async () => {
    if (!selectedAircraftId || !description.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      await createCabinDefectMutation.mutateAsync({
        aircraftId: parseInt(selectedAircraftId),
        description,
        area: area || undefined,
      });
      toast.success("Cabin defect created successfully");
      setDescription("");
      setArea("");
      setSelectedAircraftId("");
      setCreateDialogOpen(false);
      refetchCabinDefects();
    } catch (error) {
      toast.error("Failed to create cabin defect");
    }
  };

  const handleConvertToMel = async () => {
    if (!selectedCabinDefectId) {
      toast.error("No defect selected");
      return;
    }

    try {
      await convertToMelMutation.mutateAsync({
        cabinDefectId: selectedCabinDefectId,
        category: melCategory as "A" | "B" | "C" | "D" | "Connection 1" | "Connection 2",
        reference: melReference || undefined,
      });
      toast.success("Cabin defect converted to MEL item");
      setMelReference("");
      setConvertDialogOpen(false);
      refetchCabinDefects();
    } catch (error) {
      toast.error("Failed to convert to MEL");
    }
  };

  const getAircraftName = (aircraftId: number) => {
    return aircraft?.find((a: any) => a.id === aircraftId)?.registration || "Unknown";
  };

  if (loadingAircraft) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Cabin Defects</h1>
          <p className="text-gray-600 mt-2">Report and manage cabin maintenance issues</p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Report Defect
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Report Cabin Defect</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="aircraft">Aircraft *</Label>
                <Select value={selectedAircraftId} onValueChange={setSelectedAircraftId}>
                  <SelectTrigger id="aircraft">
                    <SelectValue placeholder="Select aircraft" />
                  </SelectTrigger>
                  <SelectContent>
                    {aircraft?.map((ac: any) => (
                      <SelectItem key={ac.id} value={ac.id.toString()}>
                        {ac.registration} - {ac.model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the defect..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="min-h-20"
                />
              </div>
              <div>
                <Label htmlFor="area">Area</Label>
                <Textarea
                  id="area"
                  placeholder="Where in the cabin?"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  className="min-h-16"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateCabinDefect}>
                  Create Defect
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {cabinDefects && cabinDefects.length > 0 ? (
          cabinDefects.map((defect: any) => (
            <Card key={defect.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{defect.description}</CardTitle>
                    <p className="text-sm text-gray-600 mt-2">
                      Aircraft: <span className="font-medium">{getAircraftName(defect.aircraftId)}</span>
                    </p>
                    {defect.area && (
                      <p className="text-sm text-gray-600">
                        Area: <span className="font-medium">{defect.area}</span>
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {defect.isMel ? (
                      <Badge className="bg-blue-100 text-blue-800">MEL Item</Badge>
                    ) : (
                      <Badge variant="outline">Cabin</Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  {!defect.isMel && (
                    <Dialog open={convertDialogOpen && selectedCabinDefectId === defect.id} onOpenChange={(open) => {
                      setConvertDialogOpen(open);
                      if (open) setSelectedCabinDefectId(defect.id);
                    }}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-2">
                          <ArrowRight className="w-4 h-4" />
                          Convert to MEL
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Convert to MEL Item</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="melCategory">MEL Category *</Label>
                            <Select value={melCategory} onValueChange={setMelCategory}>
                              <SelectTrigger id="melCategory">
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
                            <Label htmlFor="reference">MEL Reference</Label>
                            <Textarea
                              id="reference"
                              placeholder="MEL reference or notes..."
                              value={melReference}
                              onChange={(e) => setMelReference(e.target.value)}
                              className="min-h-16"
                            />
                          </div>
                          <div className="flex gap-2 justify-end">
                            <Button variant="outline" onClick={() => setConvertDialogOpen(false)}>
                              Cancel
                            </Button>
                            <Button onClick={handleConvertToMel}>
                              Convert to MEL
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-12">
            <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No cabin defects reported</p>
          </div>
        )}
      </div>
    </div>
  );
}
