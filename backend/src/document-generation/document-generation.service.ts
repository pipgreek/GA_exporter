import { Injectable } from '@nestjs/common';
import { GanttJson } from '../llm/schemas/gantt.schema';
import { InfoJson } from '../llm/schemas/info.schema';
import { KpiJson } from '../llm/schemas/kpi.schema';
import { renderGanttExcel } from './gantt-renderer';
import { renderInfoDoc } from './info-renderer';
import { renderKpiExcel } from './kpi-renderer';
import { PreviewResponse } from './preview.types';

export interface GeneratedDocuments {
  infoDocx: Buffer;
  ganttXlsx: Buffer;
  kpiXlsx: Buffer;
  preview: PreviewResponse;
}

@Injectable()
export class DocumentGenerationService {
  /**
   * Renders all three output files from the same validated JSON that also
   * feeds the frontend preview (implementation-plan.md §2, §5.G) — the Excel
   * previews are the exact rows written into the workbooks; the Word preview
   * is mammoth-converted from the exact rendered .docx buffer, not a
   * separately-derived HTML.
   */
  async generateAll(extraction: { info: InfoJson; gantt: GanttJson; kpi: KpiJson }): Promise<GeneratedDocuments> {
    const [infoResult, ganttResult, kpiResult] = await Promise.all([
      renderInfoDoc(extraction.info),
      renderGanttExcel(extraction.gantt),
      renderKpiExcel(extraction.kpi),
    ]);

    return {
      infoDocx: infoResult.buffer,
      ganttXlsx: ganttResult.buffer,
      kpiXlsx: kpiResult.buffer,
      preview: {
        info: { html: infoResult.html },
        gantt: { sheets: ganttResult.sheets },
        kpi: { sheets: kpiResult.sheets },
      },
    };
  }
}
