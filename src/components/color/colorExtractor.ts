// ─── K-Means Color Extraction ───────────────────────────────────────────────
// Pure functions for extracting dominant colors from image data using k-means clustering.

function toHex(r: number, g: number, b: number): string {
    return "#" + [r, g, b].map(v => Math.round(v).toString(16).padStart(2, "0")).join("").toUpperCase()
}

function euclideanDistance(a: number[], b: number[]): number {
    return Math.sqrt(
        (a[0] - b[0]) ** 2 +
        (a[1] - b[1]) ** 2 +
        (a[2] - b[2]) ** 2
    )
}

const MAX_ITERATIONS = 20
const SIMILARITY_THRESHOLD = 30

export function extractColors(imageData: ImageData, count: number): string[] {
    const pixels = samplePixels(imageData)
    if (pixels.length === 0) return []

    // Initialize centroids randomly from pixel data
    let centroids = initializeCentroids(pixels, count)
    let assignments = new Array<number>(pixels.length).fill(0)

    for (let iter = 0; iter < MAX_ITERATIONS; iter++) {
        // Assign each pixel to nearest centroid
        for (let i = 0; i < pixels.length; i++) {
            let minDist = Infinity
            let nearest = 0
            for (let c = 0; c < centroids.length; c++) {
                const dist = euclideanDistance(pixels[i], centroids[c])
                if (dist < minDist) {
                    minDist = dist
                    nearest = c
                }
            }
            assignments[i] = nearest
        }

        // Recalculate centroids
        const newCentroids = centroids.map(() => [0, 0, 0])
        const counts = new Array<number>(centroids.length).fill(0)

        for (let i = 0; i < pixels.length; i++) {
            const cluster = assignments[i]
            newCentroids[cluster][0] += pixels[i][0]
            newCentroids[cluster][1] += pixels[i][1]
            newCentroids[cluster][2] += pixels[i][2]
            counts[cluster]++
        }

        let converged = true
        for (let c = 0; c < centroids.length; c++) {
            if (counts[c] === 0) continue
            const updated = [
                newCentroids[c][0] / counts[c],
                newCentroids[c][1] / counts[c],
                newCentroids[c][2] / counts[c],
            ]
            if (euclideanDistance(centroids[c], updated) > 1) {
                converged = false
            }
            centroids[c] = updated
        }

        if (converged) break
    }

    // Count cluster sizes for sorting
    const clusterSizes = new Array<number>(centroids.length).fill(0)
    for (const a of assignments) clusterSizes[a]++

    // Sort by cluster size (most prominent first)
    const indexed = centroids.map((centroid, i) => ({ centroid, size: clusterSizes[i] }))
    indexed.sort((a, b) => b.size - a.size)

    // Convert to hex and deduplicate similar colors
    const result: { hex: string; size: number }[] = []
    for (const { centroid, size } of indexed) {
        const hex = toHex(centroid[0], centroid[1], centroid[2])
        const isDuplicate = result.some(existing => {
            const er = parseInt(existing.hex.slice(1, 3), 16)
            const eg = parseInt(existing.hex.slice(3, 5), 16)
            const eb = parseInt(existing.hex.slice(5, 7), 16)
            return euclideanDistance(centroid, [er, eg, eb]) < SIMILARITY_THRESHOLD
        })
        if (!isDuplicate) {
            result.push({ hex, size })
        }
    }

    return result.map(r => r.hex)
}

function samplePixels(imageData: ImageData): number[][] {
    const pixels: number[][] = []
    const data = imageData.data
    for (let i = 0; i < data.length; i += 4) {
        // Skip fully transparent pixels
        if (data[i + 3] < 128) continue
        pixels.push([data[i], data[i + 1], data[i + 2]])
    }
    return pixels
}

function initializeCentroids(pixels: number[][], k: number): number[][] {
    const centroids: number[][] = []
    const usedIndices = new Set<number>()

    // Pick first centroid randomly
    const firstIdx = Math.floor(Math.random() * pixels.length)
    centroids.push([...pixels[firstIdx]])
    usedIndices.add(firstIdx)

    // K-means++ initialization: pick remaining centroids weighted by distance
    while (centroids.length < k && centroids.length < pixels.length) {
        const distances = pixels.map(pixel => {
            let minDist = Infinity
            for (const centroid of centroids) {
                const dist = euclideanDistance(pixel, centroid)
                if (dist < minDist) minDist = dist
            }
            return minDist * minDist
        })

        const totalDist = distances.reduce((sum, d) => sum + d, 0)
        let random = Math.random() * totalDist
        let idx = 0
        for (let i = 0; i < distances.length; i++) {
            random -= distances[i]
            if (random <= 0) {
                idx = i
                break
            }
        }

        if (!usedIndices.has(idx)) {
            centroids.push([...pixels[idx]])
            usedIndices.add(idx)
        } else {
            // Fallback: pick any unused pixel
            for (let i = 0; i < pixels.length; i++) {
                if (!usedIndices.has(i)) {
                    centroids.push([...pixels[i]])
                    usedIndices.add(i)
                    break
                }
            }
        }
    }

    return centroids
}
