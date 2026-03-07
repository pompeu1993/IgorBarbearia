import Link from "next/link";

export default function AppointmentsPage() {
    const appointments = [
        { id: "1", date: "24 de Outubro, 2023", time: "10:00 AM", service: "Degradê Americano", barber: "Mike", status: "Confirmado", price: "R$ 55,00" },
        { id: "2", date: "15 de Novembro, 2023", time: "14:30 PM", service: "Corte + Barba Therapy", barber: "Carlos", status: "Pendente", price: "R$ 85,00" },
    ];

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
                {appointments.length > 0 ? (
                    <div className="space-y-4">
                        {appointments.map((apt) => (
                            <div key={apt.id} className="bg-zinc-900/80 border border-white/5 p-4 rounded-xl shadow-lg relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 blur-[30px] rounded-full -mr-12 -mt-12 pointer-events-none"></div>
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <span className="text-[10px] font-bold text-primary uppercase tracking-widest block mb-1">
                                            {apt.date} • {apt.time}
                                        </span>
                                        <h3 className="text-white font-bold text-lg uppercase tracking-tight">{apt.service}</h3>
                                        <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wide flex items-center gap-1 mt-1">
                                            <span className="material-symbols-outlined text-[14px]">person</span>
                                            Barbeiro {apt.barber}
                                        </p>
                                    </div>
                                    <div className={`px-2 py-1 rounded-sm text-[9px] font-black uppercase tracking-wider ${apt.status === "Confirmado" ? "bg-primary/20 text-primary border border-primary/30" : "bg-slate-800 text-slate-300 border border-slate-600"
                                        }`}>
                                        {apt.status}
                                    </div>
                                </div>
                                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                                    <span className="text-white font-bold tracking-tight">{apt.price}</span>
                                    <div className="flex gap-2">
                                        <button className="px-3 py-1.5 border border-white/20 text-white rounded-md text-[10px] font-bold uppercase transition-colors hover:bg-white/10">
                                            Reagendar
                                        </button>
                                        <button className="px-3 py-1.5 bg-zinc-800 text-red-400 rounded-md text-[10px] font-bold uppercase transition-colors hover:bg-red-500/20">
                                            Cancelar
                                        </button>
                                    </div>
                                </div>
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
