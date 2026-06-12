import { toPng } from 'html-to-image'

/** Render an element to a 1080px-wide PNG (legible after WhatsApp compression)
 *  and hand it to the native share sheet on mobile, else download it. */
export async function exportRosterImage(el: HTMLElement, fileName: string) {
  const dataUrl = await toPng(el, {
    backgroundColor: '#ffffff',
    pixelRatio: 2,
    width: 1080,
    style: { width: '1080px' },
  })

  const blob = await (await fetch(dataUrl)).blob()
  const file = new File([blob], fileName, { type: 'image/png' })
  if (typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: fileName })
      return
    } catch {
      // user cancelled the sheet — fall through to download
    }
  }
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = fileName
  a.click()
}
