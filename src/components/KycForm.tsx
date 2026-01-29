'use client';

import { useState, useEffect } from 'react';
import Camera from './Camera';
import { cn } from '@/lib/utils';
import { Landmark, User, FileText, CheckCircle2, Home, CreditCard } from 'lucide-react';

interface KycFormProps {
    token: string;
}

const STEPS = [
    { id: 'aadhar_front', label: 'Aadhaar Card (Front)', icon: FileText },
    { id: 'aadhar_back', label: 'Aadhaar Card (Back)', icon: FileText },
    { id: 'pan_front', label: 'PAN Card (Front)', icon: FileText },
    { id: 'selfie', label: 'Selfie with Loan Agent', icon: User },
    { id: 'prop_1', label: 'Property View (Side 1)', icon: Home },
    { id: 'prop_2', label: 'Property View (Side 2)', icon: Home },
    { id: 'prop_3', label: 'Property View (Side 3)', icon: Home },
];

export default function KycForm({ token }: KycFormProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const [loanData, setLoanData] = useState<any>(null);
    const [capturedData, setCapturedData] = useState<Record<string, { url: string; geo: any }>>({});
    const [status, setStatus] = useState<'loading' | 'active' | 'success' | 'error'>('loading');
    const [errorMsg, setErrorMsg] = useState('');

    // Bank Details State
    const [bankDetails, setBankDetails] = useState({
        bank_name: '',
        ifsc_code: '',
        account_holder_name: '',
        account_number: ''
    });
    const [isBankDetailsSubmitted, setIsBankDetailsSubmitted] = useState(false);

    useEffect(() => {
        verifyToken();
    }, [token]);

    const verifyToken = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/kyc/verify/${token}`);
            const data = await res.json();
            if (res.ok) {
                setLoanData(data);
                setStatus('active');
            } else {
                setStatus('error');
                setErrorMsg(data.error || "Invalid or Expired Link");
            }
        } catch (err) {
            setStatus('error');
            setErrorMsg("Connection failed. Check your internet.");
        }
    };

    const uploadToCloudinary = async (blob: Blob) => {
        const formData = new FormData();
        formData.append('file', blob);
        formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!);
        formData.append('cloud_name', process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!);

        const res = await fetch(`https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`, {
            method: 'POST',
            body: formData
        });
        const data = await res.json();
        return data.secure_url;
    };

    const handleCapture = async (blob: Blob, geo: any) => {
        try {
            const url = await uploadToCloudinary(blob);
            const stepId = STEPS[currentStep].id;
            setCapturedData(prev => ({
                ...prev,
                [stepId]: { url, geo }
            }));

            if (currentStep < STEPS.length - 1) {
                setCurrentStep(currentStep + 1);
            } else {
                submitFinalData({
                    ...capturedData,
                    [stepId]: { url, geo }
                });
            }
        } catch (err) {
            alert("Upload failed. Try again.");
        }
    };

    const submitFinalData = async (finalData: any) => {
        setStatus('loading');
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/kyc/submit/${token}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...finalData,
                    ...bankDetails // Include bank details
                })
            });
            if (res.ok) {
                setStatus('success');
            } else {
                setStatus('error');
                setErrorMsg("Submission failed. Contact support.");
            }
        } catch (err) {
            setStatus('error');
            setErrorMsg("Network error.");
        }
    };

    const handleBankChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setBankDetails({ ...bankDetails, [e.target.name]: e.target.value });
    };

    const submitBankDetails = (e: React.FormEvent) => {
        e.preventDefault();
        if (Object.values(bankDetails).some(val => !val)) {
            alert("Please fill all bank details.");
            return;
        }
        setIsBankDetailsSubmitted(true);
    };

    if (status === 'loading') return <div className="min-h-screen flex items-center justify-center p-8 text-slate-500 font-bold animate-pulse">VERIFYING SESSION...</div>;

    if (status === 'error') return (
        <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center gap-4 bg-slate-50">
            <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 mb-2">
                <Landmark size={40} />
            </div>
            <h1 className="text-2xl font-black text-slate-900 leading-tight">Link Unavailable</h1>
            <p className="text-slate-500 font-medium text-sm max-w-xs">{errorMsg}</p>
        </div>
    );

    if (status === 'success') return (
        <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center gap-4 bg-slate-50">
            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 mb-2">
                <CheckCircle2 size={40} />
            </div>
            <h1 className="text-3xl font-black text-slate-900 leading-tight">Verification Complete</h1>
            <p className="text-slate-500 font-medium text-sm max-w-xs">Your documents have been submitted securely. You can close this window now.</p>
        </div>
    );

    // Bank Details Form View
    if (status === 'active' && !isBankDetailsSubmitted) {
        return (
            <div className="max-w-md mx-auto min-h-screen bg-slate-50 pb-20">
                <header className="bg-slate-900 p-8 rounded-b-[3rem] shadow-2xl mb-8">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-white">
                            <CreditCard size={20} />
                        </div>
                        <div>
                            <h2 className="text-white font-black text-xl leading-none">Bank Details</h2>
                            <span className="text-slate-400 text-[10px] uppercase font-bold tracking-widest mt-1 block">Verify Beneficiary Info</span>
                        </div>
                    </div>
                </header>

                <div className="px-6">
                    <form onSubmit={submitBankDetails} className="space-y-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Bank Name</label>
                            <input
                                name="bank_name"
                                value={bankDetails.bank_name}
                                onChange={handleBankChange}
                                className="w-full p-3 bg-slate-50 rounded-xl border-none outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-800"
                                placeholder="e.g. HDFC Bank"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">IFSC Code</label>
                            <input
                                name="ifsc_code"
                                value={bankDetails.ifsc_code}
                                onChange={handleBankChange}
                                className="w-full p-3 bg-slate-50 rounded-xl border-none outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-800 uppercase"
                                placeholder="e.g. HDFC0001234"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Account Holder Name</label>
                            <input
                                name="account_holder_name"
                                value={bankDetails.account_holder_name}
                                onChange={handleBankChange}
                                className="w-full p-3 bg-slate-50 rounded-xl border-none outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-800"
                                placeholder="Name as per Passbook"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Account Number</label>
                            <input
                                name="account_number"
                                value={bankDetails.account_number}
                                onChange={handleBankChange}
                                type="number"
                                className="w-full p-3 bg-slate-50 rounded-xl border-none outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-800"
                                placeholder="xxxxxxxxxx"
                            />
                        </div>

                        <button type="submit" className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-200 active:scale-95 transition-transform">
                            Proceed to Camera Verification
                        </button>
                    </form>
                </div>

                <footer className="mt-8 text-center p-6">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                        Securely Encrypted by Open Score Infrastructure
                    </p>
                </footer>
            </div>
        );
    }

    const StepIcon = STEPS[currentStep].icon;

    return (
        <div className="max-w-md mx-auto min-h-screen bg-slate-50 pb-20">
            <header className="bg-slate-900 p-8 rounded-b-[3rem] shadow-2xl mb-8">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-white">
                        <StepIcon size={20} />
                    </div>
                    <div>
                        <h2 className="text-white font-black text-xl leading-none">KYC Step {currentStep + 1}</h2>
                        <span className="text-slate-400 text-[10px] uppercase font-bold tracking-widest mt-1 block">Verification for Loan ID: {loanData.loan_id}</span>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-blue-500 transition-all duration-500"
                        style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
                    />
                </div>
            </header>

            <div className="px-6">
                <Camera
                    key={currentStep}
                    label={STEPS[currentStep].label}
                    onCapture={handleCapture}
                />
            </div>

            <footer className="fixed bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-md border-t border-slate-100 flex justify-center">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center">
                    Securely Encrypted by Open Score Infrastructure
                </p>
            </footer>
        </div>
    );
}
