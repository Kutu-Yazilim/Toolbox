import { type Preset } from "@/components/shared/PresetsDrawer"

export const CSV_PRESETS: Preset[] = [
    { name: "Employee List", category: "Sample Data", description: "Basic employee data with 5 columns", content: `Name,Age,City,Role,Salary
Alice,30,New York,Engineer,95000
Bob,25,San Francisco,Designer,82000
Charlie,35,London,Manager,110000
Diana,28,Berlin,Developer,88000
Eve,32,Tokyo,Analyst,76000` },
    { name: "Sales Data", category: "Sample Data", description: "Monthly sales figures", content: `Month,Product,Units,Revenue
Jan,Widget A,120,2400
Feb,Widget A,150,3000
Mar,Widget B,80,4000
Apr,Widget A,200,4000
May,Widget B,95,4750` },
    { name: "TSV Example", category: "Formats", description: "Tab-separated data", content: `Name\tScore\tGrade
Alice\t95\tA
Bob\t82\tB
Charlie\t91\tA` },
]
