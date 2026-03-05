import { useState } from "react"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { AppSidebar } from "@/components/layout/AppSidebar"
import { MobileNav } from "@/components/layout/MobileNav"
import { WelcomePage } from "@/components/welcome/WelcomePage"
import { TreeCreator } from "@/components/tree/TreeCreator"
import { DbModelling } from "@/components/db/DbModelling"
import { BoardEditor } from "@/components/board/BoardEditor"
import { ColorPicker } from "@/components/color/ColorPicker"
import { JsonFormatter } from "@/components/json/JsonFormatter"
import { RegexPlayground } from "@/components/regex/RegexPlayground"
import { EncoderDecoder } from "@/components/encoder/EncoderDecoder"
import { TimestampConverter } from "@/components/timestamp/TimestampConverter"
import { ApiRequestBuilder } from "@/components/api/ApiRequestBuilder"
import { MarkdownPreview } from "@/components/markdown/MarkdownPreview"
import { WheelOfFate } from "@/components/wheel/WheelOfFate"
import { JwtTool } from "@/components/jwt/JwtTool"
import { QrGenerator } from "@/components/qr/QrGenerator"
import { CoinFlip } from "@/components/coinflip/CoinFlip"
import { ShapeMaker } from "@/components/shapemaker/ShapeMaker"

function App() {
  const [activeTab, setActiveTab] = useState("home")

  return (
    <div className="h-screen bg-background text-foreground flex flex-col md:flex-row overflow-hidden">
      <Tabs value={activeTab} onValueChange={setActiveTab} orientation="vertical" className="flex-1 flex flex-col md:flex-row min-h-0">
        <AppSidebar />
        <MobileNav activeTab={activeTab} />
        <main className="flex-1 flex flex-col min-h-0 overflow-hidden pt-12 md:pt-0">
          <TabsContent value="home" className="flex-1 min-h-0">
            <WelcomePage onNavigate={setActiveTab} />
          </TabsContent>
          <TabsContent value="tree" className="flex-1 min-h-0">
            <TreeCreator />
          </TabsContent>
          <TabsContent value="db" className="flex-1 min-h-0">
            <DbModelling />
          </TabsContent>
          <TabsContent value="color" className="flex-1 min-h-0">
            <ColorPicker />
          </TabsContent>
          <TabsContent value="board" className="flex-1 min-h-0">
            <BoardEditor />
          </TabsContent>
          <TabsContent value="json" className="flex-1 min-h-0">
            <JsonFormatter />
          </TabsContent>
          <TabsContent value="regex" className="flex-1 min-h-0">
            <RegexPlayground />
          </TabsContent>
          <TabsContent value="encoder" className="flex-1 min-h-0">
            <EncoderDecoder />
          </TabsContent>
          <TabsContent value="timestamp" className="flex-1 min-h-0">
            <TimestampConverter />
          </TabsContent>
          <TabsContent value="api" className="flex-1 min-h-0">
            <ApiRequestBuilder />
          </TabsContent>
          <TabsContent value="markdown" className="flex-1 min-h-0">
            <MarkdownPreview />
          </TabsContent>
          <TabsContent value="wheel" className="flex-1 min-h-0">
            <WheelOfFate />
          </TabsContent>
          <TabsContent value="jwt" className="flex-1 min-h-0">
            <JwtTool />
          </TabsContent>
          <TabsContent value="qr" className="flex-1 min-h-0">
            <QrGenerator />
          </TabsContent>
          <TabsContent value="coinflip" className="flex-1 min-h-0">
            <CoinFlip />
          </TabsContent>
          <TabsContent value="shapemaker" className="flex-1 min-h-0">
            <ShapeMaker />
          </TabsContent>
        </main>
      </Tabs>
    </div>
  )
}

export default App
