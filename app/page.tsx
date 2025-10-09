"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/login");
  }, [router]);
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-xs flex flex-col items-center gap-6">
        <img
          src="/logo.png"
          alt="Faltas"
          className="h-16 w-16 animate-pulse"
        />
        <div className="w-full h-2 bg-gray-200 rounded overflow-hidden">
          <div className="h-full bg-gray-900 indeterminate-bar" />
        </div>
        <p className="text-gray-600 text-sm">Cargando...</p>
      </div>

      <style jsx>{`
        @keyframes indeterminate {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(0%); }
          100% { transform: translateX(100%); }
        }
        .indeterminate-bar {
          width: 40%;
          animation: indeterminate 1.2s linear infinite;
        }
      `}</style>
    </div>
  );
}
