import React, { useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { deleteRecord, listRecords, upsertRecord } from '../services/localStore';
import { authProfiles, useAuth } from '../contexts/AuthContext';

const statusFolders = [
  { key: 'en_vigueur', label: 'En Vigueur', description: 'Documents applicables et utilises au laboratoire.' },
  { key: 'perime', label: 'Perimes', description: 'Documents retires, remplaces ou non applicables.' }
];

const typeFolders = [
  { key: 'procedure', label: 'Procedure', prefix: 'PRO', description: 'Mode operatoire, responsabilites, etapes et preuves attendues.' },
  { key: 'fiche', label: 'Fiche', prefix: 'FIC', description: 'Formulaire, support de saisie, fiche de controle ou enregistrement.' }
];

const approverRoles = ['responsable_technique', 'dg', 'responsable_labo'];
const documentWorkflowLabels = {
  brouillon: 'Brouillon',
  soumis_validation: 'Soumis pour validation',
  valide: 'Valide',
  rejete: 'Rejete'
};

const procedureSections = [
  {
    key: 'objectif',
    title: '1. Objectif',
    helper: 'Preciser le but de la procedure et le resultat attendu.'
  },
  {
    key: 'domaine_application',
    title: "2. Domaine d'application",
    helper: 'Indiquer les activites, services, postes ou essais concernes.'
  },
  {
    key: 'references_normatives',
    title: '3. References et documents associes',
    helper: 'Lister normes, fiches, formulaires, modes operatoires et documents qualite lies.'
  },
  {
    key: 'responsabilites',
    title: '4. Responsabilites',
    helper: 'Decrire qui redige, verifie, valide, applique et archive.'
  },
  {
    key: 'deroulement',
    title: '5. Deroulement de la procedure',
    helper: 'Rediger les etapes dans l ordre reel de travail au laboratoire.'
  },
  {
    key: 'enregistrements',
    title: '6. Enregistrements et preuves',
    helper: 'Indiquer les preuves a conserver: fiche, rapport, signature, photo, QR, fichier.'
  },
  {
    key: 'maitrise_modifications',
    title: '7. Maitrise des modifications',
    helper: 'Tracer les revisions, motifs de changement, anciennes versions et date d application.'
  }
];

const today = () => new Date().toISOString().slice(0, 10);

const procedureDefaults = () => procedureSections.reduce((values, section) => ({
  ...values,
  [section.key]: ''
}), {});

const procedureTemplateDefaults = () => ({
  laboratoire_nom: 'TESTLAB',
  laboratoire_sous_titre: 'Laboratoire Geotechnique',
  date_evolution: today(),
  etat_evolution: 'Creation',
  redacteur_modificateur: '',
  redacteur_nom: '',
  redacteur_fonction: '',
  redacteur_date: today(),
  redacteur_visa: '',
  verificateur_nom: '',
  verificateur_fonction: 'Responsable Qualite',
  verificateur_date: today(),
  verificateur_visa: '',
  approbateur_fonction: 'Directeur General',
  approbateur_date: today(),
  approbateur_visa: '',
  destinataire: 'Tout le personnel du laboratoire',
  instruction_steps: []
});

function emptyForm(status, type, records) {
  return {
    reference: nextDocumentReference(records, type),
    titre: '',
    type,
    statut: status,
    version: '01',
    processus: '',
    responsable: '',
    date_application: today(),
    date_revision: '',
    objet: '',
    contenu: '',
    document_text: '',
    document_html: '',
    workflow_status: 'brouillon',
    approbateur_role: '',
    approbateur_nom: '',
    redige_par: '',
    redacteur_role: '',
    soumis_le: '',
    lien_document: '',
    observation: '',
    ...procedureTemplateDefaults(),
    ...procedureDefaults()
  };
}

function nextDocumentReference(records, type) {
  const year = new Date().getFullYear();
  const typeConfig = typeFolders.find((item) => item.key === type) || typeFolders[0];
  const pattern = new RegExp(`^${typeConfig.prefix}-${year}-(\\d+)$`, 'i');
  const max = records.reduce((highest, record) => {
    const match = String(record.reference || '').match(pattern);
    return match ? Math.max(highest, Number(match[1])) : highest;
  }, 0);
  return `${typeConfig.prefix}-${year}-${String(max + 1).padStart(3, '0')}`;
}

function statusLabel(value) {
  return statusFolders.find((item) => item.key === value)?.label || value;
}

function typeLabel(value) {
  return typeFolders.find((item) => item.key === value)?.label || value;
}

function compareDocuments(a, b) {
  return String(a.reference || '').localeCompare(String(b.reference || ''), 'fr', {
    numeric: true,
    sensitivity: 'base'
  });
}

function isExpiredProcedure(record) {
  if (record.type !== 'procedure' || record.statut !== 'en_vigueur' || !record.date_revision) return false;
  return record.date_revision < today();
}

function sectionValue(record, sectionKey) {
  if (record[sectionKey]) return record[sectionKey];
  if (sectionKey === 'objectif') return record.objet || '';
  if (sectionKey === 'deroulement') return record.contenu || '';
  return '';
}

function procedureText(record) {
  if (record.document_text) return record.document_text;
  const sections = procedureSections
    .map((section) => {
      const value = sectionValue(record, section.key);
      return value ? `${section.title}\n${value}` : '';
    })
    .filter(Boolean);
  return sections.join('\n\n');
}

function htmlFromPlainText(value) {
  const text = String(value || '').trim();
  if (!text) return '<p>Aucun contenu redige.</p>';
  return text
    .split(/\n{2,}/)
    .map((block) => {
      const lines = block.split('\n');
      const firstLine = lines[0] || '';
      const rest = lines.slice(1).join('\n');
      const isHeading = /^\d+\.\s/.test(firstLine);
      if (isHeading) {
        return `<section><h3>${escapeHtml(firstLine)}</h3>${rest ? `<p>${escapeHtml(rest).replace(/\n/g, '<br />')}</p>` : ''}</section>`;
      }
      return `<p>${escapeHtml(block).replace(/\n/g, '<br />')}</p>`;
    })
    .join('');
}

function procedureHtml(record) {
  if (record.document_html) return record.document_html;
  return htmlFromPlainText(procedureText(record));
}

function formatProcedureDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('fr-FR');
}

function procedureTitle(record) {
  return String(record.titre || firstDocumentLine(procedureHtml(record), 'Procedure qualite')).trim();
}

function procedureHeadings(record) {
  if (typeof document === 'undefined') return [];
  const container = document.createElement('div');
  container.innerHTML = procedureHtml(record);
  return Array.from(container.querySelectorAll('h1, h2, h3'))
    .map((heading) => heading.textContent.trim())
    .filter(Boolean)
    .slice(0, 14);
}

function defaultProcedureHeadings(record) {
  const fromContent = procedureHeadings(record);
  if (fromContent.length > 0) return fromContent;
  return [
    '1. Objet',
    "2. Champ d'application",
    '3. Responsabilites',
    '4. Documents de reference',
    '5. Description de la demarche'
  ];
}

function procedureCartouche(record) {
  const title = procedureTitle(record).toUpperCase();
  return `
    <div class="qualityProcedureCartouche">
      <div class="qualityProcedureBrand">
        <div class="qualityProcedureLogo">TL</div>
        <strong>${escapeHtml(record.laboratoire_nom || 'TESTLAB')}</strong>
        <span>${escapeHtml(record.laboratoire_sous_titre || 'Laboratoire Geotechnique')}</span>
      </div>
      <div class="qualityProcedureTitle">${escapeHtml(title)}</div>
      <div class="qualityProcedureRef">
        <div><strong>Ref :</strong> ${escapeHtml(record.reference || '-')}</div>
        <div><strong>Version :</strong> ${escapeHtml(record.version || '01')}</div>
        <div><strong>du</strong> ${escapeHtml(formatProcedureDate(record.date_application || record.created_at || today()))}</div>
      </div>
    </div>
  `;
}

function procedureFooter(pageLabel = '') {
  return `
    <div class="qualityProcedureFooter">
      <span>Le laboratoire TESTLAB exerce exclusivement son droit de propriete sur le present document. De ce fait, toute reproduction ou utilisation sans autorisation prealable est strictement interdite</span>
      <strong>${escapeHtml(pageLabel)}</strong>
    </div>
  `;
}

function procedureTableCell(value) {
  return escapeHtml(value || '-');
}

function isSignatureValue(value) {
  return String(value || '').startsWith('data:image/');
}

function procedureVisaCell(value) {
  if (isSignatureValue(value)) {
    return `<img class="qualitySignatureImage" src="${value}" alt="Signature numerique" />`;
  }
  return procedureTableCell(value);
}

function normalizeInstructionSteps(value) {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }
  return [];
}

