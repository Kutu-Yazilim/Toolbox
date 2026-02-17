import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Header } from "@/components/layout/Header"
import { TreeCreator } from "@/components/tree/TreeCreator"
import { DbModelling } from "@/components/db/DbModelling"
import { BoardEditor } from "@/components/board/BoardEditor"
import { ColorPicker } from "./components/color/ColorPicker"

function App() {
  return (
    <div className="h-screen bg-background text-foreground flex flex-col overflow-hidden">
      <Header />
      <main className="flex-1 flex flex-col min-h-0">
        <Tabs defaultValue="tree" className="flex-1 flex flex-col min-h-0">
          <div className="px-4 pt-2 pb-1 flex-shrink-0">
            <TabsList className="w-fit">
              <TabsTrigger value="color">Color Picker</TabsTrigger>
              <TabsTrigger value="board">Whiteboard</TabsTrigger>
              <TabsTrigger value="db">DB Modelling</TabsTrigger>
              <TabsTrigger value="tree">Tree Structure</TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="color" className="flex-1 min-h-0 px-4 pb-2">
            <ColorPicker />
          </TabsContent>
          <TabsContent value="board" className="flex-1 min-h-0 px-4 pb-2">
            <BoardEditor />
          </TabsContent>
          <TabsContent value="db" className="flex-1 min-h-0">
            <DbModelling />
          </TabsContent>
          <TabsContent value="tree" className="flex-1 min-h-0 px-4 pb-2">
            <TreeCreator />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

export default App
