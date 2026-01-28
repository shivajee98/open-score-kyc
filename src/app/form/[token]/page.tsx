import KycForm from '@/components/KycForm';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Open Score | Secure KYC verification',
    description: 'Secure document verification powered by Open Score Infrastructure',
};

interface PageProps {
    params: { token: string };
}

export default function Page({ params }: PageProps) {
    return (
        <main className="min-h-screen bg-white">
            <KycForm token={params.token} />
        </main>
    );
}
