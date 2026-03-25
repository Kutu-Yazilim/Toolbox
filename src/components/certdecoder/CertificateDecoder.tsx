"use client"

import { useState, useCallback } from "react"
import {
  CopyIcon,
  CheckIcon,
  TrashIcon,
  BookOpenIcon,
  ShieldCheckIcon,
  ShieldAlertIcon,
  AlertCircleIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// ─── OID map ────────────────────────────────────────────────────────────────

const OID_MAP: Record<string, string> = {
  "2.5.4.3": "CN",
  "2.5.4.6": "C",
  "2.5.4.7": "L",
  "2.5.4.8": "ST",
  "2.5.4.10": "O",
  "2.5.4.11": "OU",
  "1.2.840.113549.1.1.1": "RSA",
  "1.2.840.113549.1.1.5": "SHA-1 with RSA",
  "1.2.840.113549.1.1.11": "SHA-256 with RSA",
  "1.2.840.113549.1.1.12": "SHA-384 with RSA",
  "1.2.840.113549.1.1.13": "SHA-512 with RSA",
  "1.2.840.10045.2.1": "EC",
  "1.2.840.10045.4.3.2": "ECDSA with SHA-256",
  "1.2.840.10045.4.3.3": "ECDSA with SHA-384",
  "1.2.840.10045.4.3.4": "ECDSA with SHA-512",
  "1.3.101.112": "Ed25519",
  "2.5.29.17": "subjectAltName",
  "2.5.29.19": "basicConstraints",
  "2.5.29.15": "keyUsage",
  "2.5.29.37": "extKeyUsage",
  "2.5.29.14": "subjectKeyIdentifier",
  "2.5.29.35": "authorityKeyIdentifier",
}

const KEY_USAGE_BITS = [
  "Digital Signature",
  "Non Repudiation",
  "Key Encipherment",
  "Data Encipherment",
  "Key Agreement",
  "Key Cert Sign",
  "CRL Sign",
  "Encipher Only",
  "Decipher Only",
]

// ─── ASN.1 DER Parser ──────────────────────────────────────────────────────

type ASN1Node = {
  tag: number
  constructed: boolean
  bytes: Uint8Array
  children?: ASN1Node[]
  offset: number
  headerLen: number
  length: number
}

function parseASN1(data: Uint8Array, offset = 0): ASN1Node[] {
  const nodes: ASN1Node[] = []
  let pos = offset

  while (pos < data.length) {
    const startPos = pos
    const tag = data[pos++]
    if (tag === undefined || pos >= data.length) break

    let length = data[pos++]
    let headerLen = 2

    if (length === undefined) break

    if (length & 0x80) {
      const numBytes = length & 0x7f
      if (numBytes > 4 || pos + numBytes > data.length) break
      length = 0
      for (let i = 0; i < numBytes; i++) {
        length = (length << 8) | data[pos++]
      }
      headerLen = 2 + numBytes
    }

    if (pos + length > data.length) break

    const bytes = data.slice(pos, pos + length)
    const constructed = !!(tag & 0x20)

    const node: ASN1Node = {
      tag,
      constructed,
      bytes,
      offset: startPos,
      headerLen,
      length,
    }

    if (constructed) {
      try {
        node.children = parseASN1(bytes)
      } catch {
        // leave children undefined
      }
    }

    nodes.push(node)
    pos += length
  }

  return nodes
}

function parseOID(bytes: Uint8Array): string {
  if (bytes.length < 1) return ""
  const parts: number[] = []
  parts.push(Math.floor(bytes[0] / 40))
  parts.push(bytes[0] % 40)

  let value = 0
  for (let i = 1; i < bytes.length; i++) {
    value = (value << 7) | (bytes[i] & 0x7f)
    if (!(bytes[i] & 0x80)) {
      parts.push(value)
      value = 0
    }
  }
  return parts.join(".")
}

function parseUTCTime(bytes: Uint8Array): Date | null {
  try {
    const str = new TextDecoder().decode(bytes)
    // YYMMDDHHmmSSZ
    const yy = parseInt(str.slice(0, 2))
    const year = yy >= 50 ? 1900 + yy : 2000 + yy
    const month = parseInt(str.slice(2, 4)) - 1
    const day = parseInt(str.slice(4, 6))
    const hour = parseInt(str.slice(6, 8))
    const min = parseInt(str.slice(8, 10))
    const sec = parseInt(str.slice(10, 12))
    return new Date(Date.UTC(year, month, day, hour, min, sec))
  } catch {
    return null
  }
}

function parseGeneralizedTime(bytes: Uint8Array): Date | null {
  try {
    const str = new TextDecoder().decode(bytes)
    // YYYYMMDDHHmmSSZ
    const year = parseInt(str.slice(0, 4))
    const month = parseInt(str.slice(4, 6)) - 1
    const day = parseInt(str.slice(6, 8))
    const hour = parseInt(str.slice(8, 10))
    const min = parseInt(str.slice(10, 12))
    const sec = parseInt(str.slice(12, 14))
    return new Date(Date.UTC(year, month, day, hour, min, sec))
  } catch {
    return null
  }
}

function bytesToHex(bytes: Uint8Array, separator = ":"): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0").toUpperCase())
    .join(separator)
}

