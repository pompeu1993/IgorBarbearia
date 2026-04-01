"use client";

type HistoryFiltersProps = {
    from: string;
    to: string;
    onFromChange: (value: string) => void;
    onToChange: (value: string) => void;
    onApply: () => void;
    onClear: () => void;
};

export function HistoryFilters(props: HistoryFiltersProps) {
    return (
        <section className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-4 shadow-lg space-y-4">
            <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[18px]">filter_alt</span>
                <h2 className="text-xs font-black uppercase tracking-[0.2em] text-white">Filtros de Data</h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <input
                    type="date"
                    value={props.from}
                    onChange={(event) => props.onFromChange(event.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm [color-scheme:dark]"
                />
                <input
                    type="date"
                    value={props.to}
                    onChange={(event) => props.onToChange(event.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm [color-scheme:dark]"
                />
            </div>
            <div className="flex gap-3">
                <button
                    onClick={props.onApply}
                    className="flex-1 h-11 bg-gradient-to-r from-primary to-[#bfa040] text-black rounded-xl font-black text-xs uppercase tracking-widest"
                >
                    Aplicar
                </button>
                <button
                    onClick={props.onClear}
                    className="flex-1 h-11 bg-white/5 border border-white/10 text-white rounded-xl font-black text-xs uppercase tracking-widest"
                >
                    Limpar
                </button>
            </div>
        </section>
    );
}
