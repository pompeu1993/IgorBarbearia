"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function SummaryContent() {
    const searchParams = useSearchParams();
    const serviceId = searchParams.get("serviceId") || "1";
    const [showPixModal, setShowPixModal] = useState(false);

    const serviceName = serviceId === "2" ? "Corte + Barba Therapy" : serviceId === "3" ? "Degradê Americano" : "Corte Moderno";
    const servicePrice = serviceId === "2" ? "R$ 85,00" : serviceId === "3" ? "R$ 55,00" : "R$ 45,00";

    return (
        <>
            <div className="sticky top-0 z-30 bg-black/90 backdrop-blur-xl border-b border-white/5 p-4">
                <div className="flex items-center justify-between mx-auto">
                    <Link href={`/appointments/new/datetime?serviceId=${serviceId}`} className="text-white flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-white/10 transition-colors">
                        <span className="material-symbols-outlined">arrow_back_ios_new</span>
                    </Link>
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
                                <h4 className="text-white font-extrabold text-xl leading-tight">{serviceName}</h4>
                                <div className="mt-3 space-y-2">
                                    <div className="flex items-center gap-2 text-slate-400">
                                        <span className="material-symbols-outlined text-primary text-[18px]">calendar_today</span>
                                        <span className="text-sm font-medium">Domingo, 8 Out</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-400">
                                        <span className="material-symbols-outlined text-primary text-[18px]">schedule</span>
                                        <span className="text-sm font-medium">18:00 • 30 min</span>
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
                        <span className="text-white font-bold">{servicePrice}</span>
                    </div>
                    <div className="flex justify-between items-center mb-6 px-1">
                        <span className="text-slate-400 font-medium">Taxa de Reserva</span>
                        <span className="text-primary font-bold">Grátis</span>
                    </div>
                    <div className="flex justify-between items-end px-1">
                        <div>
                            <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest block mb-1">Valor Total</span>
                            <span className="text-white text-3xl font-black tracking-tight leading-none">{servicePrice}</span>
                        </div>
                    </div>
                </section>

                {showPixModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowPixModal(false)}></div>
                        <div className="w-full max-w-sm bg-zinc-900 border border-primary/30 rounded-[2.5rem] p-8 shadow-[0_0_50px_rgba(220,167,21,0.15)] relative overflow-hidden z-10 animate-in fade-in zoom-in duration-300">
                            <div className="absolute inset-0 border border-primary/20 rounded-[2.5rem] pointer-events-none"></div>
                            <div className="flex flex-col items-center text-center">
                                <h2 className="text-white text-xl font-extrabold mb-6 tracking-tight">Pagamento via Pix</h2>
                                <div className="bg-white p-3 rounded-3xl mb-6 shadow-[0_0_30px_rgba(255,255,255,0.05)]">
                                    <img alt="Pix QR Code" className="w-48 h-48 block rounded-xl grayscale contrast-125" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC6A7nC8xGH3gkVHuw-WX6ooShoQ_8VxbwC9NSXKjIv2ur_wEzeTs2LnMflAG9KfmfQelecBMQ9cHHCKzTHPTPFmYAFk8yl9aIBD8EOKNtBFTOODqIkdk4KueIsYt80LtBRESeJ5lDTyfagejEQYIfF5aT18nho0sqOtWGjkZl-CAcJ61TD0q7_ir56opZQNWaFXNQ8oSvmE0dXTr8yEwZxnb_mWOFlQjHA40dRehdB3_CJkUHBs2DqAeRTNPCrZ_G15Q5zbFZ8lEI" />
                                </div>
                                <div className="flex items-center gap-2 mb-8 bg-primary/10 px-4 py-2 rounded-full">
                                    <span className="size-2 bg-primary rounded-full animate-pulse"></span>
                                    <span className="text-primary text-xs font-black uppercase tracking-widest">Aguardando Pagamento...</span>
                                </div>
                                <div className="w-full space-y-4 mb-10">
                                    <div className="text-left">
                                        <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest block mb-2 px-1">Chave Pix (E-mail)</span>
                                        <div className="flex items-center gap-3 bg-white/5 border border-white/10 p-4 rounded-2xl group active:bg-white/10 transition-colors cursor-pointer">
                                            <span className="text-sm font-bold text-white flex-1 truncate">pagamento@exclusivebarber.com</span>
                                            <button className="text-primary shrink-0">
                                                <span className="material-symbols-outlined text-lg">content_copy</span>
                                            </button>
                                        </div>
                                    </div>
                                    <div className="text-left pt-2 border-t border-white/5">
                                        <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest block mb-1 px-1">Valor</span>
                                        <span className="text-2xl font-black text-white px-1">{servicePrice}</span>
                                    </div>
                                </div>
                                <div className="w-full space-y-5">
                                    <Link href="/" className="w-full h-16 bg-gradient-to-r from-primary via-[#bfa040] to-primary text-black rounded-2xl font-black text-lg shadow-[0_15px_30px_-10px_rgba(212,175,55,0.4)] active:scale-[0.98] transition-transform flex items-center justify-center">
                                        Já paguei
                                    </Link>
                                    <button onClick={() => setShowPixModal(false)} className="text-slate-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest px-4 py-2">
                                        Cancelar Pagamento
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

            </main>

            <div className="fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-2xl border-t border-white/5 p-6 pb-24 z-40 max-w-md mx-auto">
                <div className="space-y-4">
                    <button onClick={() => setShowPixModal(true)} className="w-full h-16 bg-gradient-to-r from-[#dca715] via-primary to-[#dca715] hover:bg-[100%_0] transition-all duration-500 text-black rounded-2xl font-black text-lg shadow-[0_15px_35px_-10px_rgba(220,167,21,0.5)] flex items-center justify-center gap-3 active:scale-[0.98]">
                        <span>Pagar com Pix e Confirmar</span>
                        <span className="material-symbols-outlined font-black">qr_code_2</span>
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
        <Suspense fallback={<div className="p-8 text-center text-primary">Carregando resumo...</div>}>
            <SummaryContent />
        </Suspense>
    );
}
