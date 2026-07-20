import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, AlertTriangle, ChevronDown, ChevronUp, Plus, CheckCircle, MessageSquare, Trash2, Eye } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function DefectControl() {
  const [, navigate] = useLocation();
  const { data: aircraft, isLoading: loadingAircraft } = trpc.aircraft.list.useQuery();
  const { data: allDefects, refetch: refetchDefects } = trpc.defect.list.useQuery({});
  const { data: allSurveillance, refetch: refetchSurveillance } = trpc.surveillance.list.useQuery({});
  const { data: allActionLogs } = trpc.actionLog.list.useQuery({ defectId: 0 });
  
  const closeDefectMutation = trpc.defect.close.useMutation();
  const createActionLogMutation = trpc.actionLog.create.useMutation();
  const deleteDefectMutation = trpc.defect.delete.useMutation();
  const closeSurveillanceMutation = trpc.surveillance.close.useMutation();
  const respondSurveillanceMutation = trpc.surveillance.respond.useMutation();
  const deleteSurveillanceMutation = trpc.surveillance.delete.useMutation();

  const [expandedAircraft, setExpandedAircraft] = useState<number | null>(null);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedDefectId, setSelectedDefectId] = useState<number | null>(null);
  const [selectedSurveillanceId, setSelectedSurveillanceId] = useState<number | null>(null);
  const [actionText, setActionText] = useState("");
  const [nextActionText, setNextActionText] = useState("");
  const [surveillanceResponseText, setSurveillanceResponseText] = useState("");

  const handleCloseDefect = async (defectId: number) => {
    try {
      await closeDefectMutation.mutateAsync({ id: defectId });
      toast.success("Defect closed successfully");
      refetchDefects();
    } catch (error) {
      toast.error("Failed to close defect");
    }
  };

  const handleDeleteDefect = async () => {
    if (!selectedDefectId) return;
    try {
      await deleteDefectMutation.mutateAsync({ id: selectedDefectId });
      toast.success("Defect deleted successfully");
      setDeleteDialogOpen(false);
      refetchDefects();
    } catch (error) {
      toast.error("Failed to delete defect");
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

  const handleRespondSurveillance = async (surveillanceId: number) => {
    if (!surveillanceResponseText.trim()) {
      toast.error("Please enter a response");
      return;
    }

    try {
      await respondSurveillanceMutation.mutateAsync({
        id: surveillanceId,
        actionTaken: surveillanceResponseText,
        status: "IN_PROGRESS",
      });
      toast.success("Response logged successfully");
      setSurveillanceResponseText("");
      setActionDialogOpen(false);
      refetchSurveillance();
    } catch (error) {
      toast.error("Failed to log response");
    }
  };

  const handleCloseSurveillance = async (surveillanceId: number) => {
    try {
      await closeSurveillanceMutation.mutateAsync({ id: surveillanceId });
      toast.success("Surveillance report closed and sent to QA");
      refetchSurveillance();
    } catch (error) {
      toast.error("Failed to close surveillance report");
    }
  };

  const handleDeleteSurveillance = async (surveillanceId: number) => {
    try {
      await deleteSurveillanceMutation.mutateAsync({ id: surveillanceId });
      toast.success("Surveillance report deleted");
      setDeleteDialogOpen(false);
      refetchSurveillance();
    } catch (error) {
      toast.error("Failed to delete surveillance report");
    }
  };

  const getDefectsForAircraft = (aircraftId: number) => {
    return (allDefects || []).filter((d: any) => d.aircraftId === aircraftId && d.status === "OPEN");
  };

  const getSurveillanceForAircraft = (aircraftId: number) => {
    return (allSurveillance || []).filter((s: any) => s.aircraftId === aircraftId && s.status !== "SENT_TO_QA");
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "OPEN":
        return "bg-red-100 text-red-800";
      case "CLOSED":
        return "bg-green-100 text-green-800";
      case "DEFERRED":
        return "bg-yellow-100 text-yellow-800";
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-800";
      case "SENT_TO_QA":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "CRITICAL":
        return "bg-red-100 text-red-800";
      case "MAJOR":
        return "bg-orange-100 text-orange-800";
      case "MINOR":
        return "bg-yellow-100 text-yellow-800";
      case "OBSERVATION":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getActionLogsForDefect = (defectId: number) => {
    return (allActionLogs || []).filter((log: any) => log.defectId === defectId);
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
          <p className="text-gray-600 mt-2">Manage aircraft defects and surveillance reports</p>
        </div>
        <Button onClick={() => navigate("/new-defect")} className="gap-2">
          <Plus className="w-4 h-4" />
          New Defect
        </Button>
      </div>

      <div className="space-y-4">
        {aircraft?.map((ac: any) => {
          const defects = getDefectsForAircraft(ac.id);
          const surveillance = getSurveillanceForAircraft(ac.id);
          const totalIssues = defects.length + surveillance.length;
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
                  {totalIssues > 0 && (
                    <Badge className="bg-red-100 text-red-800">{totalIssues} Issues</Badge>
                  )}
                  {defects.length > 0 && (
                    <Badge className="bg-orange-100 text-orange-800">{defects.length} Defects</Badge>
                  )}
                  {surveillance.length > 0 && (
                    <Badge className="bg-blue-100 text-blue-800">{surveillance.length} Surveillance</Badge>
                  )}
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5" />
                  ) : (
                    <ChevronDown className="w-5 h-5" />
                  )}
                </div>
              </CardHeader>

              {isExpanded && (
                <CardContent className="border-t pt-6">
                  {totalIssues === 0 ? (
                    <p className="text-gray-500 text-center py-4">No open defects or surveillance reports</p>
                  ) : (
                    <div className="space-y-4">
                      {/* Defects Section */}
                      {defects.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-orange-700 mb-3">Defects ({defects.length})</h4>
                          <div className="space-y-3">
                            {defects.map((defect: any) => (
                              <div key={defect.id} className="border rounded-lg p-4 bg-orange-50">
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

                                {getActionLogsForDefect(defect.id).length > 0 && (
                                  <div className="mb-4 p-3 bg-blue-50 rounded border border-blue-200">
                                    <p className="text-sm font-semibold text-blue-900 mb-2">Action History:</p>
                                    <div className="space-y-2">
                                      {getActionLogsForDefect(defect.id).map((log: any) => (
                                        <div key={log.id} className="text-xs text-blue-800">
                                          <p className="font-medium">{log.actionTaken}</p>
                                          {log.nextAction && <p className="text-blue-700 mt-1">Next: {log.nextAction}</p>}
                                          <p className="text-blue-600 mt-1">{new Date(log.createdAt).toLocaleString()}</p>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

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

                                  <AlertDialog open={deleteDialogOpen && selectedDefectId === defect.id} onOpenChange={(open) => {
                                    setDeleteDialogOpen(open);
                                    if (open) setSelectedDefectId(defect.id);
                                  }}>
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      className="gap-2"
                                      onClick={() => {
                                        setSelectedDefectId(defect.id);
                                        setDeleteDialogOpen(true);
                                      }}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                      Delete
                                    </Button>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Delete Defect</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Are you sure you want to delete this defect? This action cannot be undone.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <div className="flex gap-2 justify-end">
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleDeleteDefect} className="bg-red-600 hover:bg-red-700">
                                          Delete
                                        </AlertDialogAction>
                                      </div>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Surveillance Section */}
                      {surveillance.length > 0 && (
                        <div className="mt-6 pt-6 border-t">
                          <h4 className="font-semibold text-blue-700 mb-3 flex items-center gap-2">
                            <Eye className="w-4 h-4" />
                            Surveillance Reports ({surveillance.length})
                          </h4>
                          <div className="space-y-3">
                            {surveillance.map((report: any) => (
                              <div key={report.id} className="border rounded-lg p-4 bg-blue-50">
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <h3 className="font-semibold text-lg">{report.auditType}</h3>
                                      <Badge className={getSeverityColor(report.severity)}>
                                        {report.severity}
                                      </Badge>
                                    </div>
                                    <p className="text-sm text-gray-700 mt-2">{report.findings}</p>
                                  </div>
                                  <Badge className={getStatusBadgeColor(report.status)}>
                                    {report.status}
                                  </Badge>
                                </div>

                                <p className="text-xs text-gray-500 mb-4">
                                  Reported: {new Date(report.createdAt).toLocaleDateString()}
                                </p>

                                {report.actionTaken && (
                                  <div className="mb-4 p-3 bg-green-50 rounded border border-green-200">
                                    <p className="text-sm font-semibold text-green-900 mb-2">Action Taken:</p>
                                    <p className="text-sm text-green-800">{report.actionTaken}</p>
                                    {report.respondedAt && (
                                      <p className="text-xs text-green-600 mt-2">Responded: {new Date(report.respondedAt).toLocaleString()}</p>
                                    )}
                                  </div>
                                )}

                                <div className="flex gap-2 flex-wrap">
                                  {report.status === "OPEN" && (
                                    <Dialog open={actionDialogOpen && selectedSurveillanceId === report.id} onOpenChange={(open) => {
                                      setActionDialogOpen(open);
                                      if (open) setSelectedSurveillanceId(report.id);
                                    }}>
                                      <DialogTrigger asChild>
                                        <Button variant="outline" size="sm" className="gap-2">
                                          <MessageSquare className="w-4 h-4" />
                                          Respond
                                        </Button>
                                      </DialogTrigger>
                                      <DialogContent>
                                        <DialogHeader>
                                          <DialogTitle>Respond to Surveillance Report</DialogTitle>
                                        </DialogHeader>
                                        <div className="space-y-4">
                                          <div>
                                            <Label htmlFor="response">Response *</Label>
                                            <Textarea
                                              id="response"
                                              placeholder="Describe the action taken..."
                                              value={surveillanceResponseText}
                                              onChange={(e) => setSurveillanceResponseText(e.target.value)}
                                              className="min-h-20"
                                            />
                                          </div>
                                          <div className="flex gap-2 justify-end">
                                            <Button variant="outline" onClick={() => setActionDialogOpen(false)}>
                                              Cancel
                                            </Button>
                                            <Button onClick={() => handleRespondSurveillance(report.id)}>
                                              Log Response
                                            </Button>
                                          </div>
                                        </div>
                                      </DialogContent>
                                    </Dialog>
                                  )}

                                  {(report.status === "OPEN" || report.status === "IN_PROGRESS") && (
                                    <Button
                                      variant="default"
                                      size="sm"
                                      className="gap-2 bg-purple-600 hover:bg-purple-700"
                                      onClick={() => handleCloseSurveillance(report.id)}
                                    >
                                      <CheckCircle className="w-4 h-4" />
                                      Close & Send to QA
                                    </Button>
                                  )}

                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    className="gap-2"
                                    onClick={() => handleDeleteSurveillance(report.id)}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                    Delete
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
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
