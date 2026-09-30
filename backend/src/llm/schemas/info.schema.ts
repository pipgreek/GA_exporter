import { z } from 'zod';

const CoordinatorSchema = z.object({
  shortName: z.string(),
  legalName: z.string(),
  country: z.string(),
});

const OwnEntitySchema = z.object({
  shortName: z.string(),
  legalName: z.string(),
  pic: z.string(),
  role: z.enum(['COO', 'BEN', 'AE', 'AP', 'tbd']),
  country: z.string(),
});

const DurationSchema = z.object({
  startDate: z.string(),
  endDate: z.string(),
  totalMonths: z.number().int().min(1),
});

const ReportingPeriodSchema = z.object({
  id: z.string(),
  monthFrom: z.number().int().min(1),
  monthTo: z.number().int().min(1),
});

const SocialMediaSchema = z
  .object({
    facebook: z.string(),
    linkedin: z.string(),
    youtube: z.string(),
    twitter: z.string().optional(),
    instagram: z.string().optional(),
  })
  .strict();

const TaskSchema = z.object({
  id: z.string().regex(/^T[0-9]+\.[0-9]+$/),
  name: z.string(),
  leader: z.string().optional(),
  monthFrom: z.number().int().min(1).optional(),
  monthTo: z.number().int().min(1).optional(),
});

const WorkPackageSchema = z.object({
  id: z.string().regex(/^WP[0-9]+$/),
  name: z.string(),
  leadBeneficiary: z.string(),
  monthFrom: z.number().int().min(1),
  monthTo: z.number().int().min(1),
  personMonths: z.number().min(0).optional(),
  tasks: z.array(TaskSchema),
});

const RoleSchema = z.object({
  name: z.string(),
  title: z.string(),
  periodFrom: z.string(),
  periodTo: z.string().optional(),
  responsibilities: z.array(z.string()).optional(),
  deliverableAuthorship: z.array(z.string()).optional(),
});

// Mirrors llm/schemas/info.schema.json (required/optional per that schema's own
// "required" arrays; "default" hints from the JSON Schema are prompt guidance
// for the model, not something this layer injects on missing fields).
export const InfoSchema = z
  .object({
    gaNumber: z.string().regex(/^[0-9]{5,10}$/),
    projectAcronym: z.string(),
    projectName: z.string(),
    coordinator: CoordinatorSchema.optional(),
    ownEntity: OwnEntitySchema.optional(),
    callTopic: z.string(),
    typeOfAction: z.string(),
    projectSummary: z.string().optional(),
    duration: DurationSchema,
    reportingPeriods: z.array(ReportingPeriodSchema).min(1),
    website: z.string().optional(),
    socialMedia: SocialMediaSchema.optional(),
    repository: z.string().optional(),
    mailingLists: z.string().optional(),
    ownEffortSummary: z.string().optional(),
    workPackages: z.array(WorkPackageSchema).min(1),
    roles: z.array(RoleSchema),
  })
  .strict();

export type InfoJson = z.infer<typeof InfoSchema>;
