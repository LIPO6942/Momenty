import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function MapPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-foreground mb-6">Ma Carte de Voyage</h1>
      <Card>
        <CardContent className="p-2">
            <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                <p className="text-muted-foreground">La carte interactive sera bientôt disponible ici.</p>
            </div>
        </CardContent>
      </Card>
       <div className="mt-8">
            <h2 className="text-2xl font-bold mb-4">Lieux Visitées</h2>
            <div className="space-y-4">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Tozeur, Tunisie</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">3 instants capturés.</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Tunis, Tunisie</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">2 instants capturés.</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    </div>
  );
}