function parseName(node: ASN1Node): Record<string, string> {
  const result: Record<string, string> = {}
  if (!node.children) return result

  for (const setNode of node.children) {
    // Each RDN is a SET containing SEQUENCEs
    const seqNodes = setNode.children || []
    for (const seq of seqNodes) {
      const attrSeq = seq.tag === 0x30 ? seq : setNode
      if (!attrSeq.children || attrSeq.children.length < 2) continue
      const oidNode = attrSeq.children[0]
      const valueNode = attrSeq.children[1]
      if (oidNode.tag !== 0x06) continue
      const oid = parseOID(oidNode.bytes)
      const label = OID_MAP[oid] || oid
      const value = new TextDecoder().decode(valueNode.bytes)
      result[label] = value
    }
  }
  return result
}

function parseExtensions(
  extSeq: ASN1Node,
): { oid: string; name: string; critical: boolean; value: Uint8Array }[] {
  const extensions: {
    oid: string
    name: string
    critical: boolean
    value: Uint8Array
  }[] = []
  if (!extSeq.children) return extensions

  for (const ext of extSeq.children) {
    if (!ext.children || ext.children.length < 2) continue
    const oidNode = ext.children[0]
    if (oidNode.tag !== 0x06) continue
    const oid = parseOID(oidNode.bytes)

    let critical = false
    let valueNode: ASN1Node | undefined

    if (ext.children.length === 3) {
      // second is BOOLEAN (critical), third is OCTET STRING (value)
      if (ext.children[1].tag === 0x01) {
        critical = ext.children[1].bytes[0] !== 0
      }
      valueNode = ext.children[2]
    } else {
      valueNode = ext.children[1]
    }

    if (valueNode) {
      extensions.push({
        oid,
        name: OID_MAP[oid] || oid,
        critical,
        value: valueNode.bytes,
      })
    }
  }

  return extensions
}

function parseSANs(octetBytes: Uint8Array): string[] {
  const sans: string[] = []
  try {
    const inner = parseASN1(octetBytes)
    const seq = inner[0]
    if (!seq?.children) return sans
    for (const child of seq.children) {
      // context tag [2] = dNSName, [7] = iPAddress
      const tagNum = child.tag & 0x1f
      if (tagNum === 2) {
        sans.push(new TextDecoder().decode(child.bytes))
      } else if (tagNum === 7) {
        if (child.bytes.length === 4) {
          sans.push(Array.from(child.bytes).join("."))
        } else if (child.bytes.length === 16) {
          const parts: string[] = []
          for (let i = 0; i < 16; i += 2) {
            parts.push(
              ((child.bytes[i] << 8) | child.bytes[i + 1])
                .toString(16)
                .padStart(4, "0"),
            )
          }
          sans.push(parts.join(":"))
        }
      }
    }
  } catch {
    // best effort
  }
  return sans
}

function parseKeyUsage(octetBytes: Uint8Array): string[] {
  const usages: string[] = []
  try {
    const inner = parseASN1(octetBytes)
    if (!inner[0] || inner[0].tag !== 0x03) return usages
    const bitString = inner[0].bytes
    if (bitString.length < 2) return usages
    const unusedBits = bitString[0]
    for (let byteIdx = 1; byteIdx < bitString.length; byteIdx++) {
      for (let bitIdx = 0; bitIdx < 8; bitIdx++) {
        if (
          byteIdx === bitString.length - 1 &&
          bitIdx >= 8 - unusedBits
        )
          break
        if (bitString[byteIdx] & (0x80 >> bitIdx)) {
          const idx = (byteIdx - 1) * 8 + bitIdx
          if (idx < KEY_USAGE_BITS.length) {
            usages.push(KEY_USAGE_BITS[idx])
          }
        }
      }
    }
  } catch {
    // best effort
  }
  return usages
}

