import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, CheckCircle, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function NewDefect() {
  const [, navigate] = useLocation();
  const { data: aircraft, isLoading: loadingAircraft } = trpc.aircraft.list.useQuery();
  const createDefectMutation = trpc.defect.create.useMutation();
  const createMelMutation = trpc.mel.create.useMutation();

  const [formData, setFormData] = useState({
    aircraftId: "",
    source: "",
    description: "",
    isMel: false,
    melCategory: "",
    melReference: "",
    openDate: new Date().toISOString().split("T")[0],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (!formData.aircraftId || !formData.source || !formData.description) {
        toast.error("Please fill in all required fields");
        setIsSubmitting(false);
        return;
      }

      // Create defect
      const defectResult = await createDefectMutation.mutateAsync({
        aircraftId: parseInt(formData.aircraftId),
        source: formData.source,
        description: formData.description,
      });

      const defectId = (defectResult as any).insertId;

      // Create MEL if selected
      if (formData.isMel && formData.melCategory && defectId) {
        await createMelMutation.mutateAsync({
          defectId,
          category: formData.melCategory as any,
          reference: formData.melReference || undefined,
        });
      }

      toast.success("Defect created successfully");
      navigate("/defect-control");
    } catch (error) {
      toast.error("Failed to create defect");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingAircraft) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Report New Defect</h1>
        <p className="text-gray-600 mt-2">Log a new aircraft defect or maintenance issue</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Defect Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Aircraft Selection */}
            <div>
              <Label htmlFor="aircraft">Aircraft *</Label>
              <Select value={formData.aircraftId} onValueChange={(value) => setFormData({ ...formData, aircraftId: value })}>
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

            {/* Defect Source */}
            <div>
              <Label htmlFor="source">Defect Source *</Label>
              <Select value={formData.source} onValueChange={(value) => setFormData({ ...formData, source: value })}>
                <SelectTrigger id="source">
                  <SelectValue placeholder="Select source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ECAM Msg">ECAM Message</SelectItem>
                  <SelectItem value="Failure Msg">Failure Message</SelectItem>
                  <SelectItem value="Capt Entry">Captain Entry</SelectItem>
                  <SelectItem value="Crew Observation">Crew Observation</SelectItem>
                  <SelectItem value="Maintenance Observation">Maintenance Observation</SelectItem>
                  <SelectItem value="Cabin">Cabin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Describe the defect in detail"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="min-h-24"
              />
            </div>

            {/* Open Date */}
            <div>
              <Label htmlFor="openDate">Open Date</Label>
              <Input
                id="openDate"
                type="date"
                value={formData.openDate}
                onChange={(e) => setFormData({ ...formData, openDate: e.target.value })}
              />
            </div>

            {/* MEL Section */}
            <div className="border-t pt-6">
              <div className="flex items-center gap-3 mb-4">
                <Checkbox
                  id="isMel"
                  checked={formData.isMel}
                  onCheckedChange={(checked) => setFormData({ ...formData, isMel: checked as boolean })}
                />
                <Label htmlFor="isMel" className="font-medium cursor-pointer">
                  This is a MEL Item
                </Label>
              </div>

              {formData.isMel && (
                <div className="space-y-4 p-4 bg-blue-50 rounded-lg">
                  <div>
                    <Label htmlFor="melCategory">MEL Category *</Label>
                    <Select value={formData.melCategory} onValueChange={(value) => setFormData({ ...formData, melCategory: value })}>
                      <SelectTrigger id="melCategory">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A">Category A (Immediate)</SelectItem>
                        <SelectItem value="B">Category B (3 Days)</SelectItem>
                        <SelectItem value="C">Category C (10 Days)</SelectItem>
                        <SelectItem value="D">Category D (120 Days)</SelectItem>
                        <SelectItem value="Connection 1">Connection 1</SelectItem>
                        <SelectItem value="Connection 2">Connection 2</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="melReference">MEL Reference</Label>
                    <Input
                      id="melReference"
                      placeholder="e.g., 34-11-11"
                      value={formData.melReference}
                      onChange={(e) => setFormData({ ...formData, melReference: e.target.value })}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Create Defect
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/defect-control")}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
