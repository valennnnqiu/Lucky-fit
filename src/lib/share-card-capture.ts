/**
 * iOS WebKit + html-to-image often drops <img> pixels inside SVG foreignObject.
 * Temporarily replace marked images with <canvas> (bitmap); html-to-image copies
 * canvas via toDataURL(). Large ticket art stays <img> (no data-share-inline).
 */
export async function prepareImagesForHtmlToImageCapture(
  root: HTMLElement,
): Promise<() => void> {
  const imgs = [...root.querySelectorAll("img[data-share-inline]")] as HTMLImageElement[];

  const replacements: {
    parent: HTMLElement;
    canvas: HTMLCanvasElement;
    img: HTMLImageElement;
    srcAttr: string;
  }[] = [];

  const fetchInit: RequestInit = { credentials: "same-origin", cache: "force-cache" };

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
      const rect = img.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        canvas.style.width = `${rect.width}px`;
        canvas.style.height = `${rect.height}px`;
      }

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
