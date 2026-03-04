import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Header } from "@/components/layout/Header"
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

function App() {
  return (
    <div className="h-screen bg-background text-foreground flex flex-col overflow-hidden">
      <Tabs defaultValue="color" className="flex-1 flex flex-col min-h-0">
        <Header
          centerContent={(
            <div className="w-full max-w-full overflow-x-auto overflow-y-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <TabsList className="min-w-full">
                <TabsTrigger value="tree">Tree</TabsTrigger>
                <TabsTrigger value="db">DB Modelling</TabsTrigger>
                <TabsTrigger value="color">Colors</TabsTrigger>
                <TabsTrigger value="board">Board</TabsTrigger>
                <TabsTrigger value="json">JSON</TabsTrigger>
                <TabsTrigger value="regex">Regex</TabsTrigger>
                <TabsTrigger value="encoder">Encoder</TabsTrigger>
                <TabsTrigger value="timestamp">Timestamp</TabsTrigger>
                <TabsTrigger value="api">API</TabsTrigger>
                <TabsTrigger value="markdown">Markdown</TabsTrigger>
                <TabsTrigger value="wheel">Wheel of Fate</TabsTrigger>
              </TabsList>
            </div>
          )}
        />
        <main className="flex-1 flex flex-col min-h-0">
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
        </main>
      </Tabs>
    </div>
  )
}

export default App
