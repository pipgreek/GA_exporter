import { z } from 'zod';

const KpiItemSchema = z.object({
  code: z.string().optional(),
  label: z.string(),
  target: z.string(),
  unit: z.string().optional(),
  achieved: z.number().optional(),
  monthlyValues: z.array(z.union([z.number(), z.null()])).optional(),
});

const KpiGroupSchema = z.object({
  label: z.string().optional(),
  kpis: z.array(KpiItemSchema).min(1),
});

const KpiCategorySchema = z.object({
  name: z.string(),
  groups: z.array(KpiGroupSchema).min(1),
});

// Mirrors llm/schemas/kpi.schema.json.
export const KpiSchema = z
  .object({
    projectAcronym: z.string(),
    projectStartDate: z.string().optional(),
    totalMonths: z.number().int().min(1),
    categories: z.array(KpiCategorySchema).min(1),
  })
  .strict();

export type KpiJson = z.infer<typeof KpiSchema>;
