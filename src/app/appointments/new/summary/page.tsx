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

    // CPF handling
    const [userCpf, setUserCpf] = useState<string | null>(null);
    const [showCpfModal, setShowCpfModal] = useState(false);
    const [inputCpf, setInputCpf] = useState("");
    const [savingCpf, setSavingCpf] = useState(false);

    useEffect(() => {
        if (!serviceId) return;
        const fetchService = async () => {
            const { data } = await supabase.from("services").select("*").eq("id", serviceId).single();
            if (data) setService(data);
            setLoadingService(false);

            if (user?.id) {
                const { data: profileData } = await supabase.from("profiles").select("cpf").eq("id", user.id).single();
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
                setShowPixModal(true);
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

    const handleConfirmPayment = async () => {
        if (!paymentId) return;
        setConfirming(true);

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

            if (res.ok) {
                // Success, navigate to Dashboard
                router.replace("/");
                router.refresh(); // optionally force refresh
            } else {
                alert("Não foi possível confirmar o pagamento. Ele pode ainda estar sendo processado.");
            }
        } catch (err) {
            console.error(err);
        } finally {
            setConfirming(false);
            // Optionally close the modal
        }
    };

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
                    <button onClick={() => router.back()} className="text-white flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-white/10 transition-colors">
                        <span className="material-symbols-outlined">arrow_back_ios_new</span>
                    </button>
                    <h2 className="text-white text-lg font-bold tracking-tight">Pagamento</h2>
                    <div className="size-10"></div>
                </div>
            </div>

            <main className="flex-1 w-full px-5 pt-6 pb-48 relative">
                <section className="mb-8">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 mb-4 px-1">Resumo do Agendamento</h3>
                    <div className="p-5 rounded-3xl bg-zinc-900 border border-white/5 shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-[50px] rounded-full -mr-16 -mt-16"></div>
                        <div className="flex items-start gap-4">
                            <div className="size-14 rounded-2xl bg-gradient-to-br from-primary to-[#bfa040] flex items-center justify-center shrink-0 shadow-lg">
                                <span className="material-symbols-outlined text-black text-3xl">content_cut</span>
                            </div>
                            <div className="flex-1">
                                <h4 className="text-white font-extrabold text-xl leading-tight">{service.name}</h4>
                                <div className="mt-3 space-y-2">
                                    <div className="flex items-center gap-2 text-slate-400">
                                        <span className="material-symbols-outlined text-primary text-[18px]">calendar_today</span>
                                        <span className="text-sm font-medium">{formattedDate}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-400">
                                        <span className="material-symbols-outlined text-primary text-[18px]">schedule</span>
                                        <span className="text-sm font-medium">{formattedTime} • {service.duration} min</span>
                                    </div>
                                    <div className="flex items-start gap-2 text-slate-400 pt-1 border-t border-white/5">
                                        <span className="material-symbols-outlined text-primary text-[18px] mt-0.5">location_on</span>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-semibold text-slate-200">The Barber Elite</span>
                                            <span className="text-[11px] leading-tight text-slate-500">Av. Paulista, 1200 - Jardins, São Paulo</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="mb-8">
                    <div className="flex items-center justify-between mb-4 px-1">
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Método de Pagamento</h3>
                        <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Apenas Pix</span>
                    </div>
                    <div className="space-y-3">
                        <div className="p-5 rounded-2xl bg-zinc-900 border-2 border-primary flex items-center justify-between shadow-xl ring-1 ring-primary/20">
                            <div className="flex items-center gap-4">
                                <div className="size-10 rounded-lg bg-[#32BCAD]/10 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-[#32BCAD]">qr_code_2</span>
                                </div>
                                <div>
                                    <span className="text-white font-bold text-lg block">Pix</span>
                                    <span className="text-slate-500 text-xs font-medium">Aprovação instantânea</span>
                                </div>
                            </div>
                            <div className="size-6 rounded-full border-2 border-primary flex items-center justify-center p-1">
                                <div className="size-full bg-primary rounded-full"></div>
                            </div>
                        </div>
                        <p className="text-[11px] text-slate-500 text-center mt-4 font-medium italic">O pagamento via Pix é obrigatório para garantir a exclusividade do horário.</p>
                    </div>
                </section>

                <section className="mt-10 border-t border-white/5 pt-6">
                    <div className="flex justify-between items-center mb-2 px-1">
                        <span className="text-slate-400 font-medium">Subtotal</span>
                        <span className="text-white font-bold">{formatPrice(service.price)}</span>
                    </div>
                    <div className="flex justify-between items-center mb-6 px-1">
                        <span className="text-slate-400 font-medium">Taxa de Reserva</span>
                        <span className="text-primary font-bold">Grátis</span>
                    </div>
                    <div className="flex justify-between items-end px-1">
                        <div>
                            <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest block mb-1">Valor Total</span>
                            <span className="text-white text-3xl font-black tracking-tight leading-none">{formatPrice(service.price)}</span>
                        </div>
                    </div>
                </section>

                {showPixModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => !confirming && setShowPixModal(false)}></div>
                        <div className="w-full max-w-sm bg-zinc-900 border border-primary/30 rounded-[2.5rem] p-8 shadow-[0_0_50px_rgba(220,167,21,0.15)] relative overflow-hidden z-10 animate-in fade-in zoom-in duration-300">
                            <div className="absolute inset-0 border border-primary/20 rounded-[2.5rem] pointer-events-none"></div>
                            <div className="flex flex-col items-center text-center">
                                <h2 className="text-white text-xl font-extrabold mb-6 tracking-tight">Pagamento via Pix</h2>
                                <div className="bg-white p-3 rounded-3xl mb-6 shadow-[0_0_30px_rgba(255,255,255,0.05)] w-48 h-48 flex items-center justify-center relative overflow-hidden">
                                    {pixData?.image || pixData?.text ? (
                                        <img alt="Pix QR Code" className="w-[110%] h-[110%] object-cover block rounded-xl contrast-125 mix-blend-multiply" src={pixData?.image || `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(pixData?.text || '')}`} />
                                    ) : (
                                        <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 mb-8 bg-primary/10 px-4 py-2 rounded-full">
                                    <span className="size-2 bg-primary rounded-full animate-pulse"></span>
                                    <span className="text-primary text-xs font-black uppercase tracking-widest">Aguardando Pagamento...</span>
                                </div>
                                <div className="w-full space-y-4 mb-10">
                                    <div className="text-left">
                                        <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest block mb-2 px-1">Pix Copia e Cola</span>
                                        <div className="flex items-center gap-3 bg-white/5 border border-white/10 p-4 rounded-2xl group active:bg-white/10 transition-colors cursor-pointer" onClick={() => {
                                            if (pixData?.text) {
                                                navigator.clipboard.writeText(pixData.text);
                                                alert("Pix copiado!");
                                            }
                                        }}>
                                            <span className="text-sm font-bold text-white flex-1 truncate">{pixData?.text || "Gerando chave..."}</span>
                                            <button className="text-primary shrink-0">
                                                <span className="material-symbols-outlined text-lg">content_copy</span>
                                            </button>
                                        </div>
                                    </div>
                                    <div className="text-left pt-2 border-t border-white/5">
                                        <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest block mb-1 px-1">Valor</span>
                                        <span className="text-2xl font-black text-white px-1">{formatPrice(service.price)}</span>
                                    </div>
                                </div>
                                <div className="w-full space-y-5">
                                    <button onClick={handleConfirmPayment} disabled={confirming} className="w-full h-16 bg-gradient-to-r from-primary via-[#bfa040] to-primary text-black rounded-2xl font-black text-lg shadow-[0_15px_30px_-10px_rgba(212,175,55,0.4)] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center">
                                        {confirming ? "Confirmando..." : "Já paguei"}
                                    </button>
                                    <button onClick={() => setShowPixModal(false)} disabled={confirming} className="text-slate-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest px-4 py-2 disabled:opacity-50">
                                        Cancelar Pagamento
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {showCpfModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => !savingCpf && setShowCpfModal(false)}></div>
                        <div className="w-full max-w-sm bg-zinc-900 border border-primary/30 rounded-[2.5rem] p-8 shadow-[0_0_50px_rgba(220,167,21,0.15)] relative overflow-hidden z-10 animate-in fade-in zoom-in duration-300">
                            <h2 className="text-white text-xl font-extrabold mb-2 text-center tracking-tight">CPF Necessário</h2>
                            <p className="text-slate-400 text-xs mb-6 text-center leading-relaxed">Para gerar a cobrança Pix via PagSeguro, você deve associar um CPF ativo à sua conta nesta barbearia.</p>
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

            <div className="fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-2xl border-t border-white/5 p-6 pb-24 z-40 max-w-md mx-auto">
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
