"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function DateTimeSelection() {
    const searchParams = useSearchParams();
    const serviceId = searchParams.get("serviceId") || "1";

    // Mock service details based on ID
    const serviceName = serviceId === "2" ? "Corte + Barba Therapy" : serviceId === "3" ? "Degradê Americano" : "Corte Moderno";
    const servicePrice = serviceId === "2" ? "R$ 85,00" : serviceId === "3" ? "R$ 55,00" : "R$ 45,00";

    return (
        <>
            <div className="sticky top-0 z-30 bg-black/90 backdrop-blur-xl border-b border-white/5 p-4">
                <div className="flex items-center justify-between mx-auto">
                    <Link href="/appointments/new" className="text-white flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-white/10 transition-colors">
                        <span className="material-symbols-outlined">arrow_back_ios_new</span>
                    </Link>
                    <h2 className="text-white text-lg font-bold tracking-tight">Agendar Horário</h2>
                    <div className="size-10"></div>
                </div>
            </div>

            <main className="flex-1 w-full px-5 pb-40">
                <div className="mt-6 p-4 rounded-2xl bg-zinc-900 border border-primary/20 flex items-center gap-4 shadow-2xl">
                    <div className="size-12 rounded-xl bg-primary flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-black text-2xl">content_cut</span>
                    </div>
                    <div className="flex-1">
                        <h3 className="text-white font-bold text-base">{serviceName}</h3>
                        <p className="text-slate-400 text-sm">30 min • {servicePrice}</p>
                    </div>
                </div>

                <div className="mt-8">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-white text-xl font-bold">Outubro 2023</h3>
                        <div className="flex gap-2">
                            <button className="p-2 rounded-lg bg-zinc-900 border border-white/10 text-slate-400">
                                <span className="material-symbols-outlined">chevron_left</span>
                            </button>
                            <button className="p-2 rounded-lg bg-zinc-900 border border-white/10 text-slate-400">
                                <span className="material-symbols-outlined">chevron_right</span>
                            </button>
                        </div>
                    </div>
                    <div className="bg-zinc-900 rounded-2xl p-4 border border-white/5 shadow-xl">
                        <div className="grid grid-cols-7 mb-4">
                            <div className="text-primary/50 text-[10px] font-black uppercase text-center">Dom</div>
                            <div className="text-primary/50 text-[10px] font-black uppercase text-center">Seg</div>
                            <div className="text-primary/50 text-[10px] font-black uppercase text-center">Ter</div>
                            <div className="text-primary/50 text-[10px] font-black uppercase text-center">Qua</div>
                            <div className="text-primary/50 text-[10px] font-black uppercase text-center">Qui</div>
                            <div className="text-primary/50 text-[10px] font-black uppercase text-center">Sex</div>
                            <div className="text-primary/50 text-[10px] font-black uppercase text-center">Sáb</div>
                        </div>
                        <div className="grid grid-cols-7 gap-1">
                            <div className="h-12 flex items-center justify-center opacity-20"><span className="text-sm">1</span></div>
                            <div className="h-12 flex items-center justify-center opacity-20"><span className="text-sm">2</span></div>
                            <div className="h-12 flex items-center justify-center opacity-20"><span className="text-sm">3</span></div>
                            <div className="h-12 flex items-center justify-center opacity-20"><span className="text-sm">4</span></div>
                            <div className="h-12 flex items-center justify-center opacity-20"><span className="text-sm">5</span></div>
                            <button className="h-12 flex flex-col items-center justify-center rounded-xl hover:bg-white/5 transition-all">
                                <span className="text-sm font-bold">6</span>
                            </button>
                            <button className="h-12 flex flex-col items-center justify-center rounded-xl hover:bg-white/5 transition-all">
                                <span className="text-sm font-bold">7</span>
                            </button>
                            <button className="h-12 flex flex-col items-center justify-center rounded-xl bg-primary text-black shadow-[0_0_20px_rgba(212,175,55,0.3)] ring-2 ring-primary ring-offset-4 ring-offset-zinc-900">
                                <span className="text-sm font-black">8</span>
                                <div className="w-1 h-1 bg-black rounded-full mt-0.5"></div>
                            </button>
                            <button className="h-12 flex flex-col items-center justify-center rounded-xl hover:bg-white/5 transition-all">
                                <span className="text-sm font-bold text-white">9</span>
                            </button>
                            <button className="h-12 flex flex-col items-center justify-center rounded-xl hover:bg-white/5 transition-all">
                                <span className="text-sm font-bold text-white">10</span>
                            </button>
                            <button className="h-12 flex flex-col items-center justify-center rounded-xl hover:bg-white/5 transition-all">
                                <span className="text-sm font-bold text-white">11</span>
                            </button>
                            <button className="h-12 flex flex-col items-center justify-center rounded-xl hover:bg-white/5 transition-all">
                                <span className="text-sm font-bold text-white">12</span>
                            </button>
                            <button className="h-12 flex flex-col items-center justify-center rounded-xl hover:bg-white/5 transition-all">
                                <span className="text-sm font-bold text-white">13</span>
                            </button>
                            <button className="h-12 flex flex-col items-center justify-center rounded-xl hover:bg-white/5 transition-all">
                                <span className="text-sm font-bold text-white">14</span>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="mt-8 space-y-8">
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <span className="material-symbols-outlined text-primary text-lg">light_mode</span>
                            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Manhã</h4>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            <button className="py-3 rounded-xl border border-white/10 bg-zinc-900 text-sm font-bold text-slate-300 hover:border-primary/50">09:00</button>
                            <button className="py-3 rounded-xl border border-white/10 bg-zinc-900 text-sm font-bold text-slate-300 hover:border-primary/50">09:30</button>
                            <button className="py-3 rounded-xl border border-white/5 bg-zinc-900/50 text-sm font-medium text-slate-600 cursor-not-allowed line-through">10:00</button>
                            <button className="py-3 rounded-xl border border-white/10 bg-zinc-900 text-sm font-bold text-slate-300 hover:border-primary/50">10:30</button>
                        </div>
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <span className="material-symbols-outlined text-primary text-lg">wb_twilight</span>
                            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Tarde</h4>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            <button className="py-3 rounded-xl border border-white/10 bg-zinc-900 text-sm font-bold text-slate-300 hover:border-primary/50">14:00</button>
                            <button className="py-3 rounded-xl border border-white/10 bg-zinc-900 text-sm font-bold text-slate-300 hover:border-primary/50">14:30</button>
                            <button className="py-3 rounded-xl bg-primary text-black text-sm font-black shadow-[0_0_20px_rgba(212,175,55,0.4)] relative overflow-hidden">
                                18:00
                                <div className="absolute top-0 right-0 p-1">
                                    <span className="material-symbols-outlined text-[12px] font-black">check_circle</span>
                                </div>
                            </button>
                            <button className="py-3 rounded-xl border border-white/10 bg-zinc-900 text-sm font-bold text-slate-300 hover:border-primary/50">18:30</button>
                            <button className="py-3 rounded-xl border border-white/10 bg-zinc-900 text-sm font-bold text-slate-300 hover:border-primary/50">19:00</button>
                        </div>
                    </div>
                </div>
            </main>

            <div className="fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-2xl border-t border-white/5 p-5 pb-safe z-40 max-w-md mx-auto mb-[72px]">
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                        <div className="flex flex-col">
                            <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Resumo</span>
                            <span className="text-white text-sm font-bold">Dom, 8 Out • 18:00</span>
                        </div>
                        <div className="text-right">
                            <span className="text-primary text-lg font-black tracking-tight">{servicePrice}</span>
                        </div>
                    </div>
                    <Link href={`/appointments/new/summary?serviceId=${serviceId}`} className="w-full h-16 bg-gradient-to-r from-[#dca715] via-primary to-[#dca715] text-black rounded-2xl font-black text-lg shadow-[0_10px_30px_-10px_rgba(212,175,55,0.5)] flex items-center justify-center gap-3 active:scale-[0.98]">
                        <span>Confirmar Horário</span>
                        <span className="material-symbols-outlined font-black">calendar_check</span>
                    </Link>
                </div>
            </div>
        </>
    );
}

export default function DateTimePage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-primary">Carregando horários...</div>}>
            <DateTimeSelection />
        </Suspense>
    );
}
