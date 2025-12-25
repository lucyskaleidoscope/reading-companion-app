import { Card, Book, Chapter, PostReadResult } from './supabase';

// Web-compatible export functions

function escapeForAnki(text: string): string {
  return text.replace(/\t/g, ' ').replace(/\n/g, '<br>');
}

function escapeTag(tag: string): string {
  return tag.replace(/\s+/g, '_');
}

interface AnkiExportOptions {
  cards: Card[];
  bookTitle: string;
  includeMetadata?: boolean;
}

export async function exportToAnki({ cards, bookTitle, includeMetadata = true }: AnkiExportOptions): Promise<void> {
  const lines = cards.map(card => {
    const front = escapeForAnki(card.front);
    const back = escapeForAnki(card.back);
    const tags = [
      `book::${escapeTag(bookTitle)}`,
      `type::${card.card_type}`,
      `difficulty::${card.difficulty}`,
    ].join(' ');

    return `${front}\t${back}\t${tags}`;
  });

  const content = lines.join('\n');
  downloadFile(content, `${escapeTag(bookTitle)}_anki.txt`, 'text/plain');
}

interface PrintableExportOptions {
  cards: Card[];
  bookTitle: string;
  chapterTitle?: string;
}

export async function exportToPrintable({ cards, bookTitle, chapterTitle }: PrintableExportOptions): Promise<void> {
  const html = `
    <html>
      <head>
        <style>
          body { font-family: system-ui; padding: 20px; }
          h1 { font-size: 24px; }
          h2 { font-size: 18px; color: #666; }
          .card { border: 1px solid #ddd; padding: 16px; margin: 12px 0; border-radius: 8px; }
          .front { font-weight: bold; margin-bottom: 8px; }
          .back { color: #444; }
          .meta { font-size: 12px; color: #888; margin-top: 8px; }
        </style>
      </head>
      <body>
        <h1>${bookTitle}</h1>
        ${chapterTitle ? `<h2>${chapterTitle}</h2>` : ''}
        ${cards.map(card => `
          <div class="card">
            <div class="front">${card.front}</div>
            <div class="back">${card.back}</div>
            <div class="meta">${card.card_type} | ${card.difficulty}</div>
          </div>
        `).join('')}
      </body>
    </html>
  `;

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
}

export async function shareCardsAsText(cards: Card[], title: string): Promise<void> {
  const text = cards.map(card => 
    `Q: ${card.front}\nA: ${card.back}\n`
  ).join('\n');

  const content = `${title}\n${'='.repeat(title.length)}\n\n${text}`;
  
  if (navigator.share) {
    await navigator.share({ title, text: content });
  } else {
    downloadFile(content, `${escapeTag(title)}_cards.txt`, 'text/plain');
  }
}

function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
