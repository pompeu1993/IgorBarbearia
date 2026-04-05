"use client";

import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

type Service = {
    id: string;
    name: string;
    description: string;
    price: number;
    duration: number;
};

const remoteImageLoader = ({ src }: { src: string }) => src;

function SummaryContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const serviceId = searchParams.get("serviceId");
    const datetimeStr = searchParams.get("datetime");
    const { user } = useAuth();

    const [service, setService] = useState<Service | null>(null);
    const [loadingService, setLoadingService] = useState(true);

    // Payment Processing States
    const [checkingOut, setCheckingOut] = useState(false);
    const [confirming, setConfirming] = useState(false);
    const [paymentId, setPaymentId] = useState<string | null>(null);
    const [pixData, setPixData] = useState<{ image: string | null, text: string | null } | null>(null);
    const [showPixSection, setShowPixSection] = useState(false);

    // Guest Info
    const [guestName, setGuestName] = useState("");

    useEffect(() => {
        if (!serviceId) return;
        const fetchService = async () => {
            const { data } = await supabase.from("services").select("*").eq("id", serviceId).maybeSingle();
            if (data) setService(data);
            setLoadingService(false);
        };
        void fetchService();

        // Pre-fill name if user is logged in or has cached name
        if (user?.email) {
            let name = sessionStorage.getItem("cachedProfileName") || user.user_metadata?.name || user.email.split('@')[0];
            if (name.startsWith("ghost_")) {
                name = localStorage.getItem("guestName") || "Visitante";
            }
            setGuestName(name);
        } else {
            const cachedName = localStorage.getItem("guestName") || sessionStorage.getItem("cachedProfileName");
            if (cachedName) setGuestName(cachedName);
        }
    }, [serviceId, user]);

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);
    };

    const parsedDate = datetimeStr ? new Date(datetimeStr) : new Date();
    const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    const weekDays = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
    const formattedDate = `${weekDays[parsedDate.getDay()]}, ${parsedDate.getDate()} ${monthNames[parsedDate.getMonth()]}`;
    const formattedTime = `${parsedDate.getHours().toString().padStart(2, '0')}:${parsedDate.getMinutes().toString().padStart(2, '0')}`;

    // Determina se precisa pagar (Antes das 09:00 ou depois/igual 18:00)
    const hour = parsedDate.getHours();
    const requiresPayment = hour < 9 || hour >= 18;

    const handleCheckout = async () => {
        if (!service || !datetimeStr) return;

        if (!user && !guestName.trim()) {
            alert("Por favor, informe seu nome para continuar.");
            return;
        }

        setCheckingOut(true);

        try {
            const headers: Record<string, string> = { "Content-Type": "application/json" };
            if (user) {
                const { data: { session } } = await supabase.auth.getSession();
                if (session?.access_token) {
                    headers["Authorization"] = `Bearer ${session.access_token}`;
                }
            }

            const res = await fetch("/api/checkout", {
                method: "POST",
                headers,
                body: JSON.stringify({
                    serviceId: service.id,
                    serviceName: service.name,
                    price: service.price,
                    date: datetimeStr,
                    userId: user?.id,
                    userName: guestName.trim()
                })
            });

            const data = await res.json();
            
            if (res.ok) {
                // Sempre salvar o guestName se existir, para não perder o cache do nome do visitante
                if (guestName.trim()) {
                    localStorage.setItem("guestName", guestName.trim());
                    sessionStorage.setItem("cachedProfileName", guestName.trim());
                }

                // Se foi gerado um ghost user NOVO, loga no background
                if (data.ghostToken) {
                    // Esperar o login para garantir que a sessão seja criada antes de navegar
                    await supabase.auth.signInWithPassword({
                        email: data.ghostToken.email,
                        password: data.ghostToken.password
                    }).catch(console.error);
                }

                if (data.requiresPayment && data.paymentId) {
                    setPaymentId(data.paymentId);
                    setPixData({ image: data.qrCodeImage, text: data.qrCodeText });
                    setShowPixSection(true);
                } else {
                    // Sem pagamento necessário
                    alert("Agendamento confirmado com sucesso!");
                    router.replace("/");
                }
            } else {
                alert("Erro ao processar agendamento: " + (data.error || "Tente novamente."));
            }
        } catch (err) {
            console.error(err);
            alert("Erro de conexão ao processar agendamento.");
        } finally {
            setCheckingOut(false);
        }
    };

    const handleCancelPix = async () => {
        if (!paymentId) {
            setShowPixSection(false);
            return;
        }

        const confirmCancel = confirm("Tem certeza que deseja cancelar este agendamento?");
        if (!confirmCancel) return;

        setConfirming(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const headers: Record<string, string> = { "Content-Type": "application/json" };
            if (session?.access_token) {
                headers["Authorization"] = `Bearer ${session.access_token}`;
            }

            const res = await fetch("/api/checkout/cancel", {
                method: "POST",
                headers,
                body: JSON.stringify({ paymentId })
            });

            if (res.ok) {
                setPaymentId(null);
                setPixData(null);
                setShowPixSection(false);
                alert("Agendamento e cobrança cancelados com sucesso.");
                router.replace("/");
            } else {
                alert("Erro ao cancelar a cobrança.");
            }
        } catch (err) {
            console.error(err);
        } finally {
            setConfirming(false);
        }
    };

    const handleConfirmPayment = useCallback(async (silent = false) => {
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
                router.replace("/");
                router.refresh();
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
    }, [paymentId, router]);

    // Auto-check payment status every 5 seconds while pix section is visible
    useEffect(() => {
        let intervalId: NodeJS.Timeout;
        if (showPixSection && paymentId) {
            intervalId = setInterval(() => {
                handleConfirmPayment(true);
            }, 5000); // 5 seconds
        }
        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [handleConfirmPayment, showPixSection, paymentId]);

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
                    <h2 className="text-white text-lg font-bold tracking-tight">Resumo</h2>
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
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section className="mb-8">
                            <div className="flex items-center justify-between mb-4 px-1">
                                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white">Método de Pagamento</h3>
                                {requiresPayment ? (
                                    <span className="text-[10px] bg-primary text-black px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Apenas Pix</span>
                                ) : (
                                    <span className="text-[10px] bg-green-500/20 text-green-500 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Gratuito</span>
                                )}
                            </div>
                            
                            {requiresPayment ? (
                                <div className="space-y-3">
                                    <div className="bg-[#0a0a0a] border border-white/10 p-5 rounded-2xl flex items-center gap-4 relative overflow-hidden shadow-lg group">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/0 group-hover:bg-primary/10 blur-[40px] rounded-full -mr-16 -mt-16 transition-colors duration-500 pointer-events-none"></div>
                                        <div className="absolute right-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#dca715] to-[#8a680b]"></div>
                                        <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center p-2 shrink-0 relative z-10 shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                                            <Image priority loading="eager" src="https://logospng.org/download/pix/logo-pix-icone-1024.png" alt="Pix" className="w-full h-full object-contain" width={56} height={56} unoptimized loader={remoteImageLoader} />
                                        </div>
                                        <div className="flex-1 relative z-10">
                                            <span className="text-white font-extrabold block mb-0.5 text-lg">Pix</span>
                                            <span className="text-xs text-white/70 font-medium">Aprovação imediata</span>
                                        </div>
                                        <span className="material-symbols-outlined text-primary relative z-10 text-[28px]">radio_button_checked</span>
                                    </div>
                                    <p className="text-xs text-white/50 px-2 mt-2">
                                        Horários fora do expediente padrão (antes das 09h ou a partir das 18h) exigem pagamento antecipado para confirmação.
                                    </p>
                                </div>
                            ) : (
                                <div className="bg-[#0a0a0a] border border-white/10 p-5 rounded-2xl relative overflow-hidden shadow-lg">
                                    <p className="text-white/80 text-sm font-medium">
                                        Este horário não exige pagamento antecipado. O pagamento será feito diretamente no estabelecimento.
                                    </p>
                                </div>
                            )}
                        </section>

                        {!user && (
                            <section className="mb-8">
                                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white mb-4 px-1">Seus Dados</h3>
                                <div className="bg-[#0a0a0a] border border-white/10 p-5 rounded-2xl shadow-lg relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/0 group-hover:bg-primary/10 blur-[40px] rounded-full -mr-16 -mt-16 transition-colors duration-500 pointer-events-none"></div>
                                    <div className="relative z-10">
                                        <label className="block text-white/70 text-xs font-bold uppercase tracking-wider mb-2">Seu Nome</label>
                                        <input 
                                            type="text" 
                                            value={guestName}
                                            onChange={(e) => setGuestName(e.target.value)}
                                            placeholder="Ex: João Silva" 
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-primary transition-colors"
                                        />
                                        <p className="text-[10px] text-white/50 mt-2">Nenhum cadastro complexo é necessário. Apenas seu nome.</p>
                                    </div>
                                </div>
                            </section>
                        )}

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
                                        <span className="text-white/90 font-medium">Total</span>
                                        <span className="text-white font-bold">{formatPrice(service.price)}</span>
                                    </div>
                                    <div className="flex justify-between items-center mb-6 px-1">
                                        <span className="text-white/50 font-medium">A pagar agora</span>
                                        <span className="text-primary font-black text-xl">{requiresPayment ? formatPrice(service.price) : "R$ 0,00"}</span>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </>
                ) : (
                    <section className="flex flex-col items-center justify-center pt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(212,175,55,0.2)]">
                            <span className="material-symbols-outlined text-primary text-[40px]">qr_code_scanner</span>
                        </div>
                        <h3 className="text-white font-black text-2xl tracking-tight mb-2 text-center">Pagamento Pix</h3>
                        <p className="text-white/60 text-center mb-8 max-w-[280px] text-sm">Escaneie o QR Code abaixo ou copie o código Pix para pagar.</p>

                        {pixData?.image ? (
                            <div className="bg-white p-4 rounded-3xl shadow-2xl mb-8 relative group">
                                <div className="absolute -inset-1 bg-gradient-to-r from-[#dca715] to-[#8a680b] rounded-[26px] blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
                                <div className="relative bg-white rounded-2xl p-2">
                                    <Image src={pixData.image} alt="QR Code Pix" width={220} height={220} className="w-[220px] h-[220px] object-contain" unoptimized loader={remoteImageLoader} />
                                </div>
                            </div>
                        ) : (
                            <div className="w-[252px] h-[252px] bg-[#0a0a0a] border border-white/10 rounded-3xl mb-8 flex items-center justify-center">
                                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        )}

                        <div className="w-full bg-[#0a0a0a] border border-white/10 rounded-2xl p-5 mb-8 relative overflow-hidden">
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary"></div>
                            <p className="text-white/90 text-sm mb-4 font-medium text-center">Ou copie o código Pix (Copia e Cola):</p>
                            <div className="flex gap-2">
                                <input type="text" readOnly value={pixData?.text || ""} className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white/50 text-sm font-mono focus:outline-none" />
                                <button onClick={() => {
                                    if (pixData?.text) {
                                        navigator.clipboard.writeText(pixData.text);
                                        alert("Código Pix copiado!");
                                    }
                                }} className="bg-white/10 hover:bg-white/20 text-white rounded-xl px-4 flex items-center justify-center transition-colors">
                                    <span className="material-symbols-outlined text-[20px]">content_copy</span>
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 text-white/60 text-xs font-medium mb-12 bg-white/5 px-4 py-3 rounded-full border border-white/5">
                            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin shrink-0"></div>
                            Aguardando confirmação do pagamento...
                        </div>

                        <div className="w-full space-y-4">
                            <button onClick={() => handleConfirmPayment(false)} disabled={confirming} className="w-full h-14 bg-gradient-to-r from-[#dca715] via-primary to-[#dca715] text-black rounded-2xl flex items-center justify-center font-black text-sm uppercase tracking-[0.15em] transition-all hover:shadow-[0_0_30px_rgba(212,175,55,0.4)] disabled:opacity-50">
                                {confirming ? 'Verificando...' : 'Já realizei o pagamento'}
                            </button>
                            <button onClick={handleCancelPix} disabled={confirming} className="w-full h-14 bg-transparent border border-white/10 text-white/50 hover:text-white hover:bg-white/5 rounded-2xl flex items-center justify-center font-bold text-sm uppercase tracking-[0.15em] transition-all">
                                Cancelar
                            </button>
                        </div>
                    </section>
                )}
            </main>

            {/* Bottom Sticky Action Bar for Checkout */}
            {!showPixSection && (
                <div className="fixed bottom-[72px] left-0 right-0 bg-black/90 backdrop-blur-xl border-t border-white/10 p-5 px-6 z-40 max-w-md mx-auto pb-6">
                    <button 
                        onClick={handleCheckout} 
                        disabled={checkingOut || (!user && !guestName.trim())} 
                        className="w-full h-14 bg-gradient-to-r from-[#dca715] via-primary to-[#dca715] text-black rounded-2xl shadow-[0_10px_30px_-5px_rgba(212,175,55,0.3)] flex items-center justify-center font-black text-sm uppercase tracking-[0.15em] transition-all disabled:opacity-50 hover:bg-[100%_0] duration-500 hover:shadow-[0_0_30px_rgba(212,175,55,0.4)]"
                    >
                        {checkingOut ? 'Processando...' : (requiresPayment ? 'Confirmar e Pagar' : 'Confirmar Agendamento')}
                    </button>
                </div>
            )}
        </>
    );
}

export default function Summary() {
    return (
        <Suspense fallback={
            <div className="flex-1 flex items-center justify-center min-h-screen bg-black">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        }>
            <SummaryContent />
        </Suspense>
    );
}