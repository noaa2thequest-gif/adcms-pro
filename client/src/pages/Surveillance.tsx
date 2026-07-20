import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";

type AuditType = "SURVEILLANCE" | "SAFA";
type Severity = "CRITICAL" | "MAJOR" | "MINOR" | "OBSERVATION";
type Status = "OPEN" | "IN_PROGRESS" | "CLOSED" | "SENT_TO_QA";

export default function SurveillancePage() {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [selectedAircraft, setSelectedAircraft] = useState<number | undefined>();
  const [auditType, setAuditType] = useState<AuditType>("SURVEILLANCE");
  const [severity, setSeverity] = useState<Severity>("OBSERVATION");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [findings, setFindings] = useState("");
  const [actionTaken, setActionTaken] = useState("");
  const [selectedReport, setSelectedReport] = useState<number | undefined>();

  const aircraftQuery = trpc.aircraft.list.useQuery();
  const reportsQuery = trpc.surveillance.list.useQuery({ aircraftId: selectedAircraft });
  const createMutation = trpc.surveillance.create.useMutation();
  const respondMutation = trpc.surveillance.respond.useMutation();
  const closeMutation = trpc.surveillance.close.useMutation();
  const deleteMutation = trpc.surveillance.delete.useMutation();

  const handleCreateReport = async () => {
    if (!selectedAircraft || !title || !description) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      await createMutation.mutateAsync({
        aircraftId: selectedAircraft,
        title,
        description,
        auditType,
        findings: findings || undefined,
        severity,
      });
      toast.success("Surveillance report created successfully");
      setTitle("");
      setDescription("");
      setFindings("");
      setShowForm(false);
      reportsQuery.refetch();
    } catch (error) {
      toast.error("Failed to create report");
    }
  };

  const handleRespondToReport = async (reportId: number) => {
    if (!actionTaken) {
      toast.error("Please enter action taken");
      return;
    }

    try {
      await respondMutation.mutateAsync({
        id: reportId,
        actionTaken,
        status: "IN_PROGRESS",
      });
      toast.success("Response submitted");
      setActionTaken("");
      setSelectedReport(undefined);
      reportsQuery.refetch();
    } catch (error) {
      toast.error("Failed to respond");
    }
  };

  const handleCloseReport = async (reportId: number) => {
    try {
      await closeMutation.mutateAsync({ id: reportId });
      toast.success("Report closed and sent to Quality Management");
      reportsQuery.refetch();
    } catch (error) {
      toast.error("Failed to close report");
    }
  };

  const handleDeleteReport = async (reportId: number) => {
    try {
      await deleteMutation.mutateAsync({ id: reportId });
      toast.success("Report deleted");
      reportsQuery.refetch();
    } catch (error) {
      toast.error("Failed to delete report");
    }
  };

  const getSeverityColor = (sev: Severity) => {
    switch (sev) {
      case "CRITICAL":
        return "bg-red-100 text-red-800";
      case "MAJOR":
        return "bg-orange-100 text-orange-800";
      case "MINOR":
        return "bg-yellow-100 text-yellow-800";
      case "OBSERVATION":
        return "bg-blue-100 text-blue-800";
    }
  };

  const getStatusColor = (status: Status) => {
    switch (status) {
      case "OPEN":
        return "bg-red-100 text-red-800";
      case "IN_PROGRESS":
        return "bg-yellow-100 text-yellow-800";
      case "CLOSED":
        return "bg-green-100 text-green-800";
      case "SENT_TO_QA":
        return "bg-purple-100 text-purple-800";
    }
  };

  const canCreateReport = ["quality_auditor", "supervisor", "technician", "admin", "surveillance"].includes(
    user?.role || ""
  );
  const canRespond = ["technician", "mcc", "admin"].includes(user?.role || "");
  const canClose = ["quality_auditor", "admin"].includes(user?.role || "");
  const canDelete = user?.role === "admin";

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Surveillance & SAFA Audits</h1>
        {canCreateReport && (
          <Button onClick={() => setShowForm(!showForm)} variant="default">
            {showForm ? "Cancel" : "New Audit Report"}
          </Button>
        )}
      </div>

      {showForm && canCreateReport && (
        <Card className="p-6 space-y-4">
          <h2 className="text-xl font-semibold">Create New Audit Report</h2>

          <div className="space-y-2">
            <label className="block text-sm font-medium">Aircraft *</label>
            <Select value={selectedAircraft ? String(selectedAircraft) : ""} onValueChange={(v) => setSelectedAircraft(v ? Number(v) : undefined)}>
              <SelectTrigger>
                <SelectValue placeholder="Select Aircraft" />
              </SelectTrigger>
              <SelectContent>
                {aircraftQuery.data?.map((ac) => (
                  <SelectItem key={ac.id} value={ac.id.toString()}>
                    {ac.registration} - {ac.model}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium">Audit Type *</label>
              <Select value={auditType} onValueChange={(v) => setAuditType(v as AuditType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SURVEILLANCE">Surveillance</SelectItem>
                  <SelectItem value="SAFA">SAFA</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium">Severity</label>
              <Select value={severity} onValueChange={(v) => setSeverity(v as Severity)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CRITICAL">Critical</SelectItem>
                  <SelectItem value="MAJOR">Major</SelectItem>
                  <SelectItem value="MINOR">Minor</SelectItem>
                  <SelectItem value="OBSERVATION">Observation</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium">Title *</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Audit title" />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium">Description *</label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Detailed description" rows={3} />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium">Findings</label>
            <Textarea value={findings} onChange={(e) => setFindings(e.target.value)} placeholder="Findings and observations" rows={3} />
          </div>

          <Button onClick={handleCreateReport} disabled={createMutation.isPending} className="w-full">
            {createMutation.isPending ? <Spinner className="mr-2" /> : "Create Report"}
          </Button>
        </Card>
      )}

      {/* Aircraft Selection */}
      <div className="space-y-2">
        <label className="block text-sm font-medium">Filter by Aircraft</label>
        <Select value={selectedAircraft ? String(selectedAircraft) : ""} onValueChange={(v) => setSelectedAircraft(v ? Number(v) : undefined)}>
          <SelectTrigger>
            <SelectValue placeholder="All Aircraft" />
          </SelectTrigger>
          <SelectContent>
            {aircraftQuery.data?.map((ac) => (
              <SelectItem key={ac.id} value={ac.id.toString()}>
                {ac.registration} - {ac.model}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Reports List */}
      <div className="space-y-4">
        {reportsQuery.isLoading ? (
          <div className="flex justify-center">
            <Spinner />
          </div>
        ) : reportsQuery.data && reportsQuery.data.length > 0 ? (
          reportsQuery.data.map((report) => (
            <Card key={report.id} className="p-6 space-y-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold">{report.title}</h3>
                    <Badge className={getSeverityColor(report.severity as Severity)}>{report.severity}</Badge>
                    <Badge className={getStatusColor(report.status as Status)}>{report.status}</Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    Type: {report.auditType} | Aircraft ID: {report.aircraftId}
                  </p>
                  <p className="text-sm mb-2">{report.description}</p>
                  {report.findings && <p className="text-sm text-gray-700 mb-2">Findings: {report.findings}</p>}
                </div>
              </div>

              {/* Response Section */}
              {report.status === "OPEN" && canRespond && (
                <div className="bg-blue-50 p-4 rounded-lg space-y-2">
                  <label className="block text-sm font-medium">Action Taken</label>
                  <Textarea
                    value={selectedReport === report.id ? actionTaken : ""}
                    onChange={(e) => {
                      setSelectedReport(report.id);
                      setActionTaken(e.target.value);
                    }}
                    placeholder="Describe the action taken"
                    rows={2}
                  />
                  <Button
                    onClick={() => handleRespondToReport(report.id)}
                    disabled={respondMutation.isPending}
                    className="w-full"
                    variant="default"
                  >
                    {respondMutation.isPending ? <Spinner className="mr-2" /> : "Submit Response"}
                  </Button>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4 border-t">
                {report.status === "IN_PROGRESS" && canClose && (
                  <Button
                    onClick={() => handleCloseReport(report.id)}
                    disabled={closeMutation.isPending}
                    variant="default"
                    className="flex-1"
                  >
                    {closeMutation.isPending ? <Spinner className="mr-2" /> : "Close & Send to QA"}
                  </Button>
                )}

                {canDelete && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" className="flex-1">
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogTitle>Delete Report</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete this surveillance report? This action cannot be undone.
                      </AlertDialogDescription>
                      <div className="flex gap-2">
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteReport(report.id)}
                          disabled={deleteMutation.isPending}
                          className="bg-destructive"
                        >
                          {deleteMutation.isPending ? <Spinner className="mr-2" /> : "Delete"}
                        </AlertDialogAction>
                      </div>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>

              {/* Response Details */}
              {report.actionTaken && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm font-medium mb-1">Action Taken:</p>
                  <p className="text-sm">{report.actionTaken}</p>
                  {report.respondedAt && (
                    <p className="text-xs text-gray-600 mt-2">
                      Responded: {new Date(report.respondedAt).toLocaleString()}
                    </p>
                  )}
                </div>
              )}
            </Card>
          ))
        ) : (
          <Card className="p-6 text-center text-gray-500">
            No surveillance reports found. Create one to get started.
          </Card>
        )}
      </div>
    </div>
  );
}
