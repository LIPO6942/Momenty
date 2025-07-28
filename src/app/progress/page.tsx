import { ProgressTracker } from "@/components/progress/progress-tracker";

export default function ProgressPage() {
  return (
    <div className="container mx-auto px-4 py-8 pb-24">
      <h1 className="text-3xl font-bold text-foreground mb-2">Suivi des Progrès Visuels</h1>
      <p className="text-muted-foreground mb-8">
        Capturez et visualisez votre parcours. Une image vaut mille mots.
      </p>
      <ProgressTracker />
    </div>
  );
}
