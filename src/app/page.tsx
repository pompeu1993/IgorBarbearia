"use client";

import Image from "next/image";
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

const remoteImageLoader = ({ src }: { src: string }) => src;

export default function Home() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  
  // Tática de grandes apps: Stale-While-Revalidate (SWR) via sessionStorage
  // Mostra o dado em cache instantaneamente, enquanto busca a atualização real no fundo
  const [profileName, setProfileName] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      let cached = sessionStorage.getItem("cachedProfileName") || null;
      if (cached && cached.startsWith("ghost_")) {
        cached = localStorage.getItem("guestName") || "Visitante";
      }
      return cached;
    }
    return null;
  });
  
  const [avatarUrl, setAvatarUrl] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("cachedAvatarUrl") || null;
    }
    return null;
  });
  
  const [nextAppointments, setNextAppointments] = useState<NextAppointment[] | null>(() => {
    if (typeof window !== "undefined") {
      const cached = sessionStorage.getItem("cachedNextAppointments");
      return cached ? JSON.parse(cached) : null;
    }
    return null;
  });

  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("cachedIsAdmin") === "true";
    }
    return false;
  });

  useEffect(() => {
    if (authLoading || !isAuthenticated || !user) {
      return;
    }

    const fetchData = async () => {
      // Se não temos nenhum dado (primeiro acesso), mostra o skeleton loader
      if (!profileName) {
        setLoading(true);
      }

      // Fetch Profile sem cache (sempre atualizado)
      const { data: profile } = await supabase
        .from("profiles")
        .select("name, avatar_url, role")
        .eq("id", user.id)
        .maybeSingle();

      let newProfileName = user.email?.split('@')[0] || "Cliente";
      
      if (profile && profile.name) {
        newProfileName = profile.name;
      }
      
      // Previne exibir o email do ghost user na UI
      if (newProfileName.startsWith("ghost_")) {
        newProfileName = localStorage.getItem("guestName") || "Visitante";
      }

      let newAvatarUrl = null;
      let newIsAdmin = user.email === 'rafaelmiguelalonso@gmail.com';

      if (profile) {
        newAvatarUrl = profile.avatar_url;
        newIsAdmin = profile.role === 'admin' || newIsAdmin;
      }
      
      setProfileName(newProfileName);
      setAvatarUrl(newAvatarUrl);
      setIsAdmin(newIsAdmin);
      
      // Salva no cache instantâneo para a próxima navegação
      sessionStorage.setItem("cachedProfileName", newProfileName);
      if (newAvatarUrl) sessionStorage.setItem("cachedAvatarUrl", newAvatarUrl);
      sessionStorage.setItem("cachedIsAdmin", newIsAdmin.toString());

      // Auto-complete past confirmed appointments before fetching
      const now = new Date().toISOString();
      await supabase
        .from("appointments")
        .update({ status: "COMPLETED" })
        .eq("user_id", user.id)
        .eq("status", "CONFIRMED")
        .lt("date", now);

      // Fetch Next Appointments
      const { data: appointments } = await supabase
        .from("appointments")
        .select(`
          id,
          date,
          service:services(name)
        `)
        .eq("user_id", user.id)
        .eq("status", "CONFIRMED") // Apenas pagos
        .gte("date", now)
        .order("date", { ascending: true })
        .limit(3); // No máximo 3

      if (appointments && appointments.length > 0) {
        const nextApps = appointments.map(app => ({
          id: app.id,
          date: app.date,
          service: Array.isArray(app.service) ? app.service[0] : app.service
        }));
        setNextAppointments(nextApps);
        sessionStorage.setItem("cachedNextAppointments", JSON.stringify(nextApps));
      } else {
        setNextAppointments(null);
        sessionStorage.removeItem("cachedNextAppointments");
      }

      setLoading(false);
    };

    fetchData();
  }, [authLoading, user, isAuthenticated]);

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
        <div className="flex items-center">
          {isAuthenticated && isAdmin ? (
            <Link href="/admin" className="text-[10px] font-bold tracking-widest text-primary uppercase border border-primary/30 px-2 py-1 rounded bg-primary/10 flex items-center gap-1 hover:bg-primary hover:text-black transition-colors">
              <span className="material-symbols-outlined text-[14px]">admin_panel_settings</span>
              Admin
            </Link>
          ) : (
            <Link href="/admin-login" className="text-[10px] font-bold tracking-widest text-primary uppercase border border-primary/30 px-2 py-1 rounded bg-primary/10 flex items-center gap-1 hover:bg-primary hover:text-black transition-colors">
              <span className="material-symbols-outlined text-[14px]">admin_panel_settings</span>
              Admin
            </Link>
          )}
        </div>
        <div className="flex justify-center">
          <div className="text-[10px] font-bold tracking-[0.2em] text-primary uppercase border border-primary/30 px-3 py-1.5 rounded bg-primary/10 whitespace-nowrap">
            IGOR BARBEARIA
          </div>
        </div>
        <div className="flex justify-end">
          {/* Espaço reservado para manter o alinhamento da grid */}
        </div>
      </header>

      {/* User Greeting */}
      <div className="flex flex-col items-center px-6 py-8 text-center relative z-10 min-h-[260px]">
        {(authLoading || (isAuthenticated && loading && !profileName)) ? (
          <div className="flex flex-col items-center w-full animate-pulse">
            <div className="w-32 h-32 rounded-full p-1.5 border-2 border-primary/20 shadow-[0_0_25px_rgba(212,175,55,0.05)] bg-black flex items-center justify-center mb-5">
              <div className="w-full h-full rounded-full bg-white/10"></div>
            </div>
            <div className="h-8 bg-white/10 rounded-md w-48 mb-2"></div>
            <div className="h-4 bg-primary/20 rounded-md w-64 mt-1"></div>
          </div>
        ) : (
          <>
            {isAuthenticated && (
              <div className="relative mb-5 group">
                <div className="w-32 h-32 rounded-full p-1.5 border-2 border-primary shadow-[0_0_25px_rgba(212,175,55,0.2)] bg-black flex items-center justify-center overflow-hidden">
                  {avatarUrl ? (
                    <Image src={avatarUrl} alt="Avatar" className="w-full h-full rounded-full object-cover" width={128} height={128} unoptimized loader={remoteImageLoader} />
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
          </>
        )}
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
      {isAuthenticated && !loading && nextAppointments && nextAppointments.length > 0 && (
        <div className="flex-1 overflow-y-auto pb-[130px] hide-scrollbar relative z-10">
          <div className="px-6 mb-8">
            <div className="flex items-center justify-between mb-4 border-l-4 border-primary pl-3">
              <h2 className="text-lg font-bold text-white uppercase tracking-wide">
                {nextAppointments.length > 1 ? "Próximos Horários" : "Próximo Horário"}
              </h2>
              <Link
                href="/history"
                className="text-xs font-bold text-primary hover:text-white transition-colors uppercase tracking-widest"
              >
                Ver Histórico
              </Link>
            </div>

            <div className="space-y-3">
              {nextAppointments.map((appointment) => (
                <Link key={appointment.id} href="/history" className="bg-[#0a0a0a] rounded-2xl p-5 border border-white/10 shadow-lg flex items-center overflow-hidden group hover:border-primary/50 transition-colors relative">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/0 group-hover:bg-primary/10 blur-[40px] rounded-full -mr-16 -mt-16 transition-colors duration-500 pointer-events-none"></div>
                  
                  <div className="bg-gradient-to-br from-[#dca715] to-[#8a680b] text-black w-16 h-16 rounded-xl flex flex-col items-center justify-center flex-shrink-0 shadow-[0_0_15px_rgba(212,175,55,0.2)] relative z-10">
                    <span className="text-[10px] font-black uppercase tracking-widest">{formatMonth(appointment.date).slice(0, 3)}</span>
                    <span className="text-xl font-black leading-none mt-0.5">{formatDay(appointment.date)}</span>
                  </div>
                  
                  <div className="flex-1 min-w-0 pl-4 overflow-hidden relative z-10">
                    <h3 className="font-extrabold text-white truncate text-lg uppercase tracking-tight mb-1">
                      {appointment.service?.name}
                    </h3>
                    <div className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-full border border-white/5 inline-flex">
                      <span className="material-symbols-outlined text-[14px] text-primary">schedule</span>
                      <span className="text-[11px] text-white font-bold uppercase tracking-wider">{formatTime(appointment.date)}</span>
                    </div>
                  </div>
                  
                  <div className="w-8 h-full flex items-center justify-end text-white/50 group-hover:text-primary transition-colors relative z-10">
                    <span className="material-symbols-outlined text-[24px]">chevron_right</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {isAuthenticated && !loading && (!nextAppointments || nextAppointments.length === 0) && (
        <div className="px-6 pb-[130px] text-center">
          <p className="text-white text-sm py-4">Você ainda não tem horários marcados.</p>
        </div>
      )}
    </>
  );
}
