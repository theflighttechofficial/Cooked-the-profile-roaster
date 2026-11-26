// Reads the text in a screenshot on the user's device (tesseract.js, WASM).
// Used when no server AI can read images. Assets are served from /ocr (see vite.config.ts).

export async function readScreenshotText(image: string, onProgress?: (pct: number) => void): Promise<string> {
  const { createWorker } = await import('tesseract.js');
  const worker = await createWorker('eng', 1, {
    workerPath: '/ocr/worker.min.js',
    corePath: '/ocr',
    langPath: '/ocr',
    gzip: true,
    logger: (m: { status: string; progress: number }) => {
      if (m.status === 'recognizing text') onProgress?.(Math.round(m.progress * 100));
    },
  });
  try {
    const { data } = await worker.recognize(image);
    return data.text.replace(/[ \t]+/g, ' ').replace(/\n{2,}/g, '\n').trim();
  } finally {
    await worker.terminate();
  }
}
