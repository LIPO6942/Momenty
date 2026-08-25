'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

function TimelineRedirectContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const id = searchParams.get('id') || searchParams.get('instant');
        if (id) {
            router.replace(`/?instant=${encodeURIComponent(id)}`);
        } else {
            router.replace('/');
        }
    }, [router, searchParams]);

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm font-medium">Chargement de votre souvenir...</p>
        </div>
    );
}

export default function TimelineRedirectPage() {
    return (
        <Suspense fallback={
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm font-medium">Chargement...</p>
            </div>
        }>
            <TimelineRedirectContent />
        </Suspense>
    );
}
