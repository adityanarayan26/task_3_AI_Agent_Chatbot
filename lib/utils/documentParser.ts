import AdmZip from 'adm-zip';
import * as XLSX from 'xlsx';

/**
 * Decodes standard XML/HTML character entities.
 */
function decodeXmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

/**
 * Parses and extracts text from docx file base64 data.
 */
export function parseDocx(base64Data: string): string {
  try {
    const buffer = Buffer.from(base64Data, 'base64');
    const zip = new AdmZip(buffer);
    const documentXmlEntry = zip.getEntry('word/document.xml');
    
    if (!documentXmlEntry) {
      return '[Error: Invalid Word document structure - word/document.xml not found]';
    }

    const xml = documentXmlEntry.getData().toString('utf8');
    const matches = xml.match(/<w:t[^>]*>(.*?)<\/w:t>/g);
    
    if (!matches) {
      return '';
    }

    const textContent = matches
      .map(val => {
        // Strip tag
        const innerText = val.replace(/<w:t[^>]*>|<\/w:t>/g, '');
        return decodeXmlEntities(innerText);
      })
      .join('');

    return textContent;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return `[Failed to parse Word document: ${errorMessage}]`;
  }
}

/**
 * Parses and extracts text slide-by-slide from pptx file base64 data.
 */
export function parsePptx(base64Data: string): string {
  try {
    const buffer = Buffer.from(base64Data, 'base64');
    const zip = new AdmZip(buffer);
    
    const slideEntries = zip.getEntries().filter(
      entry => entry.entryName.startsWith('ppt/slides/slide') && entry.entryName.endsWith('.xml')
    );

    if (slideEntries.length === 0) {
      return '[Error: Invalid PowerPoint document structure - no slides found]';
    }

    // Sort slides numerically
    slideEntries.sort((a, b) => {
      const aNum = parseInt(a.entryName.match(/\d+/)?. [0] || '0', 10);
      const bNum = parseInt(b.entryName.match(/\d+/)?. [0] || '0', 10);
      return aNum - bNum;
    });

    let extractedText = '';
    slideEntries.forEach((slide, idx) => {
      const xml = slide.getData().toString('utf8');
      const matches = xml.match(/<a:t[^>]*>(.*?)<\/a:t>/g);
      
      const slideText = matches
        ? matches
            .map(val => {
              const innerText = val.replace(/<a:t[^>]*>|<\/a:t>/g, '');
              return decodeXmlEntities(innerText);
            })
            .join(' ')
        : '';
        
      extractedText += `--- Slide ${idx + 1} ---\n${slideText}\n\n`;
    });

    return extractedText.trim();
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return `[Failed to parse PowerPoint presentation: ${errorMessage}]`;
  }
}

/**
 * Parses and formats xlsx worksheets to CSV structures from base64 data.
 */
export function parseXlsx(base64Data: string): string {
  try {
    const buffer = Buffer.from(base64Data, 'base64');
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    
    let extractedText = '';
    workbook.SheetNames.forEach(sheetName => {
      const sheet = workbook.Sheets[sheetName];
      const csv = XLSX.utils.sheet_to_csv(sheet);
      extractedText += `--- Sheet: ${sheetName} ---\n${csv}\n\n`;
    });

    return extractedText.trim();
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return `[Failed to parse Excel spreadsheet: ${errorMessage}]`;
  }
}

/**
 * Main routing document parser that returns plain-text presentation context.
 */
export function extractDocumentText(filename: string, base64Data: string, mimeType: string): string {
  const extension = filename.split('.').pop()?.toLowerCase();
  
  if (extension === 'docx' || mimeType.includes('officedocument.wordprocessingml')) {
    return parseDocx(base64Data);
  }
  
  if (extension === 'pptx' || mimeType.includes('officedocument.presentationml')) {
    return parsePptx(base64Data);
  }
  
  if (extension === 'xlsx' || mimeType.includes('officedocument.spreadsheetml') || extension === 'xls') {
    return parseXlsx(base64Data);
  }

  // Fallback decodes standard base64 text files directly
  try {
    const text = Buffer.from(base64Data, 'base64').toString('utf8');
    // Basic heuristics checking if parsed data is printable text
    const isPrintable = /^[\s\x20-\x7E\p{L}\p{N}\p{P}]*$/u.test(text.slice(0, 1000));
    if (isPrintable) {
      return text;
    }
  } catch {
    // Ignore and proceed to fallback
  }

  return `[Attached Document: ${filename} (Binary format, ${mimeType})]`;
}
