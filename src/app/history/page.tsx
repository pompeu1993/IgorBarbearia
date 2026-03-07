import Link from "next/link";

export default function HistoryPage() {
    const history = [
        { id: "1", date: "10 de Setembro, 2023", service: "Corte Moderno", price: "R$ 45,00", barber: "Mike" },
        { id: "2", date: "05 de Agosto, 2023", service: "Degradê Americano", price: "R$ 55,00", barber: "Carlos" },
        { id: "3", date: "12 de Julho, 2023", service: "Corte + Barba Therapy", price: "R$ 85,00", barber: "Mike" },
    ];

    return (
        <>
            <header className="flex items-center justify-between p-4 pt-6 bg-black/90 backdrop-blur-md sticky top-0 z-20 border-b border-white/10">
                <Link href="/" className="p-2 -ml-2 rounded-full hover:bg-zinc-800 text-white transition-colors">
                    <span className="material-symbols-outlined text-[28px]">chevron_left</span>
                </Link>
                <h1 className="text-sm font-extrabold tracking-[0.2em] text-white uppercase">Histórico</h1>
                <div className="w-10"></div>
            </header>

            <main className="flex-1 overflow-y-auto pb-32 hide-scrollbar relative z-10 px-6 py-6 border-t border-transparent">
                <div className="space-y-4">
                    {history.map((item) => (
                        <div key={item.id} className="bg-zinc-900/50 border border-white/5 p-4 rounded-xl flex items-center justify-between opacity-80 hover:opacity-100 transition-opacity cursor-default">
                            <div>
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">
                                    {item.date}
                                </span>
                                <h3 className="text-slate-300 font-bold text-base uppercase tracking-tight">{item.service}</h3>
                                <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wide flex items-center gap-1 mt-1">
                                    <span className="material-symbols-outlined text-[14px]">check_circle</span>
                                    Realizado com {item.barber}
                                </p>
                            </div>
                            <div className="text-right">
                                <span className="text-slate-400 font-bold text-sm tracking-tight">{item.price}</span>
                                <button className="mt-2 text-[10px] text-primary font-bold uppercase hover:underline block ml-auto">
                                    Agendar Novamente
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </main>
        </>
    );
}