function extractInstructionSteps(html, record = {}) {
  const steps = [];
  const pushStep = (text) => {
    const clean = String(text || '')
      .replace(/^\s*(\d+[\).\-\s]+|[-*]\s+)/, '')
      .replace(/^(etape|phase)\s*\d+\s*[:.\-]\s*/i, '')
      .replace(/\s+/g, ' ')
      .trim();
    if (clean.length < 8 || steps.some((item) => item.action.toLowerCase() === clean.toLowerCase())) return;
    steps.push({
      id: `step-${Date.now()}-${steps.length}`,
      ordre: steps.length + 1,
      action: clean,
      responsable: record.responsable || record.redacteur_fonction || 'Responsable concerne',
      preuve: 'Enregistrement, visa ou document associe'
    });
  };

  if (typeof document !== 'undefined') {
    const container = document.createElement('div');
    container.innerHTML = html || '';
    Array.from(container.querySelectorAll('li')).forEach((item) => pushStep(item.textContent));
  }

  const plainText = stripHtml(html);

  if (steps.length === 0) {
    plainText
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => /^(\d+[\).\-\s]+|[-*]\s+)/.test(line))
      .forEach(pushStep);
  }

  if (steps.length === 0) {
    const actionStarters = [
      'accueillir', 'analyser', 'approuver', 'archiver', 'attribuer', 'calculer', 'classer',
      'collecter', 'comparer', 'controler', 'corriger', 'creer', 'declarer', 'diffuser',
      'documenter', 'emettre', 'enregistrer', 'envoyer', 'etablir', 'generer', 'identifier',
      'informer', 'mesurer', 'notifier', 'planifier', 'prelever', 'preparer', 'recevoir',
      'rediger', 'rejeter', 'remplir', 'signaler', 'signer', 'soumettre', 'transmettre',
      'valider', 'verifier'
    ];
    plainText
      .split(/(?<=[.!?])\s+|\n+/)
      .map((sentence) => sentence.trim())
      .filter((sentence) => {
        const normalized = sentence
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLowerCase();
        return actionStarters.some((verb) => normalized.startsWith(verb));
      })
      .forEach(pushStep);
  }

  return steps.slice(0, 20);
}

function instructionSteps(record) {
  const detected = extractInstructionSteps(procedureHtml(record), record);
  if (detected.length > 0) return detected;
  return normalizeInstructionSteps(record.instruction_steps);
}

