import { NextResponse } from "next/server";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";

// Point pdfjs-dist at the worker binary bundled in the package.
GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).href;

async function extractTextFromUrl(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; NokoBot/1.0)" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();
    // Strip script/style tags and collapse whitespace for readable text.
    const text = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ")
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    return text.slice(0, 12000);
  } catch (e) {
    throw new Error(`Gagal ekstrak URL: ${String(e)}`);
  }
}

async function extractTextFromPdf(base64: string): Promise<string> {
  try {
    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    const pdf = await getDocument({ data: bytes }).promise;
    const parts: string[] = [];
type PdfTextItem = { str: string; [key: string]: unknown };

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items
        .map((item) => (item as PdfTextItem).str)
        .join(" ");
      parts.push(pageText);
    }
    return parts.join("\n").slice(0, 12000);
  } catch (e) {
    throw new Error(`Gagal ekstrak PDF: ${String(e)}`);
  }
}

export async function POST(req: Request): Promise<NextResponse> {
  try {
    const body = await req.json();
    const url = String(body?.url ?? "").trim();
    const fileBase64 = String(body?.fileBase64 ?? "").trim();

    if (url) {
      const text = await extractTextFromUrl(url);
      return NextResponse.json({ ok: true, text, source: url });
    }

    if (fileBase64) {
      const text = await extractTextFromPdf(fileBase64);
      return NextResponse.json({ ok: true, text, source: "pdf" });
    }

    return NextResponse.json(
      { ok: false, error: "URL atau file PDF diperlukan" },
      { status: 400 }
    );
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}