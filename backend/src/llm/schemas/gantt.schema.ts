import { z } from 'zod';

const GanttReportingPeriodSchema = z.object({
  id: z.string(),
  monthFrom: z.number().int().min(1),
  monthTo: z.number().int().min(1),
});

const PhaseSchema = z.object({
  monthFrom: z.number().int().min(1),
  monthTo: z.number().int().min(1),
});

const GanttTaskSchema = z.object({
  id: z.string().regex(/^T[0-9]+\.[0-9]+$/),
  name: z.string(),
  phases: z.array(PhaseSchema).min(1),
});

const GanttWorkPackageSchema = z.object({
  id: z.string().regex(/^WP[0-9]+$/),
  name: z.string(),
  lead: z.string(),
  monthFrom: z.number().int().min(1),
  monthTo: z.number().int().min(1),
  milestoneIds: z.array(z.string()).optional(),
  tasks: z.array(GanttTaskSchema),
});

const DeliverableTypeEnum = z.enum(['R', 'DEM', 'DEC', 'OTHER', 'ETHICS', 'ORDP', 'DMP', 'SECU', 'tbd']);
const DisseminationLevelEnum = z.enum(['PU', 'SEN', 'EU-R', 'EU-C', 'EU-S', 'tbd']);

const DeliverableSchema = z.object({
  id: z.string().regex(/^D[0-9]+\.[0-9]+$/),
  title: z.string(),
  wp: z.string().regex(/^WP[0-9]+$/),
  leadBeneficiary: z.string(),
  // The task (within this deliverable's own WP) that produces it, only when
  // stated/inferable with confidence — absent otherwise. The render engine
  // falls back to the WP's own row rather than guessing (implementation-plan.md §7).
  taskId: z.string().regex(/^T[0-9]+\.[0-9]+$/).optional(),
  type: DeliverableTypeEnum,
  disseminationLevel: DisseminationLevelEnum,
  dueMonth: z.number().int().min(1),
});

const MilestoneSchema = z.object({
  id: z.string().regex(/^MS[0-9]+$/),
  name: z.string(),
  wp: z.string().regex(/^WP[0-9]+$/),
  leadBeneficiary: z.string(),
  meansOfVerification: z.string().optional(),
  dueMonth: z.number().int().min(1),
});

// Mirrors llm/schemas/gantt.schema.json.
export const GanttSchema = z
  .object({
    projectAcronym: z.string(),
    projectStartDate: z.string().optional(),
    totalMonths: z.number().int().min(1),
    reportingPeriods: z.array(GanttReportingPeriodSchema).min(1),
    workPackages: z.array(GanttWorkPackageSchema).min(1),
    deliverables: z.array(DeliverableSchema),
    milestones: z.array(MilestoneSchema),
  })
  .strict();

export type GanttJson = z.infer<typeof GanttSchema>;
