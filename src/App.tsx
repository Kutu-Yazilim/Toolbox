import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Header } from "@/components/layout/Header"
import { TreeCreator } from "@/components/tree/TreeCreator"
import { DbModelling } from "@/components/db/DbModelling"
import { BoardEditor } from "@/components/board/BoardEditor"

function App() {
  return (
    <div className="h-screen bg-background text-foreground flex flex-col overflow-hidden">
      <Header />
      <main className="flex-1 flex flex-col min-h-0">
        <Tabs defaultValue="tree" className="flex-1 flex flex-col min-h-0">
          <div className="px-4 pt-2 pb-1 flex-shrink-0">
            <TabsList className="w-fit">
              <TabsTrigger value="tree">Tree Structure</TabsTrigger>
              <TabsTrigger value="db">DB Modelling</TabsTrigger>
              <TabsTrigger value="board">Whiteboard</TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="tree" className="flex-1 min-h-0 px-4 pb-2">
            <TreeCreator />
          </TabsContent>
          <TabsContent value="db" className="flex-1 min-h-0">
            <DbModelling />
          </TabsContent>
          <TabsContent value="board" className="flex-1 min-h-0 px-4 pb-2">
            <BoardEditor />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

export default App
