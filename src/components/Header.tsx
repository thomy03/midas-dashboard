"use client";

import Image from "next/image";

export function Header() {
  return (
    <header className="sticky top-0 z-40 bg-zinc-950/90 backdrop-blur-lg border-b border-zinc-800/50">
      <div className="flex items-center gap-3 px-4 py-3 max-w-md mx-auto">
        <Image
          src="/midas-logo.png"
          alt="Midas"
          width={36}
          height={36}
          className="rounded-lg"
        />
        <div>
          <h1 className="text-lg font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
            Midas
          </h1>
          <p className="text-xs text-zinc-500">AI Trading Bot</p>
        </div>
      </div>
    </header>
  );
}
