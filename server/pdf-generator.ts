import { PDFDocument, PDFPage, rgb } from "pdf-lib";
import { formatReportDate } from "./reports";

export interface PDFReportOptions {
  title: string;
  subtitle?: string;
  generatedDate: Date;
  columns: string[];
  data: any[];
  footerText?: string;
}

/**
 * Generate a professional PDF report
 */
export async function generatePDFReport(options: PDFReportOptions): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  let page = pdfDoc.addPage([595, 842]); // A4 size
  const { width, height } = page.getSize();

  const margin = 40;
  const lineHeight = 20;
  let yPosition = height - margin;

  // Header
  page.drawText(options.title, {
    x: margin,
    y: yPosition,
    size: 20,
    color: rgb(0, 0, 0),
  });

  yPosition -= lineHeight * 1.5;

  if (options.subtitle) {
    page.drawText(options.subtitle, {
      x: margin,
      y: yPosition,
      size: 12,
      color: rgb(100, 100, 100),
    });
    yPosition -= lineHeight;
  }

  // Generated date
  page.drawText(`Generated: ${formatReportDate(options.generatedDate)}`, {
    x: margin,
    y: yPosition,
    size: 10,
    color: rgb(150, 150, 150),
  });

  yPosition -= lineHeight * 2;

  // Draw horizontal line
  page.drawLine({
    start: { x: margin, y: yPosition },
    end: { x: width - margin, y: yPosition },
    thickness: 1,
    color: rgb(200, 200, 200),
  });

  yPosition -= lineHeight;

  // Table header
  const columnWidth = (width - 2 * margin) / options.columns.length;

  // Draw header background first (light gray)
  page.drawRectangle({
    x: margin,
    y: yPosition - 15,
    width: width - 2 * margin,
    height: 20,
    color: rgb(220, 220, 220),
    borderColor: rgb(100, 100, 100),
    borderWidth: 1,
  });

  // Draw header text on top
  let xPosition = margin;
  for (const column of options.columns) {
    page.drawText(column, {
      x: xPosition + 5,
      y: yPosition - 12,
      size: 11,
      color: rgb(0, 0, 0),
    });
    xPosition += columnWidth;
  }

  yPosition -= lineHeight * 2;

  // Table data
  for (const row of options.data) {
    // Check if we need a new page
    if (yPosition < margin + lineHeight * 3) {
      page = pdfDoc.addPage([595, 842]);
      yPosition = height - margin;
    }

    xPosition = margin;
    for (const column of options.columns) {
      const cellValue = String(row[column.toLowerCase().replace(/ /g, "")] || "");
      const truncatedValue = cellValue.length > 30 ? cellValue.substring(0, 27) + "..." : cellValue;

      page.drawText(truncatedValue, {
        x: xPosition,
        y: yPosition,
        size: 9,
        color: rgb(0, 0, 0),
      });
      xPosition += columnWidth;
    }

    // Draw row border
    page.drawRectangle({
      x: margin,
      y: yPosition - 15,
      width: width - 2 * margin,
      height: lineHeight,
      borderColor: rgb(200, 200, 200),
      borderWidth: 0.5,
    });

    yPosition -= lineHeight;
  }

  // Footer
  if (options.footerText) {
    page.drawText(options.footerText, {
      x: margin,
      y: margin,
      size: 9,
      color: rgb(150, 150, 150),
    });
  }

  // Page number
  const pages = pdfDoc.getPages();
  pages.forEach((p, index) => {
    p.drawText(`Page ${index + 1} of ${pages.length}`, {
      x: width - margin - 80,
      y: margin,
      size: 9,
      color: rgb(150, 150, 150),
    });
  });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

/**
 * Generate summary statistics box
 */
export function generateSummaryText(summary: any): string {
  return `
SUMMARY STATISTICS:
- Total Defects: ${summary.totalDefects}
  - Open: ${summary.openDefects}
  - Closed: ${summary.closedDefects}
  - Deferred: ${summary.deferredDefects}
- MEL Items: ${summary.totalMelItems}
  - Expired: ${summary.expiredMel}
  - Active: ${summary.activeMel}
- Inventory: ${summary.totalInventory}
  - Out of Stock: ${summary.outOfStock}
  - Low Stock: ${summary.lowStock}
`;
}
