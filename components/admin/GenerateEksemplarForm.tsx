'use client';

import { useState } from 'react';
import { generateEksemplar } from '@/actions/eksemplar';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Plus, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface GenerateEksemplarFormProps {
  bukuId: string;
}

export default function GenerateEksemplarForm({
  bukuId,
}: GenerateEksemplarFormProps) {
  const [jumlah, setJumlah] = useState<string>('1');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseInt(jumlah, 10);
    if (isNaN(num) || num < 1 || num > 500) {
      toast.error('Jumlah harus 1-500');
      return;
    }

    setLoading(true);
    try {
      const hasil = await generateEksemplar(bukuId, num);
      toast.success(`${hasil.length} eksemplar dibuat: ${hasil.join(', ')}`);
      setJumlah('1');
    } catch (err) {
      toast.error(`Error: ${err instanceof Error ? err.message : 'Gagal generate'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      <h2 className="text-lg font-bold text-slate-900 mb-4">Generate Eksemplar Baru</h2>
      <div className="flex items-end gap-3">
        <div className="flex-1 max-w-xs">
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Jumlah Eksemplar (1-500)
          </label>
          <Input
            type="number"
            min="1"
            max="500"
            value={jumlah}
            onChange={(e) => setJumlah(e.target.value)}
            placeholder="Contoh: 5"
            disabled={loading}
          />
        </div>
        <Button type="submit" disabled={loading} className="h-10">
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Membuat...
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              Generate
            </>
          )}
        </Button>
      </div>
      <p className="text-xs text-slate-500 mt-2">
        Kode 8-digit akan di-generate otomatis (misal: 00001234). Rak akan auto-assign berdasarkan klasifikasi buku.
      </p>
    </form>
  );
}
