"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

type Appointment = {
    id: string;
    date: string;
    status: string;
    service: {
        name: string;
        price: number;
    };
};

export default function AppointmentsPage() {
    const { user, isAuthenticated } = useAuth();
    const router = useRouter();
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user || !isAuthenticated) {
            setLoading(false);
            return;
        }

        const fetchAppointments = async () => {
            setLoading(true);
            const now = new Date().toISOString();
            
            // Auto-complete past confirmed appointments before fetching
            await supabase
                .from("appointments")
                .update({ status: "COMPLETED" })
                .eq("user_id", user.id)
                .eq("status", "CONFIRMED")
                .lt("date", now);

            const { data } = await supabase
                .from("appointments")
                .select(`
                    id, 
                    date, 
                    status,
                    service:services (name, price)
                `)
                .eq("user_id", user.id)
                .in("status", ["PENDING", "CONFIRMED"])
                .gte("date", now)
                .order("date", { ascending: true });

            if (data) {
                const formattedData: Appointment[] = data.map((item: any) => ({
                    id: item.id,
                    date: item.date,
                    status: item.status,
                    service: Array.isArray(item.service) ? item.service[0] : item.service
                }));
                setAppointments(formattedData);
            }
            setLoading(false);
        };

        fetchAppointments();
    }, [user, isAuthenticated]);

    const handleCancel = async (id: string) => {
        if (!confirm("Deseja realmente cancelar este agendamento?")) return;

        const { error } = await supabase
            .from("appointments")
            .update({ status: "CANCELLED" })
            .eq("id", id);

        if (!error) {
            setAppointments(prev => prev.filter(app => app.id !== id));
        } else {
            alert("Erro ao cancelar o agendamento.");
        }
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);
    };

    const formatDate = (isoStr: string) => {
        const d = new Date(isoStr);
        const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
        return `${d.getDate()} de ${monthNames[d.getMonth()]}, ${d.getFullYear()}`;
    };

    const formatTime = (isoStr: string) => {
        const d = new Date(isoStr);
        return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
    };

    const canReschedule = (isoStr: string, status: string) => {
        // Pode reagendar se for CONFIRMADO e estiver no futuro
        if (status !== "CONFIRMED") return false;
        
        const apptDate = new Date(isoStr).getTime();
        const now = new Date().getTime();
        
        return apptDate > now;
    };

    return (
        <>
            <header className="flex items-center justify-between p-4 pt-6 bg-black/90 backdrop-blur-md sticky top-0 z-20 border-b border-primary/20">
                <Link href="/" className="p-2 -ml-2 rounded-full hover:bg-zinc-800 text-primary transition-colors">
                    <span className="material-symbols-outlined text-[28px]">chevron_left</span>
                </Link>
                <h1 className="text-sm font-extrabold tracking-[0.2em] text-white uppercase">Meus Agendamentos</h1>
                <div className="w-10"></div>
            </header>

            <main className="flex-1 overflow-y-auto pb-32 hide-scrollbar relative z-10 px-6 py-6">
                {!isAuthenticated ? (
                    <div className="flex flex-col items-center justify-center h-full text-center mt-12">
                        <h2 className="text-xl font-bold text-white uppercase tracking-tight mb-3">Faça login para ver seus agendamentos.</h2>
                        <Link href="/login" className="px-6 py-3 bg-primary text-black font-bold uppercase tracking-widest text-xs rounded-xl mt-4">IR PARA O LOGIN</Link>
                    </div>
                ) : loading ? (
                    <div className="flex justify-center p-10">
                        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                    </div>
                ) : appointments.length > 0 ? (
                    <div className="space-y-4">
                        {appointments.map((apt: any) => (
                            <div key={apt.id} className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-5 shadow-lg relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/0 group-hover:bg-primary/10 blur-[40px] rounded-full -mr-16 -mt-16 transition-colors duration-500 pointer-events-none"></div>
                                <div className="flex justify-between items-start mb-4 relative z-10">
                                    <div>
                                        <span className="text-[10px] font-bold text-primary uppercase tracking-widest block mb-1">
                                            {formatDate(apt.date)} • {formatTime(apt.date)}
                                        </span>
                                        <h3 className="text-white font-extrabold text-lg uppercase tracking-tight mb-1">{apt.service?.name}</h3>
                                        <p className="text-[11px] text-white/70 font-medium uppercase tracking-wide flex items-center gap-1">
                                            <span className="material-symbols-outlined text-[14px]">person</span>
                                            Profissional da Casa
                                        </p>
                                    </div>
                                    <span className="text-primary font-black text-lg tracking-tight bg-white/5 px-3 py-1 rounded-lg border border-white/5">
                                        {apt.service?.price ? formatPrice(apt.service.price) : ''}
                                    </span>
                                </div>
                                
                                <div className="flex items-center justify-between pt-4 mt-2 border-t border-white/5 relative z-10">
                                    <div className="flex items-center gap-2">
                                        <span className={`size-2 rounded-full ${apt.status === 'CONFIRMED' ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'}`}></span>
                                        <span className="text-[10px] text-white font-bold uppercase tracking-widest">
                                            {apt.status === 'CONFIRMED' ? 'Confirmado' : 'Aguardando Pagamento'}
                                        </span>
                                    </div>
                                    {apt.status === 'PENDING' && apt.payment_status === 'PENDING' && (
                                        <Link href={`/appointments/new/summary?serviceId=${apt.service_id}&datetime=${apt.date}`} className="text-[10px] bg-primary text-black font-black uppercase tracking-widest px-3 py-1.5 rounded-full hover:bg-primary-dark transition-colors shadow-sm">
                                            Pagar
                                        </Link>
                                    )}
                                </div>
                                
                                {canReschedule(apt.date, apt.status) && (
                                    <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between relative z-10">
                                        <div className="flex items-center gap-1.5 max-w-[65%]">
                                            <span className="material-symbols-outlined text-slate-400 text-[14px]">info</span>
                                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest leading-tight">Reagendamentos permitidos com até 24h de antecedência</span>
                                        </div>
                                        <Link
                                            href={`/appointments/reschedule?appointmentId=${apt.id}`}
                                            className="text-[10px] font-bold text-black uppercase tracking-widest transition-colors bg-primary hover:bg-[#cfaa33] px-4 py-2 rounded-full flex items-center gap-1 shadow-[0_0_15px_rgba(212,175,55,0.2)]"
                                        >
                                            Reagendar
                                        </Link>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center mt-12">
                        <div className="mb-8 relative">
                            <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full"></div>
                            <div className="relative w-24 h-24 bg-zinc-900/80 border border-primary/30 rounded-full flex items-center justify-center mx-auto mb-6">
                                <span className="material-symbols-outlined text-primary text-[48px]" style={{ fontVariationSettings: "'FILL' 0, 'wght' 200" }}>calendar_today</span>
                            </div>
                        </div>
                        <h2 className="text-xl font-bold text-white uppercase tracking-tight mb-3">Você não possui nenhum agendamento ativo.</h2>
                        <p className="text-slate-400 text-sm leading-relaxed mb-10 max-w-[280px]">
                            É hora de agendar seu próximo corte e manter o estilo em dia!
                        </p>
                        <Link href="/appointments/new" className="w-full h-16 bg-gradient-to-r from-primary to-[#bfa040] hover:from-[#cfaa33] hover:to-[#dcb650] text-black rounded-sm shadow-[0_4px_25px_-5px_rgba(212,175,55,0.4)] flex items-center justify-center gap-3 font-extrabold text-base uppercase tracking-[0.1em] transition-all active:scale-[0.98]">
                            <span className="material-symbols-outlined text-xl">add_circle</span>
                            AGENDAR NOVO HORÁRIO
                        </Link>
                    </div>
                )}
            </main>
        </>
    );
}
