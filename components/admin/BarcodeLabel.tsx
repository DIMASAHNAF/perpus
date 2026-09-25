'use client';

import { useEffect, useRef } from 'react';
import bwipjs from 'bwip-js';

interface BarcodeLabelProps {
  kode: string;
  judul: string;
  rakNama?: string;
  size?: 'small' | 'medium' | 'large';
}

export function BarcodeLabel({
  kode,
  judul,
  rakNama,
  size = 'medium',
}: BarcodeLabelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    try {
      bwipjs.toCanvas(canvasRef.current, {
        bcid: 'code128',
        text: kode,
        scale: 2,
        height: 10,
        includetext: false,
        paddingleft: 2,
        paddingright: 2,
      });
    } catch (err) {
      console.error('Barcode error:', err);
    }
  }, [kode]);

  const sizeClass =
    size === 'small'
      ? 'w-24 h-20'
      : size === 'large'
        ? 'w-40 h-32'
        : 'w-32 h-24';

  return (
    <div className={`flex flex-col items-center gap-2 ${sizeClass}`}>
      <canvas ref={canvasRef} className="w-full" />
      <div className="text-xs text-center leading-tight">
        <div className="font-bold">{kode}</div>
        {judul && (
          <div className="text-[10px] line-clamp-2 max-w-full">{judul}</div>
        )}
        {rakNama && <div className="text-[9px] text-slate-500">{rakNama}</div>}
      </div>
    </div>
  );
}
