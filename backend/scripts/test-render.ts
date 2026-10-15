// Ad-hoc local verification script (not part of the server) — renders
// info/gantt docs directly from a fixture JSON, bypassing Supabase/Redis/LLM,
// to check renderer-code changes without needing cloud infra.
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { renderInfoDoc } from '../src/document-generation/info-renderer';
import { renderGanttExcel } from '../src/document-generation/gantt-renderer';
import { InfoSchema } from '../src/llm/schemas/info.schema';
import { GanttSchema } from '../src/llm/schemas/gantt.schema';

const info = InfoSchema.parse({
  gaNumber: '101158152',
  projectAcronym: 'EVOLVE2CARE',
  projectName: 'Engaging the Value Of Living Labs to Innovate Care And Regulatory Environments',
  coordinator: { shortName: 'AUTH', legalName: 'ARISTOTELIO PANEPISTIMIO THESSALONIKIS', country: 'EL' },
  ownEntity: { shortName: 'VILABS', legalName: 'VILABS (CY) LTD', pic: '917943205', role: 'BEN', country: 'CY' },
  callTopic: 'HORIZON-EIE-2023-CONNECT-02 / HORIZON-EIE-2023-CONNECT-02-01',
  typeOfAction: 'HORIZON Coordination and Support Actions',
  projectSummary: 'tbd',
  duration: { startDate: '2024-10-01', endDate: '2026-09-30', totalMonths: 24 },
  reportingPeriods: [
    { id: 'RP1', monthFrom: 1, monthTo: 12 },
    { id: 'RP2', monthFrom: 13, monthTo: 24 },
  ],
  ownEntityTotalPersonMonths: 72.1,
  ownEffortSummary: 'VILABS leads WP4 and its tasks T4.1 and T4.2.',
  workPackages: [
    {
      id: 'WP4',
      name: "EVOLVE2CARE's People-Centric Experimentation Ecosystem Outreach, Sustainability and Clustering",
      leadBeneficiary: 'VILABS',
      monthFrom: 1,
      monthTo: 24,
      personMonths: 90.8,
      ownEntityPersonMonths: 60,
      tasks: [
        {
          id: 'T4.1',
          name: 'EVOLVE2CARE Dissemination, Communication and Outreach for the Open Calls',
          leader: 'VILABS',
          monthFrom: 1,
          monthTo: 24,
          participants: ['ALL'],
        },
        {
          id: 'T4.2',
          name: 'Exploitation and IPR of AccelUP',
          leader: 'VILABS',
          monthFrom: 1,
          monthTo: 24,
          participants: ['ALL'],
        },
        {
          id: 'T4.3',
          name: 'Clustering with EIT KICs',
          leader: 'ENOLL',
          monthFrom: 12,
          monthTo: 24,
          participants: ['ALL'],
        },
      ],
    },
  ],
});

const gantt = GanttSchema.parse({
  projectAcronym: 'EVOLVE2CARE',
  projectStartDate: '2024-10-01',
  totalMonths: 24,
  reportingPeriods: [
    { id: 'RP1', monthFrom: 1, monthTo: 12 },
    { id: 'RP2', monthFrom: 13, monthTo: 24 },
  ],
  workPackages: [
    {
      id: 'WP1',
      name: 'EVOLVE2CARE experimentation space framework',
      lead: 'AUTH',
      monthFrom: 1,
      monthTo: 24,
      milestoneIds: ['MS1'],
      tasks: [
        { id: 'T1.1', name: 'Drivers and Barriers', phases: [{ monthFrom: 1, monthTo: 4 }, { monthFrom: 19, monthTo: 24 }] },
      ],
    },
  ],
  deliverables: [
    { id: 'D1.1', title: 'Roadmap', wp: 'WP1', leadBeneficiary: 'SPLORO', taskId: 'T1.1', type: 'R', disseminationLevel: 'PU', dueMonth: 4 },
  ],
  milestones: [
    { id: 'MS1', name: 'Holistic ACCELUP blueprints', wp: 'WP1', leadBeneficiary: 'AUTH', meansOfVerification: 'D1.3(v1)', dueMonth: 9 },
  ],
});

async function main() {
  const outDir = join(__dirname, '..', '..', 'llm', 'examples', 'manual-render-check');
  const infoResult = await renderInfoDoc(info);
  const ganttResult = await renderGanttExcel(gantt);
  writeFileSync(join(outDir, 'INFO_Generation.docx'), infoResult.buffer);
  writeFileSync(join(outDir, 'Gantt_Chart.xlsx'), ganttResult.buffer);
  // eslint-disable-next-line no-console
  console.log('wrote', outDir);
}

main();
