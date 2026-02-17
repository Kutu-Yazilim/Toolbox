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

function App() {
  return (
    <div className="h-screen bg-background text-foreground flex flex-col overflow-hidden">
      <Header />
      <main className="flex-1 flex flex-col min-h-0">
        <Tabs defaultValue="tree" className="flex-1 flex flex-col min-h-0">
          <div className="px-4 pt-2 pb-1 flex-shrink-0 border-b border-border">
            <TabsList className="w-fit">
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
            </TabsList>
          </div>
          <TabsContent value="tree" className="flex-1 min-h-0 px-4 py-2">
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
        </Tabs>
      </main>
    </div>
  )
}

export default App
