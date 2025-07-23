
import { Contract, ContractType, Provision } from '../types';
import { INSURANCE_KEYWORDS } from '../constants';
import { summarizeProvisions } from './geminiService';

// --- Type definitions for CDN libraries ---

interface JSZipObject {
  name: string;
  dir: boolean;
  async(type: 'arraybuffer'): Promise<ArrayBuffer>;
}

declare const JSZip: {
  loadAsync(data: File): Promise<{ files: { [key: string]: JSZipObject } }>;
};

interface PDFTextItem {
    str: string;
}

interface PDFTextContent {
    items: PDFTextItem[];
}

interface PDFPageProxy {
    getTextContent(): Promise<PDFTextContent>;
}

interface PDFDocumentProxy {
    getPage(pageNumber: number): Promise<PDFPageProxy>;
    numPages: number;
}

interface PDFDocumentLoadingTask {
    promise: Promise<PDFDocumentProxy>;
}

declare const pdfjsLib: {
    GlobalWorkerOptions: {
        workerSrc: string;
    };
    getDocument(source: { data: ArrayBuffer }): PDFDocumentLoadingTask;
};

declare const mammoth: {
    extractRawText(options: { arrayBuffer: ArrayBuffer }): Promise<{ value: string }>;
};


// --- Library Configuration ---

// Configure PDF.js worker
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.3.136/pdf.worker.min.mjs`;
}


// --- File Parsing Functions ---

async function parsePdf(fileData: ArrayBuffer): Promise<string> {
  const loadingTask = pdfjsLib.getDocument({ data: fileData });
  const pdf: PDFDocumentProxy = await loadingTask.promise;
  let text = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page: PDFPageProxy = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    text += textContent.items.map((item) => item.str).join(' ');
  }
  return text;
}

async function parseDocx(fileData: ArrayBuffer): Promise<string> {
  const result = await mammoth.extractRawText({ arrayBuffer: fileData });
  return result.value;
}

async function parseTxt(fileData: ArrayBuffer): Promise<string> {
  return new TextDecoder().decode(fileData);
}

// --- Provision Extraction ---

function extractProvisions(text: string): Omit<Provision, 'summary'>[] {
    const provisions: Omit<Provision, 'summary'>[] = [];
    const keywordRegex = new RegExp(`\\b(${INSURANCE_KEYWORDS.join('|')})\\b`, 'i');
    
    // Split text into sentences. This is a simplified approach.
    const sentences = text.match(/[^.!?]+[.!?]*/g) || [];

    sentences.forEach((sentence, index) => {
        if (keywordRegex.test(sentence)) {
            // Capture the sentence and potentially the surrounding ones for context.
            const contextWindow = [
                sentences[index - 1],
                sentence,
                sentences[index + 1]
            ].filter(Boolean).join(' ');

            // Avoid adding duplicate or very similar provisions
            const isSimilarToExisting = provisions.some(p => p.text.includes(sentence));
            if (!isSimilarToExisting) {
                provisions.push({
                    id: `prov-${Date.now()}-${provisions.length}`,
                    text: contextWindow.trim().replace(/\s+/g, ' '),
                });
            }
        }
    });

    return provisions;
}

// --- Main Processing Function ---

export async function processZipFile(
  zipFile: File,
  contractType: ContractType,
  updateStatus: (message: string) => void
): Promise<Contract[]> {
  updateStatus('Unzipping files...');
  const zip = await JSZip.loadAsync(zipFile);
  const contracts: Contract[] = [];
  const files: JSZipObject[] = Object.values(zip.files).filter(file => !file.dir && (file.name.endsWith('.pdf') || file.name.endsWith('.docx') || file.name.endsWith('.txt')));

  if (files.length === 0) {
      throw new Error('No valid contract files (.pdf, .docx, .txt) found in the zip archive.');
  }

  let filesProcessed = 0;
  for (const file of files) {
    updateStatus(`Parsing contract: ${file.name} (${++filesProcessed}/${files.length})`);
    try {
      const contentBuffer = await file.async('arraybuffer');
      let textContent = '';

      if (file.name.endsWith('.pdf')) {
        textContent = await parsePdf(contentBuffer);
      } else if (file.name.endsWith('.docx')) {
        textContent = await parseDocx(contentBuffer);
      } else if (file.name.endsWith('.txt')) {
        textContent = await parseTxt(contentBuffer);
      }
      
      const rawProvisions = extractProvisions(textContent);

      if (rawProvisions.length > 0) {
          contracts.push({
            id: `contract-${Date.now()}-${contracts.length}`,
            name: file.name,
            type: contractType,
            content: textContent,
            provisions: rawProvisions.map(p => ({...p, summary: ''})) // placeholder
          });
      }
    } catch (e) {
        console.error(`Failed to process file ${file.name}:`, e);
        // Optionally skip failed files or throw an error
    }
  }
  
  const allProvisionsToSummarize = contracts.flatMap(c => c.provisions);
  if (allProvisionsToSummarize.length > 0) {
      updateStatus(`Found ${allProvisionsToSummarize.length} potential provisions. Analyzing with AI...`);
      const summaries = await summarizeProvisions(allProvisionsToSummarize);
      
      let summaryIndex = 0;
      contracts.forEach(contract => {
          contract.provisions.forEach(provision => {
              if (summaryIndex < summaries.length) {
                  provision.summary = summaries[summaryIndex++];
              }
          });
      });
  }
  
  updateStatus('Analysis complete.');
  return contracts;
}
