"use client"

import {
  DownloadIcon,
  UploadIcon,
  ActivityIcon,
  WifiIcon,
} from "lucide-react"
import { StatCard } from "./StatCard"

type SpeedResult = {
  ping: number
  jitter: number
  download: number
  upload: number
}

export function ResultsGrid({ result }: { result: SpeedResult }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <StatCard
        icon={<DownloadIcon className="h-4 w-4" />}
        label="Download"
        value={result.download}
        unit="Mbps"
        type="download"
      />
      <StatCard
        icon={<UploadIcon className="h-4 w-4" />}
        label="Upload"
        value={result.upload}
        unit="Mbps"
        type="upload"
      />
      <StatCard
        icon={<ActivityIcon className="h-4 w-4" />}
        label="Ping"
        value={result.ping}
        unit="ms"
        type="ping"
      />
      <StatCard
        icon={<WifiIcon className="h-4 w-4" />}
        label="Jitter"
        value={result.jitter}
        unit="ms"
        type="jitter"
      />
    </div>
  )
}
