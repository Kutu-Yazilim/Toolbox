import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Header } from "@/components/layout/Header"
import { TreeCreator } from "@/components/tree/TreeCreator"
import { DbModelling } from "@/components/db/DbModelling"
import { BoardEditor } from "@/components/board/BoardEditor"
import { ColorPicker } from "@/components/color/ColorPicker"

function App() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />
      <main className="flex-1 px-4 py-4">
        <Tabs defaultValue="color" className="h-full flex flex-col">
          <TabsList className="grid w-full max-w-lg mx-auto grid-cols-4 flex-shrink-0">
            <TabsTrigger value="tree">Tree Structure</TabsTrigger>
            <TabsTrigger value="db">DB Modelling</TabsTrigger>
            <TabsTrigger value="board">Whiteboard</TabsTrigger>
            <TabsTrigger value="color">Color Picker</TabsTrigger>
          </TabsList>
          <TabsContent value="tree" className="mt-4 flex-1">
            <TreeCreator />
          </TabsContent>
          <TabsContent value="db" className="mt-4 flex-1">
            <DbModelling />
          </TabsContent>
          <TabsContent value="board" className="mt-4 flex-1">
            <BoardEditor />
          </TabsContent>
          <TabsContent value="color" className="mt-4 flex-1">
            <ColorPicker />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

export default App
