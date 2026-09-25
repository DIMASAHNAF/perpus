'use client';

/**
 * Label punggung buku (call number) untuk dicetak di stiker.
 * Format: [R] <DDC> <3 huruf pengarang> <3 huruf judul>
 * Tampilan vertikal, font besar — mudah dibaca di rak.
 */
export function SpineLabel({ callNumber }: { callNumber: string }) {
  if (!callNumber) {
    return (
      <div className="flex items-center justify-center w-20 h-32 border-2 border-dashed border-slate-300 rounded text-[10px] text-slate-400 text-center p-1">
        Klasifikasi kosong
      </div>
    );
  }

  const parts = callNumber.split(/\s+/);

  return (
    <div className="flex flex-col items-center justify-center w-20 h-32 border-2 border-slate-900 rounded overflow-hidden bg-white">
      {parts.map((p, i) => (
        <div
          key={i}
          className={`font-mono font-extrabold tracking-wide ${
            i === 0
              ? 'text-[11px] border-b border-slate-300 w-full text-center py-0.5'
              : i === 1
                ? 'text-lg leading-tight'
                : 'text-sm leading-tight text-slate-700'
          }`}
        >
          {p}
        </div>
      ))}
    </div>
  );
}
