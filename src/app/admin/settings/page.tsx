"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AdminSettings() {
    const [price, setPrice] = useState("");
    const [allowRescheduling, setAllowRescheduling] = useState(true);
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSettings = async () => {
            // Fetch price
            const { data: serviceData } = await supabase
                .from("services")
                .select("price")
                .eq("name", "Corte Tradicional")
                .maybeSingle();

            if (serviceData) {
                setPrice(serviceData.price.toString());
            }

            // Fetch generic settings
            const { data: settingsData } = await supabase
                .from("settings")
                .select("*")
                .eq("id", 1)
                .maybeSingle();

            if (settingsData) {
                setAllowRescheduling(settingsData.allow_rescheduling);
            }

            setLoading(false);
        };
        fetchSettings();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            // Update Price
            const numPrice = parseFloat(price);
            if (!isNaN(numPrice)) {
                await supabase
                    .from("services")
                    .update({ price: numPrice })
                    .eq("name", "Corte Tradicional");
            }

            // Update Settings
            await supabase
                .from("settings")
                .update({
                    allow_rescheduling: allowRescheduling
                })
                .eq("id", 1);

            alert("Configurações salvas com sucesso!");
        } catch (error) {
            console.error(error);
            alert("Erro ao salvar configurações.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center min-h-screen bg-black">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <main className="flex-1 w-full relative pb-24">
            <header className="px-6 py-8 bg-black/90 backdrop-blur-md sticky top-0 z-20 border-b border-white/10">
                <h1 className="text-2xl font-black text-white uppercase tracking-widest">Configurações</h1>
            </header>

            <div className="px-6 pt-6 space-y-8">
                {/* Preço do Corte */}
                <section>
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-primary mb-4">Serviços</h3>
                    <div className="bg-[#0a0a0a] border border-white/10 p-5 rounded-2xl shadow-lg relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/0 group-hover:bg-primary/10 blur-[40px] rounded-full -mr-16 -mt-16 transition-colors duration-500 pointer-events-none"></div>
                        <div className="relative z-10">
                            <label className="block text-[10px] text-white/70 font-bold uppercase tracking-widest mb-2">
                                Preço do Corte Tradicional (R$)
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-bold focus:outline-none focus:border-primary transition-colors"
                            />
                        </div>
                    </div>
                </section>

                {/* Regras de Negócio */}
                <section>
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-primary mb-4">Regras de Negócio</h3>
                    <div className="bg-[#0a0a0a] border border-white/10 p-5 rounded-2xl shadow-lg relative overflow-hidden space-y-6">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/0 group-hover:bg-primary/10 blur-[40px] rounded-full -mr-16 -mt-16 transition-colors duration-500 pointer-events-none"></div>
                        
                        <div className="flex items-center justify-between relative z-10">
                            <div>
                                <span className="text-white font-bold block mb-1">Permitir Reagendamento</span>
                                <span className="text-[10px] text-white/50 font-bold uppercase tracking-widest block max-w-[200px]">
                                    Clientes podem reagendar pelo app (até 24h antes)
                                </span>
                            </div>
                            <button
                                onClick={() => setAllowRescheduling(!allowRescheduling)}
                                className={`w-14 h-7 rounded-full relative transition-colors ${allowRescheduling ? 'bg-primary' : 'bg-white/10'}`}
                            >
                                <span className={`absolute top-1 left-1 bg-white size-5 rounded-full transition-transform ${allowRescheduling ? 'translate-x-7 bg-black' : 'translate-x-0'}`}></span>
                            </button>
                        </div>

                        {/* Future Implementation Note */}
                        <div className="pt-4 border-t border-white/5 relative z-10">
                            <span className="text-white font-bold block mb-2">Dias de Funcionamento</span>
                            <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest mb-3">Configuração de dias desabilitados no mês</p>
                            <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                                <span className="material-symbols-outlined text-slate-500 mb-1">build</span>
                                <p className="text-xs text-slate-400 font-medium">Em breve: Bloqueio de dias específicos diretamente por aqui.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Salvar */}
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full h-14 bg-gradient-to-r from-primary to-[#bfa040] hover:from-[#cfaa33] hover:to-[#dcb650] text-black rounded-xl font-black text-sm uppercase tracking-widest transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 shadow-[0_10px_30px_-10px_rgba(212,175,55,0.4)]"
                >
                    {saving ? 'Salvando...' : 'Salvar Configurações'}
                    <span className="material-symbols-outlined text-xl">save</span>
                </button>
            </div>
        </main>
    );
}
