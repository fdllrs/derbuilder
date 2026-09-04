/** Export the diagram SVG as a downloadable .svg file */
export function exportSVG(svgEl: SVGSVGElement, filename = 'diagrama.svg'): void {
  // Clone to avoid mutating the live SVG
  const clone = svgEl.cloneNode(true) as SVGSVGElement

  // Embed font references as a <style> block
  const style = document.createElementNS('http://www.w3.org/2000/svg', 'style')
  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=STIX+Two+Text&family=Inter:wght@400;500&display=swap');
    text { font-family: 'STIX Two Text', Georgia, serif; }
  `
  clone.prepend(style)

  // Ensure viewBox covers the full diagram
  const bbox = svgEl.getBBox()
  const padding = 20
  clone.setAttribute(
    'viewBox',
    `${bbox.x - padding} ${bbox.y - padding} ${bbox.width + padding * 2} ${bbox.height + padding * 2}`,
  )
  clone.removeAttribute('style')

  const serializer = new XMLSerializer()
  const svgString = '<?xml version="1.0" encoding="UTF-8"?>\n' + serializer.serializeToString(clone)

  const blob = new Blob([svgString], { type: 'image/svg+xml' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

/** Export the diagram SVG as a PNG by rendering it onto a canvas */
export async function exportPNG(
  svgEl: SVGSVGElement,
  filename = 'diagrama.png',
  scale = 2,
): Promise<void> {
  const bbox = svgEl.getBBox()
  const padding = 20
  const w = (bbox.width + padding * 2) * scale
  const h = (bbox.height + padding * 2) * scale

  const serializer = new XMLSerializer()
  const clone = svgEl.cloneNode(true) as SVGSVGElement
  clone.setAttribute(
    'viewBox',
    `${bbox.x - padding} ${bbox.y - padding} ${bbox.width + padding * 2} ${bbox.height + padding * 2}`,
  )
  clone.setAttribute('width', String(w))
  clone.setAttribute('height', String(h))

  const svgString = serializer.serializeToString(clone)
  const blob = new Blob([svgString], { type: 'image/svg+xml' })
  const url = URL.createObjectURL(blob)

  await new Promise<void>((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')!
      ctx.fillStyle = '#f8f9fa'
      ctx.fillRect(0, 0, w, h)
      ctx.drawImage(img, 0, 0)
      canvas.toBlob((pngBlob) => {
        if (!pngBlob) { reject(new Error('PNG export failed')); return }
        const pngUrl = URL.createObjectURL(pngBlob)
        const a = document.createElement('a')
        a.href = pngUrl
        a.download = filename
        a.click()
        URL.revokeObjectURL(pngUrl)
        resolve()
      }, 'image/png')
      URL.revokeObjectURL(url)
    }
    img.onerror = reject
    img.src = url
  })
}
