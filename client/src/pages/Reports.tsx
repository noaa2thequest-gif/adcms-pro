import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Download, FileText } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

export default function Reports() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  const exportDefectReportMutation = trpc.report.exportDefectReport.useMutation();
  const exportMelReportMutation = trpc.report.exportMelReport.useMutation();
  const exportActionLogReportMutation = trpc.report.exportActionLogReport.useMutation();
  const exportInventoryReportMutation = trpc.report.exportInventoryReport.useMutation();
  const getReportSummaryQuery = trpc.report.getReportSummary.useQuery({
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  });

  const handleExport = async (
    mutation: any,
    reportName: string,
    filters?: any
  ) => {
    setIsExporting(true);
    try {
      const result = await mutation.mutateAsync(filters || {});
      
      // Convert base64 to blob
      const binaryString = atob(result.pdf);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: "application/pdf" });

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = result.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success(`${reportName} exported successfully`);
    } catch (error) {
      toast.error(`Failed to export ${reportName}`);
      console.error(error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Reports & Export</h1>
        <p className="text-gray-600 mt-2">Generate and export maintenance reports in PDF format</p>
      </div>

      {/* Date Filters */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Report Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Statistics */}
      {getReportSummaryQuery.data && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">
                  {getReportSummaryQuery.data.totalDefects}
                </div>
                <div className="text-sm text-gray-600">Total Defects</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600">
                  {getReportSummaryQuery.data.openDefects}
                </div>
                <div className="text-sm text-gray-600">Open Defects</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-red-600">
                  {getReportSummaryQuery.data.expiredMel}
                </div>
                <div className="text-sm text-gray-600">Expired MEL</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-red-600">
                  {getReportSummaryQuery.data.outOfStock}
                </div>
                <div className="text-sm text-gray-600">Out of Stock</div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Export Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Defect Report */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Defect Report
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Export all defects with details including source, description, and status.
            </p>
            <Button
              onClick={() =>
                handleExport(
                  exportDefectReportMutation,
                  "Defect Report",
                  {
                    startDate: startDate || undefined,
                    endDate: endDate || undefined,
                  }
                )
              }
              disabled={isExporting}
              className="w-full gap-2"
            >
              {isExporting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              Export as PDF
            </Button>
          </CardContent>
        </Card>

        {/* MEL Report */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              MEL Report
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Export deferred maintenance items with expiry dates and status.
            </p>
            <Button
              onClick={() =>
                handleExport(
                  exportMelReportMutation,
                  "MEL Report",
                  {
                    startDate: startDate || undefined,
                    endDate: endDate || undefined,
                  }
                )
              }
              disabled={isExporting}
              className="w-full gap-2"
            >
              {isExporting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              Export as PDF
            </Button>
          </CardContent>
        </Card>

        {/* Action Log Report */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Action Log Report
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Export maintenance actions taken with timestamps and engineer notes.
            </p>
            <Button
              onClick={() =>
                handleExport(
                  exportActionLogReportMutation,
                  "Action Log Report",
                  {
                    startDate: startDate || undefined,
                    endDate: endDate || undefined,
                  }
                )
              }
              disabled={isExporting}
              className="w-full gap-2"
            >
              {isExporting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              Export as PDF
            </Button>
          </CardContent>
        </Card>

        {/* Inventory Report */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Inventory Report
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Export spare parts inventory with stock levels and locations.
            </p>
            <Button
              onClick={() =>
                handleExport(
                  exportInventoryReportMutation,
                  "Inventory Report"
                )
              }
              disabled={isExporting}
              className="w-full gap-2"
            >
              {isExporting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              Export as PDF
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
