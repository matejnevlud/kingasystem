'use client';

import {useEffect} from 'react';
import {useRouter} from 'next/navigation';

export default function Home() {
    const router = useRouter();

    useEffect(() => {
        // Redirect to menu page
        // The middleware will handle redirecting to login if not authenticated
        router.push('/menu');
    }, [router]);

    return (
        <div className="min-h-screen flex items-center justify-center">
            <p className="text-lg">Loading...</p>
        </div>
    );
}
