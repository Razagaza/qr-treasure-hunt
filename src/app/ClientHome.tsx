'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users, User, ArrowRight, Sparkles, UserCircle } from 'lucide-react';

export default function ClientHome() {
    const router = useRouter();
    const [step, setStep] = useState<'group' | 'name'>('group');
    const [selectedGroup, setSelectedGroup] = useState<string>('');
    const [username, setUsername] = useState<string>('');

    const groups = ['A', 'B', 'C', 'D'];

    const handleGroupSelect = (group: string) => {
        setSelectedGroup(group);
        setStep('name');
    };

    const handleStart = async () => {
        if (!username.trim()) return;

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ group: selectedGroup, username })
            });

            if (res.ok) {
                router.push('/dashboard');
            } else {
                alert('Login failed. Please try again.');
            }
        } catch (e) {
            alert('An error occurred.');
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-indigo-900 via-purple-900 to-black text-white">

            <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="text-center space-y-2">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/10 backdrop-blur-lg mb-4 ring-1 ring-white/20 shadow-xl shadow-purple-500/20">
                        <Sparkles className="w-8 h-8 text-yellow-300" />
                    </div>
                    <h1 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-purple-200">
                        Treasure Hunt
                    </h1>
                    <p className="text-purple-200/80">Join your team and find the hidden treasures!</p>
                </div>

                <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 shadow-2xl">
                    {step === 'group' ? (
                        <div className="space-y-6">
                            <div className="text-center space-y-1">
                                <h2 className="text-xl font-semibold flex items-center justify-center gap-2">
                                    <Users className="w-5 h-5 text-purple-300" />
                                    Select Your Group
                                </h2>
                                <p className="text-sm text-gray-400">Choose your assigned team letter</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {groups.map((group) => (
                                    <button
                                        key={group}
                                        onClick={() => handleGroupSelect(group)}
                                        className="relative group relative overflow-hidden p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-purple-500/20 active:scale-95 text-center"
                                    >
                                        <div className="text-3xl font-bold mb-1">{group}</div>
                                        <div className="text-xs text-purple-200/60 uppercase tracking-wider">Team</div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="text-center space-y-1">
                                <h2 className="text-xl font-semibold flex items-center justify-center gap-2">
                                    <UserCircle className="w-5 h-5 text-purple-300" />
                                    Enter Your Name
                                </h2>
                                <p className="text-sm text-gray-400">Team {selectedGroup}</p>
                            </div>

                            <div className="space-y-4">
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        placeholder="Enter your name"
                                        className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
                                        autoFocus
                                        onKeyDown={(e) => e.key === 'Enter' && handleStart()}
                                    />
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setStep('group')}
                                        className="flex-1 py-3 px-4 rounded-xl border border-white/10 hover:bg-white/5 transition-colors text-sm font-medium text-gray-300"
                                    >
                                        Back
                                    </button>
                                    <button
                                        onClick={handleStart}
                                        disabled={!username.trim()}
                                        className="flex-[2] py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium shadow-lg shadow-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 group"
                                    >
                                        Start Game
                                        <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
