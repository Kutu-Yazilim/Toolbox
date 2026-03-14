import { PDFDocument, degrees, rgb, StandardFonts } from "pdf-lib"
import type { SplitConfig, WatermarkConfig } from "@/types/pdf"
import { parsePageRanges } from "@/utils/pdfUtils"

export async function mergePdfs(
  pdfBytesArray: ArrayBuffer[]
): Promise<Uint8Array> {
  const merged = await PDFDocument.create()

  for (const bytes of pdfBytesArray) {
    const doc = await PDFDocument.load(bytes)
    const pages = await merged.copyPages(doc, doc.getPageIndices())
    for (const page of pages) {
      merged.addPage(page)
    }
  }

  return merged.save()
}

export async function splitPdf(
  pdfBytes: ArrayBuffer,
  config: SplitConfig
): Promise<Uint8Array[]> {
  const source = await PDFDocument.load(pdfBytes)
  const totalPages = source.getPageCount()
  const results: Uint8Array[] = []

  let pageGroups: number[][]

  switch (config.mode) {
    case "range": {
      const indices = parsePageRanges(config.ranges, totalPages)
      pageGroups = [indices]
      break
    }
    case "every-n": {
      pageGroups = []
      for (let i = 0; i < totalPages; i += config.everyN) {
        const group: number[] = []
        for (let j = i; j < Math.min(i + config.everyN, totalPages); j++) {
          group.push(j)
        }
        pageGroups.push(group)
      }
      break
    }
    case "extract": {
      const indices = parsePageRanges(config.ranges, totalPages)
      pageGroups = indices.map((i) => [i])
      break
    }
  }

  for (const group of pageGroups) {
    const newDoc = await PDFDocument.create()
    const pages = await newDoc.copyPages(source, group)
    for (const page of pages) {
      newDoc.addPage(page)
    }
    results.push(await newDoc.save())
  }

  return results
}

export async function reorderPdf(
  pdfBytes: ArrayBuffer,
  newOrder: number[]
): Promise<Uint8Array> {
  const source = await PDFDocument.load(pdfBytes)
  const reordered = await PDFDocument.create()
  const pages = await reordered.copyPages(source, newOrder)
  for (const page of pages) {
    reordered.addPage(page)
  }
  return reordered.save()
}

export async function rotatePdfPage(
  pdfBytes: ArrayBuffer,
  pageIndex: number,
  angle: 0 | 90 | 180 | 270
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(pdfBytes)
  const page = doc.getPage(pageIndex)
  page.setRotation(degrees(angle))
  return doc.save()
}

export async function deletePdfPages(
  pdfBytes: ArrayBuffer,
  pagesToKeep: number[]
): Promise<Uint8Array> {
  const source = await PDFDocument.load(pdfBytes)
  const newDoc = await PDFDocument.create()
  const pages = await newDoc.copyPages(source, pagesToKeep)
  for (const page of pages) {
    newDoc.addPage(page)
  }
  return newDoc.save()
}

export async function addWatermark(
  pdfBytes: ArrayBuffer,
  config: WatermarkConfig
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(pdfBytes)
  const pages = doc.getPages()
  const totalPages = pages.length

  // Determine which pages to watermark
  let targetPages: number[]
  if (config.pages === "all") {
    targetPages = pages.map((_, i) => i)
  } else if (config.pages === "odd") {
    targetPages = pages.map((_, i) => i).filter((i) => i % 2 === 0)
  } else if (config.pages === "even") {
    targetPages = pages.map((_, i) => i).filter((i) => i % 2 === 1)
  } else {
    targetPages = parsePageRanges(config.pages, totalPages)
  }

  if (config.type === "text") {
    const fontKey =
      config.color === "Courier"
        ? StandardFonts.Courier
        : config.color === "Times"
          ? StandardFonts.TimesRoman
          : StandardFonts.Helvetica
    const font = await doc.embedFont(fontKey)

    // Parse hex color
    const hex = config.color.replace("#", "")
    const r = parseInt(hex.substring(0, 2), 16) / 255
    const g = parseInt(hex.substring(2, 4), 16) / 255
    const b = parseInt(hex.substring(4, 6), 16) / 255

    for (const idx of targetPages) {
      const page = pages[idx]
      const { width, height } = page.getSize()

      if (config.position === "mosaic") {
        const spacing = config.fontSize * 4
        for (let x = 0; x < width; x += spacing) {
          for (let y = 0; y < height; y += spacing) {
            page.drawText(config.text, {
              x,
              y,
              size: config.fontSize,
              font,
              color: rgb(r, g, b),
              opacity: config.opacity,
              rotate: degrees(config.rotation),
            })
          }
        }
      } else {
        let x: number
        let y: number
        const textWidth = font.widthOfTextAtSize(config.text, config.fontSize)

        switch (config.position) {
          case "center":
            x = (width - textWidth) / 2
            y = height / 2
            break
          case "diagonal":
            x = width * 0.1
            y = height * 0.5
            break
          case "top-left":
            x = 40
            y = height - 40 - config.fontSize
            break
          case "top-right":
            x = width - textWidth - 40
            y = height - 40 - config.fontSize
            break
          case "bottom-left":
            x = 40
            y = 40
            break
          case "bottom-right":
            x = width - textWidth - 40
            y = 40
            break
          default:
            x = (width - textWidth) / 2
            y = height / 2
        }

        page.drawText(config.text, {
          x,
          y,
          size: config.fontSize,
          font,
          color: rgb(r, g, b),
          opacity: config.opacity,
          rotate: degrees(config.rotation),
        })
      }
    }
  } else if (config.type === "image" && config.imageData) {
    const embedFn =
      config.imageFormat === "png"
        ? doc.embedPng.bind(doc)
        : doc.embedJpg.bind(doc)
    const image = await embedFn(config.imageData)
    const imgDims = image.scale(1)

    for (const idx of targetPages) {
      const page = pages[idx]
      const { width, height } = page.getSize()
      const imgW = width * config.scale
      const imgH = (imgDims.height / imgDims.width) * imgW

      if (config.position === "mosaic") {
        for (let x = 0; x < width; x += imgW * 1.5) {
          for (let y = 0; y < height; y += imgH * 1.5) {
            page.drawImage(image, {
              x,
              y,
              width: imgW,
              height: imgH,
              opacity: config.opacity,
              rotate: degrees(config.rotation),
            })
          }
        }
      } else {
        let x: number
        let y: number
        switch (config.position) {
          case "center":
            x = (width - imgW) / 2
            y = (height - imgH) / 2
            break
          case "top-left":
            x = 40
            y = height - imgH - 40
            break
          case "top-right":
            x = width - imgW - 40
            y = height - imgH - 40
            break
          case "bottom-left":
            x = 40
            y = 40
            break
          case "bottom-right":
            x = width - imgW - 40
            y = 40
            break
          default:
            x = (width - imgW) / 2
            y = (height - imgH) / 2
        }

        page.drawImage(image, {
          x,
          y,
          width: imgW,
          height: imgH,
          opacity: config.opacity,
          rotate: degrees(config.rotation),
        })
      }
    }
  }

  return doc.save()
}

export async function getPdfPageCount(
  pdfBytes: ArrayBuffer
): Promise<number> {
  const doc = await PDFDocument.load(pdfBytes)
  return doc.getPageCount()
}
