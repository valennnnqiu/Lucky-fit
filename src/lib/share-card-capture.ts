type Replacement = {
  parent: HTMLElement;
  canvas: HTMLCanvasElement;
  img: HTMLImageElement;
  srcAttr: string;
};

/**
 * Full-bleed ticket art: rasterize for export (same reason as thumbs — <img> in foreignObject).
 */
async function rasterizeTicketForCapture(
  img: HTMLImageElement,
  pixelRatio: number,
  replacements: Replacement[],
): Promise<void> {
  const srcAttr = img.getAttribute("src") ?? "";
  await img.decode?.().catch(() => {});
  if (img.naturalWidth < 1 || img.naturalHeight < 1) return;

  let displayW = img.offsetWidth || img.clientWidth;
  let displayH = img.offsetHeight || img.clientHeight;
  const rect = img.getBoundingClientRect();
  if (rect.width >= 1 && rect.height >= 1) {
    displayW = rect.width;
    displayH = rect.height;
  }
  if (displayW < 1 || displayH < 1) {
    const par = img.parentElement;
    displayW = par?.offsetWidth || par?.clientWidth || displayW;
    if (displayW >= 1 && img.naturalWidth >= 1) {
      displayH = Math.max(1, Math.round((displayW * img.naturalHeight) / img.naturalWidth));
    }
  }
  if (displayW < 1 || displayH < 1) {
    displayW = img.naturalWidth;
    displayH = img.naturalHeight;
  }

  let w = Math.max(1, Math.round(displayW * pixelRatio));
  let h = Math.max(1, Math.round(displayH * pixelRatio));
  const MAX = 2400;
  if (w > MAX) {
    h = Math.max(1, Math.round((h * MAX) / w));
    w = MAX;
  }
  if (h > MAX) {
    w = Math.max(1, Math.round((w * MAX) / h));
    h = MAX;
  }

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.drawImage(img, 0, 0, w, h);
  canvas.className = img.className;
  canvas.style.width = `${displayW}px`;
  canvas.style.height = `${displayH}px`;

  const p = img.parentElement;
  if (!p) return;
  p.replaceChild(canvas, img);
  replacements.push({ parent: p, canvas, img, srcAttr });
}

/**
 * iOS WebKit + html-to-image drop many <img> pixels inside SVG foreignObject.
 * Swap marked nodes to <canvas> (see patched cloneCanvasElement). Ticket + thumbs + logo.
 */
export async function prepareImagesForHtmlToImageCapture(
  root: HTMLElement,
  pixelRatio: number,
): Promise<() => void> {
  const replacements: Replacement[] = [];
  const fetchInit: RequestInit = { credentials: "same-origin", cache: "force-cache" };

  const ticket = root.querySelector("img[data-share-ticket]");
  if (ticket instanceof HTMLImageElement) {
    await rasterizeTicketForCapture(ticket, pixelRatio, replacements);
  }

  const imgs = [...root.querySelectorAll("img[data-share-inline]")] as HTMLImageElement[];

  for (const img of imgs) {
    const srcAttr = img.getAttribute("src") ?? "";
    let fetchUrl = img.currentSrc || srcAttr;
    if (!fetchUrl) continue;

    try {
      let width: number;
      let height: number;
      let toDraw: CanvasImageSource;
      let closeBitmap: ImageBitmap | undefined;

      if (fetchUrl.startsWith("data:")) {
        await img.decode?.().catch(() => {});
        if (img.naturalWidth < 1 || img.naturalHeight < 1) continue;
        width = img.naturalWidth;
        height = img.naturalHeight;
        toDraw = img;
      } else {
        if (fetchUrl.startsWith("blob:")) {
          await img.decode?.().catch(() => {});
          if (img.naturalWidth < 1 || img.naturalHeight < 1) continue;
          width = img.naturalWidth;
          height = img.naturalHeight;
          toDraw = img;
        } else {
          if (!/^https?:\/\//i.test(fetchUrl)) {
            fetchUrl = new URL(fetchUrl, window.location.href).href;
          }
          const res = await fetch(fetchUrl, fetchInit);
          if (!res.ok) continue;
          const blob = await res.blob();

          try {
            if (typeof createImageBitmap === "function") {
              const bmp = await createImageBitmap(blob);
              closeBitmap = bmp;
              width = bmp.width;
              height = bmp.height;
              toDraw = bmp;
            } else {
              throw new Error("no ImageBitmap");
            }
          } catch {
            const o = URL.createObjectURL(blob);
            try {
              const el = new Image();
              await new Promise<void>((resolve, reject) => {
                el.onload = () => resolve();
                el.onerror = () => reject(new Error("decode"));
                el.src = o;
              });
              width = el.naturalWidth;
              height = el.naturalHeight;
              toDraw = el;
            } finally {
              URL.revokeObjectURL(o);
            }
          }

          if (width < 1 || height < 1) {
            closeBitmap?.close();
            continue;
          }
        }
      }

      if (width < 1 || height < 1) continue;

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        closeBitmap?.close();
        continue;
      }
      ctx.drawImage(toDraw, 0, 0);
      closeBitmap?.close();

      canvas.className = img.className;
      let dw = img.offsetWidth || img.clientWidth || 60;
      let dh = img.offsetHeight || img.clientHeight || 60;
      const rect = img.getBoundingClientRect();
      if (rect.width >= 1 && rect.height >= 1) {
        dw = rect.width;
        dh = rect.height;
      }
      canvas.style.width = `${dw}px`;
      canvas.style.height = `${dh}px`;

      const p = img.parentElement;
      if (!p) continue;
      p.replaceChild(canvas, img);
      replacements.push({ parent: p, canvas, img, srcAttr });
    } catch {
      /* leave original <img> */
    }
  }

  return () => {
    for (const { parent, canvas, img, srcAttr } of replacements.reverse()) {
      parent.replaceChild(img, canvas);
      if (srcAttr !== "") img.setAttribute("src", srcAttr);
      else img.removeAttribute("src");
    }
  };
}
