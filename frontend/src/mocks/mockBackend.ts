import type {
  PreviewResponse,
  ProcessingStatus,
  StatusResponse,
} from "@/lib/api/types";

/**
 * Stateless mock of the backend pipeline, used until the real backend exists.
 *
 * The requestId encodes the scenario and the start time
 * (`mock_<scenario>_<startMs>`), so every status call can compute where the
 * "pipeline" is from elapsed time alone — no in-memory state to lose on reload.
 *
 * Scenarios are picked from the uploaded file name, so every UI state can be
 * tested by renaming a PDF:
 *   - default          → completes in ~15s
 *   - name has "error" → fails during "analyzing"
 *   - name has "slow"  → stalls at "analyzing" forever (tests the 90s timeout
 *                        and the fallback message rotation)
 *   - name has "preview-error" → completes, but GET /preview fails with 500
 *                        (tests the preview error message + Retry)
 */

export type MockScenario = "ok" | "error" | "slow" | "previewerror";

const STAGES: { status: ProcessingStatus; untilSec: number; progressEnd: number }[] = [
  { status: "scanning", untilSec: 3, progressEnd: 15 },
  { status: "extracting", untilSec: 6, progressEnd: 35 },
  { status: "analyzing", untilSec: 10, progressEnd: 65 },
  { status: "generating", untilSec: 14, progressEnd: 95 },
];

const STAGE_MESSAGES: Record<ProcessingStatus, string> = {
  scanning: "Scanning Grant Agreement...",
  extracting: "Extracting text and structure...",
  analyzing: "Analyzing Work Packages and KPIs...",
  generating: "Generating previews...",
  done: "Previews generated successfully.",
  error: "Processing failed. Please try again.",
};

export function scenarioFromFileName(fileName: string): MockScenario {
  const name = fileName.toLowerCase();
  if (name.includes("preview-error")) return "previewerror";
  if (name.includes("error")) return "error";
  if (name.includes("slow")) return "slow";
  return "ok";
}

export function createRequestId(scenario: MockScenario, now = Date.now()): string {
  return `mock_${scenario}_${now}`;
}

export function parseRequestId(
  requestId: string,
): { scenario: MockScenario; startedAt: number } | null {
  const match = /^mock_(ok|error|slow|previewerror)_(\d+)$/.exec(requestId);
  if (!match) return null;
  return { scenario: match[1] as MockScenario, startedAt: Number(match[2]) };
}

export function computeStatus(
  scenario: MockScenario,
  startedAt: number,
  now = Date.now(),
): StatusResponse {
  const elapsed = (now - startedAt) / 1000;

  // The "error" scenario fails midway through "analyzing" and stays failed.
  if (scenario === "error" && elapsed >= 8) {
    return { status: "error", progress: 50, message: STAGE_MESSAGES.error };
  }

  let prevUntil = 0;
  let prevProgress = 0;
  for (const stage of STAGES) {
    const stalled = scenario === "slow" && stage.status === "analyzing";
    if (elapsed < stage.untilSec || stalled) {
      // Progress creeps up within the stage; a stalled stage stops just below its end.
      const t = stalled
        ? Math.min(0.9, (elapsed - prevUntil) / (stage.untilSec - prevUntil))
        : (elapsed - prevUntil) / (stage.untilSec - prevUntil);
      const progress = Math.round(prevProgress + t * (stage.progressEnd - prevProgress));
      return { status: stage.status, progress, message: STAGE_MESSAGES[stage.status] };
    }
    prevUntil = stage.untilSec;
    prevProgress = stage.progressEnd;
  }

  return { status: "done", progress: 100, message: STAGE_MESSAGES.done };
}

/** Sample preview data, shaped after the EVOLVE2CARE examples in docs/Παραδείγματα. */
export const MOCK_PREVIEW: PreviewResponse = {
  info: {
    html: `
      <h1>SAMPLE PROJECT — Project Information</h1>
      <table>
        <tbody>
          <tr><th>Contract</th><td>Grant Agreement (mock data)</td></tr>
          <tr><th>GA Number</th><td>101000000</td></tr>
          <tr><th>Call / Topic</th><td>HORIZON-CL4-2024-EXAMPLE-01</td></tr>
          <tr><th>Type of Action</th><td>HORIZON Research and Innovation Actions</td></tr>
          <tr><th>Duration</th><td>36 months (01/01/2025 – 31/12/2027)</td></tr>
        </tbody>
      </table>
      <h2>Reporting Periods</h2>
      <ul>
        <li>RP1: M1 – M18</li>
        <li>RP2: M19 – M36</li>
      </ul>
      <h2>Work Packages</h2>
      <ol>
        <li><strong>WP1</strong> — Project Management and Coordination (Lead: VILABS)</li>
        <li><strong>WP2</strong> — Requirements and Co-design</li>
        <li><strong>WP3</strong> — Platform Development</li>
        <li><strong>WP4</strong> — Pilots and Validation</li>
        <li><strong>WP5</strong> — Dissemination, Communication and Exploitation</li>
      </ol>
      <p><em>This is placeholder content from the mock backend.</em></p>
    `,
  },
  gantt: {
    headers: ["ID", "Title", "Lead", "Start", "End", "Type"],
    rows: [
      ["WP1", "Project Management and Coordination", "VILABS", "M1", "M36", "WP"],
      ["T1.1", "Administrative and financial management", "VILABS", "M1", "M36", "Task"],
      ["WP2", "Requirements and Co-design", "Partner A", "M1", "M9", "WP"],
      ["T2.1", "User requirements elicitation", "Partner A", "M1", "M6", "Task"],
      ["WP3", "Platform Development", "Partner B", "M6", "M30", "WP"],
      ["T3.1", "System architecture", "Partner B", "M6", "M12", "Task"],
      ["WP4", "Pilots and Validation", "Partner C", "M18", "M34", "WP"],
      ["WP5", "Dissemination, Communication and Exploitation", "VILABS", "M1", "M36", "WP"],
      ["D1.1", "Project Management Handbook", "VILABS", "M3", "M3", "Deliverable"],
      ["D2.1", "User Requirements Report", "Partner A", "M6", "M6", "Deliverable"],
      ["MS1", "Requirements finalised", "Partner A", "M9", "M9", "Milestone"],
      ["MS2", "Platform prototype ready", "Partner B", "M18", "M18", "Milestone"],
    ],
  },
  kpi: {
    headers: ["Category", "KPI", "Target", "Achieved", "M6", "M12", "M18"],
    rows: [
      ["Dissemination", "Scientific publications", 6, 2, 0, 1, 1],
      ["Dissemination", "Conference presentations", 10, 4, 1, 2, 1],
      ["Communication", "Website visitors", 5000, 1800, 300, 700, 800],
      ["Communication", "Newsletter issues", 6, 2, 1, 1, 0],
      ["Exploitation", "Stakeholder workshops", 4, 1, 0, 0, 1],
      ["Technical", "Pilot sites operational", 3, 0, 0, 0, 0],
    ],
  },
};
