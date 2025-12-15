import React, { useState } from 'react';
import { Shield, Cpu, Activity, ArrowRight, Lock, ExternalLink } from 'lucide-react';

interface LandingPageProps {
  onLogin: (name: string, enableAI: boolean) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLogin }) => {
  const [name, setName] = useState('');
  const [enableAI, setEnableAI] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    setLoading(true);

    // Handle Google API Key Selection if AI is enabled and environment supports it
    // Cast window to any to avoid type conflicts with existing global declarations
    const win = window as any;
    if (enableAI && win.aistudio) {
        try {
            const hasKey = await win.aistudio.hasSelectedApiKey();
            if (!hasKey) {
                await win.aistudio.openSelectKey();
            }
        } catch (error: any) {
            console.error("AI Login Error:", error);
            // Handle race condition/stale state error per instructions
            if (error.message && error.message.includes("Requested entity was not found")) {
                try {
                    await win.aistudio.openSelectKey();
                } catch (retryError) {
                    console.error("Retry failed:", retryError);
                }
            }
        }
    }
    
    // Simulate connection delay and proceed
    setTimeout(() => {
        onLogin(name.trim(), enableAI);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-500 opacity-50" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-slate-950 to-slate-950 pointer-events-none" />

      <div className="relative z-10 max-w-md w-full bg-slate-900/40 border border-slate-800 rounded-2xl p-8 backdrop-blur-xl shadow-2xl">
        <div className="flex flex-col items-center text-center mb-8">
            <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center border border-slate-700 mb-4 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                <Activity className="w-8 h-8 text-emerald-500" />
            </div>
            <h1 className="text-3xl font-bold text-white font-mono tracking-tighter mb-2">SENTINEL<span className="text-slate-600">_SYSTEM</span></h1>
            <p className="text-slate-400 text-sm">Autonomous Accountability Protocol</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
                <label className="text-xs font-mono text-slate-500 uppercase tracking-wider block">Identity Verification</label>
                <input 
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-black/50 border border-slate-700 rounded-lg px-4 py-3 text-white font-mono placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
                    placeholder="ENTER CODENAME"
                    maxLength={30}
                    autoFocus
                />
            </div>

            <div 
                className={`bg-slate-900/50 border ${enableAI ? 'border-emerald-500/30' : 'border-slate-800'} rounded-lg p-4 cursor-pointer group transition-all`} 
                onClick={() => setEnableAI(!enableAI)}
            >
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded flex items-center justify-center transition-colors ${enableAI ? 'bg-purple-900/30 text-purple-400' : 'bg-slate-800 text-slate-600'}`}>
                            <Cpu size={18} />
                        </div>
                        <div>
                            <div className={`text-sm font-bold ${enableAI ? 'text-white' : 'text-slate-300'}`}>AI Overseer Link</div>
                            <div className="text-xs text-slate-500">Google Gemini 2.5 Flash</div>
                        </div>
                    </div>
                    <div className={`w-10 h-5 rounded-full relative transition-colors ${enableAI ? 'bg-emerald-600' : 'bg-slate-700'}`}>
                        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${enableAI ? 'left-6' : 'left-1'}`} />
                    </div>
                </div>
                
                {enableAI && (
                    <div className="mt-2 pt-2 border-t border-slate-800/50 text-[10px] text-slate-400 flex items-center gap-2">
                        <ExternalLink size={10} />
                        <span>Requires Google Account login.</span>
                        <a 
                            href="https://ai.google.dev/gemini-api/docs/billing" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:underline"
                            onClick={(e) => e.stopPropagation()}
                        >
                            Billing Info
                        </a>
                    </div>
                )}
            </div>

            <button 
                type="submit" 
                disabled={!name || loading}
                className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group"
            >
                {loading ? (
                    <span className="animate-pulse">ESTABLISHING LINK...</span>
                ) : (
                    <>
                        INITIALIZE PROTOCOL <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </>
                )}
            </button>
        </form>

        <div className="mt-6 flex justify-between items-end">
             <div className="flex gap-4 text-[10px] text-slate-600 font-mono">
                <span className="flex items-center gap-1"><Lock size={10} /> ENCRYPTED</span>
                <span className="flex items-center gap-1"><Shield size={10} /> SECURE</span>
             </div>
        </div>
      </div>
    </div>
  );
};