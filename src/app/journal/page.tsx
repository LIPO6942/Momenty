import { WeeklyProgressChart } from "@/components/dashboard/weekly-progress-chart";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const history = [
  { date: "2024-07-22", time: "09:05", habit: "Boire de l'eau", status: "Terminé" },
  { date: "2024-07-22", time: "10:01", habit: "S'étirer", status: "Terminé" },
  { date: "2024-07-22", time: "11:02", habit: "Boire de l'eau", status: "Terminé" },
  { date: "2024-07-21", time: "15:30", habit: "Reposer les yeux", status: "Terminé" },
  { date: "2024-07-21", time: "14:00", habit: "Respiration profonde", status: "Oublié" },
  { date: "2024-07-20", time: "10:15", habit: "S'étirer", status: "Terminé" },
];

export default function JournalPage() {
  return (
    <div className="container mx-auto px-4 py-8 pb-24">
      <h1 className="text-3xl font-bold text-foreground mb-2">Journal de Progrès</h1>
      <p className="text-muted-foreground mb-8">
        Visualisez votre constance et célébrez vos réussites.
      </p>

      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Progression Hebdomadaire</h2>
        <WeeklyProgressChart />
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-4">Historique des actions</h2>
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
          <Table>
            <TableCaption>Un historique de vos 30 derniers jours d'activité.</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">Date</TableHead>
                <TableHead className="w-[100px]">Heure</TableHead>
                <TableHead>Habitude</TableHead>
                <TableHead className="text-right">Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((entry, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{entry.date}</TableCell>
                  <TableCell>{entry.time}</TableCell>
                  <TableCell>{entry.habit}</TableCell>
                  <TableCell className="text-right">
                    {entry.status === 'Terminé' ? (
                      <Badge className="bg-primary/20 text-primary-foreground border-transparent hover:bg-primary/30">
                        {entry.status}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-destructive/50 text-destructive bg-destructive/10">
                        {entry.status}
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
