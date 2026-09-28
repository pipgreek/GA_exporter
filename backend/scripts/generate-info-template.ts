// Generates backend/templates/info-template.docx: the docxtemplater template
// filled at render time by src/document-generation/info-renderer.ts. Run once
// (`pnpm ts-node scripts/generate-info-template.ts`) and commit the output —
// this script is not part of the running server.
//
// Each {tag} is written as its own single TextRun so docxtemplater always
// finds the whole tag in one XML run (Word/docx-generators commonly split
// text across runs, which breaks tag detection if a tag straddles two runs).
import { Document, HeadingLevel, Packer, Paragraph, TextRun } from 'docx';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

function tag(text: string): Paragraph {
  return new Paragraph({ children: [new TextRun(text)] });
}

function label(text: string): Paragraph {
  return new Paragraph({ children: [new TextRun({ text, bold: true })] });
}

function blank(): Paragraph {
  return new Paragraph({ children: [] });
}

const doc = new Document({
  sections: [
    {
      children: [
        new Paragraph({ children: [new TextRun('{projectAcronym} — Project Info')], heading: HeadingLevel.TITLE }),
        new Paragraph({ children: [new TextRun('{projectName}')], heading: HeadingLevel.HEADING_2 }),
        blank(),

        label('Contract'),
        tag('GA: {gaNumber}'),
        tag('{#ownEntity}{legalName} ({country}){/ownEntity}'),
        blank(),

        label('Call-Topic'),
        tag('{callTopic}'),
        blank(),

        label('Type of action'),
        tag('{typeOfAction}'),
        blank(),

        label('Project Summary'),
        tag('{projectSummary}'),
        blank(),

        label('Duration'),
        tag('{#duration}{startDate} – {endDate} ({totalMonths}M){/duration}'),
        blank(),

        label('Reporting Periods'),
        tag('{#reportingPeriods}'),
        tag('{id}: M{monthFrom}-M{monthTo}'),
        tag('{/reportingPeriods}'),
        blank(),

        label('Website'),
        tag('{website}'),
        blank(),

        label('Social Media'),
        tag('{#socialMedia}'),
        tag('Facebook: {facebook}'),
        tag('LinkedIn: {linkedin}'),
        tag('YouTube: {youtube}'),
        tag('{/socialMedia}'),
        blank(),

        label('Repository'),
        tag('{repository}'),
        blank(),

        label('Mailing lists'),
        tag('{mailingLists}'),
        blank(),

        label('VIL Efforts'),
        tag('{ownEffortSummary}'),
        blank(),

        new Paragraph({ children: [new TextRun('Work Packages')], heading: HeadingLevel.HEADING_2 }),
        tag('{#workPackages}'),
        tag('{id} - {name} [{leadBeneficiary} | M{monthFrom}-M{monthTo}]'),
        tag('{#tasks}'),
        tag('Task {id} - {name}'),
        tag('{/tasks}'),
        tag('{/workPackages}'),
        blank(),

        new Paragraph({ children: [new TextRun('Roles')], heading: HeadingLevel.HEADING_2 }),
        tag('{#roles}'),
        tag('{title}: {name} (M{periodFrom} - {periodTo})'),
        tag('{/roles}'),
      ],
    },
  ],
});

Packer.toBuffer(doc).then((buffer) => {
  const outPath = join(__dirname, '..', 'templates', 'info-template.docx');
  writeFileSync(outPath, buffer);
  // eslint-disable-next-line no-console
  console.log('wrote', outPath);
});
