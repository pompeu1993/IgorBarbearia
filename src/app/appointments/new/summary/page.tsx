"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

type Service = {
    id: string;
    name: string;
    description: string;
    price: number;
    duration: number;
};

function SummaryContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const serviceId = searchParams.get("serviceId");
    const datetimeStr = searchParams.get("datetime");
    const { user } = useAuth();

    const [service, setService] = useState<Service | null>(null);
    const [loadingService, setLoadingService] = useState(true);
    const [showPixModal, setShowPixModal] = useState(false);

    // Payment Processing States
    const [checkingOut, setCheckingOut] = useState(false);
    const [confirming, setConfirming] = useState(false);
    const [paymentId, setPaymentId] = useState<string | null>(null);
    const [pixData, setPixData] = useState<{ image: string | null, text: string | null } | null>(null);
    const [showPixSection, setShowPixSection] = useState(false);

    // CPF handling
    const [userCpf, setUserCpf] = useState<string | null>(null);
    const [showCpfModal, setShowCpfModal] = useState(false);
    const [inputCpf, setInputCpf] = useState("");
    const [savingCpf, setSavingCpf] = useState(false);

    useEffect(() => {
        if (!serviceId) return;
        const fetchService = async () => {
            const { data } = await supabase.from("services").select("*").eq("id", serviceId).maybeSingle();
            if (data) setService(data);
            setLoadingService(false);

            if (user?.id) {
                const { data: profileData } = await supabase.from("profiles").select("cpf").eq("id", user.id).maybeSingle();
                if (profileData?.cpf) {
                    setUserCpf(profileData.cpf);
                }
            }
        };
        fetchService();
    }, [serviceId]);

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);
    };

    const parsedDate = datetimeStr ? new Date(datetimeStr) : new Date();
    const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    const weekDays = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
    const formattedDate = `${weekDays[parsedDate.getDay()]}, ${parsedDate.getDate()} ${monthNames[parsedDate.getMonth()]}`;
    const formattedTime = `${parsedDate.getHours().toString().padStart(2, '0')}:${parsedDate.getMinutes().toString().padStart(2, '0')}`;

    const handleCheckout = async (overrideCpf?: string) => {
        if (!user || !service || !datetimeStr) return;

        const actCpf = overrideCpf || userCpf;
        if (!actCpf) {
            setShowCpfModal(true);
            return;
        }

        setCheckingOut(true);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const headers: Record<string, string> = { "Content-Type": "application/json" };
            if (session?.access_token) {
                headers["Authorization"] = `Bearer ${session.access_token}`;
            }

            const res = await fetch("/api/checkout", {
                method: "POST",
                headers,
                body: JSON.stringify({
                    serviceId: service.id,
                    serviceName: service.name,
                    price: service.price,
                    date: datetimeStr,
                    userId: user.id
                })
            });

            const data = await res.json();
            if (res.ok && data.paymentId) {
                setPaymentId(data.paymentId);
                setPixData({ image: data.qrCodeImage, text: data.qrCodeText });
                setShowPixSection(true);
            } else {
                alert("Erro ao processar pagamento: " + (data.error || "Tente novamente."));
            }
        } catch (err) {
            console.error(err);
            alert("Erro de conexão ao processar agendamento.");
        } finally {
            setCheckingOut(false);
        }
    };

    const handleConfirmPayment = async (silent = false) => {
        if (!paymentId) return;
        if (!silent) setConfirming(true);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const headers: Record<string, string> = { "Content-Type": "application/json" };
            if (session?.access_token) {
                headers["Authorization"] = `Bearer ${session.access_token}`;
            }

            const res = await fetch("/api/checkout/confirm", {
                method: "POST",
                headers,
                body: JSON.stringify({ paymentId })
            });

            const data = await res.json();

            if (res.ok && data.success) {
                // Success, navigate to Dashboard
                router.replace("/");
                router.refresh(); // optionally force refresh
            } else {
                if (!silent) {
                    alert(data.message || "Não foi possível confirmar o pagamento. Ele pode ainda estar sendo processado.");
                }
            }
        } catch (err) {
            console.error(err);
        } finally {
            if (!silent) setConfirming(false);
        }
    };

    // Auto-check payment status every 10 seconds while pix section is visible
    useEffect(() => {
        let intervalId: NodeJS.Timeout;
        if (showPixSection && paymentId) {
            intervalId = setInterval(() => {
                handleConfirmPayment(true);
            }, 10000); // 10 seconds
        }

        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [showPixSection, paymentId]);

    const handleSaveCpf = async () => {
        if (!user) return;
        const unmasked = inputCpf.replace(/\D/g, "");
        if (unmasked.length !== 11) {
            alert("CPF inválido.");
            return;
        }
        setSavingCpf(true);
        const { error } = await supabase.from("profiles").update({ cpf: unmasked }).eq("id", user.id);
        setSavingCpf(false);

        if (error) {
            alert("Erro ao salvar CPF. Talvez este CPF já esteja em uso por outra conta.");
            return;
        }

        setUserCpf(unmasked);
        setShowCpfModal(false);
        // Automatically start checkout now that we have the CPF saved in DB
        handleCheckout(unmasked);
    };

    if (loadingService || !service) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-black">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-primary text-sm font-bold tracking-widest uppercase">Carregando resumo...</p>
            </div>
        );
    }

    return (
        <>
            <div className="sticky top-0 z-30 bg-black/90 backdrop-blur-xl border-b border-white/5 p-4">
                <div className="flex items-center justify-between mx-auto">
                    <button onClick={() => showPixSection ? setShowPixSection(false) : router.back()} className="text-white flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-white/10 transition-colors">
                        <span className="material-symbols-outlined">arrow_back_ios_new</span>
                    </button>
                    <h2 className="text-white text-lg font-bold tracking-tight">Pagamento</h2>
                    <div className="size-10"></div>
                </div>
            </div>

            <main className="flex-1 w-full px-5 pt-6 pb-[160px] relative">
                {!showPixSection ? (
                    <>
                        <section className="mb-8">
                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white mb-4 px-1">Resumo do Agendamento</h3>
                            <div className="p-5 rounded-2xl bg-[#0a0a0a] border border-white/10 shadow-lg relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/0 group-hover:bg-primary/10 blur-[40px] rounded-full -mr-16 -mt-16 transition-colors duration-500 pointer-events-none"></div>
                                <div className="flex items-start gap-4 relative z-10">
                                    <div className="size-14 rounded-2xl bg-gradient-to-br from-[#dca715] to-[#8a680b] flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(212,175,55,0.2)] text-black">
                                        <span className="material-symbols-outlined text-3xl">content_cut</span>
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-white font-extrabold text-xl leading-tight mb-3">{service.name}</h4>
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 text-white/90">
                                                <span className="material-symbols-outlined text-primary text-[18px]">calendar_today</span>
                                                <span className="text-sm font-medium">{formattedDate}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-white/90">
                                                <span className="material-symbols-outlined text-primary text-[18px]">schedule</span>
                                                <span className="text-sm font-medium">{formattedTime} • {service.duration} min</span>
                                            </div>
                                            <div className="flex items-start gap-2 text-white/90 pt-2 mt-2 border-t border-white/5">
                                                <span className="material-symbols-outlined text-primary text-[18px] mt-0.5">location_on</span>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-white">The Barber Elite</span>
                                                    <span className="text-[11px] leading-tight text-white/70">Av. Paulista, 1200 - Jardins, São Paulo</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section className="mb-8">
                            <div className="flex items-center justify-between mb-4 px-1">
                                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white">Método de Pagamento</h3>
                                <span className="text-[10px] bg-primary text-black px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Apenas Pix</span>
                            </div>
                            <div className="space-y-3">
                                <div className="bg-[#0a0a0a] border border-white/10 p-5 rounded-2xl flex items-center gap-4 relative overflow-hidden shadow-lg group">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/0 group-hover:bg-primary/10 blur-[40px] rounded-full -mr-16 -mt-16 transition-colors duration-500 pointer-events-none"></div>
                                    <div className="absolute right-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#dca715] to-[#8a680b]"></div>
                                    <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center p-2 shrink-0 relative z-10 shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                                        <img src="https://logospng.org/download/pix/logo-pix-icone-1024.png" alt="Pix" className="w-full h-full object-contain" />
                                    </div>
                                    <div className="flex-1 relative z-10">
                                        <span className="text-white font-extrabold block mb-0.5 text-lg">Pix</span>
                                        <span className="text-xs text-white/70 font-medium">Aprovação imediata</span>
                                    </div>
                                    <span className="material-symbols-outlined text-primary relative z-10 text-[28px]">radio_button_checked</span>
                                </div>
                            </div>
                        </section>

                        <section>
                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white mb-4 px-1">Valores</h3>
                            <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl p-6 space-y-4 shadow-lg relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/0 group-hover:bg-primary/10 blur-[40px] rounded-full -mr-16 -mt-16 transition-colors duration-500 pointer-events-none"></div>
                                <div className="relative z-10">
                                    <div className="flex justify-between items-center px-1 mb-4">
                                        <span className="text-white/90 font-medium">{service.name}</span>
                                        <span className="text-white font-bold">{formatPrice(service.price)}</span>
                                    </div>
                                    <div className="w-full h-px bg-white/10 mb-4"></div>
                                    <div className="flex justify-between items-center mb-2 px-1">
                                        <span className="text-white/90 font-medium">Subtotal</span>
                                        <span className="text-white font-bold">{formatPrice(service.price)}</span>
                                    </div>
                                    <div className="flex justify-between items-center mb-6 px-1">
                                        <span className="text-white/90 font-medium">Taxa de Reserva</span>
                                        <span className="text-primary font-bold">Grátis</span>
                                    </div>
                                    <div className="flex justify-between items-end px-1 pt-2">
                                        <div>
                                            <span className="text-[10px] text-white/70 font-black uppercase tracking-widest block mb-1">Valor Total</span>
                                            <span className="text-white text-3xl font-black tracking-tight leading-none">{formatPrice(service.price)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <div className="fixed bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-black via-black/90 to-transparent z-40 pointer-events-none">
                            <div className="max-w-md mx-auto pointer-events-auto">
                                <button
                                    onClick={() => handleCheckout()}
                                    disabled={checkingOut}
                                    className="w-full h-16 bg-gradient-to-r from-[#dca715] via-primary to-[#dca715] hover:bg-[100%_0] transition-all duration-500 disabled:opacity-50 text-black rounded-2xl font-black text-lg shadow-[0_15px_35px_-10px_rgba(220,167,21,0.5)] flex items-center justify-center gap-3 active:scale-[0.98]"
                                >
                                    <span>{checkingOut ? 'Gerando Pix...' : 'Pagar com Pix e Confirmar'}</span>
                                    {!checkingOut && <span className="material-symbols-outlined font-black">qr_code_2</span>}
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="bg-[#0a0a0a] border border-primary/30 rounded-3xl p-8 shadow-[0_0_50px_rgba(220,167,21,0.1)] relative overflow-hidden">
                            <div className="absolute inset-0 border border-primary/10 rounded-3xl pointer-events-none"></div>
                            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[60px] rounded-full -mr-32 -mt-32 pointer-events-none"></div>
                            
                            <div className="flex flex-col items-center text-center relative z-10">
                                <h2 className="text-white text-2xl font-extrabold mb-2 tracking-tight">Pagamento via Pix</h2>
                                <p className="text-white/60 text-sm mb-8">Escaneie o QR Code ou copie a chave abaixo</p>
                                
                                <div className="bg-white p-4 rounded-3xl mb-8 shadow-[0_0_40px_rgba(255,255,255,0.1)] w-56 h-56 flex items-center justify-center relative overflow-hidden group">
                                    {pixData?.image || pixData?.text ? (
                                        <img alt="Pix QR Code" className="w-[105%] h-[105%] object-cover block rounded-xl contrast-125 mix-blend-multiply group-hover:scale-105 transition-transform duration-500" src={pixData?.image || `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(pixData?.text || '')}`} />
                                    ) : (
                                        <div className="w-10 h-10 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
                                    )}
                                </div>
                                
                                <div className="flex items-center gap-2 mb-8 bg-primary/10 border border-primary/20 px-5 py-2.5 rounded-full">
                                    <span className="size-2.5 bg-primary rounded-full animate-pulse shadow-[0_0_10px_rgba(212,175,55,0.8)]"></span>
                                    <span className="text-primary text-xs font-black uppercase tracking-[0.2em]">Aguardando Pagamento...</span>
                                </div>
                                
                                <div className="w-full space-y-5 mb-10">
                                    <div className="text-left bg-black/50 p-5 rounded-2xl border border-white/5">
                                        <span className="text-[10px] text-primary/80 font-black uppercase tracking-[0.2em] block mb-3 px-1">Pix Copia e Cola</span>
                                        <div className="flex items-center gap-3 bg-white/5 border border-white/10 p-4 rounded-xl group active:bg-white/10 transition-colors cursor-pointer hover:border-primary/50" onClick={() => {
                                            if (pixData?.text) {
                                                navigator.clipboard.writeText(pixData.text);
                                                alert("Chave Pix copiada para a área de transferência!");
                                            }
                                        }}>
                                            <span className="text-sm font-bold text-white flex-1 truncate font-mono">{pixData?.text || "Gerando chave..."}</span>
                                            <button className="text-primary shrink-0 bg-primary/10 p-2 rounded-lg group-hover:bg-primary group-hover:text-black transition-colors">
                                                <span className="material-symbols-outlined text-xl">content_copy</span>
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <div className="flex justify-between items-center bg-black/50 p-5 rounded-2xl border border-white/5">
                                        <span className="text-xs text-white/70 font-black uppercase tracking-widest">Valor a pagar</span>
                                        <span className="text-2xl font-black text-white">{formatPrice(service.price)}</span>
                                    </div>
                                </div>
                                
                                <div className="w-full space-y-4">
                                    <button onClick={() => handleConfirmPayment(false)} disabled={confirming} className="w-full h-16 bg-gradient-to-r from-primary via-[#bfa040] to-primary text-black rounded-xl font-black text-lg shadow-[0_10px_30px_-10px_rgba(212,175,55,0.5)] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center hover:bg-[100%_0] duration-500 uppercase tracking-widest">
                                        {confirming ? "Confirmando..." : "Já fiz o pagamento"}
                                    </button>
                                    <button onClick={() => setShowPixSection(false)} disabled={confirming} className="text-slate-400 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest px-4 py-3 disabled:opacity-50 w-full rounded-xl hover:bg-white/5">
                                        Cancelar Pagamento
                                    </button>
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                {showCpfModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => !savingCpf && setShowCpfModal(false)}></div>
                        <div className="w-full max-w-sm bg-zinc-900 border border-primary/30 rounded-[2.5rem] p-8 shadow-[0_0_50px_rgba(220,167,21,0.15)] relative overflow-hidden z-10 animate-in fade-in zoom-in duration-300">
                            <h2 className="text-white text-xl font-extrabold mb-2 text-center tracking-tight">CPF Necessário</h2>
                            <p className="text-slate-400 text-xs mb-6 text-center leading-relaxed">Para gerar a cobrança Pix via Asaas, você deve associar um CPF ativo à sua conta nesta barbearia.</p>
                            <div className="relative mb-6">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-primary text-[20px]">badge</span>
                                <input
                                    type="text"
                                    value={inputCpf}
                                    onChange={(e) => {
                                        let val = e.target.value.replace(/\D/g, "");
                                        if (val.length <= 11) {
                                            val = val.replace(/(\d{3})(\d)/, "$1.$2");
                                            val = val.replace(/(\d{3})(\d)/, "$1.$2");
                                            val = val.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
                                            setInputCpf(val);
                                        }
                                    }}
                                    className="w-full bg-[#111] border border-white/10 rounded-xl pl-12 pr-4 py-4 text-white focus:outline-none focus:border-primary transition-colors text-sm"
                                    placeholder="000.000.000-00"
                                />
                            </div>
                            <button
                                onClick={handleSaveCpf}
                                disabled={savingCpf || inputCpf.length < 14}
                                className="w-full bg-gradient-to-r from-primary to-[#bfa040] text-black font-extrabold py-4 rounded-xl disabled:opacity-50 active:scale-[0.98] transition-transform text-sm uppercase tracking-widest"
                            >
                                {savingCpf ? "Salvando..." : "Confirmar e Pagar"}
                            </button>
                        </div>
                    </div>
                )}

            </main>

            <div className="fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-2xl border-t border-white/5 p-6 pb-[90px] z-40 max-w-md mx-auto">
                <div className="space-y-4">
                    <button onClick={() => handleCheckout()} disabled={checkingOut} className="w-full h-16 bg-gradient-to-r from-[#dca715] via-primary to-[#dca715] hover:bg-[100%_0] transition-all duration-500 disabled:opacity-50 text-black rounded-2xl font-black text-lg shadow-[0_15px_35px_-10px_rgba(220,167,21,0.5)] flex items-center justify-center gap-3 active:scale-[0.98]">
                        <span>{checkingOut ? "Processando..." : "Pagar com Pix e Confirmar"}</span>
                        {!checkingOut && <span className="material-symbols-outlined font-black">qr_code_2</span>}
                    </button>
                    <div className="flex items-center justify-center gap-2">
                        <span className="material-symbols-outlined text-slate-500 text-[16px]">info</span>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider text-center">
                            Cancelamentos não permitidos, apenas reagendamentos
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}

export default function SummaryPage() {
    return (
        <Suspense fallback={<div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-black">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-primary text-sm font-bold tracking-widest uppercase">Carregando...</p>
        </div>}>
            <SummaryContent />
        </Suspense>
    );
}