// ─── Certificate parser ─────────────────────────────────────────────────────

type CertInfo = {
  version: string
  serialNumber: string
  signatureAlgorithm: string
  issuer: Record<string, string>
  subject: Record<string, string>
  notBefore: Date | null
  notAfter: Date | null
  publicKeyAlgorithm: string
  publicKeySize: number | null
  extensions: { oid: string; name: string; critical: boolean; value: Uint8Array }[]
  sans: string[]
  keyUsage: string[]
  basicConstraints: string
  fingerprint: string
}

async function computeSHA256(data: Uint8Array): Promise<string> {
  const hash = await crypto.subtle.digest("SHA-256", data as BufferSource)
  return bytesToHex(new Uint8Array(hash))
}

async function parseCertificate(pem: string): Promise<CertInfo> {
  // Strip PEM headers/footers and decode base64
  const b64 = pem
    .replace(/-----BEGIN CERTIFICATE-----/g, "")
    .replace(/-----END CERTIFICATE-----/g, "")
    .replace(/\s/g, "")

  const binaryStr = atob(b64)
  const der = new Uint8Array(binaryStr.length)
  for (let i = 0; i < binaryStr.length; i++) {
    der[i] = binaryStr.charCodeAt(i)
  }

  const fingerprint = await computeSHA256(der)

  const root = parseASN1(der)
  if (!root[0]?.children) throw new Error("Invalid certificate structure")

  const certSeq = root[0] // outer SEQUENCE
  const tbsCert = certSeq.children![0] // TBSCertificate SEQUENCE
  if (!tbsCert?.children) throw new Error("Invalid TBSCertificate")

  const tbs = tbsCert.children!
  let idx = 0

  // Version (optional, context tag [0])
  let version = "v1"
  if (tbs[idx] && (tbs[idx].tag & 0xa0) === 0xa0) {
    const versionNode = tbs[idx].children?.[0]
    if (versionNode) {
      const v = versionNode.bytes[0]
      version = `v${(v || 0) + 1}`
    }
    idx++
  }

  // Serial Number
  let serialNumber = "Could not parse"
  if (tbs[idx] && tbs[idx].tag === 0x02) {
    serialNumber = bytesToHex(tbs[idx].bytes)
    idx++
  }

  // Signature Algorithm
  let signatureAlgorithm = "Could not parse"
  if (tbs[idx]?.children?.[0]?.tag === 0x06) {
    const oid = parseOID(tbs[idx].children![0].bytes)
    signatureAlgorithm = OID_MAP[oid] || oid
    idx++
  }

  // Issuer
  const issuer = idx < tbs.length ? parseName(tbs[idx]) : {}
  idx++

  // Validity
  let notBefore: Date | null = null
  let notAfter: Date | null = null
  if (tbs[idx]?.children && tbs[idx].children!.length >= 2) {
    const nb = tbs[idx].children![0]
    const na = tbs[idx].children![1]
    notBefore =
      nb.tag === 0x17
        ? parseUTCTime(nb.bytes)
        : nb.tag === 0x18
          ? parseGeneralizedTime(nb.bytes)
          : null
    notAfter =
      na.tag === 0x17
        ? parseUTCTime(na.bytes)
        : na.tag === 0x18
          ? parseGeneralizedTime(na.bytes)
          : null
    idx++
  }

  // Subject
  const subject = idx < tbs.length ? parseName(tbs[idx]) : {}
  idx++

  // SubjectPublicKeyInfo
  let publicKeyAlgorithm = "Could not parse"
  let publicKeySize: number | null = null
  if (tbs[idx]?.children && tbs[idx].children!.length >= 2) {
    const pkAlgSeq = tbs[idx].children![0]
    if (pkAlgSeq?.children?.[0]?.tag === 0x06) {
      const oid = parseOID(pkAlgSeq.children[0].bytes)
      publicKeyAlgorithm = OID_MAP[oid] || oid
    }
    const pkBitString = tbs[idx].children![1]
    if (pkBitString?.tag === 0x03) {
      // BIT STRING: first byte is unused bits count
      const keyBytes = pkBitString.bytes.slice(1)
      if (publicKeyAlgorithm === "RSA") {
        // RSA public key: parse the inner SEQUENCE to get modulus length
        try {
          const inner = parseASN1(keyBytes)
          if (inner[0]?.children?.[0]) {
            const modulus = inner[0].children[0].bytes
            // Remove leading zero byte if present
            const effectiveLen =
              modulus[0] === 0 ? modulus.length - 1 : modulus.length
            publicKeySize = effectiveLen * 8
          }
        } catch {
          publicKeySize = (keyBytes.length - 1) * 8
        }
      } else if (publicKeyAlgorithm === "EC") {
        // EC key size is based on the curve, approximate from key bytes
        const keyLen = keyBytes.length
        if (keyLen <= 33) publicKeySize = 256
        else if (keyLen <= 49) publicKeySize = 256
        else if (keyLen <= 65) publicKeySize = 256
        else if (keyLen <= 97) publicKeySize = 384
        else publicKeySize = 521
      } else if (publicKeyAlgorithm === "Ed25519") {
        publicKeySize = 256
      }
    }
    idx++
  }

  // Extensions (optional, context tag [3])
  let extensions: CertInfo["extensions"] = []
  let sans: string[] = []
  let keyUsage: string[] = []
  let basicConstraints = ""

  for (let i = idx; i < tbs.length; i++) {
    if ((tbs[i].tag & 0xff) === 0xa3) {
      // context [3] EXPLICIT -> contains a SEQUENCE of extensions
      const extOuter = tbs[i].children?.[0]
      if (extOuter) {
        extensions = parseExtensions(extOuter)
        for (const ext of extensions) {
          if (ext.oid === "2.5.29.17") {
            sans = parseSANs(ext.value)
          } else if (ext.oid === "2.5.29.15") {
            keyUsage = parseKeyUsage(ext.value)
          } else if (ext.oid === "2.5.29.19") {
            try {
              const inner = parseASN1(ext.value)
              if (inner[0]?.children) {
                const isCA =
                  inner[0].children[0]?.tag === 0x01 &&
                  inner[0].children[0].bytes[0] !== 0
                basicConstraints = isCA ? "CA: TRUE" : "CA: FALSE"
              } else {
                basicConstraints = "CA: FALSE"
              }
            } catch {
              basicConstraints = "Could not parse"
            }
          }
        }
      }
    }
  }

  return {
    version,
    serialNumber,
    signatureAlgorithm,
    issuer,
    subject,
    notBefore,
    notAfter,
    publicKeyAlgorithm,
    publicKeySize,
    extensions,
    sans,
    keyUsage,
    basicConstraints,
    fingerprint,
  }
}

