import { ProfileForm } from "@/components/profile/profile-form";

export default function ProfilePage() {
  return (
    <div className="container mx-auto max-w-2xl px-4 py-8 min-h-screen">
        <div className="py-16 space-y-2">
            <h1 className="text-3xl font-bold text-foreground">Mon Profil</h1>
            <p className="text-muted-foreground">Gérez vos informations personnelles.</p>
        </div>
        <ProfileForm />
    </div>
  );
}
