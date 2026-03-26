"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
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

function DateTimeSelection() {
    const searchParams = useSearchParams();
    const serviceId = searchParams.get("serviceId");
    const { isAuthenticated } = useAuth();

    const [service, setService] = useState<Service | null>(null);
    const [loadingService, setLoadingService] = useState(true);

    const [currentMonth, setCurrentMonth] = useState(() => {
        const d = new Date();
        d.setDate(1);
        return d;
    });

    // Select today by default if it's the current month, else null
    const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [bookedSlots, setBookedSlots] = useState<string[]>([]);
    const [loadingSlots, setLoadingSlots] = useState(false);

    useEffect(() => {
        if (!serviceId) return;
        const fetchService = async () => {
            const { data } = await supabase.from("services").select("*").eq("id", serviceId).single();
            if (data) setService(data);
            setLoadingService(false);
        };
        fetchService();
    }, [serviceId]);

    // Fetch appointments for the selected date
    useEffect(() => {
        if (!selectedDate) {
            setBookedSlots([]);
            return;
        }

        const fetchAppointments = async () => {
            setLoadingSlots(true);
            const start = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), 0, 0, 0);
            const end = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), 23, 59, 59);

            const { data } = await supabase.rpc("get_booked_slots", {
                start_time: start.toISOString(),
                end_time: end.toISOString()
            });

            if (data) {
                // Extracts "HH:mm" from local time
                const slots = data.map((app: any) => {
                    const d = new Date(app.booked_date);
                    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
                });
                setBookedSlots(slots);
            } else {
                setBookedSlots([]);
            }
            setLoadingSlots(false);
            // Reset selected time when date changes
            setSelectedTime(null);
        };

        fetchAppointments();
    }, [selectedDate]);

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);
    };

    const nextMonth = () => {
        const m = new Date(currentMonth);
        m.setMonth(m.getMonth() + 1);
        setCurrentMonth(m);
    };

    const prevMonth = () => {
        const m = new Date(currentMonth);
        m.setMonth(m.getMonth() - 1);
        setCurrentMonth(m);
    };

    const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

    const generateCalendar = () => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const daysInMonth = getDaysInMonth(year, month);
        const firstDay = getFirstDayOfMonth(year, month);

        const days = [];
        for (let i = 0; i < firstDay; i++) {
            days.push(null);
        }
        for (let i = 1; i <= daysInMonth; i++) {
            days.push(new Date(year, month, i));
        }
        return days;
    };

    const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

    const isSameDay = (d1: Date, d2: Date) => {
        return d1.getDate() === d2.getDate() && d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear();
    };

    const isPastDay = (d: Date) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return d.getTime() < today.getTime();
    };

    // Combine Date and Time
    const finalDateTimeStr = (() => {
        if (!selectedDate || !selectedTime) return null;
        const [hours, minutes] = selectedTime.split(":").map(Number);
        const dt = new Date(selectedDate);
        dt.setHours(hours, minutes, 0, 0);
        return dt.toISOString();
    })();

    // Generate timeslots (simple 30 minute jumps)
    const morningSlots = ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30"];
    const afternoonSlots = ["14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00"];

    const renderTimeBtn = (time: string) => {
        const isBooked = bookedSlots.includes(time);
        const isSelected = selectedTime === time;

        const isPastTime = (() => {
            if (!selectedDate) return false;
            const today = new Date();
            if (!isSameDay(selectedDate, today)) return false;
            const [h, m] = time.split(":").map(Number);
            return (today.getHours() * 60 + today.getMinutes()) >= (h * 60 + m);
        })();

        const disabled = isBooked || isPastTime;

        if (disabled) {
            return (
                <button key={time} disabled className="py-3 rounded-xl border border-white/5 bg-[#050505] text-sm font-medium text-white cursor-not-allowed line-through opacity-80">
                    {time}
                </button>
            );
        }

        if (isSelected) {
            return (
                <button key={time} onClick={() => setSelectedTime(time)} className="py-3 rounded-xl bg-gradient-to-br from-[#dca715] to-[#8a680b] text-black text-sm font-black shadow-[0_0_20px_rgba(212,175,55,0.4)] relative overflow-hidden transition-all duration-300">
                    {time}
                    <div className="absolute top-0 right-0 p-1">
                        <span className="material-symbols-outlined text-[12px] font-black">check_circle</span>
                    </div>
                </button>
            );
        }

        return (
            <button key={time} onClick={() => setSelectedTime(time)} className="py-3 rounded-xl border border-white/10 bg-[#0a0a0a] text-sm font-bold text-white hover:border-primary/50 transition-colors shadow-lg relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-16 h-16 bg-primary/0 group-hover:bg-primary/10 blur-[20px] rounded-full -mr-8 -mt-8 transition-colors duration-500 pointer-events-none"></div>
                <span className="relative z-10">{time}</span>
            </button>
        );
    };

    if (loadingService || !service) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-black">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-primary text-sm font-bold tracking-widest uppercase">Carregando...</p>
            </div>
        );
    }

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

            <main className="flex-1 w-full px-5 pb-[130px]">
                <div className="mt-6 p-5 rounded-2xl bg-[#0a0a0a] border border-white/10 flex items-center gap-4 shadow-lg relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/0 group-hover:bg-primary/10 blur-[40px] rounded-full -mr-16 -mt-16 transition-colors duration-500 pointer-events-none"></div>
                    <div className="size-14 rounded-2xl bg-gradient-to-br from-[#dca715] to-[#8a680b] flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(212,175,55,0.2)] text-black relative z-10">
                        <span className="material-symbols-outlined text-3xl">content_cut</span>
                    </div>
                    <div className="flex-1 relative z-10">
                        <h3 className="text-white font-extrabold text-lg leading-tight mb-1">{service.name}</h3>
                        <div className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-full border border-white/5 inline-flex">
                            <span className="material-symbols-outlined text-[14px] text-primary">schedule</span>
                            <span className="text-[11px] text-white font-bold uppercase tracking-wider">{service.duration} min</span>
                        </div>
                    </div>
                </div>

                <div className="mt-8">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-white text-xl font-bold capitalize">{monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}</h3>
                        <div className="flex gap-2">
                            <button onClick={prevMonth} className="p-2 rounded-lg bg-[#0a0a0a] border border-white/10 text-white hover:text-primary hover:border-primary/50 transition-colors shadow-lg">
                                <span className="material-symbols-outlined">chevron_left</span>
                            </button>
                            <button onClick={nextMonth} className="p-2 rounded-lg bg-[#0a0a0a] border border-white/10 text-white hover:text-primary hover:border-primary/50 transition-colors shadow-lg">
                                <span className="material-symbols-outlined">chevron_right</span>
                            </button>
                        </div>
                    </div>
                    <div className="bg-[#0a0a0a] rounded-2xl p-5 border border-white/10 shadow-lg relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/0 hover:bg-primary/5 blur-[40px] rounded-full -mr-16 -mt-16 transition-colors duration-500 pointer-events-none"></div>
                        <div className="grid grid-cols-7 mb-4 relative z-10">
                            {weekDays.map(w => (
                                <div key={w} className="text-primary text-[10px] font-black uppercase text-center">{w}</div>
                            ))}
                        </div>
                        <div className="grid grid-cols-7 gap-1 relative z-10">
                            {generateCalendar().map((day, idx) => {
                                if (!day) return <div key={`empty-${idx}`} className="h-12"></div>;

                                const isPast = isPastDay(day);
                                const isSelected = selectedDate && isSameDay(selectedDate, day);

                                if (isPast) {
                                    return (
                                        <div key={day.toISOString()} className="h-12 flex items-center justify-center">
                                            <span className="text-sm text-white line-through decoration-white/50">{day.getDate()}</span>
                                        </div>
                                    );
                                }

                                if (isSelected) {
                                    return (
                                        <button key={day.toISOString()} className="h-12 flex flex-col items-center justify-center rounded-xl bg-gradient-to-br from-[#dca715] to-[#8a680b] text-black shadow-[0_0_20px_rgba(212,175,55,0.4)] ring-2 ring-primary ring-offset-4 ring-offset-[#0a0a0a] transition-all">
                                            <span className="text-sm font-black">{day.getDate()}</span>
                                            <div className="w-1 h-1 bg-black rounded-full mt-0.5"></div>
                                        </button>
                                    );
                                }

                                return (
                                    <button onClick={() => setSelectedDate(day)} key={day.toISOString()} className="h-12 flex flex-col items-center justify-center rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10 transition-all">
                                        <span className="text-sm font-bold text-white">{day.getDate()}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="mt-8 space-y-8">
                    {loadingSlots ? (
                        <div className="text-center text-primary text-sm py-10">Buscando horários disponíveis...</div>
                    ) : selectedDate ? (
                        <>
                            <div>
                                <div className="flex items-center gap-2 mb-4">
                                    <span className="material-symbols-outlined text-primary text-lg">light_mode</span>
                                    <h4 className="text-xs font-black uppercase tracking-[0.2em] text-white">Manhã</h4>
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                    {morningSlots.map(time => renderTimeBtn(time))}
                                </div>
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-4">
                                    <span className="material-symbols-outlined text-primary text-lg">wb_twilight</span>
                                    <h4 className="text-xs font-black uppercase tracking-[0.2em] text-white">Tarde / Noite</h4>
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                    {afternoonSlots.map(time => renderTimeBtn(time))}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="text-center text-white text-sm py-10">Selecione uma data para ver os horários.</div>
                    )}
                </div>
            </main>

            <div className={`fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-2xl border-t border-white/5 p-5 pb-safe z-40 max-w-md mx-auto mb-[80px] transition-transform duration-500 ${selectedDate && selectedTime ? 'translate-y-0' : 'translate-y-full'}`}>
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                        <div className="flex flex-col">
                            <span className="text-[10px] text-white font-black uppercase tracking-widest">Resumo</span>
                            <span className="text-white text-sm font-bold">
                                {selectedDate && `${weekDays[selectedDate.getDay()]}, ${selectedDate.getDate()} ${monthNames[selectedDate.getMonth()].slice(0, 3)}`} • {selectedTime}
                            </span>
                        </div>
                        <div className="text-right">
                            <span className="text-primary text-lg font-black tracking-tight">{formatPrice(service.price)}</span>
                        </div>
                    </div>
                    {isAuthenticated ? (
                        <Link href={`/appointments/new/summary?serviceId=${serviceId}&datetime=${finalDateTimeStr}`} className="w-full h-16 bg-gradient-to-r from-[#dca715] via-primary to-[#dca715] text-black rounded-2xl font-black text-lg shadow-[0_10px_30px_-10px_rgba(212,175,55,0.5)] flex items-center justify-center gap-3 active:scale-[0.98] transition-transform">
                            <span>Confirmar Horário</span>
                            <span className="material-symbols-outlined font-black">calendar_check</span>
                        </Link>
                    ) : (
                        <Link href={`/login?redirect=/appointments/new/summary?serviceId=${serviceId}&datetime=${finalDateTimeStr}`} className="w-full h-16 bg-gradient-to-r from-[#dca715] via-primary to-[#dca715] text-black rounded-2xl font-black text-lg shadow-[0_10px_30px_-10px_rgba(212,175,55,0.5)] flex items-center justify-center gap-3 active:scale-[0.98] transition-transform">
                            <span>Fazer Login para Confirmar</span>
                            <span className="material-symbols-outlined font-black">lock</span>
                        </Link>
                    )}
                </div>
            </div>
        </>
    );
}

export default function DateTimePage() {
    return (
        <Suspense fallback={<div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-black">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-primary text-sm font-bold tracking-widest uppercase">Carregando horários...</p>
        </div>}>
            <DateTimeSelection />
        </Suspense>
    );
}