// ─── Example certificate ────────────────────────────────────────────────────

const EXAMPLE_PEM = `-----BEGIN CERTIFICATE-----
MIIDazCCAlOgAwIBAgIUYo3M7B0MFAhg9uxFMGWzINFTdicwDQYJKoZIhvcNAQEL
BQAwRTELMAkGA1UEBhMCVVMxEzARBgNVBAgMClNvbWUtU3RhdGUxITAfBgNVBAoM
GEludGVybmV0IFdpZGdpdHMgUHR5IEx0ZDAeFw0yNDAxMDExMjAwMDBaFw0yNTAx
MDExMjAwMDBaMEUxCzAJBgNVBAYTAlVTMRMwEQYDVQQIDApTb21lLVN0YXRlMSEw
HwYDVQQKDBhJbnRlcm5ldCBXaWRnaXRzIFB0eSBMdGQwggEiMA0GCSqGSIb3DQEB
AQUAA4IBDwAwggEKAoIBAQDJ7pRRIFE9vDEE8UlE7EM4CBJHQP9I7mJ/RO80CDMK
WGR1DJATvHfRBuFJI3eLBx9gP5JhkZAGRaHxYK3YAh3hMI3FTfGn3FPOjNFqMJh
ce37+EB1sdWRHwLhMGLOBih4hi0e1RnQEJ16N5TGNTOVS0Z8RmAVBJOJelKeLCBL
AvYFPWL+PxN3sXUHBGkQmv7Q3NUQZ3EFYMFMPBQxOP6zBxMgBJPIzfGZYJ4seyQ
u+sBIhMcFp0EP4GcFFKNVc9MJkkJOVLARplCNcP+rrzRMxwCUNQ0mS99VkJaVBSe
L5WH0BE7JBjCMcnVMrJERO2A6XjeyNqvXNFhJv7JRBhNAgMBAAGjUzBRMB0GA1Ud
DgQWBBTvB6VzH9RraRSPYq+oUzEfAAgzEjAfBgNVHSMEGDAWgBTvB6VzH9RraRSP
Yq+oUzEfAAgzEjAPBgNVHRMBAf8EBTADAQH/MA0GCSqGSIb3DQEBCwUAA4IBAQCX
RJGuP4pa1ILCncwRCLmgcfE0d4PGzCAPMaN0JOxTHAJAMFGB9X7YN2JCBjVJMKdE
gHR1KRK2hSNR0pnMYJlXBPqj9GqKFIOaSvOC/Aq+zFAvJQUaHGCgE0LEKWI95FO+
b5f2LqBkynetHM5kL+2nCVzam/g7GNSKdyyOjfyB/VNKiNkFcF2JnBJPITzRIRBi
KYNsSL9OPuHqN0o6mazGLPP+VrIAz2FMmi+EAqjRYMmQwkNm+f1cKNPBVA/RM8vG
nkL7gMfGSHb+FBYSTRQ3k1BUaGJMfit/YeJm0kF3mAAENMTgNp2/6J5ABToZHOcK
fYKKT3V/EncbH8hNGkCP
-----END CERTIFICATE-----`

