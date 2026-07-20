import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as db from "./db";
import { reportRouter } from "./report-routers";

// Helper to check if user is admin
function isAdmin(role: string | undefined) {
  return role === "admin";
}

// Helper to check if user is MCC engineer
function isMccEngineer(role: string | undefined) {
  return role === "mcc" || role === "admin";
}

// Helper to check if user is cabin department
function isCabinDept(role: string | undefined) {
  return role === "cabin" || role === "admin";
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Aircraft procedures
  aircraft: router({
    list: protectedProcedure.query(async () => {
      return db.listAircraft();
    }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getAircraftById(input.id);
      }),

    create: protectedProcedure
      .input(
        z.object({
          registration: z.string(),
          model: z.string(),
          location: z.string().optional(),
          status: z.enum(["SERVICEABLE", "DEFERRED", "AOG"]).optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (!isAdmin(ctx.user?.role)) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Only admins can create aircraft" });
        }
        return db.createAircraft(input);
      }),

    updateStatus: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          status: z.enum(["SERVICEABLE", "DEFERRED", "AOG"]),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (!isAdmin(ctx.user?.role)) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Only admins can update aircraft status" });
        }
        return db.updateAircraft(input.id, { status: input.status });
      }),
  }),

  // Defect procedures
  defect: router({
    list: protectedProcedure
      .input(z.object({ aircraftId: z.number().optional() }).optional())
      .query(async ({ input }) => {
        return db.listDefects(input?.aircraftId);
      }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getDefectById(input.id);
      }),

    create: protectedProcedure
      .input(
        z.object({
          aircraftId: z.number(),
          source: z.string(),
          description: z.string(),
          status: z.enum(["OPEN", "CLOSED", "DEFERRED"]).optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
        const result = await db.createDefect({
          ...input,
          reportedBy: ctx.user.id,
        });
        return result;
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          status: z.enum(["OPEN", "CLOSED", "DEFERRED"]).optional(),
          description: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
        const { id, ...updates } = input;
        return db.updateDefect(id, updates);
      }),

    close: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
        return db.updateDefect(input.id, { status: "CLOSED" });
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (!isAdmin(ctx.user?.role)) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Only admins can delete defects" });
        }
        return db.deleteDefect(input.id);
      }),
  }),

  // MEL procedures
  mel: router({
    list: protectedProcedure
      .input(z.object({ defectId: z.number().optional() }).optional())
      .query(async ({ input }) => {
        return db.listMelItems(input?.defectId);
      }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getMelItemById(input.id);
      }),

    create: protectedProcedure
      .input(
        z.object({
          defectId: z.number(),
          category: z.enum(["A", "B", "C", "D", "Connection 1", "Connection 2"]),
          reference: z.string().optional(),
          expiryDate: z.date().optional(),
          placardRequired: z.boolean().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (!isAdmin(ctx.user?.role) && !isMccEngineer(ctx.user?.role)) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Only admins and MCC engineers can create MEL items" });
        }

        // Calculate expiry date based on category if not provided
        let expiryDate = input.expiryDate;
        if (!expiryDate) {
          const now = new Date();
          switch (input.category) {
            case "A":
              expiryDate = new Date(now.getTime() + 0); // Immediate
              break;
            case "B":
              expiryDate = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000); // 3 days
              break;
            case "C":
              expiryDate = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000); // 10 days
              break;
            case "D":
              expiryDate = new Date(now.getTime() + 120 * 24 * 60 * 60 * 1000); // 120 days
              break;
            case "Connection 1":
            case "Connection 2":
              expiryDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days default
              break;
          }
        }

        return db.createMelItem({
          ...input,
          expiryDate,
          placardRequired: input.placardRequired ? 1 : 0,
        });
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          category: z.enum(["A", "B", "C", "D", "Connection 1", "Connection 2"]).optional(),
          reference: z.string().optional(),
          expiryDate: z.date().optional(),
          placardRequired: z.boolean().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (!isAdmin(ctx.user?.role) && !isMccEngineer(ctx.user?.role)) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Only admins and MCC engineers can update MEL items" });
        }

        const { id, ...updates } = input;
        const updateData: any = { ...updates };
        if (updates.placardRequired !== undefined) {
          updateData.placardRequired = updates.placardRequired ? 1 : 0;
        }
        return db.updateMelItem(id, updateData);
      }),
  }),

  // Cabin defect procedures
  cabinDefect: router({
    list: protectedProcedure
      .input(z.object({ aircraftId: z.number().optional() }).optional())
      .query(async ({ input }) => {
        return db.listCabinDefects(input?.aircraftId);
      }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getCabinDefectById(input.id);
      }),

    create: protectedProcedure
      .input(
        z.object({
          aircraftId: z.number(),
          area: z.string().optional(),
          description: z.string(),
          isMel: z.boolean().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (!isAdmin(ctx.user?.role) && !isCabinDept(ctx.user?.role)) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Only admins and cabin department can create cabin defects" });
        }
        if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });

        return db.createCabinDefect({
          ...input,
          isMel: input.isMel ? 1 : 0,
          reportedBy: ctx.user.id,
        });
      }),

    convertToMel: protectedProcedure
      .input(
        z.object({
          cabinDefectId: z.number(),
          category: z.enum(["A", "B", "C", "D", "Connection 1", "Connection 2"]),
          reference: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (!isAdmin(ctx.user?.role) && !isMccEngineer(ctx.user?.role)) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Only admins and MCC engineers can convert to MEL" });
        }

        // Update cabin defect to mark as MEL
        await db.updateCabinDefect(input.cabinDefectId, { isMel: 1 });

        // Create a defect record for the MEL item
        const cabinDefect = await db.getCabinDefectById(input.cabinDefectId);
        if (!cabinDefect) throw new TRPCError({ code: "NOT_FOUND" });

        const defectResult = await db.createDefect({
          aircraftId: cabinDefect.aircraftId,
          source: "Cabin",
          description: cabinDefect.description,
          reportedBy: ctx.user?.id,
        });

        // Create MEL item
        const melResult = await db.createMelItem({
          defectId: (defectResult as any).insertId || 0,
          category: input.category,
          reference: input.reference,
        });

        // Update cabin defect with MEL item ID
        await db.updateCabinDefect(input.cabinDefectId, { melItemId: (melResult as any).insertId || 0 });

        return { success: true };
      }),
  }),

  // Action log procedures
  actionLog: router({
    list: protectedProcedure
      .input(z.object({ defectId: z.number() }))
      .query(async ({ input }) => {
        return db.listActionLogs(input.defectId);
      }),

    create: protectedProcedure
      .input(
        z.object({
          defectId: z.number(),
          actionTaken: z.string(),
          nextAction: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });

        return db.createActionLog({
          ...input,
          engineerId: ctx.user.id,
        });
      }),
  }),

  // Surveillance & SAFA procedures
  surveillance: router({
    list: protectedProcedure
      .input(z.object({ aircraftId: z.number().optional() }).optional())
      .query(async ({ input }) => {
        return db.listSurveillanceReports(input?.aircraftId);
      }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getSurveillanceReportById(input.id);
      }),

    create: protectedProcedure
      .input(
        z.object({
          aircraftId: z.number(),
          title: z.string(),
          description: z.string(),
          auditType: z.enum(["SURVEILLANCE", "SAFA"]),
          findings: z.string().optional(),
          severity: z.enum(["CRITICAL", "MAJOR", "MINOR", "OBSERVATION"]).optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
        
        const allowedRoles = ["quality_auditor", "supervisor", "technician", "admin", "surveillance"];
        if (!allowedRoles.includes(ctx.user.role)) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Only auditors can create surveillance reports" });
        }

        return db.createSurveillanceReport({
          ...input,
          reportedBy: ctx.user.id,
          status: "OPEN",
          severity: input.severity || "OBSERVATION",
        });
      }),

    respond: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          actionTaken: z.string(),
          status: z.enum(["IN_PROGRESS", "CLOSED"]),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
        
        const allowedRoles = ["technician", "mcc", "admin"];
        if (!allowedRoles.includes(ctx.user.role)) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Only technicians can respond" });
        }

        return db.updateSurveillanceReport(input.id, {
          actionTaken: input.actionTaken,
          status: input.status,
          respondedBy: ctx.user.id,
          respondedAt: new Date(),
        });
      }),

    close: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
        
        const allowedRoles = ["quality_auditor", "admin"];
        if (!allowedRoles.includes(ctx.user.role)) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Only quality auditors can close" });
        }

        return db.updateSurveillanceReport(input.id, {
          status: "SENT_TO_QA",
          closedAt: new Date(),
          sentToQaAt: new Date(),
        });
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (!isAdmin(ctx.user?.role)) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Only admins can delete" });
        }
        return db.deleteSurveillanceReport(input.id);
      }),
  }),

  // Spare parts procedures
  sparePart: router({
    list: protectedProcedure.query(async () => {
      return db.listSpareParts();
    }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getSparePartById(input.id);
      }),

    create: protectedProcedure
      .input(
        z.object({
          partCode: z.string(),
          description: z.string(),
          quantity: z.number().optional(),
          location: z.string().optional(),
          minStock: z.number().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (!isAdmin(ctx.user?.role)) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Only admins can create spare parts" });
        }
        return db.createSparePart(input);
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          quantity: z.number().optional(),
          location: z.string().optional(),
          minStock: z.number().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (!isAdmin(ctx.user?.role)) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Only admins can update spare parts" });
        }
        const { id, ...updates } = input;
        return db.updateSparePart(id, updates);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (!isAdmin(ctx.user?.role)) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Only admins can delete spare parts" });
        }
        return db.deleteSparePartById(input.id);
      }),
    }),
  report: router(reportRouter),
});
export type AppRouter = typeof appRouter;
