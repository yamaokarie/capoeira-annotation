// Neither the IFrame API nor oEmbed reports a YouTube video's real aspect
// ratio (oEmbed always answers 16:9). Its hqdefault thumbnail does show it:
// a vertical video is drawn as a 9:16 frame centered on a dimmed, blurred
// copy of itself, which leaves two sharp vertical edges where a horizontal
// video has none. Compare the brightness jump across those two columns to
// the frame's usual column-to-column change. Measured on real videos:
// vertical scored ≥3.3, horizontal ≤1.0.
const EDGE_RATIO_THRESHOLD = 2;

const cache = new Map<string, Promise<boolean>>();

export function isVerticalVideo(youtubeId: string): Promise<boolean> {
  let result = cache.get(youtubeId);
  if (!result) {
    result = measure(youtubeId).catch(() => false);
    cache.set(youtubeId, result);
  }
  return result;
}

function measure(youtubeId: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    // i.ytimg.com serves Access-Control-Allow-Origin: *, so the canvas
    // stays readable.
    img.crossOrigin = "anonymous";
    img.onerror = reject;
    img.onload = () => {
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      const ctx = document.createElement("canvas").getContext("2d");
      if (!ctx || w < 16 || h < 16) return resolve(false);
      ctx.canvas.width = w;
      ctx.canvas.height = h;
      ctx.drawImage(img, 0, 0);
      const { data } = ctx.getImageData(0, 0, w, h);

      const lum = (x: number, y: number) => {
        const i = (y * w + x) * 4;
        return 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      };
      // Middle rows only — skips the black bands a 16:9 video gets in this
      // 4:3 thumbnail.
      const y0 = Math.round(h * 0.15);
      const y1 = Math.round(h * 0.85);
      const gradient = (x: number) => {
        let sum = 0;
        for (let y = y0; y < y1; y++) sum += Math.abs(lum(x + 2, y) - lum(x - 2, y));
        return sum / (y1 - y0);
      };

      const frameWidth = (h * 9) / 16;
      const left = Math.round((w - frameWidth) / 2);
      const right = Math.round((w + frameWidth) / 2);
      const edge = (gradient(left) + gradient(right)) / 2;
      const baseline =
        [0.12, 0.2, 0.38, 0.46, 0.54, 0.62, 0.8, 0.88]
          .map((f) => gradient(Math.round(w * f)))
          .reduce((a, b) => a + b) / 8;
      resolve(edge / Math.max(baseline, 1) > EDGE_RATIO_THRESHOLD);
    };
    img.src = `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`;
  });
}
