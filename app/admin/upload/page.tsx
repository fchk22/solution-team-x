'use client';

import { useState } from 'react';
import { uploadAndAnalyzeAction } from '@/lib/actions';

export default function AdminUploadPage() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function handleForm(formData: FormData) {
    setStatus('loading');
    setMessage('');

    try {
      const file = formData.get('pdf-file') as File;
      if (!file) throw new Error("Please select a PDF file.");

      const arrayBuffer = await file.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString('base64');

      const result = await uploadAndAnalyzeAction(base64);

      if (result.success) {
        setStatus('success');
        setMessage(`Synced: ${result.cardName}`);
      } else {
        throw new Error(result.error);
      }
    } catch (err: any) {
      setStatus('error');
      setMessage(err.message);
    }
  }

  return (
    <div className="p-20 bg-black min-h-screen text-white">
      <div className="max-w-xl mx-auto border border-zinc-800 p-8 rounded-3xl bg-zinc-950">
        <h1 className="text-2xl font-bold mb-6">HSBC PDF Sync</h1>
        <form action={handleForm} className="space-y-6">
          <div className="border-2 border-dashed border-zinc-700 p-8 rounded-xl text-center">
            <input 
              type="file" 
              name="pdf-file" 
              accept="application/pdf" 
              className="w-full text-zinc-400 file:bg-white file:text-black file:rounded-full file:px-4 file:py-2 cursor-pointer"
            />
          </div>
          <button 
            type="submit" 
            disabled={status === 'loading'}
            className="w-full py-4 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 disabled:bg-zinc-800"
          >
            {status === 'loading' ? 'Analyzing PDF...' : 'Upload & Sync Database'}
          </button>
          {message && (
            <div className={`mt-4 p-4 rounded-lg text-center ${status === 'success' ? 'text-green-400' : 'text-red-400'}`}>
              {message}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}