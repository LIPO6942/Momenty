"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig
} from "@/components/ui/chart"

const chartData = [
  { day: "Lundi", completed: 5, goal: 8 },
  { day: "Mardi", completed: 6, goal: 8 },
  { day: "Mercredi", completed: 4, goal: 8 },
  { day: "Jeudi", completed: 7, goal: 8 },
  { day: "Vendredi", completed: 8, goal: 8 },
  { day: "Samedi", completed: 6, goal: 6 },
  { day: "Dimanche", completed: 5, goal: 6 },
]

const chartConfig = {
  completed: {
    label: "Terminées",
    color: "hsl(var(--accent))",
  },
  goal: {
    label: "Objectif",
    color: "hsl(var(--secondary))",
  },
} satisfies ChartConfig

export function WeeklyProgressChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Habitudes terminées</CardTitle>
        <CardDescription>Cette semaine vs. Objectif</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
          <BarChart accessibilityLayer data={chartData} margin={{ top: 20 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="day"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
            />
            <YAxis />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dot" />}
            />
            <Bar dataKey="goal" fill="var(--color-goal)" radius={4} />
            <Bar dataKey="completed" fill="var(--color-completed)" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
