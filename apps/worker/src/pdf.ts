import { chromium, type Browser } from 'playwright';
import { PDFDocument } from 'pdf-lib';

let browser: Browser | null = null;

async function getBrowser() {
  if (!browser || !browser.isConnected()) browser = await chromium.launch({ args: ['--no-sandbox'] });
  return browser;
}

/** Headless Chrome prints the HTML to A4 (wkhtmltopdf had a DPI scaling bug). 30 second timeout. */
export async function htmlToPdf(html: string): Promise<{ pdf: Buffer; pageCount: number }> {
  const b = await getBrowser();
  const page = await b.newPage();
  try {
    await page.setContent(html, { waitUntil: 'networkidle', timeout: 30_000 });
    await page.evaluate(() => document.fonts.ready);
    const pdf = await page.pdf({ format: 'A4', printBackground: true, preferCSSPageSize: true });
    const doc = await PDFDocument.load(pdf);
    return { pdf: Buffer.from(pdf), pageCount: doc.getPageCount() };
  } finally {
    await page.close();
  }
}

export async function closeBrowser() {
  await browser?.close();
}
