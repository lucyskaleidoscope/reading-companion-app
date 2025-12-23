import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import { Card, Book, Chapter, PostReadResult } from './supabase';

// ===========================================
// Anki Export (Tab-separated text file)
// ===========================================

interface AnkiExportOptions {
  cards: Card[];
  bookTitle: string;
  includeMetadata?: boolean;
}

export async function exportToAnki({ cards, bookTitle, includeMetadata = true }: AnkiExportOptions): Promise<void> {
  // Anki imports tab-separated values: front\tback\ttags
  const lines = cards.map(card => {
    const front = escapeForAnki(card.front);
    const back = escapeForAnki(card.back);
    const tags = [
      `book::${escapeTag(bookTitle)}`,
      `type::${card.card_type}`,
      `difficulty::${card.difficulty}`,
      ...(card.tags || []).map(t => escapeTag(t))
    ].join(' ');
    
    return `${front}\t${back}\t${tags}`;
  });

  // Add header comment for Anki
  const header = includeMetadata 
    ? `# Reading Companion Export - ${bookTitle}\n# ${cards.length} cards\n# Import as: Basic (and reversed card)\n\n`
    : '';
  
  const content = header + lines.join('\n');
  const filename = `${sanitizeFilename(bookTitle)}_anki_${Date.now()}.txt`;
  const filepath = `${FileSystem.documentDirectory}${filename}`;

  await FileSystem.writeAsStringAsync(filepath, content, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(filepath, {
      mimeType: 'text/plain',
      dialogTitle: 'Export Anki Deck',
      UTI: 'public.plain-text',
    });
  }
}

function escapeForAnki(text: string): string {
  // Escape HTML and special characters for Anki
  return text
    .replace(/\t/g, '    ')  // Replace tabs with spaces
    .replace(/\n/g, '<br>')   // Convert newlines to HTML breaks
    .replace(/"/g, '""');     // Escape quotes
}

function escapeTag(tag: string): string {
  return tag.replace(/\s+/g, '_').replace(/[^\w:]/g, '');
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-z0-9]/gi, '_').substring(0, 50);
}

// ===========================================
// Printable PDF Export
// ===========================================

interface PrintableExportOptions {
  cards: Card[];
  bookTitle: string;
  chapterTitle: string;
  postReadResult?: PostReadResult;
  includeAnswers?: boolean;
}

export async function exportToPrintable({
  cards,
  bookTitle,
  chapterTitle,
  postReadResult,
  includeAnswers = true,
}: PrintableExportOptions): Promise<void> {
  const html = generatePrintableHTML({
    cards,
    bookTitle,
    chapterTitle,
    postReadResult,
    includeAnswers,
  });

  const { uri } = await Print.printToFileAsync({ html });
  
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: 'Export Study Guide',
      UTI: 'com.adobe.pdf',
    });
  }
}

