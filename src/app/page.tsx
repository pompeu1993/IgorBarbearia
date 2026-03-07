"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

type NextAppointment = {
  id: string;
  date: string;
  service: {
    name: string;
  };
};

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [profileName, setProfileName] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [nextAppointment, setNextAppointment] = useState<NextAppointment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      // Fetch Profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("name, avatar_url")
        .eq("id", user.id)
        .single();

      if (profile) {
        setProfileName(profile.name || user.email?.split('@')[0] || "Cliente");
        setAvatarUrl(profile.avatar_url);
      } else {
        setProfileName(user.email?.split('@')[0] || "Cliente");
      }

      // Fetch Next Appointment
      const now = new Date().toISOString();
      const { data: appointment } = await supabase
        .from("appointments")
        .select(`
          id,
          date,
          service:services(name)
        `)
        .eq("user_id", user.id)
        .in("status", ["PENDING", "CONFIRMED"])
        .gte("date", now)
        .order("date", { ascending: true })
        .limit(1)
        .single();

      if (appointment) {
        setNextAppointment({
          id: appointment.id,
          date: appointment.date,
          service: Array.isArray(appointment.service) ? appointment.service[0] : appointment.service
        });
      }

      setLoading(false);
    };

    fetchData();
  }, [user, isAuthenticated]);

  const formatMonth = (isoStr: string) => {
    const d = new Date(isoStr);
    const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    return months[d.getMonth()];
  };

  const formatDay = (isoStr: string) => {
    return new Date(isoStr).getDate().toString().padStart(2, '0');
  };

  const formatTime = (isoStr: string) => {
    const d = new Date(isoStr);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  return (
    <>
      {/* Header */}
      <header className="grid grid-cols-3 items-center px-4 py-5 bg-black/90 backdrop-blur-md sticky top-0 z-20 border-b border-primary/20">
        <div className="flex items-center"></div>
        <div className="flex justify-center">
          <div className="text-[10px] font-bold tracking-[0.2em] text-primary uppercase border border-primary/30 px-3 py-1.5 rounded bg-primary/10 whitespace-nowrap">
            IGOR BARBEARIA
          </div>
        </div>
        <div className="flex justify-end">
          <button
            disabled={!isAuthenticated}
            className={`relative p-2 rounded-full transition-colors ${isAuthenticated ? "hover:bg-zinc-800 text-slate-100" : "opacity-30 pointer-events-none text-slate-500"}`}
          >
            <span className="material-symbols-outlined text-[24px]">notifications</span>
            {isAuthenticated && (
              <span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-red-600 border-2 border-black"></span>
            )}
          </button>
        </div>
      </header>

      {/* User Greeting */}
      <div className="flex flex-col items-center px-6 py-8 text-center relative z-10">
        {isAuthenticated && (
          <div className="relative mb-5 group">
            <div className="w-32 h-32 rounded-full p-1.5 border-2 border-primary shadow-[0_0_25px_rgba(212,175,55,0.2)] bg-black flex items-center justify-center overflow-hidden">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full rounded-full object-cover" />
              ) : (
                <span className="material-symbols-outlined text-border-primary text-6xl text-primary">person</span>
              )}
            </div>
            <Link href="/profile" className="absolute bottom-1 right-1 bg-primary text-black rounded-full p-2 shadow-lg border-4 border-black flex items-center justify-center hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-[18px]">edit</span>
            </Link>
          </div>
        )}
        <h1 className="text-3xl font-bold text-white mb-1 tracking-tight uppercase font-display px-2 overflow-hidden text-ellipsis whitespace-nowrap max-w-full">
          {isAuthenticated ? `Olá, ${profileName}` : "OLÁ, CLIENTE"}
        </h1>
        <p className="text-primary/80 text-xs sm:text-sm font-medium tracking-wide uppercase px-2">
          O Corte Impecável Espera por Você
        </p>
      </div>

      {/* Main Action */}
      <div className="px-6 pb-10 relative z-10">
        <Link
          href="/appointments/new"
          className="w-full h-16 bg-gradient-to-r from-primary to-[#bfa040] hover:from-[#cfaa33] hover:to-[#dcb650] text-black rounded-sm shadow-[0_4px_25px_-5px_rgba(212,175,55,0.3)] flex items-center justify-center gap-3 font-extrabold text-lg uppercase tracking-wider transition-all active:scale-[0.98] border border-white/10"
        >
          <span className="material-symbols-outlined text-[28px]">content_cut</span>
          Agendar Corte
        </Link>
        {!isAuthenticated && (
          <div className="mt-4 text-center">
            <Link href="/login" className="text-xs font-bold text-slate-400 hover:text-white uppercase tracking-widest transition-colors underline decoration-slate-600 underline-offset-4">
              Faça o login ou Cadastre-se
            </Link>
          </div>
        )}
      </div>

      {/* Next Appointment Section */}
      {isAuthenticated && !loading && nextAppointment && (
        <div className="flex-1 overflow-y-auto pb-24 hide-scrollbar relative z-10">
          <div className="px-6 mb-8">
            <div className="flex items-center justify-between mb-4 border-l-4 border-primary pl-3">
              <h2 className="text-lg font-bold text-white uppercase tracking-wide">Próximo Horário</h2>
              <Link
                href="/history"
                className="text-xs font-bold text-primary hover:text-white transition-colors uppercase tracking-widest"
              >
                Ver Histórico
              </Link>
            </div>

            <Link href="/history" className="bg-zinc-900/80 backdrop-blur-sm rounded-sm p-0 border border-white/5 shadow-xl flex items-center overflow-hidden group hover:bg-zinc-900 transition-colors">
              <div className="bg-gradient-to-b from-zinc-800 to-black text-primary w-20 self-stretch flex flex-col items-center justify-center flex-shrink-0 border-r border-white/5 group-hover:border-primary/50 transition-colors py-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{formatMonth(nextAppointment.date)}</span>
                <span className="text-2xl font-bold text-white">{formatDay(nextAppointment.date)}</span>
              </div>
              <div className="flex-1 min-w-0 py-4 px-4 overflow-hidden">
                <h3 className="font-bold text-white truncate text-base sm:text-lg uppercase tracking-tight">
                  {nextAppointment.service?.name}
                </h3>
                <p className="text-[10px] sm:text-xs font-medium text-slate-400 mt-1 truncate uppercase tracking-wide flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px] text-primary">schedule</span>
                  {formatTime(nextAppointment.date)}
                </p>
              </div>
              <div className="w-12 h-full flex items-center justify-center text-slate-500 group-hover:text-primary transition-all">
                <span className="material-symbols-outlined text-[24px]">chevron_right</span>
              </div>
            </Link>
          </div>
        </div>
      )}

      {isAuthenticated && !loading && !nextAppointment && (
        <div className="px-6 pb-24 text-center">
          <p className="text-slate-500 text-sm opacity-80 py-4">Você ainda não tem horários marcados.</p>
        </div>
      )}
    </>
  );
}
