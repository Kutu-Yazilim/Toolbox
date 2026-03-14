import { jsPDF } from "jspdf"
import type {
  PageOptions,
  Orientation,
  PdfImageData,
} from "@/types/pdf"
import { MARGINS } from "@/utils/pdfUtils"

function resolveOrientation(
  orientation: Orientation,
  imgWidth: number,
  imgHeight: number
): "portrait" | "landscape" {
  if (orientation === "auto") {
    return imgWidth > imgHeight ? "landscape" : "portrait"
  }
  return orientation
}

export async function imagesToPdf(
  images: PdfImageData[],
  options: PageOptions
): Promise<Uint8Array> {
  if (images.length === 0) throw new Error("No images provided")

  const firstImg = images[0]
  const orient = resolveOrientation(options.orientation, firstImg.width, firstImg.height)
  const margin = MARGINS[options.margin]

  let doc: jsPDF

  if (options.pageSize === "fit") {
    // First page fits to first image
    const w = firstImg.width * 0.75 // px to pt
    const h = firstImg.height * 0.75
    doc = new jsPDF({
      orientation: orient,
      unit: "pt",
      format: [w + margin * 2, h + margin * 2],
    })
  } else {
    doc = new jsPDF({
      orientation: orient,
      unit: "pt",
      format: options.pageSize,
    })
  }

  for (let i = 0; i < images.length; i++) {
    const img = images[i]

    if (i > 0) {
      if (options.pageSize === "fit") {
        const w = img.width * 0.75
        const h = img.height * 0.75
        const imgOrient = resolveOrientation(options.orientation, img.width, img.height)
        doc.addPage([w + margin * 2, h + margin * 2], imgOrient)
      } else {
        const imgOrient = resolveOrientation(options.orientation, img.width, img.height)
        doc.addPage(options.pageSize, imgOrient)
      }
    }

    const pageW = doc.internal.pageSize.getWidth()
    const pageH = doc.internal.pageSize.getHeight()
    const availW = pageW - margin * 2
    const availH = pageH - margin * 2

    // Scale image to fit available area while maintaining aspect ratio
    const imgAspect = img.width / img.height
    const areaAspect = availW / availH

    let drawW: number
    let drawH: number
    if (imgAspect > areaAspect) {
      drawW = availW
      drawH = availW / imgAspect
    } else {
      drawH = availH
      drawW = availH * imgAspect
    }

    // Center the image
    const x = margin + (availW - drawW) / 2
    const y = margin + (availH - drawH) / 2

    const format = img.name.toLowerCase().endsWith(".png") ? "PNG" : "JPEG"
    doc.addImage(img.dataUrl, format, x, y, drawW, drawH)
  }

  const arrayBuffer = doc.output("arraybuffer")
  return new Uint8Array(arrayBuffer)
}
