/**
 * iOS Safari often renders empty <img> tiles in html-to-image output when `src`
 * stays as a same-page URL. Inlining bytes as data URLs before `toPng` fixes it.
 * Call the returned cleanup in `finally` to restore original attributes.
 */
export async function prepareImagesForHtmlToImageCapture(
  root: HTMLElement,
): Promise<() => void> {
  const imgs = [...root.querySelectorAll("img")] as HTMLImageElement[];
  const snapshots = imgs.map((img) => ({
    img,
    srcAttr: img.getAttribute("src") ?? "",
  }));

  await Promise.all(
    imgs.map(async (img) => {
      const attr = img.getAttribute("src") ?? "";
      if (!attr || attr.startsWith("data:")) {
        await img.decode?.().catch(() => {});
        return;
      }
      if (attr.startsWith("blob:")) {
        await img.decode?.().catch(() => {});
        return;
      }

      await img.decode?.().catch(() => {});

      let fetchUrl = attr;
      try {
        if (!/^https?:\/\//i.test(attr)) {
          fetchUrl = new URL(attr, window.location.href).href;
        }
      } catch {
        return;
      }

      try {
        const res = await fetch(fetchUrl);
        if (!res.ok) return;
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
    }),
  );

  return () => {
    for (const { img, srcAttr } of snapshots) {
      if (srcAttr !== "") img.setAttribute("src", srcAttr);
      else img.removeAttribute("src");
    }
  };
}
