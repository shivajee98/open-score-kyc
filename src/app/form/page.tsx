'use client';

import KycForm from '@/components/KycForm';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function KycPageContent() {
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    if (!token) {
        return (
            <main className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-center p-6">
                    <h1 className="text-2xl font-bold text-red-600 mb-2">Invalid Access</h1>
                    <p className="text-gray-600">No KYC token provided. Please use the link sent to your email/SMS.</p>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-white">
            <KycForm token={token} />
        </main>
    );
}

export default function Page() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center">Loading...</div>}>
            <KycPageContent />
        </Suspense>
    );
}