function generatePrintableHTML({
  cards,
  bookTitle,
  chapterTitle,
  postReadResult,
  includeAnswers,
}: PrintableExportOptions): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${bookTitle} - ${chapterTitle}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Georgia', serif;
      font-size: 11pt;
      line-height: 1.5;
      color: #1a1a1a;
      padding: 0.75in;
    }
    h1 {
      font-size: 18pt;
      margin-bottom: 4pt;
      border-bottom: 2px solid #1a1a1a;
      padding-bottom: 8pt;
    }
    h2 {
      font-size: 14pt;
      margin-top: 20pt;
      margin-bottom: 8pt;
      color: #333;
    }
    h3 {
      font-size: 12pt;
      margin-top: 12pt;
      margin-bottom: 4pt;
    }
    .subtitle {
      font-size: 12pt;
      color: #666;
      margin-bottom: 16pt;
    }
    .summary {
      background: #f5f5f5;
      padding: 12pt;
      margin-bottom: 16pt;
      border-left: 3pt solid #333;
    }
    .concept {
      margin-bottom: 12pt;
      padding-bottom: 8pt;
      border-bottom: 1px solid #eee;
    }
    .concept-name {
      font-weight: bold;
      color: #1a1a1a;
    }
    .concept-def {
      margin-top: 4pt;
    }
    .concept-sig {
      font-style: italic;
      color: #666;
      margin-top: 4pt;
    }
    .card {
      margin-bottom: 16pt;
      page-break-inside: avoid;
    }
    .card-num {
      font-size: 9pt;
      color: #888;
      margin-bottom: 2pt;
    }
    .card-front {
      font-weight: bold;
      margin-bottom: 4pt;
    }
    .card-back {
      color: #444;
      padding-left: 12pt;
      border-left: 2pt solid #ddd;
    }
    .card-meta {
      font-size: 9pt;
      color: #888;
      margin-top: 4pt;
    }
    .page-break {
      page-break-before: always;
    }
    .cards-only .card-back {
      color: #fff;
      border-left-color: #fff;
    }
    .answer-key .card-front {
      font-weight: normal;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 12pt 0;
    }
    th, td {
      border: 1px solid #ddd;
      padding: 6pt 8pt;
      text-align: left;
      font-size: 10pt;
    }
    th {
      background: #f5f5f5;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <h1>${escapeHtml(bookTitle)}</h1>
  <div class="subtitle">${escapeHtml(chapterTitle)}</div>

  ${postReadResult ? `
    <div class="summary">
      <strong>Summary:</strong> ${escapeHtml(postReadResult.chapter_summary || '')}
    </div>

    ${postReadResult.core_concepts?.length ? `
      <h2>Core Concepts</h2>
      ${postReadResult.core_concepts.map(c => `
        <div class="concept">
          <div class="concept-name">${escapeHtml(c.name)}</div>
          <div class="concept-def">${escapeHtml(c.definition)}</div>
          <div class="concept-sig">Why it matters: ${escapeHtml(c.significance)}</div>
        </div>
      `).join('')}
    ` : ''}

    ${postReadResult.key_claims?.length ? `
      <h2>Key Claims</h2>
      <table>
        <tr>
          <th>Claim</th>
          <th>Evidence</th>
          <th>Implications</th>
        </tr>
        ${postReadResult.key_claims.map(c => `
          <tr>
            <td>${escapeHtml(c.claim)}</td>
            <td>${escapeHtml(c.evidence)}</td>
            <td>${escapeHtml(c.implications)}</td>
          </tr>
        `).join('')}
      </table>
    ` : ''}
  ` : ''}

  <h2 class="page-break">Review Cards (${cards.length})</h2>
  
  ${includeAnswers ? `
    ${cards.map((card, i) => `
      <div class="card">
        <div class="card-num">Card ${i + 1} • ${card.card_type} • ${card.difficulty}</div>
        <div class="card-front">Q: ${escapeHtml(card.front)}</div>
        <div class="card-back">A: ${escapeHtml(card.back)}</div>
      </div>
    `).join('')}
  ` : `
    <p><em>Questions only - answers on next page</em></p>
    ${cards.map((card, i) => `
      <div class="card">
        <div class="card-num">Card ${i + 1} • ${card.card_type} • ${card.difficulty}</div>
        <div class="card-front">Q: ${escapeHtml(card.front)}</div>
      </div>
    `).join('')}
    
    <h2 class="page-break">Answer Key</h2>
    ${cards.map((card, i) => `
      <div class="card answer-key">
        <div class="card-num">Card ${i + 1}</div>
        <div class="card-front">${escapeHtml(card.front)}</div>
        <div class="card-back">A: ${escapeHtml(card.back)}</div>
      </div>
    `).join('')}
  `}
  
  <div style="margin-top: 24pt; font-size: 9pt; color: #888; text-align: center;">
    Generated by Reading Companion • ${new Date().toLocaleDateString()}
  </div>
</body>
</html>
  `;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ===========================================
// Quick Export Functions
// ===========================================

export async function shareCardsAsText(cards: Card[], title: string): Promise<void> {
  const text = cards.map((card, i) => 
    `${i + 1}. Q: ${card.front}\n   A: ${card.back}\n`
  ).join('\n');
  
  const content = `${title}\n${'='.repeat(title.length)}\n\n${text}`;
  const filename = `${sanitizeFilename(title)}_cards.txt`;
  const filepath = `${FileSystem.documentDirectory}${filename}`;
  
  await FileSystem.writeAsStringAsync(filepath, content);
  
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(filepath, {
      mimeType: 'text/plain',
      dialogTitle: 'Share Cards',
    });
  }
}