// ─── Copy hook ──────────────────────────────────────────────────────────────

function useCopy() {
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  const copy = useCallback((key: string, value: string) => {
    navigator.clipboard.writeText(value)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 1500)
  }, [])

  return { copiedKey, copy }
}

// ─── Component ──────────────────────────────────────────────────────────────

export function CertificateDecoder() {
  const [pem, setPem] = useState("")
  const [certInfo, setCertInfo] = useState<CertInfo | null>(null)
  const [error, setError] = useState("")
  const [parsing, setParsing] = useState(false)
  const { copiedKey, copy } = useCopy()

  const handleParse = useCallback(async (input: string) => {
    if (!input.trim()) {
      setCertInfo(null)
      setError("")
      return
    }

    if (!input.includes("-----BEGIN CERTIFICATE-----")) {
      setError("Invalid PEM format: missing -----BEGIN CERTIFICATE----- header")
      setCertInfo(null)
      return
    }

    setParsing(true)
    setError("")

    try {
      const info = await parseCertificate(input)
      setCertInfo(info)
    } catch (e) {
      setError(
        `Failed to parse certificate: ${e instanceof Error ? e.message : "Unknown error"}`,
      )
      setCertInfo(null)
    } finally {
      setParsing(false)
    }
  }, [])

  const handleInputChange = useCallback(
    (value: string) => {
      setPem(value)
      handleParse(value)
    },
    [handleParse],
  )

  const handleLoadExample = useCallback(() => {
    setPem(EXAMPLE_PEM)
    handleParse(EXAMPLE_PEM)
  }, [handleParse])

  const handleClear = useCallback(() => {
    setPem("")
    setCertInfo(null)
    setError("")
  }, [])

  const formatDate = (date: Date | null) => {
    if (!date) return "Could not parse"
    return date.toUTCString()
  }

  const isExpired =
    certInfo?.notAfter ? certInfo.notAfter.getTime() < Date.now() : null
  const isNotYetValid =
    certInfo?.notBefore ? certInfo.notBefore.getTime() > Date.now() : null

  return (
    <div className="h-full flex flex-col min-h-0">
      {/* Header bar */}
      <div className="flex flex-wrap items-center gap-3 border-b px-4 py-3">
        <span className="text-sm font-medium text-muted-foreground">
          Paste a PEM-encoded X.509 certificate to inspect its fields
        </span>
        <div className="flex items-center gap-2 ml-auto">
          <Button onClick={handleLoadExample} variant="outline" size="sm">
            <BookOpenIcon className="size-3.5" />
            Load Example
          </Button>
          <Button
            onClick={handleClear}
            variant="outline"
            size="sm"
            disabled={!pem}
          >
            <TrashIcon className="size-3.5" />
            Clear
          </Button>
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Left panel: PEM input */}
        <div className="w-1/2 border-r flex flex-col min-h-0">
          <div className="px-4 py-2 border-b">
            <span className="text-xs font-medium text-muted-foreground">
              PEM Certificate
            </span>
          </div>
          <textarea
            value={pem}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder={`Paste your PEM certificate here...\n\n-----BEGIN CERTIFICATE-----\nMIID...\n-----END CERTIFICATE-----`}
            className="flex-1 resize-none bg-transparent px-4 py-3 text-sm font-mono placeholder:text-muted-foreground/50 focus:outline-none"
            spellCheck={false}
          />
        </div>

        {/* Right panel: parsed details */}
        <div className="w-1/2 flex flex-col min-h-0">
          <div className="px-4 py-2 border-b">
            <span className="text-xs font-medium text-muted-foreground">
              Decoded Fields
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {error && (
              <div className="flex items-start gap-2.5 rounded-lg border border-red-500/20 bg-red-500/5 px-3.5 py-2.5 text-xs text-red-400">
                <AlertCircleIcon className="size-3.5 mt-0.5 shrink-0" />
                {error}
              </div>
            )}

            {parsing && (
              <div className="text-sm text-muted-foreground">Parsing...</div>
            )}

            {!certInfo && !error && !parsing && (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground/50 gap-2">
                <ShieldCheckIcon className="size-10" />
                <span className="text-sm">
                  No certificate loaded
                </span>
              </div>
            )}

            {certInfo && (
              <>
                {/* Validity status badge */}
                <div
                  className={cn(
                    "flex items-center gap-2 rounded-lg border px-3.5 py-2.5 text-xs font-medium",
                    isExpired
                      ? "border-red-500/20 bg-red-500/5 text-red-400"
                      : isNotYetValid
                        ? "border-yellow-500/20 bg-yellow-500/5 text-yellow-400"
                        : "border-green-500/20 bg-green-500/5 text-green-400",
                  )}
                >
                  {isExpired ? (
                    <ShieldAlertIcon className="size-3.5" />
                  ) : (
                    <ShieldCheckIcon className="size-3.5" />
                  )}
                  {isExpired
                    ? "Expired"
                    : isNotYetValid
                      ? "Not Yet Valid"
                      : "Valid"}
                </div>

                {/* Subject */}
                <FieldCard title="Subject">
                  <FieldRow
                    label="Common Name (CN)"
                    value={certInfo.subject.CN || "N/A"}
                    copyKey="subject-cn"
                    copiedKey={copiedKey}
                    onCopy={copy}
                  />
                  <FieldRow
                    label="Organization (O)"
                    value={certInfo.subject.O || "N/A"}
                    copyKey="subject-o"
                    copiedKey={copiedKey}
                    onCopy={copy}
                  />
                  <FieldRow
                    label="Country (C)"
                    value={certInfo.subject.C || "N/A"}
                    copyKey="subject-c"
                    copiedKey={copiedKey}
                    onCopy={copy}
                  />
                  {certInfo.subject.ST && (
                    <FieldRow
                      label="State (ST)"
                      value={certInfo.subject.ST}
                      copyKey="subject-st"
                      copiedKey={copiedKey}
                      onCopy={copy}
                    />
                  )}
                  {certInfo.subject.L && (
                    <FieldRow
                      label="Locality (L)"
                      value={certInfo.subject.L}
                      copyKey="subject-l"
                      copiedKey={copiedKey}
                      onCopy={copy}
                    />
                  )}
                  {certInfo.subject.OU && (
                    <FieldRow
                      label="Org Unit (OU)"
                      value={certInfo.subject.OU}
                      copyKey="subject-ou"
                      copiedKey={copiedKey}
                      onCopy={copy}
                    />
                  )}
                </FieldCard>

                {/* Issuer */}
                <FieldCard title="Issuer">
                  <FieldRow
                    label="Common Name (CN)"
                    value={certInfo.issuer.CN || "N/A"}
                    copyKey="issuer-cn"
                    copiedKey={copiedKey}
                    onCopy={copy}
                  />
                  <FieldRow
                    label="Organization (O)"
                    value={certInfo.issuer.O || "N/A"}
                    copyKey="issuer-o"
                    copiedKey={copiedKey}
                    onCopy={copy}
                  />
                  <FieldRow
                    label="Country (C)"
                    value={certInfo.issuer.C || "N/A"}
                    copyKey="issuer-c"
                    copiedKey={copiedKey}
                    onCopy={copy}
                  />
                  {certInfo.issuer.ST && (
                    <FieldRow
                      label="State (ST)"
                      value={certInfo.issuer.ST}
                      copyKey="issuer-st"
                      copiedKey={copiedKey}
                      onCopy={copy}
                    />
                  )}
                </FieldCard>

                {/* Validity */}
                <FieldCard title="Validity">
                  <FieldRow
                    label="Not Before"
                    value={formatDate(certInfo.notBefore)}
                    copyKey="not-before"
                    copiedKey={copiedKey}
                    onCopy={copy}
                  />
                  <FieldRow
                    label="Not After"
                    value={formatDate(certInfo.notAfter)}
                    copyKey="not-after"
                    copiedKey={copiedKey}
                    onCopy={copy}
                  />
                </FieldCard>

                {/* Public Key */}
                <FieldCard title="Public Key">
                  <FieldRow
                    label="Algorithm"
                    value={certInfo.publicKeyAlgorithm}
                    copyKey="pk-alg"
                    copiedKey={copiedKey}
                    onCopy={copy}
                  />
                  {certInfo.publicKeySize && (
                    <FieldRow
                      label="Key Size"
                      value={`${certInfo.publicKeySize} bits`}
                      copyKey="pk-size"
                      copiedKey={copiedKey}
                      onCopy={copy}
                    />
                  )}
                </FieldCard>

                {/* Certificate Details */}
                <FieldCard title="Certificate Details">
                  <FieldRow
                    label="Version"
                    value={certInfo.version}
                    copyKey="version"
                    copiedKey={copiedKey}
                    onCopy={copy}
                  />
                  <FieldRow
                    label="Serial Number"
                    value={certInfo.serialNumber}
                    copyKey="serial"
                    copiedKey={copiedKey}
                    onCopy={copy}
                  />
                  <FieldRow
                    label="Signature Algorithm"
                    value={certInfo.signatureAlgorithm}
                    copyKey="sig-alg"
                    copiedKey={copiedKey}
                    onCopy={copy}
                  />
                </FieldCard>

                {/* Fingerprint */}
                <FieldCard title="Fingerprint">
                  <FieldRow
                    label="SHA-256"
                    value={certInfo.fingerprint}
                    copyKey="fingerprint"
                    copiedKey={copiedKey}
                    onCopy={copy}
                    mono
                  />
                </FieldCard>

                {/* Extensions */}
                {(certInfo.sans.length > 0 ||
                  certInfo.keyUsage.length > 0 ||
                  certInfo.basicConstraints) && (
                  <FieldCard title="Extensions">
                    {certInfo.basicConstraints && (
                      <FieldRow
                        label="Basic Constraints"
                        value={certInfo.basicConstraints}
                        copyKey="basic-constraints"
                        copiedKey={copiedKey}
                        onCopy={copy}
                      />
                    )}
                    {certInfo.keyUsage.length > 0 && (
                      <FieldRow
                        label="Key Usage"
                        value={certInfo.keyUsage.join(", ")}
                        copyKey="key-usage"
                        copiedKey={copiedKey}
                        onCopy={copy}
                      />
                    )}
                    {certInfo.sans.length > 0 && (
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-muted-foreground">
                          Subject Alt Names
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {certInfo.sans.map((san, i) => (
                            <span
                              key={i}
                              className="rounded-md border bg-muted/40 px-2 py-0.5 text-xs font-mono"
                            >
                              {san}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </FieldCard>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function FieldCard({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-lg border bg-muted/20 p-3 space-y-2.5">
      <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">
        {title}
      </h3>
      {children}
    </div>
  )
}

function FieldRow({
  label,
  value,
  copyKey,
  copiedKey,
  onCopy,
  mono = false,
}: {
  label: string
  value: string
  copyKey: string
  copiedKey: string | null
  onCopy: (key: string, value: string) => void
  mono?: boolean
}) {
  const isCopied = copiedKey === copyKey

  return (
    <div className="flex items-start justify-between gap-2 group">
      <div className="flex flex-col gap-0.5 min-w-0 flex-1">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span
          className={cn(
            "text-sm break-all",
            mono && "font-mono text-xs",
          )}
        >
          {value}
        </span>
      </div>
      <button
        onClick={() => onCopy(copyKey, value)}
        className="opacity-0 group-hover:opacity-100 transition-opacity mt-3.5 shrink-0 text-muted-foreground hover:text-foreground"
        title="Copy"
      >
        {isCopied ? (
          <CheckIcon className="size-3.5 text-green-400" />
        ) : (
          <CopyIcon className="size-3.5" />
        )}
      </button>
    </div>
  )
}
