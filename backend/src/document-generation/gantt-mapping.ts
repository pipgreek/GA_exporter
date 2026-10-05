import { GanttJson } from '../llm/schemas/gantt.schema';
import { monthLabels } from './month-labels';
import { PreviewSheet } from './preview.types';

const WP_MARKER = 'WP';
const TASK_MARKER = 'T';

/**
 * Pure transform, validated JSON -> generic table rows. Implements
 * llm/schemas/preview-mapping.md "Gantt -> 3 sheets" exactly. Used both to
 * build the `/preview` response and, unchanged, as the row content written
 * into the rendered .xlsx (implementation-plan.md §2 "ίδιο JSON τροφοδοτεί
 * frontend preview" / one source of truth for preview and download).
 */
export function mapGanttToPreviewSheets(gantt: GanttJson): PreviewSheet[] {
  return [buildOverviewSheet(gantt), buildDeliverablesSheet(gantt), buildMilestonesSheet(gantt)];
}

function buildOverviewSheet(gantt: GanttJson): PreviewSheet {
  const { totalMonths, workPackages, milestones, projectStartDate } = gantt;
  const headers = ['', ...monthLabels(totalMonths, projectStartDate)];
  const milestonesById = new Map(milestones.map((m) => [m.id, m]));

  const rows: (string | number | null)[][] = [];
  for (const wp of workPackages) {
    const dueMonthToMilestoneId = new Map<number, string>();
    for (const id of wp.milestoneIds ?? []) {
      const milestone = milestonesById.get(id);
      if (milestone) dueMonthToMilestoneId.set(milestone.dueMonth, milestone.id);
    }

    const wpRow: (string | number | null)[] = [wp.id];
    for (let month = 1; month <= totalMonths; month++) {
      const milestoneId = dueMonthToMilestoneId.get(month);
      if (milestoneId) {
        wpRow.push(milestoneId);
      } else if (month >= wp.monthFrom && month <= wp.monthTo) {
        wpRow.push(WP_MARKER);
      } else {
        wpRow.push(null);
      }
    }
    rows.push(wpRow);

    for (const task of wp.tasks) {
      const activeMonths = new Set<number>();
      for (const phase of task.phases) {
        for (let m = phase.monthFrom; m <= phase.monthTo; m++) activeMonths.add(m);
      }
      const taskRow: (string | number | null)[] = [task.id];
      for (let month = 1; month <= totalMonths; month++) {
        taskRow.push(activeMonths.has(month) ? TASK_MARKER : null);
      }
      rows.push(taskRow);
    }
  }

  return { name: `M1-M${totalMonths} Overview`, headers, rows };
}

function buildDeliverablesSheet(gantt: GanttJson): PreviewSheet {
  return {
    name: "Deliverables' List",
    headers: ['Del No', 'Title', 'WP', 'Lead Author', 'Type', 'Dissemination Level', 'Due Date'],
    rows: gantt.deliverables.map((d) => [
      d.id,
      d.title,
      d.wp,
      d.leadBeneficiary,
      d.type,
      d.disseminationLevel,
      d.dueMonth,
    ]),
  };
}

function buildMilestonesSheet(gantt: GanttJson): PreviewSheet {
  return {
    name: "Milestones' List",
    headers: ['Mil No', 'Name', 'WP', 'Leader', 'Means of verification', 'Due Date'],
    rows: gantt.milestones.map((m) => [m.id, m.name, m.wp, m.leadBeneficiary, m.meansOfVerification ?? null, m.dueMonth]),
  };
}