function instructionStepsHtml(record) {
  const steps = instructionSteps(record);
  if (steps.length === 0) return '';
  return `
    <section class="qualityProcedurePage">
      ${procedureCartouche(record)}
      <h2 class="qualityTocTitle">Instruction operationnelle associee</h2>
      <table class="qualityProcedureTable instructionTable">
        <thead>
          <tr>
            <th>N</th>
            <th>Etape a executer</th>
            <th>Responsable</th>
            <th>Preuve attendue</th>
          </tr>
        </thead>
        <tbody>
          ${steps.map((step, index) => `
            <tr>
              <td>${escapeHtml(step.ordre || index + 1)}</td>
              <td>${escapeHtml(step.action)}</td>
              <td>${escapeHtml(step.responsable || '-')}</td>
              <td>${escapeHtml(step.preuve || '-')}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      ${procedureFooter(`Instruction - ${steps.length} etape(s)`)}
    </section>
  `;
}

function procedureModelInnerHtml(record) {
  const headings = defaultProcedureHeadings(record);
  const steps = instructionSteps(record);
  const totalPages = Math.max(3, headings.length > 7 ? 4 : 3) + (steps.length > 0 ? 1 : 0);
  return `
    <div class="qualityProcedureModel">
      <section class="qualityProcedurePage">
        ${procedureCartouche(record)}
        <div class="qualityStamp">EN VIGUEUR</div>
        <table class="qualityProcedureTable">
          <thead>
            <tr>
              <th>Date</th>
              <th>Version</th>
              <th>Etat des evolutions</th>
              <th>Redacteur / Modificateur</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>${procedureTableCell(formatProcedureDate(record.date_evolution || record.date_application))}</td>
              <td>${procedureTableCell(record.version || '01')}</td>
              <td>${procedureTableCell(record.etat_evolution || 'Creation')}</td>
              <td>${procedureTableCell(record.redacteur_modificateur || record.redige_par)}</td>
            </tr>
          </tbody>
        </table>
        <table class="qualityProcedureTable validationTable">
          <thead>
            <tr>
              <th></th>
              <th>Redacteur</th>
              <th>Verificateur</th>
              <th>Approbateur</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th>Nom</th>
              <td>${procedureTableCell(record.redacteur_nom || record.redige_par)}</td>
              <td>${procedureTableCell(record.verificateur_nom || record.approbateur_nom)}</td>
              <td>${procedureTableCell(record.approbateur_nom)}</td>
            </tr>
            <tr>
              <th>Fonction</th>
              <td>${procedureTableCell(record.redacteur_fonction || record.responsable)}</td>
              <td>${procedureTableCell(record.verificateur_fonction || 'Responsable Qualite')}</td>
              <td>${procedureTableCell(record.approbateur_fonction || 'Directeur General')}</td>
            </tr>
            <tr>
              <th>Date</th>
              <td>${procedureTableCell(formatProcedureDate(record.redacteur_date || record.date_application))}</td>
              <td>${procedureTableCell(formatProcedureDate(record.verificateur_date || record.date_application))}</td>
              <td>${procedureTableCell(formatProcedureDate(record.approbateur_date || record.date_application))}</td>
            </tr>
            <tr>
              <th>Visa</th>
              <td>${procedureVisaCell(record.redacteur_visa)}</td>
              <td>${procedureVisaCell(record.verificateur_visa)}</td>
              <td>${procedureVisaCell(record.approbateur_visa)}</td>
            </tr>
          </tbody>
        </table>
        <table class="qualityProcedureTable recipientTable">
          <tbody>
            <tr>
              <th>Destinataire</th>
              <td>${procedureTableCell(record.destinataire || 'Tout le personnel du laboratoire')}</td>
            </tr>
          </tbody>
        </table>
        ${procedureFooter(`Page 1 sur ${totalPages}`)}
      </section>

      <section class="qualityProcedurePage">
        ${procedureCartouche(record)}
        <h2 class="qualityTocTitle">Table des matieres</h2>
        <ol class="qualityToc">
          ${headings.map((heading, index) => `
            <li>
              <span>${escapeHtml(heading)}</span>
              <em>${index < 4 ? 3 : Math.min(totalPages, 4)}</em>
            </li>
          `).join('')}
          ${steps.length > 0 ? '<li><span>Instruction operationnelle associee</span><em>4</em></li>' : ''}
        </ol>
        ${procedureFooter(`Page 2 sur ${totalPages}`)}
      </section>

      <section class="qualityProcedurePage">
        ${procedureCartouche(record)}
        <main class="qualityProcedureContent">${procedureHtml(record)}</main>
        ${(record.lien_document || record.observation) ? `
          <div class="qualityProcedureNotes">
            ${record.lien_document ? `<strong>Document source:</strong> ${escapeHtml(record.lien_document)}<br />` : ''}
            ${record.observation ? `<strong>Observation:</strong> ${escapeHtml(record.observation)}` : ''}
          </div>
        ` : ''}
        ${procedureFooter(`Page 3 sur ${totalPages}`)}
      </section>
      ${instructionStepsHtml(record)}
    </div>
  `;
}

function stripHtml(value) {
  return String(value || '')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|h1|h2|h3|h4|li|section)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+\n/g, '\n')
    .replace(/\n\s+/g, '\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

function firstDocumentLine(html, fallback = 'Procedure qualite') {
  return stripHtml(html).split('\n').find((line) => line.trim()) || fallback;
}

function safeFileName(value) {
  return String(value || 'procedure')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9_-]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'procedure';
}

function workflowLabel(value) {
  return documentWorkflowLabels[value] || documentWorkflowLabels.brouillon;
}

function readUInt16(view, offset) {
  return view.getUint16(offset, true);
}

function readUInt32(view, offset) {
  return view.getUint32(offset, true);
}

function findEndOfCentralDirectory(view) {
  const minOffset = Math.max(0, view.byteLength - 66000);
  for (let offset = view.byteLength - 22; offset >= minOffset; offset -= 1) {
    if (readUInt32(view, offset) === 0x06054b50) return offset;
  }
  return -1;
}

function zipEntries(arrayBuffer) {
  const view = new DataView(arrayBuffer);
  const decoder = new TextDecoder('utf-8');
  const endOffset = findEndOfCentralDirectory(view);
  if (endOffset < 0) throw new Error('Archive Word invalide');
  const entriesCount = readUInt16(view, endOffset + 10);
  const centralDirectoryOffset = readUInt32(view, endOffset + 16);
  const entries = {};
  let offset = centralDirectoryOffset;

  for (let index = 0; index < entriesCount; index += 1) {
    if (readUInt32(view, offset) !== 0x02014b50) break;
    const compression = readUInt16(view, offset + 10);
    const compressedSize = readUInt32(view, offset + 20);
    const fileNameLength = readUInt16(view, offset + 28);
    const extraLength = readUInt16(view, offset + 30);
    const commentLength = readUInt16(view, offset + 32);
    const localHeaderOffset = readUInt32(view, offset + 42);
    const fileName = decoder.decode(new Uint8Array(arrayBuffer, offset + 46, fileNameLength));
    entries[fileName] = { compression, compressedSize, localHeaderOffset };
    offset += 46 + fileNameLength + extraLength + commentLength;
  }

  return entries;
}

async function unzipEntry(arrayBuffer, entry) {
  const view = new DataView(arrayBuffer);
  const localOffset = entry.localHeaderOffset;
  if (readUInt32(view, localOffset) !== 0x04034b50) throw new Error('Entree Word invalide');
  const fileNameLength = readUInt16(view, localOffset + 26);
  const extraLength = readUInt16(view, localOffset + 28);
  const dataOffset = localOffset + 30 + fileNameLength + extraLength;
  const compressed = new Uint8Array(arrayBuffer, dataOffset, entry.compressedSize);
  if (entry.compression === 0) return compressed;
  if (entry.compression !== 8) throw new Error('Compression Word non supportee');

  const stream = new Blob([compressed]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

function elementsByLocalName(node, localName) {
  return Array.from(node.getElementsByTagName('*')).filter((item) => item.localName === localName);
}

function firstByLocalName(node, localName) {
  return elementsByLocalName(node, localName)[0];
}

function attrValue(node, name) {
  if (!node) return '';
  return node.getAttribute(`w:${name}`) || node.getAttribute(name) || '';
}

function runText(run) {
  return Array.from(run.childNodes).map((node) => {
    if (node.localName === 't') return node.textContent || '';
    if (node.localName === 'tab') return ' ';
    if (node.localName === 'br') return '\n';
    return '';
  }).join('');
}

function formattedRun(run) {
  const text = escapeHtml(runText(run)).replace(/\n/g, '<br />');
  if (!text) return '';
  const props = firstByLocalName(run, 'rPr');
  let output = text;
  if (props && firstByLocalName(props, 'u')) output = `<u>${output}</u>`;
  if (props && firstByLocalName(props, 'i')) output = `<em>${output}</em>`;
  if (props && firstByLocalName(props, 'b')) output = `<strong>${output}</strong>`;
  return output;
}

function paragraphTag(paragraph) {
  const props = firstByLocalName(paragraph, 'pPr');
  const style = attrValue(firstByLocalName(props || paragraph, 'pStyle'), 'val').toLowerCase();
  if (style.includes('heading1') || style.includes('titre1')) return 'h1';
  if (style.includes('heading2') || style.includes('titre2')) return 'h2';
  if (style.includes('heading3') || style.includes('titre3')) return 'h3';
  return 'p';
}

function paragraphHtml(paragraph) {
  const content = Array.from(paragraph.childNodes)
    .filter((node) => node.localName === 'r')
    .map(formattedRun)
    .join('');
  if (!content.trim()) return '';
  const tag = paragraphTag(paragraph);
  return `<${tag}>${content}</${tag}>`;
}

function tableHtml(table) {
  const rows = Array.from(table.childNodes).filter((node) => node.localName === 'tr');
  if (rows.length === 0) return '';
  return `<table>${rows.map((row) => {
    const cells = Array.from(row.childNodes).filter((node) => node.localName === 'tc');
    return `<tr>${cells.map((cell) => {
      const cellContent = Array.from(cell.childNodes)
        .filter((node) => node.localName === 'p')
        .map(paragraphHtml)
        .join('');
      return `<td>${cellContent || '&nbsp;'}</td>`;
    }).join('')}</tr>`;
  }).join('')}</table>`;
}

function docxXmlToHtml(xmlText) {
  const doc = new DOMParser().parseFromString(xmlText, 'application/xml');
  const parserError = doc.querySelector('parsererror');
  if (parserError) throw new Error('Document Word illisible');
  const body = firstByLocalName(doc, 'body');
  if (!body) throw new Error('Corps du document Word introuvable');
  return Array.from(body.childNodes).map((node) => {
    if (node.localName === 'p') return paragraphHtml(node);
    if (node.localName === 'tbl') return tableHtml(node);
    return '';
  }).filter(Boolean).join('');
}

async function readDocxFile(file) {
  const arrayBuffer = await file.arrayBuffer();
  const entries = zipEntries(arrayBuffer);
  const documentEntry = entries['word/document.xml'];
  if (!documentEntry) throw new Error('Le fichier Word ne contient pas de document principal');
  const xmlBytes = await unzipEntry(arrayBuffer, documentEntry);
  return docxXmlToHtml(new TextDecoder('utf-8').decode(xmlBytes));
}

async function readTextFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

function importedHtmlFromText(text) {
  if (/<(html|body|p|h1|h2|h3|table|div|span)\b/i.test(text)) {
    const doc = new DOMParser().parseFromString(text, 'text/html');
    doc.querySelectorAll('script, style, meta, link').forEach((node) => node.remove());
    return doc.body?.innerHTML || '';
  }
  return htmlFromPlainText(text);
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export default function DocumentsQualite() {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState('');
  const [form, setForm] = useState({});
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [processFilter, setProcessFilter] = useState('all');
  const [authorFilter, setAuthorFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('all');
  const [selectedDocId, setSelectedDocId] = useState('');
  const [procedureApprovers, setProcedureApprovers] = useState({});
  const [signatureTarget, setSignatureTarget] = useState(null);
  const [isSigning, setIsSigning] = useState(false);
  const editorRef = useRef(null);
  const writerRef = useRef(null);
  const imageInputRef = useRef(null);
  const wordInputRef = useRef(null);
  const signatureCanvasRef = useRef(null);
  const approverOptions = useMemo(() => (
    authProfiles.filter((profile) => approverRoles.includes(profile.role) && profile.role !== user?.role)
  ), [user?.role]);

  const refresh = async () => {
    setLoading(true);
    const docs = await listRecords('documentsQualite');
    const expiredProcedures = docs.filter(isExpiredProcedure);
    const normalizedDocs = docs.map((record) => {
      if (!isExpiredProcedure(record)) return record;
      return {
        ...record,
        statut: 'perime',
        observation: record.observation
          ? record.observation
          : `Archive automatiquement le ${today()} car la date de revision est depassee.`,
        updated_at: new Date().toISOString()
      };
    });
    setRecords(normalizedDocs);
    setLoading(false);
    if (expiredProcedures.length > 0) {
      await Promise.all(normalizedDocs.filter((record) => expiredProcedures.some((expired) => expired.id === record.id)).map((record) => upsertRecord('documentsQualite', record)));
      toast.success(`${expiredProcedures.length} procedure(s) archivee(s) dans Perimes`);
    }
  };

  useEffect(() => {
    refresh();
    const reload = () => refresh();
    window.addEventListener('smartlab:data-changed', reload);
    return () => window.removeEventListener('smartlab:data-changed', reload);
  }, []);

  useEffect(() => {
    if (!formOpen || selectedType !== 'procedure') return undefined;
    const frame = window.requestAnimationFrame(() => {
      editorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      writerRef.current?.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [formOpen, selectedType, editingId]);

  useEffect(() => {
    if (!formOpen || selectedType !== 'procedure' || !writerRef.current) return;
    const nextHtml = form.document_html || '';
    if (writerRef.current.innerHTML !== nextHtml) {
      writerRef.current.innerHTML = nextHtml;
    }
  }, [formOpen, selectedType, editingId, form.document_html]);

  const currentDocuments = useMemo(() => (
    records
      .filter((record) => record.statut === selectedStatus && record.type === selectedType)
      .sort(compareDocuments)
  ), [records, selectedStatus, selectedType]);

  const openStatusFolder = (status) => {
    setSelectedStatus(status);
    setSelectedType('');
    setFormOpen(false);
    setEditingId('');
  };

  const openTypeFolder = (type) => {
    setSelectedType(type);
    setFormOpen(false);
    setEditingId('');
  };

  const openCreate = () => {
    if (selectedType === 'procedure' && selectedStatus === 'perime') {
      toast.error('Une procedure perimee ne se cree pas ici. Elle doit venir de En Vigueur apres expiration.');
      return;
    }
    setEditingId('');
    setForm({
      ...emptyForm(selectedStatus, selectedType, records),
      redige_par: user?.name || user?.label || '',
      responsable: user?.name || user?.label || '',
      redacteur_nom: user?.name || user?.label || '',
      redacteur_modificateur: user?.name || user?.label || '',
      redacteur_fonction: user?.fonction || user?.label || '',
      approbateur_role: approverOptions[0]?.role || '',
      approbateur_nom: approverOptions[0]?.label || 'OKOUNDE Joel'
    });
    setFormOpen(true);
  };

  const openEdit = (record) => {
    setEditingId(record.id);
    setForm({
      ...procedureDefaults(),
      ...procedureTemplateDefaults(),
      ...record,
      document_text: procedureText(record),
      document_html: procedureHtml(record),
      approbateur_role: record.approbateur_role || approverOptions[0]?.role || '',
      approbateur_nom: record.approbateur_nom || approverOptions[0]?.label || ''
    });
    setFormOpen(true);
  };

  const closeForm = () => {
    setEditingId('');
    setFormOpen(false);
    setForm({});
  };

  const updateField = (name, value) => {
    setForm((current) => ({ ...current, [name]: value }));
  };

  const updateWriterContent = () => {
    const html = writerRef.current?.innerHTML || '';
    updateField('document_html', html);
  };

  const clearSignaturePad = () => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
  };

  const openSignaturePad = (field, label) => {
    setSignatureTarget({ field, label });
    window.requestAnimationFrame(clearSignaturePad);
  };

  const closeSignaturePad = () => {
    setSignatureTarget(null);
    setIsSigning(false);
  };

  const signaturePoint = (event) => {
    const canvas = signatureCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height
    };
  };

  const startSignature = (event) => {
    event.preventDefault();
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    canvas.setPointerCapture?.(event.pointerId);
    const context = canvas.getContext('2d');
    const point = signaturePoint(event);
    context.strokeStyle = '#0f172a';
    context.lineWidth = 3;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.beginPath();
    context.moveTo(point.x, point.y);
    setIsSigning(true);
  };

  const drawSignature = (event) => {
    event.preventDefault();
    if (!isSigning) return;
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    const point = signaturePoint(event);
    context.lineTo(point.x, point.y);
    context.stroke();
  };

  const endSignature = () => {
    setIsSigning(false);
  };

  const saveSignature = () => {
    if (!signatureTarget?.field || !signatureCanvasRef.current) return;
    updateField(signatureTarget.field, signatureCanvasRef.current.toDataURL('image/png'));
    toast.success('Signature numerique ajoutee');
    closeSignaturePad();
  };

  const createDocumentNotification = async (record, approver) => {
    const notification = {
      id: `notif-doc-${record.id}-${Date.now()}`,
      title: 'Document qualite a valider',
      message: `${record.reference || 'Procedure'} soumis par ${record.redige_par || 'un responsable'}`,
      path: '/documents-qualite',
      tone: 'info',
      targetRole: approver?.role || record.approbateur_role || 'responsable_technique',
      created_at: new Date().toISOString(),
      read: false
    };
    await upsertRecord('notifications', notification);
  };

  const selectedApproverRole = (record) => (
    procedureApprovers[record.id] || record.approbateur_role || approverOptions[0]?.role || ''
  );

  const selectedApprover = (record) => (
    approverOptions.find((item) => item.role === selectedApproverRole(record))
  );

  const saveDocument = async ({ submitForApproval = false } = {}) => {
    const isProcedure = selectedType === 'procedure';
    const currentHtml = isProcedure ? (writerRef.current?.innerHTML || form.document_html || '') : '';
    const documentText = isProcedure ? stripHtml(currentHtml) : (form.document_text || '');
    const documentTitle = isProcedure ? (String(form.titre || '').trim() || firstDocumentLine(currentHtml, form.reference || 'Procedure qualite')) : form.titre;
    const approver = approverOptions.find((item) => item.role === form.approbateur_role);
    const currentInstructionSteps = isProcedure ? extractInstructionSteps(currentHtml, form) : form.instruction_steps;
    if (submitForApproval && isProcedure && !approver) {
      toast.error('Choisissez un responsable habilite avant la soumission');
      return;
    }
    const payload = {
      ...form,
      type: selectedType,
      statut: selectedStatus,
      titre: isProcedure ? documentTitle : form.titre,
      objet: isProcedure ? documentTitle : (form.objet || ''),
      contenu: isProcedure ? documentText : (form.contenu || ''),
      document_text: isProcedure ? documentText : form.document_text,
      document_html: isProcedure ? currentHtml : form.document_html,
      instruction_steps: currentInstructionSteps,
      date_evolution: isProcedure ? (form.date_evolution || today()) : form.date_evolution,
      etat_evolution: isProcedure ? (form.etat_evolution || 'Creation') : form.etat_evolution,
      redacteur_modificateur: isProcedure ? (form.redacteur_modificateur || form.redige_par || user?.name || user?.label || '') : form.redacteur_modificateur,
      redacteur_nom: isProcedure ? (form.redacteur_nom || form.redige_par || user?.name || user?.label || '') : form.redacteur_nom,
      redacteur_fonction: isProcedure ? (form.redacteur_fonction || user?.fonction || user?.label || '') : form.redacteur_fonction,
      redacteur_date: isProcedure ? (form.redacteur_date || today()) : form.redacteur_date,
      verificateur_nom: isProcedure ? (form.verificateur_nom || form.approbateur_nom || '') : form.verificateur_nom,
      verificateur_fonction: isProcedure ? (form.verificateur_fonction || 'Responsable Qualite') : form.verificateur_fonction,
      verificateur_date: isProcedure ? (form.verificateur_date || today()) : form.verificateur_date,
      approbateur_fonction: isProcedure ? (form.approbateur_fonction || 'Directeur General') : form.approbateur_fonction,
      approbateur_date: isProcedure ? (form.approbateur_date || today()) : form.approbateur_date,
      destinataire: isProcedure ? (form.destinataire || 'Tout le personnel du laboratoire') : form.destinataire,
      workflow_status: submitForApproval ? 'soumis_validation' : (form.workflow_status || 'brouillon'),
      redige_par: form.redige_par || user?.name || user?.label || '',
      redacteur_role: form.redacteur_role || user?.role || '',
      approbateur_role: isProcedure ? (form.approbateur_role || approver?.role || '') : form.approbateur_role,
      approbateur_nom: isProcedure ? (approver?.label || form.approbateur_nom || '') : form.approbateur_nom,
      soumis_le: submitForApproval ? new Date().toISOString() : form.soumis_le,
      updated_at: new Date().toISOString()
    };
    const saved = await upsertRecord('documentsQualite', {
      ...payload,
      id: editingId || form.id
    });
    if (saved.__syncError) {
      toast.error(`Enregistre localement, mais pas dans Supabase: ${saved.__syncError}`);
    } else {
      if (submitForApproval && isProcedure) {
        await createDocumentNotification(saved, approver);
        toast.success(`Procedure soumise a ${approver.label}`);
      } else {
        toast.success(editingId ? 'Document modifie dans Supabase' : 'Document qualite ajoute dans Supabase');
      }
    }
    closeForm();
    await refresh();
  };

  const submit = async (event) => {
    event.preventDefault();
    await saveDocument();
  };

  const submitSavedProcedure = async (record) => {
    const approver = selectedApprover(record);
    if (!approver) {
      toast.error('Choisissez un responsable habilite avant la soumission');
      return;
    }
    const updated = {
      ...record,
      workflow_status: 'soumis_validation',
      redige_par: record.redige_par || user?.name || user?.label || '',
      redacteur_role: record.redacteur_role || user?.role || '',
      approbateur_role: approver.role,
      approbateur_nom: approver.label,
      soumis_le: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    const saved = await upsertRecord('documentsQualite', updated);
    if (saved.__syncError) {
      toast.error(`Soumission locale, mais pas dans Supabase: ${saved.__syncError}`);
      return;
    }
    await createDocumentNotification(saved, approver);
    toast.success(`Procedure soumise a ${approver.label}`);
    await refresh();
  };

  const remove = async (record) => {
    if (!window.confirm(`Supprimer ${record.reference || record.titre} ?`)) return;
    await deleteRecord('documentsQualite', record.id);
    toast.success('Document supprime');
    await refresh();
  };

  const buildProcedureHtml = (record) => {
    return `
      <!doctype html>
      <html lang="fr">
        <head>
          <meta charset="utf-8" />
          <title>${escapeHtml(record.reference || 'Procedure')}</title>
          <style>
            @page { margin: 13mm 16mm; size: A4; }
            body { background: #eef2f7; color: #111827; font-family: Arial, sans-serif; margin: 0; }
            .qualityProcedureModel { display: grid; gap: 18px; margin: 0 auto; max-width: 820px; }
            .qualityProcedurePage { background: #fff; box-sizing: border-box; display: flex; flex-direction: column; min-height: 1060px; padding: 28px 34px 24px; page-break-after: always; position: relative; }
            .qualityProcedureCartouche { border: 1px solid #111827; display: grid; grid-template-columns: 176px minmax(0, 1fr) 138px; min-height: 84px; }
            .qualityProcedureBrand, .qualityProcedureTitle, .qualityProcedureRef { align-items: center; border-right: 1px solid #111827; display: flex; justify-content: center; padding: 8px; }
            .qualityProcedureBrand { flex-direction: column; gap: 2px; text-align: center; }
            .qualityProcedureBrand strong { font-size: 16px; letter-spacing: 6px; }
            .qualityProcedureBrand span { font-size: 11px; }
            .qualityProcedureLogo { align-items: center; background: linear-gradient(135deg, #ef4444, #ef4444 48%, transparent 49%); border: 2px solid #ef4444; color: #111827; display: flex; font-weight: 900; height: 34px; justify-content: center; letter-spacing: 2px; width: 68px; }
            .qualityProcedureTitle { font-size: 15px; font-weight: 700; text-align: center; text-transform: uppercase; }
            .qualityProcedureRef { align-items: stretch; border-right: 0; flex-direction: column; font-size: 14px; gap: 8px; justify-content: center; }
            .qualityProcedureRef div { line-height: 1.25; }
            .qualityStamp { align-self: flex-start; border: 2px solid #ef4444; color: #ef4444; font-size: 22px; font-weight: 900; letter-spacing: 0.08em; margin: 34px 0 18px; padding: 8px 18px; transform: rotate(-6deg); }
            .qualityProcedureTable { border-collapse: collapse; color: #111827; font-size: 12px; margin: 16px 0; width: 100%; }
            .qualityProcedureTable th, .qualityProcedureTable td { border: 1px solid #111827; min-height: 34px; padding: 9px 10px; text-align: left; vertical-align: top; }
            .qualityProcedureTable thead th, .qualityProcedureTable tbody th { background: #f8fafc; font-weight: 700; }
            .qualitySignatureImage { display: block; height: 42px; max-width: 150px; object-fit: contain; }
            .instructionTable th:first-child, .instructionTable td:first-child { text-align: center; width: 46px; }
            .validationTable td { height: 38px; }
            .recipientTable { margin-top: 22px; }
            .recipientTable th { width: 160px; }
            .qualityTocTitle { font-size: 18px; margin: 64px 0 28px; text-align: center; }
            .qualityToc { color: #111827; font-size: 14px; list-style-position: inside; margin: 0 auto; max-width: 560px; padding: 0; width: 100%; }
            .qualityToc li { align-items: baseline; display: grid; gap: 12px; grid-template-columns: 1fr auto; line-height: 1.9; }
            .qualityToc li span { overflow: hidden; position: relative; }
            .qualityToc li span::after { border-bottom: 1px dotted #64748b; bottom: 8px; content: ''; left: 0; position: absolute; right: 0; z-index: 0; }
            .qualityToc li span::first-letter { position: relative; }
            .qualityToc em { font-style: normal; }
            .qualityProcedureContent { color: #111827; font-size: 13px; line-height: 1.78; margin-top: 28px; }
            .qualityProcedureContent h1, .qualityProcedureContent h2, .qualityProcedureContent h3 { color: #111827; font-size: 15px; margin: 24px 0 12px; text-align: center; }
            .qualityProcedureContent p { margin: 0 0 12px; text-align: justify; }
            .qualityProcedureContent ul, .qualityProcedureContent ol { margin: 8px 0 14px 42px; }
            .qualityProcedureContent img { display: block; margin: 14px 0; max-width: 100%; }
            .qualityProcedureContent table { border-collapse: collapse; width: 100%; }
            .qualityProcedureContent td, .qualityProcedureContent th { border: 1px solid #111827; padding: 7px; }
            .qualityProcedureNotes { border: 1px solid #111827; font-size: 12px; margin-top: 18px; padding: 10px; }
            .qualityProcedureFooter { align-items: flex-end; color: #111827; display: grid; font-size: 10px; gap: 14px; grid-template-columns: 1fr auto; margin-top: auto; padding-top: 32px; }
            .qualityProcedureFooter span { max-width: 620px; }
            .qualityProcedureFooter strong { font-size: 11px; white-space: nowrap; }
            @media print {
              body { background: #fff; }
              .qualityProcedureModel { display: block; margin: 0; max-width: none; }
              .qualityProcedurePage { box-shadow: none; min-height: calc(297mm - 26mm); padding: 0; }
            }
          </style>
        </head>
        <body>
          ${procedureModelInnerHtml(record)}
        </body>
      </html>
    `;
  };

  const generateProcedure = (record) => {
    const doc = window.open('', '_blank');
    if (!doc) {
      toast.error('Fenetre PDF bloquee par le navigateur');
      return;
    }
    doc.document.write(buildProcedureHtml(record));
    doc.document.close();
    doc.focus();
    setTimeout(() => doc.print(), 450);
  };

  const exportProcedureWord = (record) => {
    const html = buildProcedureHtml(record);
    const blob = new Blob(['\ufeff', html], { type: 'application/msword;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${safeFileName(record.reference || record.titre)}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const runEditorCommand = (command, value = null) => {
    writerRef.current?.focus();
    document.execCommand(command, false, value);
    updateWriterContent();
  };

  const changeBlockStyle = (value) => {
    if (!value) return;
    runEditorCommand('formatBlock', value);
  };

  const insertEditorLink = () => {
    const url = window.prompt('Lien a inserer');
    if (!url) return;
    runEditorCommand('createLink', url);
  };

  const insertEditorImage = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      runEditorCommand('insertImage', reader.result);
      if (imageInputRef.current) imageInputRef.current.value = '';
    };
    reader.readAsDataURL(file);
  };

  const importWordDocument = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const extension = file.name.split('.').pop()?.toLowerCase();

    try {
      let html = '';
      if (extension === 'docx') {
        html = await readDocxFile(file);
      } else if (['doc', 'html', 'htm', 'txt'].includes(extension)) {
        html = importedHtmlFromText(await readTextFile(file));
      } else {
        toast.error('Format non supporte. Importez un fichier .docx, .doc, .html ou .txt');
        return;
      }

      if (!html.trim()) {
        toast.error('Aucun contenu lisible trouve dans le fichier');
        return;
      }

      if (writerRef.current) writerRef.current.innerHTML = html;
      updateField('document_html', html);
      updateField('document_text', stripHtml(html));
      toast.success('Document importe dans la zone de redaction');
    } catch (error) {
      toast.error(`Import impossible: ${error.message || 'fichier Word illisible'}`);
    } finally {
      if (wordInputRef.current) wordInputRef.current.value = '';
    }
  };

  const updateProcedureWorkflow = async (record, nextStatus) => {
    const updated = {
      ...record,
      workflow_status: nextStatus,
      valide_par: nextStatus === 'valide' ? (user?.name || user?.label || '') : record.valide_par,
      valide_le: nextStatus === 'valide' ? new Date().toISOString() : record.valide_le,
      rejete_par: nextStatus === 'rejete' ? (user?.name || user?.label || '') : record.rejete_par,
      rejete_le: nextStatus === 'rejete' ? new Date().toISOString() : record.rejete_le,
      updated_at: new Date().toISOString()
    };
    await upsertRecord('documentsQualite', updated);
    if (record.redacteur_role) {
      await upsertRecord('notifications', {
        id: `notif-doc-retour-${record.id}-${Date.now()}`,
        title: nextStatus === 'valide' ? 'Procedure validee' : 'Procedure rejetee',
        message: `${record.reference || 'Procedure'} ${nextStatus === 'valide' ? 'validee' : 'rejetee'} par ${user?.name || user?.label || 'le responsable habilite'}`,
        path: '/documents-qualite',
        tone: nextStatus === 'valide' ? 'success' : 'warning',
        targetRole: record.redacteur_role,
        created_at: new Date().toISOString(),
        read: false
      });
    }
    toast.success(nextStatus === 'valide' ? 'Procedure validee' : 'Procedure rejetee');
    await refresh();
  };

  const renderProcedureDocument = (record) => (
    <article className="procedureDocument" key={record.id}>
      <header className="procedureDocumentHeader">
        <div>
          <span>{record.reference} - Version {record.version || '01'}</span>
          <h3>{record.titre || 'Procedure sans titre'}</h3>
          <div className="documentMetaLine">
            <span className={`statusBadge ${record.workflow_status === 'soumis_validation' ? 'info' : 'neutral'}`}>
              {workflowLabel(record.workflow_status)}
            </span>
            {record.approbateur_nom && <em>Responsable habilite: {record.approbateur_nom}</em>}
          </div>
        </div>
        <div className="rowActions">
          {record.statut === 'en_vigueur' && <button type="button" className="primaryButton" onClick={() => generateProcedure(record)}>Generer procedure</button>}
          {record.statut === 'en_vigueur' && <button type="button" className="ghostButton" onClick={() => exportProcedureWord(record)}>Word</button>}
          {record.workflow_status === 'soumis_validation' && record.approbateur_role === user?.role && (
            <>
              <button type="button" className="ghostButton" onClick={() => updateProcedureWorkflow(record, 'valide')}>Valider</button>
              <button type="button" className="dangerButton" onClick={() => updateProcedureWorkflow(record, 'rejete')}>Rejeter</button>
            </>
          )}
          {record.statut === 'en_vigueur' && !['soumis_validation', 'valide'].includes(record.workflow_status || 'brouillon') && (
            <div className="submitProcedureBox">
              <select
                aria-label="Responsable habilite"
                value={selectedApproverRole(record)}
                onChange={(event) => setProcedureApprovers((current) => ({ ...current, [record.id]: event.target.value }))}
              >
                {approverOptions.map((profile) => (
                  <option key={profile.role} value={profile.role}>{profile.label}</option>
                ))}
              </select>
              <button type="button" className="secondaryButton" onClick={() => submitSavedProcedure(record)}>
                Soumettre
              </button>
            </div>
          )}
          {record.statut === 'en_vigueur' && <button type="button" className="ghostButton" onClick={() => openEdit(record)}>Modifier</button>}
          <button type="button" className="dangerButton" onClick={() => remove(record)}>Supprimer</button>
        </div>
      </header>

      <div className="procedureDocumentBody">
        <div className="procedureDocumentText qualityProcedurePreview" dangerouslySetInnerHTML={{ __html: procedureModelInnerHtml(record) }} />
      </div>
    </article>
  );

  const renderProcedureLibrary = () => (
    <div className="procedureLibraryPanel">
      <div className="tableTools">
        <strong>{typeLabel(selectedType)} - {statusLabel(selectedStatus)}</strong>
        {selectedStatus === 'en_vigueur' ? (
          <button type="button" className="secondaryButton" onClick={openCreate}>
            + Nouvelle procedure
          </button>
        ) : (
          <span className="archiveNotice">Archive automatique des procedures expirees</span>
        )}
      </div>
      {formOpen && renderProcedureEditor()}
      <div className="procedureDocumentList">
        {currentDocuments.map(renderProcedureDocument)}
        {!loading && currentDocuments.length === 0 && (
          <div className="emptyDocumentState">Aucune procedure dans ce dossier</div>
        )}
      </div>
    </div>
  );

  const renderFicheTable = () => (
    <div className="tablePanel">
      <div className="tableTools">
        <strong>{typeLabel(selectedType)} - {statusLabel(selectedStatus)}</strong>
        <button type="button" className="secondaryButton" onClick={openCreate}>
          + Nouvelle {typeLabel(selectedType).toLowerCase()}
        </button>
      </div>
      <div className="tableScroll">
        <table>
          <thead>
            <tr>
              <th>Reference</th>
              <th>Titre</th>
              <th>Version</th>
              <th>Processus</th>
              <th>Responsable</th>
              <th>Application</th>
              <th>Revision</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentDocuments.map((record) => (
              <tr key={record.id}>
                <td><strong>{record.reference}</strong></td>
                <td>{record.titre}</td>
                <td>{record.version}</td>
                <td>{record.processus || '-'}</td>
                <td>{record.responsable || '-'}</td>
                <td>{record.date_application || '-'}</td>
                <td>{record.date_revision || '-'}</td>
                <td>
                  <div className="rowActions">
                    <button type="button" className="ghostButton" onClick={() => openEdit(record)}>Modifier</button>
                    <button type="button" className="dangerButton" onClick={() => remove(record)}>Supprimer</button>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && currentDocuments.length === 0 && (
              <tr>
                <td colSpan="8" className="emptyCell">Aucun document dans ce dossier</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderSignatureControl = (field, label) => (
    <div className="signatureControl">
      <span>{label}</span>
      <div className="signaturePreviewBox">
        {isSignatureValue(form[field]) ? (
          <img src={form[field]} alt={`Signature ${label}`} />
        ) : (
          <em>Aucune signature</em>
        )}
      </div>
      <div className="rowActions">
        <button type="button" className="secondaryButton" onClick={() => openSignaturePad(field, label)}>Signer</button>
        {form[field] && <button type="button" className="ghostButton" onClick={() => updateField(field, '')}>Effacer</button>}
      </div>
    </div>
  );

  const renderSignatureModal = () => signatureTarget && (
    <div className="modalOverlay signatureModalOverlay">
      <div className="signatureModal">
        <div className="formHeader">
          <div>
            <strong>Signature numerique - {signatureTarget.label}</strong>
            <small>Signez dans le cadre avec la souris ou le doigt, puis enregistrez.</small>
          </div>
          <button type="button" className="ghostButton" onClick={closeSignaturePad}>Fermer</button>
        </div>
        <canvas
          ref={signatureCanvasRef}
          width="720"
          height="260"
          className="signatureCanvas"
          onPointerDown={startSignature}
          onPointerMove={drawSignature}
          onPointerUp={endSignature}
          onPointerLeave={endSignature}
        />
        <div className="formActions">
          <button type="button" className="ghostButton" onClick={clearSignaturePad}>Effacer</button>
          <button type="button" className="primaryButton" onClick={saveSignature}>Enregistrer la signature</button>
        </div>
      </div>
    </div>
  );

  const renderProcedureEditor = () => (
    <form className="editorPanel procedureEditorPanel" ref={editorRef} onSubmit={submit}>
      <div className="formHeader">
        <div>
          <strong>{editingId ? 'Modifier la procedure' : 'Rediger une nouvelle procedure'}</strong>
          <small>Redigez et mettez en forme le document comme dans un traitement de texte.</small>
        </div>
        <button type="button" className="ghostButton" onClick={closeForm}>Fermer</button>
      </div>

      <details className="procedureTemplateSettings">
        <summary>Cartouche, evolution et validation du document</summary>
        <div className="procedureMetaGrid">
          <label>
            <span>Titre officiel</span>
            <input value={form.titre || ''} onChange={(event) => updateField('titre', event.target.value)} placeholder="PROCEDURE DE..." />
          </label>
          <label>
            <span>Reference</span>
            <input value={form.reference || ''} onChange={(event) => updateField('reference', event.target.value)} required />
          </label>
          <label>
            <span>Version</span>
            <input value={form.version || ''} onChange={(event) => updateField('version', event.target.value)} required />
          </label>
          <label>
            <span>Date application</span>
            <input type="date" value={form.date_application || ''} onChange={(event) => updateField('date_application', event.target.value)} />
          </label>
          <label>
            <span>Date evolution</span>
            <input type="date" value={form.date_evolution || ''} onChange={(event) => updateField('date_evolution', event.target.value)} />
          </label>
          <label>
            <span>Etat evolution</span>
            <input value={form.etat_evolution || ''} onChange={(event) => updateField('etat_evolution', event.target.value)} placeholder="Creation, modification..." />
          </label>
          <label>
            <span>Redacteur / modificateur</span>
            <input value={form.redacteur_modificateur || ''} onChange={(event) => updateField('redacteur_modificateur', event.target.value)} />
          </label>
          <label>
            <span>Destinataire</span>
            <input value={form.destinataire || ''} onChange={(event) => updateField('destinataire', event.target.value)} />
          </label>
        </div>
        <div className="procedureValidationGrid">
          <label>
            <span>Redacteur - nom</span>
            <input value={form.redacteur_nom || ''} onChange={(event) => updateField('redacteur_nom', event.target.value)} />
          </label>
          <label>
            <span>Redacteur - fonction</span>
            <input value={form.redacteur_fonction || ''} onChange={(event) => updateField('redacteur_fonction', event.target.value)} />
          </label>
          <label>
            <span>Redacteur - date</span>
            <input type="date" value={form.redacteur_date || ''} onChange={(event) => updateField('redacteur_date', event.target.value)} />
          </label>
          <label>
            <span>Verificateur - nom</span>
            <input value={form.verificateur_nom || ''} onChange={(event) => updateField('verificateur_nom', event.target.value)} />
          </label>
          <label>
            <span>Verificateur - fonction</span>
            <input value={form.verificateur_fonction || ''} onChange={(event) => updateField('verificateur_fonction', event.target.value)} />
          </label>
          <label>
            <span>Verificateur - date</span>
            <input type="date" value={form.verificateur_date || ''} onChange={(event) => updateField('verificateur_date', event.target.value)} />
          </label>
          <label>
            <span>Approbateur - nom</span>
            <input value={form.approbateur_nom || ''} onChange={(event) => updateField('approbateur_nom', event.target.value)} />
          </label>
          <label>
            <span>Approbateur - fonction</span>
            <input value={form.approbateur_fonction || ''} onChange={(event) => updateField('approbateur_fonction', event.target.value)} />
          </label>
          <label>
            <span>Approbateur - date</span>
            <input type="date" value={form.approbateur_date || ''} onChange={(event) => updateField('approbateur_date', event.target.value)} />
          </label>
        </div>
        <div className="signatureGrid">
          {renderSignatureControl('redacteur_visa', 'Visa redacteur')}
          {renderSignatureControl('verificateur_visa', 'Visa verificateur')}
          {renderSignatureControl('approbateur_visa', 'Visa approbateur')}
        </div>
      </details>

      <div className="procedureWritingSurface documentWritingSurface">
        <div className="documentWriterToolbar">
          <select aria-label="Style du paragraphe" defaultValue="" onChange={(event) => changeBlockStyle(event.target.value)}>
            <option value="">Style</option>
            <option value="h1">Titre 1</option>
            <option value="h2">Titre 2</option>
            <option value="h3">Titre 3</option>
            <option value="p">Paragraphe</option>
          </select>
          <button type="button" title="Gras" onClick={() => runEditorCommand('bold')}>B</button>
          <button type="button" title="Italique" onClick={() => runEditorCommand('italic')}><i>I</i></button>
          <button type="button" title="Souligner" onClick={() => runEditorCommand('underline')}><u>U</u></button>
          <button type="button" title="Liste a puces" onClick={() => runEditorCommand('insertUnorderedList')}>Liste</button>
          <button type="button" title="Liste numerotee" onClick={() => runEditorCommand('insertOrderedList')}>1.</button>
          <button type="button" title="Aligner a gauche" onClick={() => runEditorCommand('justifyLeft')}>Gauche</button>
          <button type="button" title="Centrer" onClick={() => runEditorCommand('justifyCenter')}>Centre</button>
          <button type="button" title="Aligner a droite" onClick={() => runEditorCommand('justifyRight')}>Droite</button>
          <button type="button" title="Inserer un lien" onClick={insertEditorLink}>Lien</button>
          <button type="button" title="Importer un fichier Word" onClick={() => wordInputRef.current?.click()}>Importer Word</button>
          <button type="button" title="Inserer une image" onClick={() => imageInputRef.current?.click()}>Image</button>
          <input ref={wordInputRef} type="file" accept=".docx,.doc,.html,.htm,.txt" onChange={importWordDocument} hidden />
          <input ref={imageInputRef} type="file" accept="image/*" onChange={insertEditorImage} hidden />
        </div>
        <div
          className="documentWriter"
          ref={writerRef}
          contentEditable
          suppressContentEditableWarning
          onInput={updateWriterContent}
          data-placeholder="Redigez la procedure ici..."
        />
      </div>

      <div className="procedureAutoInstructionNotice">
        Le logiciel lit automatiquement la procedure enregistree et en deduit les instructions operationnelles a partir des listes, des numerotations et des phrases d action.
      </div>

      {renderSignatureModal()}

      <div className="formActions">
        <button type="submit" className="primaryButton">Enregistrer la procedure</button>
      </div>
    </form>
  );

  const renderFicheForm = () => (
    <form className="editorPanel" onSubmit={submit}>
      <div className="formHeader">
        <strong>{editingId ? 'Modifier' : 'Ajouter'} {typeLabel(selectedType).toLowerCase()}</strong>
        <button type="button" className="ghostButton" onClick={closeForm}>Fermer</button>
      </div>
      <div className="formGrid">
        <label>
          <span>Reference</span>
          <input value={form.reference || ''} onChange={(event) => updateField('reference', event.target.value)} required />
        </label>
        <label>
          <span>Version</span>
          <input value={form.version || ''} onChange={(event) => updateField('version', event.target.value)} required />
        </label>
        <label>
          <span>Responsable</span>
          <input value={form.responsable || ''} onChange={(event) => updateField('responsable', event.target.value)} placeholder="Responsable qualite" />
        </label>
        <label className="full">
          <span>Titre</span>
          <input value={form.titre || ''} onChange={(event) => updateField('titre', event.target.value)} required placeholder={`Titre de la ${typeLabel(selectedType).toLowerCase()}`} />
        </label>
        <label>
          <span>Processus concerne</span>
          <input value={form.processus || ''} onChange={(event) => updateField('processus', event.target.value)} placeholder="Technique, qualite, reception..." />
        </label>
        <label>
          <span>Date d'application</span>
          <input type="date" value={form.date_application || ''} onChange={(event) => updateField('date_application', event.target.value)} />
        </label>
        <label>
          <span>Date de revision</span>
          <input type="date" value={form.date_revision || ''} onChange={(event) => updateField('date_revision', event.target.value)} />
        </label>
        <label className="full">
          <span>Objet</span>
          <textarea value={form.objet || ''} onChange={(event) => updateField('objet', event.target.value)} rows="3" placeholder="Objectif, domaine d'application et documents associes." />
        </label>
        <label className="full">
          <span>Contenu / description</span>
          <textarea value={form.contenu || ''} onChange={(event) => updateField('contenu', event.target.value)} rows="5" placeholder="Champs attendus, consignes de saisie, controles a effectuer..." />
        </label>
        <label className="full">
          <span>Lien ou nom du fichier</span>
          <input value={form.lien_document || ''} onChange={(event) => updateField('lien_document', event.target.value)} placeholder="Nom du document, lien Drive, PDF, Word..." />
        </label>
        <label className="full">
          <span>Observation</span>
          <textarea value={form.observation || ''} onChange={(event) => updateField('observation', event.target.value)} rows="2" placeholder="Motif de peremption, remplacement, commentaire qualite..." />
        </label>
      </div>
      <div className="formActions">
        <button type="submit" className="primaryButton">Enregistrer</button>
      </div>
    </form>
  );

  const documentTypeLabel = (value) => {
    const labels = {
      procedure: 'Procedure',
      instruction: 'Instruction',
      fiche: 'Formulaire',
      formulaire: 'Formulaire',
      enregistrement: 'Enregistrement',
      politique: 'Politique',
      autre: 'Autre'
    };
    return labels[value] || typeLabel(value) || 'Document';
  };

  const documentTypeTone = (value) => {
    if (value === 'procedure') return 'purple';
    if (value === 'instruction') return 'success';
    if (value === 'fiche' || value === 'formulaire') return 'info';
    if (value === 'enregistrement') return 'warning';
    if (value === 'politique') return 'neutral';
    return 'neutral';
  };

  const documentStatusLabel = (value) => {
    if (value === 'en_vigueur') return 'En vigueur';
    if (value === 'perime') return 'Obsolete';
    if (value === 'brouillon') return 'Brouillon';
    return statusLabel(value);
  };

  const documentStatusTone = (value) => {
    if (value === 'en_vigueur') return 'success';
    if (value === 'perime') return 'danger';
    if (value === 'brouillon') return 'neutral';
    return 'info';
  };

  const processOptions = useMemo(() => [...new Set(records.map((record) => record.processus).filter(Boolean))], [records]);
  const authorOptions = useMemo(() => [...new Set(records.map((record) => record.responsable || record.redige_par).filter(Boolean))], [records]);

  const filteredDocuments = useMemo(() => records.filter((record) => {
    const type = record.type || 'procedure';
    const tabMatches = activeTab === 'all' || type === activeTab || (activeTab === 'formulaire' && type === 'fiche');
    const text = `${record.reference} ${record.titre} ${record.processus} ${record.responsable} ${record.redige_par} ${record.contenu}`.toLowerCase();
    const queryMatches = text.includes(query.toLowerCase());
    const typeMatches = typeFilter === 'all' || type === typeFilter || (typeFilter === 'formulaire' && type === 'fiche');
    const statusMatches = statusFilter === 'all' || record.statut === statusFilter;
    const processMatches = processFilter === 'all' || record.processus === processFilter;
    const authorMatches = authorFilter === 'all' || record.responsable === authorFilter || record.redige_par === authorFilter;
    return tabMatches && queryMatches && typeMatches && statusMatches && processMatches && authorMatches;
  }).sort(compareDocuments), [records, activeTab, query, typeFilter, statusFilter, processFilter, authorFilter]);

  const selectedDocument = records.find((record) => record.id === selectedDocId) || filteredDocuments[0] || records[0];
  const totalDocuments = records.length;
  const procedureCount = records.filter((record) => record.type === 'procedure').length;
  const instructionCount = records.filter((record) => record.type === 'instruction').length;
  const formCount = records.filter((record) => ['fiche', 'formulaire'].includes(record.type)).length;
  const recordCount = records.filter((record) => record.type === 'enregistrement').length;
  const obsoleteCount = records.filter((record) => record.statut === 'perime').length;
  const revisionCount = records.filter((record) => record.workflow_status === 'soumis_validation' || (record.date_revision && record.date_revision >= today())).length;
  const activeCount = records.filter((record) => record.statut === 'en_vigueur').length;
  const draftCount = records.filter((record) => record.workflow_status === 'brouillon').length;
  const processCounts = records.reduce((acc, record) => {
    const key = record.processus || 'Autres Documents';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const typeCounts = records.reduce((acc, record) => {
    const key = documentTypeLabel(record.type || 'procedure');
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const reviewDocuments = records
    .filter((record) => record.statut === 'en_vigueur')
    .sort((a, b) => String(a.date_revision || '9999-99-99').localeCompare(String(b.date_revision || '9999-99-99')))
    .slice(0, 3);
  const activityDocuments = records
    .slice()
    .sort((a, b) => String(b.updated_at || b.date_application || '').localeCompare(String(a.updated_at || a.date_application || '')))
    .slice(0, 4);

  const openCreateDocument = (type = 'procedure') => {
    const status = 'en_vigueur';
    const realType = type === 'formulaire' ? 'fiche' : type;
    setSelectedStatus(status);
    setSelectedType(realType);
    setEditingId('');
    setForm({
      ...emptyForm(status, realType, records),
      redige_par: user?.name || user?.label || '',
      responsable: user?.name || user?.label || '',
      redacteur_nom: user?.name || user?.label || '',
      redacteur_modificateur: user?.name || user?.label || '',
      redacteur_fonction: user?.fonction || user?.label || '',
      approbateur_role: approverOptions[0]?.role || '',
      approbateur_nom: approverOptions[0]?.label || 'OKOUNDE Joel'
    });
    setFormOpen(true);
  };

  const openDocumentEdit = (record) => {
    setSelectedStatus(record.statut || 'en_vigueur');
    setSelectedType(record.type || 'procedure');
    openEdit(record);
  };

  const formatShortDate = (value) => value ? formatProcedureDate(value) : '-';
  const daysBeforeRevision = (record) => {
    const delay = daysUntilDate(record.date_revision);
    if (delay === null) return '-';
    if (delay < 0) return 'Expire';
    return `${delay} jours`;
  };

  return (
    <div className="qualityMockPage">
      <div className="dashMockHeader qualityMockHeader">
        <div><span className="mockEyebrow">TESTLAB MOBILE</span><h2>Documents Qualite</h2><p>Gerez, consultez et maitrisez tous vos documents qualite</p></div>
        <label className="dashMockSearch"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher un document (titre, code, mot-cle...)" /><kbd>⌘ K</kbd></label>
        <button type="button" className="primaryButton" onClick={() => openCreateDocument('procedure')}>+ Nouveau document</button>
      </div>

      <div className="quoteKpiGrid qualityKpiGrid">
        <div className="mockKpiCard blue"><div><span>Documents totaux</span><strong>{totalDocuments}</strong><small>+ 12% vs mois dernier</small></div><i>⌘</i><Sparkline /></div>
        <div className="mockKpiCard purple"><div><span>Procedures</span><strong>{procedureCount}</strong><small>+ 8% vs mois dernier</small></div><i>△</i><Sparkline tone="purple" /></div>
        <div className="mockKpiCard green"><div><span>Instructions</span><strong>{instructionCount}</strong><small>+ 15% vs mois dernier</small></div><i>▤</i><Sparkline tone="green" /></div>
        <div className="mockKpiCard orange"><div><span>Enregistrements</span><strong>{recordCount || formCount}</strong><small>+ 5% vs mois dernier</small></div><i>▣</i><Sparkline tone="orange" /></div>
        <div className="mockKpiCard red"><div><span>Obsoletes</span><strong>{obsoleteCount}</strong><small>- 20% vs mois dernier</small></div><i>×</i><Sparkline tone="red" /></div>
        <div className="mockKpiCard teal"><div><span>Revisions en cours</span><strong>{revisionCount}</strong><small>Action requise</small></div><i>↻</i><Sparkline tone="green" /></div>
      </div>

      <div className="qualityLayout">
        <main className="qualityMain">
          <section className="dashPanel qualityTablePanel">
            <div className="achatTabs qualityTabs">
              {[['all', 'Tous les documents'], ['procedure', 'Procedures'], ['instruction', 'Instructions'], ['formulaire', 'Formulaires'], ['enregistrement', 'Enregistrements'], ['politique', 'Politiques'], ['autre', 'Autres']].map(([key, label]) => (
                <button key={key} type="button" className={activeTab === key ? 'active' : ''} onClick={() => setActiveTab(key)}>{label}</button>
              ))}
            </div>
            <div className="quoteTableTop qualityTools">
              <div className="quoteFilters"><select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}><option value="all">Type : Tous</option><option value="procedure">Procedure</option><option value="instruction">Instruction</option><option value="formulaire">Formulaire</option><option value="enregistrement">Enregistrement</option><option value="politique">Politique</option></select><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="all">Statut : Tous</option><option value="en_vigueur">En vigueur</option><option value="perime">Obsolete</option></select><select value={processFilter} onChange={(event) => setProcessFilter(event.target.value)}><option value="all">Processus : Tous</option>{processOptions.map((item) => <option key={item} value={item}>{item}</option>)}</select><select value={authorFilter} onChange={(event) => setAuthorFilter(event.target.value)}><option value="all">Redacteur : Tous</option>{authorOptions.map((item) => <option key={item} value={item}>{item}</option>)}</select><button type="button" className="ghostButton">Filtres avances</button></div>
              <div className="quoteTableActions"><button type="button" className="primaryButton" onClick={() => openCreateDocument('procedure')}>+ Nouveau document</button><button type="button" className="ghostButton">☷</button><button type="button" className="ghostButton">▦</button><button type="button" className="ghostButton">⇩</button></div>
            </div>
            <div className="tableScroll"><table className="mockTable qualityTable"><thead><tr><th>Code</th><th>Titre du document</th><th>Type</th><th>Processus</th><th>Version</th><th>Statut</th><th>Date MAJ</th><th>Actions</th></tr></thead><tbody>{filteredDocuments.map((record) => <tr key={record.id} className={`${selectedDocument?.id === record.id ? 'selectedRow' : ''} ${record.statut === 'perime' ? 'obsoleteRow' : ''}`} onClick={() => setSelectedDocId(record.id)}><td><strong>{record.reference}</strong></td><td>{record.titre || firstDocumentLine(procedureHtml(record), 'Document qualite')}</td><td><span className={`statusBadge ${documentTypeTone(record.type)}`}>{documentTypeLabel(record.type)}</span></td><td>{record.processus || '-'}</td><td>{record.version || '1.0'}</td><td><span className={`statusBadge ${documentStatusTone(record.statut)}`}>{documentStatusLabel(record.statut)}</span></td><td>{formatShortDate(record.updated_at || record.date_revision || record.date_application)}</td><td><div className="rowActions"><button type="button" onClick={(event) => { event.stopPropagation(); setSelectedDocId(record.id); }}>⊙</button>{record.type === 'procedure' && <button type="button" onClick={(event) => { event.stopPropagation(); generateProcedure(record); }}>⇩</button>}<button type="button" onClick={(event) => { event.stopPropagation(); openDocumentEdit(record); }}>✎</button><button type="button" onClick={(event) => { event.stopPropagation(); remove(record); }}>⋮</button></div></td></tr>)}{filteredDocuments.length === 0 && <tr><td colSpan="8" className="emptyCell">Aucun document trouve</td></tr>}</tbody></table></div>
            <div className="tableFooter"><span>Affichage de 1 a {filteredDocuments.length} sur {totalDocuments} documents</span><div><button type="button" className="pageButton active">1</button><button type="button" className="pageButton">2</button><button type="button" className="pageButton">3</button><button type="button" className="pageButton">13</button></div><select><option>10 / page</option></select></div>
          </section>

          <div className="qualityBottomGrid">
            <section className="dashPanel qualityMiniPanel"><div className="dashPanelHeader"><strong>Repartition par type</strong></div><div className="qualityDonutWrap"><div className="dashDonut quoteSmallDonut"><strong>{totalDocuments}</strong><span>Total</span></div><div className="chartLegend">{Object.entries(typeCounts).slice(0, 5).map(([label, value], index) => <div key={label}><i style={{ background: ['#7c3aed', '#22c55e', '#f59e0b', '#2f8cff', '#06b6d4'][index] }} /><span>{label}</span><strong>{value} ({Math.round((value / Math.max(totalDocuments, 1)) * 100)}%)</strong></div>)}</div></div><button type="button" className="linkButton">Voir le detail →</button></section>
            <section className="dashPanel qualityMiniPanel"><div className="dashPanelHeader"><strong>Statut des documents</strong></div><div className="qualityDonutWrap"><div className="dashDonut quoteSmallDonut"><strong>{totalDocuments}</strong><span>Total</span></div><div className="chartLegend"><div><i style={{ background: '#22c55e' }} /><span>En vigueur</span><strong>{activeCount} ({Math.round((activeCount / Math.max(totalDocuments, 1)) * 100)}%)</strong></div><div><i style={{ background: '#f59e0b' }} /><span>En revision</span><strong>{revisionCount}</strong></div><div><i style={{ background: '#ef4444' }} /><span>Obsoletes</span><strong>{obsoleteCount}</strong></div><div><i style={{ background: '#64748b' }} /><span>Brouillons</span><strong>{draftCount}</strong></div></div></div><button type="button" className="linkButton">Voir le detail →</button></section>
            <section className="dashPanel qualityMiniPanel qualityEvolution"><div className="dashPanelHeader"><strong>Evolution documentaire</strong><span>12 derniers mois</span></div><div className="qualityLineChart"><svg viewBox="0 0 420 160" aria-hidden="true"><polyline className="created" points="5,130 45,100 85,112 125,78 165,62 205,78 245,58 285,50 325,70 365,64 415,46" /><polyline className="modified" points="5,142 45,132 85,124 125,116 165,98 205,116 245,92 285,82 325,72 365,86 415,70" /><polyline className="obsolete" points="5,150 45,148 85,150 125,146 165,148 205,144 245,146 285,140 325,142 365,136 415,132" /></svg></div><button type="button" className="linkButton">Voir le rapport complet →</button></section>
          </div>

          {formOpen && <div className="qualityEditorSlot">{selectedType === 'procedure' ? renderProcedureEditor() : renderFicheForm()}</div>}
        </main>

        <aside className="qualityRightStack">
          <section className="dashPanel qualityTreePanel"><div className="dashPanelHeader"><strong>Arborescence documentaire</strong></div><div className="qualityTree"><div><span>▾</span><strong>Systeme de Management</strong><em>{totalDocuments}</em></div>{Object.entries(processCounts).slice(0, 7).map(([name, value]) => <button key={name} type="button" onClick={() => setProcessFilter(name)}><span>▹</span><b>📁</b>{name}<em>{value}</em></button>)}</div></section>
          <section className="dashPanel qualityReviewPanel"><div className="dashPanelHeader"><strong>Documents a reviser</strong><button type="button" className="linkButton">Voir tout</button></div><div className="qualityReviewList">{reviewDocuments.map((record) => <div key={record.id}><span className={`statusBadge ${documentTypeTone(record.type)}`}>{documentTypeLabel(record.type).slice(0, 3)}</span><strong>{record.reference} - {record.titre || 'Document'}</strong><small>Echeance : {formatShortDate(record.date_revision)}</small><em>{daysBeforeRevision(record)}</em></div>)}</div></section>
          <section className="dashPanel qualityQuickPanel"><div className="dashPanelHeader"><strong>Acces rapides</strong></div><div className="qualityQuickGrid"><button type="button">☆ Mes favoris</button><button type="button">◴ Recemment consultes</button><button type="button" onClick={() => setStatusFilter('perime')}>△ Documents obsoletes</button><button type="button">▤ Modifications recentes</button></div></section>
          <section className="dashPanel qualityHistoryPanel"><div className="dashPanelHeader"><strong>Historique des dernieres activites</strong></div><div className="qualityHistoryList">{activityDocuments.map((record) => <div key={record.id}><b>↻</b><span><strong>{record.reference} - {record.titre || 'Document qualite'}</strong><small>Document modifie par {record.responsable || record.redige_par || 'TESTLAB'}</small></span></div>)}</div><button type="button" className="linkButton">Voir tout l'historique →</button></section>
        </aside>
      </div>
    </div>
  );
}

function daysUntilDate(value) {
  if (!value) return null;
  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);
  const target = new Date(value);
  if (Number.isNaN(target.getTime())) return null;
  target.setHours(0, 0, 0, 0);
  return Math.round((target - todayDate) / 86400000);
}

function Sparkline({ tone = 'blue' }) {
  return <svg className={`quoteSpark ${tone}`} viewBox="0 0 120 28" aria-hidden="true"><polyline points="0,22 18,18 36,13 54,20 72,16 90,15 120,14" /></svg>;
}
