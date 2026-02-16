import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Header } from "@/components/layout/Header"
import { TreeCreator } from "@/components/tree/TreeCreator"
import { DbModelling } from "@/components/db/DbModelling"
import { BoardEditor } from "@/components/board/BoardEditor"
import { ColorPicker } from "@/components/color/ColorPicker"

function App() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Tabs defaultValue="color" className="flex-1 flex flex-col">
        <Header
          tabs={
            <TabsList className="grid w-full max-w-lg mx-auto grid-cols-4">
              <TabsTrigger value="tree">Tree Structure</TabsTrigger>
              <TabsTrigger value="db">DB Modelling</TabsTrigger>
              <TabsTrigger value="board">Whiteboard</TabsTrigger>
              <TabsTrigger value="color">Color Picker</TabsTrigger>
            </TabsList>
          }
        />
        <main className="flex-1 px-4 py-4">
          <TabsContent value="tree" className="mt-4 h-full">
            <TreeCreator />
          </TabsContent>
          <TabsContent value="db" className="mt-4 h-full">
            <DbModelling />
          </TabsContent>
          <TabsContent value="board" className="mt-4 h-full">
            <BoardEditor />
          </TabsContent>
          <TabsContent value="color" className="mt-4 h-full">
            <ColorPicker />
          </TabsContent>
        </main>
      </Tabs>
    </div>
  )
}

export default App
