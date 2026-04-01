"use client";

import Link from "next/link";
import { useState } from "react";
import { HistoryItem } from "@/lib/history/types";

type HistoryCardProps = {
    appointment: HistoryItem;
    cancelingId: string | null;
    onCancel: (id: string) => void;
};

const statusMap = {
    PENDING: { text: "Pendente", color: "text-yellow-500", icon: "schedule" },
    CONFIRMED: { text: "Confirmado", color: "text-green-500", icon: "check_circle" },
    CANCELLED: { text: "Cancelado", color: "text-red-500", icon: "cancel" },
    COMPLETED: { text: "Realizado", color: "text-primary", icon: "verified" },
} as const;

export function HistoryCard({ appointment, cancelingId, onCancel }: HistoryCardProps) {
    const [currentTime] = useState(() => Date.now());

    const statusInfo = statusMap[appointment.status as keyof typeof statusMap] ?? { text: appointment.status, color: "text-slate-500", icon: "info" };
    const appointmentTime = new Date(appointment.date).getTime();
    const isFutureAppointment = appointmentTime > currentTime;
    const canCancel = isFutureAppointment && appointment.status === "PENDING";
    const canReschedule = isFutureAppointment && appointment.status === "CONFIRMED";

    return (
        <div className="bg-[#0a0a0a] border border-white/10 p-5 rounded-2xl flex flex-col shadow-lg relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/0 group-hover:bg-primary/10 blur-[40px] rounded-full -mr-16 -mt-16 transition-colors duration-500 pointer-events-none"></div>
            <div className="flex items-center justify-between mb-3 relative z-10">
                <div>
                    <span className="text-[10px] font-bold text-white/70 uppercase tracking-widest block mb-1">
                        {formatDate(appointment.date)}
                    </span>
                    <h3 className="text-white font-extrabold text-lg tracking-tight mb-1">{appointment.service.name}</h3>
                    <p className="text-[11px] text-white/70 font-medium uppercase tracking-wide flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">person</span>
                        {appointment.professional}
                    </p>
                    <p className={`mt-2 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${statusInfo.color}`}>
                        <span className="material-symbols-outlined text-[14px]">{statusInfo.icon}</span>
                        {statusInfo.text}
                    </p>
                </div>
                <div className="text-right flex flex-col items-end gap-2">
                    <span className="text-primary font-black text-lg tracking-tight block">
                        {appointment.service.price === null ? "" : formatPrice(appointment.service.price)}
                    </span>
                    {canCancel && (
                        <button
                            onClick={() => onCancel(appointment.id)}
                            disabled={cancelingId === appointment.id}
                            className="text-[10px] font-bold text-red-400 hover:text-red-300 uppercase tracking-widest disabled:opacity-50 transition-colors bg-red-500/10 px-3 py-1.5 rounded-full border border-red-500/20"
                        >
                            {cancelingId === appointment.id ? "Cancelando..." : "Cancelar"}
                        </button>
                    )}
                </div>
            </div>
            {canReschedule && (
                <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between relative z-10">
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest leading-tight">
                        Reagendamento disponível
                    </span>
                    <Link
                        href={`/appointments/reschedule?appointmentId=${appointment.id}`}
                        className="text-[10px] font-bold text-black uppercase tracking-widest bg-primary hover:bg-[#cfaa33] px-4 py-2 rounded-full"
                    >
                        Reagendar
                    </Link>
                </div>
            )}
        </div>
    );
}

function formatDate(isoString: string) {
    const date = new Date(isoString);
    const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    const time = `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
    return `${date.getDate()} de ${monthNames[date.getMonth()]}, ${date.getFullYear()} às ${time}`;
}

function formatPrice(price: number) {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(price);
}
