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

function normalizeInfo(info: InfoJson) {
  const ownEntityShortName = info.ownEntity?.shortName;
  const isOwnEntityParticipant = (participants: string[]) =>
    participants.some((p) => p.toUpperCase() === 'ALL' || (ownEntityShortName && p === ownEntityShortName));

  return {
    ...info,
    coordinator: info.coordinator ?? { shortName: 'tbd', legalName: 'tbd', country: 'tbd' },
    ownEntity: info.ownEntity ?? { shortName: 'tbd', legalName: 'tbd', pic: 'tbd', role: 'tbd', country: 'tbd' },
    projectSummary: info.projectSummary ?? 'tbd',
    ownEntityTotalPersonMonths: formatPersonMonths(info.ownEntityTotalPersonMonths),
    ownEffortSummary: info.ownEffortSummary ?? 'tbd',
    workPackages: info.workPackages.map((wp) => ({
      ...wp,
      ownEntityPersonMonths: formatPersonMonths(wp.ownEntityPersonMonths),
      durationLabel: formatDuration(wp.monthFrom, wp.monthTo),
      isOwnEntityInvolved:
        wp.ownEntityPersonMonths > 0 || wp.tasks.some((task) => isOwnEntityParticipant(task.participants)),
      tasks: wp.tasks.map((t) => ({
        ...t,
        leader: t.leader ?? 'tbd',
        monthFrom: t.monthFrom ?? 'tbd',
        monthTo: t.monthTo ?? 'tbd',
        durationLabel: t.monthFrom && t.monthTo ? formatDuration(t.monthFrom, t.monthTo) : 'tbd',
        participantsLabel: t.participants.length > 0 ? t.participants.join(', ') : 'tbd',
        isOwnEntityInvolved: isOwnEntityParticipant(t.participants),
      })),
    })),
  };
}

function formatDuration(monthFrom: number, monthTo: number): string {
  return `M${monthFrom}-M${monthTo}`;
}

function formatPersonMonths(value: number): string {
  return Number.isInteger(value) ? value.toString() : value.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
}
