"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function Header() {
  const pathname = usePathname();

  const getTitle = () => {
    switch (pathname) {
      case "/":
        return "Invoice";
      case "/journal":
        return "Journal";
      case "/progress":
        return "Progrès Visuel";
      default:
        return "Fi9";
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/80 backdrop-blur-sm">
      <div className="container flex h-16 items-center">
        <Button variant="ghost" size="icon">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold ml-4">{getTitle()}</h1>
        <div className="flex flex-1 items-center justify-end gap-2">
            <Button variant="ghost" size="icon" asChild>
                <Link href="/login">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src="https://i.pravatar.cc/40" alt="User" />
                    <AvatarFallback>U</AvatarFallback>
                  </Avatar>
                </Link>
            </Button>
        </div>
      </div>
    </header>
  );
}
