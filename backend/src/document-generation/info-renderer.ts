import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import Docxtemplater = require('docxtemplater');
import PizZip from 'pizzip';
import * as mammoth from 'mammoth';
import { InfoJson } from '../llm/schemas/info.schema';

// backend/src/document-generation (dev) or backend/dist/document-generation
// (build) are both exactly two levels under backend/, mirroring the
// llm/prompts path resolution in llm/request-packages.ts.
const TEMPLATE_PATH = join(__dirname, '..', '..', 'templates', 'info-template.docx');

let templateCache: Buffer | undefined;

function loadTemplate(): Buffer {
  if (!templateCache) {
    templateCache = readFileSync(TEMPLATE_PATH);
  }
  return templateCache;
}

export interface RenderedInfoDoc {
  buffer: Buffer;
  html: string;
}

export async function renderInfoDoc(info: InfoJson): Promise<RenderedInfoDoc> {
  const zip = new PizZip(loadTemplate());
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    nullGetter: () => 'tbd',
  });
  doc.render(normalizeInfo(info));
  const buffer = doc.getZip().generate({ type: 'nodebuffer', compression: 'DEFLATE' });

  const { value: html } = await mammoth.convertToHtml({ buffer });
  return { buffer, html };
}

/**
 * The template's tags reference optional/nested fields (e.g. ownEntity.*,
 * socialMedia.*) that Zod validation intentionally leaves undefined when
 * absent (implementation-plan.md §5.E validates LLM output shape, it doesn't
 * inject "tbd" placeholders — that would mask genuine extraction gaps at the
 * wrong layer). Rendering a document, unlike validating one, genuinely needs
 * a concrete printable value for every tag, so the schema's own "default":
 * "tbd" hints (llm/schemas/info.schema.json) are applied here instead.
 */
function normalizeInfo(info: InfoJson) {
  return {
    ...info,
    coordinator: info.coordinator ?? { shortName: 'tbd', legalName: 'tbd', country: 'tbd' },
    ownEntity: info.ownEntity ?? { shortName: 'tbd', legalName: 'tbd', pic: 'tbd', role: 'tbd', country: 'tbd' },
    projectSummary: info.projectSummary ?? 'tbd',
    website: info.website ?? 'tbd',
    socialMedia: info.socialMedia ?? {
      facebook: 'tbd',
      linkedin: 'tbd',
      youtube: 'tbd',
      twitter: 'tbd',
      instagram: 'tbd',
    },
    repository: info.repository ?? 'tbd',
    mailingLists: info.mailingLists ?? 'tbd',
    ownEffortSummary: info.ownEffortSummary ?? 'tbd',
    workPackages: info.workPackages.map((wp) => ({
      ...wp,
      tasks: wp.tasks.map((t) => ({
        ...t,
        leader: t.leader ?? 'tbd',
        monthFrom: t.monthFrom ?? 'tbd',
        monthTo: t.monthTo ?? 'tbd',
      })),
    })),
    roles: info.roles.map((r) => ({ ...r, periodTo: r.periodTo ?? 'Present' })),
  };
}
