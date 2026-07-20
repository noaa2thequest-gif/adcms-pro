import { publicProcedure, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import {
  generateDefectReportData,
  generateMelReportData,
  generateActionLogReportData,
  generateInventoryReportData,
  getReportSummary,
  formatReportDate,
} from "./reports";
import { generatePDFReport } from "./pdf-generator";

export const reportRouter = {
  // Export defect report as PDF
  exportDefectReport: protectedProcedure
    .input(
      z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        aircraftId: z.number().optional(),
        status: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const filters = {
        startDate: input.startDate ? new Date(input.startDate) : undefined,
        endDate: input.endDate ? new Date(input.endDate) : undefined,
        aircraftId: input.aircraftId,
        status: input.status,
      };

      const data = await generateDefectReportData(filters);
      const summary = await getReportSummary(filters);

      const pdfBuffer = await generatePDFReport({
        title: "Aircraft Defect Report",
        subtitle: `Generated: ${formatReportDate(new Date())}`,
        generatedDate: new Date(),
        columns: ["Aircraft", "Source", "Description", "Status", "Date"],
        data: data.map((d: any) => ({
          aircraft: d.aircraftName,
          source: d.source,
          description: d.description,
          status: d.status,
          date: formatReportDate(d.createdAt),
        })),
        footerText: `Total: ${summary.totalDefects} | Open: ${summary.openDefects} | Closed: ${summary.closedDefects} | Deferred: ${summary.deferredDefects}`,
      });

      return {
        pdf: pdfBuffer.toString("base64"),
        filename: `defect-report-${new Date().getTime()}.pdf`,
      };
    }),

  // Export MEL report as PDF
  exportMelReport: protectedProcedure
    .input(
      z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const filters = {
        startDate: input.startDate ? new Date(input.startDate) : undefined,
        endDate: input.endDate ? new Date(input.endDate) : undefined,
      };

      const data = await generateMelReportData(filters);
      const summary = await getReportSummary(filters);

      const pdfBuffer = await generatePDFReport({
        title: "Maintenance Deferred Items (MEL) Report",
        subtitle: `Generated: ${formatReportDate(new Date())}`,
        generatedDate: new Date(),
        columns: ["Aircraft", "Defect", "Category", "Reference", "Expiry Date", "Status"],
        data: data.map((m: any) => ({
          aircraft: m.aircraftName,
          defect: m.defectDescription,
          category: m.category,
          reference: m.reference || "N/A",
          expirydate: m.expiryDate ? formatReportDate(m.expiryDate) : "N/A",
          status: m.status,
        })),
        footerText: `Total: ${summary.totalMelItems} | Expired: ${summary.expiredMel} | Active: ${summary.activeMel}`,
      });

      return {
        pdf: pdfBuffer.toString("base64"),
        filename: `mel-report-${new Date().getTime()}.pdf`,
      };
    }),

  // Export action log report as PDF
  exportActionLogReport: protectedProcedure
    .input(
      z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const filters = {
        startDate: input.startDate ? new Date(input.startDate) : undefined,
        endDate: input.endDate ? new Date(input.endDate) : undefined,
      };

      const data = await generateActionLogReportData(filters);

      const pdfBuffer = await generatePDFReport({
        title: "Maintenance Action Log Report",
        subtitle: `Generated: ${formatReportDate(new Date())}`,
        generatedDate: new Date(),
        columns: ["Aircraft", "Defect", "Action Taken", "Next Action", "Date"],
        data: data.map((log: any) => ({
          aircraft: log.aircraftName,
          defect: log.defectDescription,
          actiontaken: log.actionTaken,
          nextaction: log.nextAction || "N/A",
          date: formatReportDate(log.createdAt),
        })),
        footerText: `Total Actions: ${data.length}`,
      });

      return {
        pdf: pdfBuffer.toString("base64"),
        filename: `action-log-report-${new Date().getTime()}.pdf`,
      };
    }),

  // Export inventory report as PDF
  exportInventoryReport: protectedProcedure.mutation(async () => {
    const data = await generateInventoryReportData();

    const pdfBuffer = await generatePDFReport({
      title: "Spare Parts Inventory Report",
      subtitle: `Generated: ${formatReportDate(new Date())}`,
      generatedDate: new Date(),
      columns: ["Part Code", "Description", "Quantity", "Location", "Status"],
      data: data.map((p: any) => ({
        partcode: p.partCode,
        description: p.description,
        quantity: String(p.quantity),
        location: p.location || "Unknown",
        status: p.stockStatus,
      })),
      footerText: `Total Parts: ${data.length} | Out of Stock: ${data.filter((p: any) => p.stockStatus === "OUT_OF_STOCK").length} | Low Stock: ${data.filter((p: any) => p.stockStatus === "LOW_STOCK").length}`,
    });

    return {
      pdf: pdfBuffer.toString("base64"),
      filename: `inventory-report-${new Date().getTime()}.pdf`,
    };
  }),

  // Get report summary
  getReportSummary: protectedProcedure
    .input(
      z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        aircraftId: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      const filters = {
        startDate: input.startDate ? new Date(input.startDate) : undefined,
        endDate: input.endDate ? new Date(input.endDate) : undefined,
        aircraftId: input.aircraftId,
      };

      return await getReportSummary(filters);
    }),
};
