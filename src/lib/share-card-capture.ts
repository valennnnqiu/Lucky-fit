/**
 * iOS Safari often drops <img> tiles in html-to-image when `src` is a normal URL.
 * Inlining fixes that — but inlining *every* image (especially the full-size ticket
 * PNG, multi‑MB as data URL) blows up the intermediate SVG and WebKit then loses the
 * small thumbs. Only mark compact assets with `data-share-inline` (garment thumbs, logo).
 */
export async function prepareImagesForHtmlToImageCapture(
  root: HTMLElement,
): Promise<() => void> {
  const imgs = [...root.querySelectorAll("img[data-share-inline]")] as HTMLImageElement[];
  const snapshots = imgs.map((img) => ({
    img,
    srcAttr: img.getAttribute("src") ?? "",
  }));

  const fetchInit: RequestInit = { credentials: "same-origin" };

  for (const img of imgs) {
    const attr = img.currentSrc || img.getAttribute("src") || "";
    if (!attr || attr.startsWith("data:")) {
      await img.decode?.().catch(() => {});
      continue;
    }
    if (attr.startsWith("blob:")) {
      await img.decode?.().catch(() => {});
      continue;
    }

    await img.decode?.().catch(() => {});

    let fetchUrl = attr;
    try {
      if (!/^https?:\/\//i.test(attr)) {
        fetchUrl = new URL(attr, window.location.href).href;
      }
    } catch {
      continue;
    }

    try {
      const res = await fetch(fetchUrl, fetchInit);
      if (!res.ok) continue;
      const blob = await res.blob();
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const fr = new FileReader();
        fr.onload = () => resolve(fr.result as string);
        fr.onerror = () => reject(fr.error);
        fr.readAsDataURL(blob);
      });
      img.src = dataUrl;
      await img.decode?.().catch(() => {});
    } catch {
      /* keep remote src */
    }
  }

  return () => {
    for (const { img, srcAttr } of snapshots) {
      if (srcAttr !== "") img.setAttribute("src", srcAttr);
      else img.removeAttribute("src");
    }
  };
}
