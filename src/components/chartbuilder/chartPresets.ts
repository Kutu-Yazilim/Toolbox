import { type Preset } from "@/components/shared/PresetsDrawer"

export const CHART_PRESETS: Preset[] = [
    { name: "Monthly Sales", category: "Business", description: "12-month sales and revenue data", content: `Month,Sales,Revenue,Expenses
Jan,120,200,150
Feb,150,230,160
Mar,180,280,170
Apr,140,220,155
May,200,320,190
Jun,230,350,210
Jul,210,310,200
Aug,190,290,185
Sep,250,380,220
Oct,270,400,240
Nov,300,450,260
Dec,320,480,280` },
    { name: "Website Traffic", category: "Analytics", description: "Weekly page views and sessions", content: `Week,PageViews,Sessions,BounceRate
W1,12000,4500,42
W2,15000,5200,38
W3,13500,4800,40
W4,18000,6100,35` },
    { name: "Team Scores", category: "Comparison", description: "Team performance scores", content: `Team,Quality,Speed,Innovation
Alpha,85,72,90
Beta,78,88,65
Gamma,92,80,78
Delta,70,95,82` },
    { name: "JSON Array", category: "Formats", description: "Data as JSON array", content: JSON.stringify([
        { category: "A", value: 30 },
        { category: "B", value: 45 },
        { category: "C", value: 28 },
        { category: "D", value: 52 },
    ], null, 2) },
]
