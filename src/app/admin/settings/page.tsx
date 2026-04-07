/* eslint-disable */
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AdminSettings() {
    const [price, setPrice] = useState("");
    const [allowRescheduling, setAllowRescheduling] = useState(true);
    const [operatingDays, setOperatingDays] = useState<number[]>([1, 2, 3, 4, 5, 6]);
    const [disabledDates, setDisabledDates] = useState<string[]>([]);
    const [newDisabledDate, setNewDisabledDate] = useState("");
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    const [priceError, setPriceError] = useState<string | null>(null);

    const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value;
        setPrice(value);

        const numPrice = parseFloat(value);
        if (isNaN(numPrice)) {
            setPriceError("Preço inválido.");
        } else if (numPrice < 5.00) {
            setPriceError("O Asaas exige um valor mínimo de R$ 5,00 para cobranças.");
        } else {
            setPriceError(null);
        }
    };

    const weekDays = [
        { id: 0, label: "Dom" },
        { id: 1, label: "Seg" },
        { id: 2, label: "Ter" },
        { id: 3, label: "Qua" },
        { id: 4, label: "Qui" },
        { id: 5, label: "Sex" },
        { id: 6, label: "Sáb" }
    ];

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
                if (settingsData.operating_days) setOperatingDays(settingsData.operating_days);
                if (settingsData.disabled_dates) setDisabledDates(settingsData.disabled_dates);
            }

            setLoading(false);
        };
        fetchSettings();
    }, []);

    const handleSave = async () => {
        if (priceError) {
            setFeedback({ type: 'error', message: "Corrija os erros no formulário antes de salvar." });
            return;
        }
        
        setSaving(true);
        setFeedback(null);
        try {
            // Update Price
            const numPrice = parseFloat(price);
            if (!isNaN(numPrice)) {
                const { data: serviceData, error: serviceError } = await supabase
                    .from("services")
                    .update({ price: numPrice })
                    .eq("name", "Corte Tradicional")
                    .select();

                if (serviceError) {
                    console.error("[Admin Settings] Erro ao atualizar preço:", serviceError);
                    throw new Error(`Erro do banco: ${serviceError.message}`);
                }
                
                if (!serviceData || serviceData.length === 0) {
                    throw new Error("Falha de permissão (RLS): Você não tem privilégios de 'admin' no banco de dados para alterar o preço do serviço.");
                }
            }

            // Update Settings
            const { data: settingsData, error: settingsError } = await supabase
                .from("settings")
                .update({
                    allow_rescheduling: allowRescheduling,
                    operating_days: operatingDays,
                    disabled_dates: disabledDates
                })
                .eq("id", 1)
                .select();

            if (settingsError) {
                console.error("[Admin Settings] Erro ao atualizar settings:", settingsError);
                throw new Error(`Erro do banco: ${settingsError.message}`);
            }
            
            if (!settingsData || settingsData.length === 0) {
                throw new Error("Falha de permissão (RLS): Você não tem privilégios de 'admin' para alterar as configurações do sistema.");
            }

            setFeedback({ type: 'success', message: "Configurações salvas com sucesso!" });
            
            // Remove success message after 3 seconds
            setTimeout(() => setFeedback(null), 3000);
            
        } catch (error: any) {
            console.error("[Admin Settings] Erro geral:", error);
            setFeedback({ type: 'error', message: error.message || "Erro ao salvar configurações. Verifique o console." });
        } finally {
            setSaving(false);
        }
    };

    const toggleOperatingDay = (dayId: number) => {
        setOperatingDays(prev => 
            prev.includes(dayId) 
                ? prev.filter(d => d !== dayId)
                : [...prev, dayId].sort()
        );
    };

    const addDisabledDate = () => {
        if (!newDisabledDate) return;
        if (!disabledDates.includes(newDisabledDate)) {
            setDisabledDates([...disabledDates, newDisabledDate].sort());
        }
        setNewDisabledDate("");
    };

    const removeDisabledDate = (dateToRemove: string) => {
        setDisabledDates(disabledDates.filter(d => d !== dateToRemove));
    };

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center min-h-screen bg-black">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    const handleLogout = async () => {
        // Obter os dados do ghost user local antes de deslogar o admin
        const ghostEmail = localStorage.getItem("ghostEmail");
        const ghostPassword = localStorage.getItem("ghostPassword");
        const guestName = localStorage.getItem("guestName");
        
        await supabase.auth.signOut();
        
        // Se houver dados de um ghost user salvos, logar de volta silenciosamente
        if (ghostEmail && ghostPassword) {
            try {
                await supabase.auth.signInWithPassword({
                    email: ghostEmail,
                    password: ghostPassword
                });
                if (guestName) {
                    sessionStorage.setItem("cachedProfileName", guestName);
                }
            } catch (err) {
                console.error("Falha ao restaurar sessão ghost:", err);
            }
        }
        
        window.location.href = "/";
    };

    return (
        <main className="flex-1 w-full relative pb-24">
            <header className="px-6 py-8 bg-black/90 backdrop-blur-md sticky top-0 z-20 border-b border-white/10 flex items-start justify-between">
                <h1 className="text-2xl font-black text-white uppercase tracking-widest">Configurações</h1>
                <button onClick={handleLogout} className="size-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all shrink-0">
                    <span className="material-symbols-outlined text-[20px]">logout</span>
                </button>
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
                            <div className="relative">
                                <span className="absolute left-4 top-3 text-white/50 font-bold">R$</span>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="5.00"
                                    value={price}
                                    onChange={handlePriceChange}
                                    className={`w-full bg-white/5 border ${priceError ? 'border-red-500/50' : 'border-white/10'} rounded-xl pl-12 pr-4 py-3 text-white font-bold focus:outline-none ${priceError ? 'focus:border-red-500' : 'focus:border-primary'} transition-colors`}
                                />
                            </div>
                            {priceError && (
                                <p className="text-red-400 text-xs font-bold mt-2 animate-in fade-in slide-in-from-top-1">
                                    <span className="material-symbols-outlined text-[14px] align-middle mr-1">error</span>
                                    {priceError}
                                </p>
                            )}
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

                        {/* Dias da Semana */}
                        <div className="pt-4 border-t border-white/5 relative z-10">
                            <span className="text-white font-bold block mb-2">Dias da Semana de Funcionamento</span>
                            <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest mb-4">Selecione os dias em que a barbearia abre</p>
                            
                            <div className="flex flex-wrap gap-2">
                                {weekDays.map(day => {
                                    const isActive = operatingDays.includes(day.id);
                                    return (
                                        <button
                                            key={day.id}
                                            onClick={() => toggleOperatingDay(day.id)}
                                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                                                isActive 
                                                ? 'bg-primary border-primary text-black shadow-[0_0_15px_rgba(212,175,55,0.3)]' 
                                                : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                                            }`}
                                        >
                                            {day.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Feriados / Bloqueios Específicos */}
                        <div className="pt-4 border-t border-white/5 relative z-10">
                            <span className="text-white font-bold block mb-2">Bloquear Datas Específicas</span>
                            <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest mb-4">Feriados, férias ou folgas</p>
                            
                            <div className="flex gap-2 mb-4">
                                <input 
                                    type="date" 
                                    value={newDisabledDate}
                                    onChange={(e) => setNewDisabledDate(e.target.value)}
                                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-primary transition-colors [color-scheme:dark]"
                                />
                                <button 
                                    onClick={addDisabledDate}
                                    disabled={!newDisabledDate}
                                    className="bg-primary/20 text-primary border border-primary/30 px-4 rounded-xl font-bold uppercase text-xs tracking-widest disabled:opacity-50 transition-colors hover:bg-primary/30 flex items-center justify-center"
                                >
                                    <span className="material-symbols-outlined">add</span>
                                </button>
                            </div>

                            {disabledDates.length > 0 ? (
                                <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                    {disabledDates.map(date => (
                                        <div key={date} className="flex items-center justify-between bg-white/5 border border-white/5 px-4 py-2.5 rounded-lg group">
                                            <div className="flex items-center gap-2">
                                                <span className="material-symbols-outlined text-red-400 text-[16px]">event_busy</span>
                                                <span className="text-white text-sm font-medium">
                                                    {new Date(date + 'T12:00:00').toLocaleDateString('pt-BR')}
                                                </span>
                                            </div>
                                            <button 
                                                onClick={() => removeDisabledDate(date)}
                                                className="text-white/30 hover:text-red-500 transition-colors p-1"
                                            >
                                                <span className="material-symbols-outlined text-[18px]">delete</span>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-4 bg-white/5 rounded-xl border border-white/5">
                                    <p className="text-xs text-slate-500">Nenhuma data bloqueada.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {feedback && (
                    <div className={`p-4 rounded-xl text-sm font-bold flex items-center gap-3 ${
                        feedback.type === 'success' 
                        ? 'bg-green-500/10 border border-green-500/30 text-green-400' 
                        : 'bg-red-500/10 border border-red-500/30 text-red-400'
                    }`}>
                        <span className="material-symbols-outlined text-[20px]">
                            {feedback.type === 'success' ? 'check_circle' : 'error'}
                        </span>
                        <p>{feedback.message}</p>
                    </div>
                )}

                {/* Salvar */}
                <button 
                    onClick={handleSave} 
                    disabled={saving}
                    className="w-full h-14 bg-gradient-to-r from-primary to-[#bfa040] hover:from-[#cfaa33] hover:to-[#dcb650] text-black rounded-xl font-black text-sm uppercase tracking-widest transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 shadow-[0_10px_30px_-10px_rgba(212,175,55,0.4)]"
                >
                    {saving ? (
                        <>
                            Salvando...
                            <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                        </>
                    ) : (
                        <>
                            Salvar Configurações
                            <span className="material-symbols-outlined text-xl">save</span>
                        </>
                    )}
                </button>
            </div>
        </main>
    );
}
