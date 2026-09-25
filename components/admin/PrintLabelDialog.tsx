'use client';

import { useState } from 'react';
import { Printer, X, BookText, Barcode } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { BarcodeLabel } from '@/components/admin/BarcodeLabel';
import { SpineLabel } from '@/components/admin/SpineLabel';
import { buildCallNumber, printWithPageSize, LABEL_SIZES } from '@/lib/label';

interface PrintLabelDialogProps {
  kode: string;
  judul: string;
  rakNama?: string;
  klasifikasi?: string | null;
  penulis?: string | null;
  isReferensi?: boolean;
}

type Tab = 'BARCODE' | 'PUNGGUNG';

export default function PrintLabelDialog({
  kode,
  judul,
  rakNama,
  klasifikasi,
  penulis,
  isReferensi,
}: PrintLabelDialogProps) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>('BARCODE');

  const callNumber = buildCallNumber({
    klasifikasi,
    penulis,
    judul,
    isReferensi,
  });

  const handlePrint = () => {
    if (tab === 'BARCODE') {
      printWithPageSize(LABEL_SIZES.eksemplar.width, LABEL_SIZES.eksemplar.height);
    } else {
      printWithPageSize(LABEL_SIZES.punggung.width, LABEL_SIZES.punggung.height);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5"
      >
        <Printer className="w-3.5 h-3.5" />
        Label
      </Button>

      {/* Print-only area */}
      {open && (
        <div className="print-area">
          {tab === 'BARCODE' ? (
            <BarcodeLabel kode={kode} judul={judul} rakNama={rakNama} size="large" />
          ) : (
            <SpineLabel callNumber={callNumber} />
          )}
        </div>
      )}

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 print-hidden"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white rounded-xl shadow-xl w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900">Cetak Label</h3>
              <button
                onClick={() => setOpen(false)}
                className="text-slate-400 hover:text-slate-900 transition-colors"
                aria-label="Tutup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-5">
              <button
                onClick={() => setTab('BARCODE')}
                className={`flex-1 flex items-center justify-center gap-1.5 h-10 rounded-lg text-xs font-semibold transition-colors ${
                  tab === 'BARCODE'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Barcode className="w-4 h-4" />
                Label Eksemplar
              </button>
              <button
                onClick={() => setTab('PUNGGUNG')}
                className={`flex-1 flex items-center justify-center gap-1.5 h-10 rounded-lg text-xs font-semibold transition-colors ${
                  tab === 'PUNGGUNG'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <BookText className="w-4 h-4" />
                Label Punggung
              </button>
            </div>

            {/* Preview */}
            <div className="flex flex-col items-center gap-4 py-6 border border-dashed border-slate-300 rounded-lg">
              {tab === 'BARCODE' ? (
                <BarcodeLabel kode={kode} judul={judul} rakNama={rakNama} size="large" />
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <SpineLabel callNumber={callNumber} />
                  <p className="text-[10px] font-mono text-slate-500">{callNumber}</p>
                </div>
              )}
              <p className="text-xs text-slate-500 text-center px-4">
                {tab === 'BARCODE'
                  ? 'Ukuran 70×35mm. Tempel di cover dalam eksemplar.'
                  : 'Ukuran 40×60mm. Tempel di punggung buku sesuai rak.'}
              </p>
            </div>

            <div className="flex gap-2 mt-6">
              <Button onClick={handlePrint} className="flex-1">
                <Printer className="w-4 h-4" />
                Cetak
              </Button>
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
                className="flex-1"
              >
                Batal
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
