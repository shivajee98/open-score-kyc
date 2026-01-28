import KycForm from '@/components/KycForm';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Open Score | Secure KYC verification',
    description: 'Secure document verification powered by Open Score Infrastructure',
};

interface PageProps {
    params: Promise<{ token: string }>;
}

export default async function Page({ params }: PageProps) {
    const { token } = await params;
    return (
        <main className="min-h-screen bg-white">
            <KycForm token={token} />
        </main>
    );
}
