import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, AlertTriangle, ChevronDown, ChevronUp, Plus, CheckCircle, MessageSquare } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function DefectControl() {
  const [, navigate] = useLocation();
  const { data: aircraft, isLoading: loadingAircraft } = trpc.aircraft.list.useQuery();
  const { data: allDefects, refetch: refetchDefects } = trpc.defect.list.useQuery({});
  const { data: allActionLogs } = trpc.actionLog.list.useQuery({ defectId: 0 });
  
  const closeDefectMutation = trpc.defect.close.useMutation();
  const createActionLogMutation = trpc.actionLog.create.useMutation();

  const [expandedAircraft, setExpandedAircraft] = useState<number | null>(null);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [selectedDefectId, setSelectedDefectId] = useState<number | null>(null);
  const [actionText, setActionText] = useState("");
  const [nextActionText, setNextActionText] = useState("");

  const handleCloseDefect = async (defectId: number) => {
    try {
      await closeDefectMutation.mutateAsync({ id: defectId });
      toast.success("Defect closed successfully");
      refetchDefects();
    } catch (error) {
      toast.error("Failed to close defect");
    }
  };

  const handleAddAction = async () => {
    if (!selectedDefectId || !actionText.trim()) {
      toast.error("Please enter an action");
      return;
    }

    try {
      await createActionLogMutation.mutateAsync({
        defectId: selectedDefectId,
        actionTaken: actionText,
        nextAction: nextActionText || undefined,
      });
      toast.success("Action logged successfully");
      setActionText("");
      setNextActionText("");
      setActionDialogOpen(false);
      refetchDefects();
    } catch (error) {
      toast.error("Failed to log action");
    }
  };

  const getDefectsForAircraft = (aircraftId: number) => {
    return (allDefects || []).filter((d: any) => d.aircraftId === aircraftId && d.status === "OPEN");
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

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Defect Control</h1>
          <p className="text-gray-600 mt-2">Manage aircraft defects and maintenance actions</p>
        </div>
        <Button onClick={() => navigate("/new-defect")} className="gap-2">
          <Plus className="w-4 h-4" />
          New Defect
        </Button>
      </div>

      <div className="space-y-4">
        {aircraft?.map((ac: any) => {
          const defects = getDefectsForAircraft(ac.id);
          const isExpanded = expandedAircraft === ac.id;

          return (
            <Card key={ac.id} className="overflow-hidden">
              <CardHeader
                className="cursor-pointer hover:bg-gray-50 transition-colors flex flex-row items-center justify-between"
                onClick={() => setExpandedAircraft(isExpanded ? null : ac.id)}
              >
                <div className="flex-1">
                  <CardTitle className="text-lg">{ac.registration}</CardTitle>
                  <p className="text-sm text-gray-600">{ac.model}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className="bg-red-100 text-red-800">{defects.length} Open</Badge>
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5" />
                  ) : (
                    <ChevronDown className="w-5 h-5" />
                  )}
                </div>
              </CardHeader>

              {isExpanded && (
                <CardContent className="border-t pt-6">
                  {defects.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No open defects</p>
                  ) : (
                    <div className="space-y-4">
                      {defects.map((defect: any) => (
                        <div key={defect.id} className="border rounded-lg p-4 bg-gray-50">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg">{defect.description}</h3>
                              <p className="text-sm text-gray-600 mt-1">
                                Source: <span className="font-medium">{defect.source}</span>
                              </p>
                            </div>
                            <Badge className={getStatusBadgeColor(defect.status)}>
                              {defect.status}
                            </Badge>
                          </div>

                          <p className="text-xs text-gray-500 mb-4">
                            Reported: {new Date(defect.createdAt).toLocaleDateString()}
                          </p>

                          <div className="flex gap-2 flex-wrap">
                            <Dialog open={actionDialogOpen && selectedDefectId === defect.id} onOpenChange={(open) => {
                              setActionDialogOpen(open);
                              if (open) setSelectedDefectId(defect.id);
                            }}>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm" className="gap-2">
                                  <MessageSquare className="w-4 h-4" />
                                  Add Action
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Log Maintenance Action</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div>
                                    <Label htmlFor="action">Action Taken *</Label>
                                    <Textarea
                                      id="action"
                                      placeholder="Describe the action taken..."
                                      value={actionText}
                                      onChange={(e) => setActionText(e.target.value)}
                                      className="min-h-20"
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="nextAction">Next Action</Label>
                                    <Textarea
                                      id="nextAction"
                                      placeholder="What's the next step?"
                                      value={nextActionText}
                                      onChange={(e) => setNextActionText(e.target.value)}
                                      className="min-h-20"
                                    />
                                  </div>
                                  <div className="flex gap-2 justify-end">
                                    <Button variant="outline" onClick={() => setActionDialogOpen(false)}>
                                      Cancel
                                    </Button>
                                    <Button onClick={handleAddAction}>
                                      Log Action
                                    </Button>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>

                            <Button
                              variant="default"
                              size="sm"
                              className="gap-2 bg-green-600 hover:bg-green-700"
                              onClick={() => handleCloseDefect(defect.id)}
                            >
                              <CheckCircle className="w-4 h-4" />
                              Close Defect
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {(!aircraft || aircraft.length === 0) && (
        <div className="text-center py-12">
          <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No aircraft in fleet</p>
        </div>
      )}
    </div>
  );
}
