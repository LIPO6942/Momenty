"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useRouter } from "next/navigation";

export function LoginForm() {
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, you would handle authentication here.
    // On success, redirect to the dashboard.
    router.push("/");
  };

  const handleGuest = () => {
    router.push("/");
  };

  return (
    <Card className="w-full max-w-sm border-none shadow-none">
      <CardHeader className="text-center">
        <CardTitle className="text-3xl font-bold">Connexion</CardTitle>
        <CardDescription>
          Accédez à votre journal de voyage.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleLogin}>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="m@exemple.com" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Mot de passe</Label>
            <Input id="password" type="password" required />
          </div>
          <Button type="submit" className="w-full">
            Se connecter
          </Button>
        </CardContent>
      </form>
      <CardFooter className="flex flex-col gap-4">
        <div className="relative w-full">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Ou continuer avec
            </span>
          </div>
        </div>
        <Button variant="outline" className="w-full" onClick={handleGuest}>
          Continuer en tant qu'invité
        </Button>
        <div className="mt-4 text-center text-sm">
          Pas de compte ?{" "}
          <Link href="/signup" className="font-semibold text-primary underline-offset-4 hover:underline">
            S'inscrire
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}
