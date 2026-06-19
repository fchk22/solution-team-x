'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function CreateTripPage() {
  const [name, setName] = useState('');
  const [hotelName, setHotelName] = useState('');
  const [hotelAddress, setHotelAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/travel-chat/login');
      } else {
        setUser(user);
      }
    };
    checkAuth();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    const { data, error } = await supabase
      .from('travel_rooms')
      .insert([
        {
          name: name,
          hotel_name: hotelName,
          hotel_address: hotelAddress,
          created_by: user.id
        }
      ])
      .select();

    if (error) {
      console.error("Full Supabase Error Details:", JSON.stringify(error, null, 2));
      alert(`Error: ${error.message}. Check browser console for details.`);
      setLoading(false);
    } else if (data && data.length > 0) {
      // Redirect to the room page using the new ID returned from the database
      const newRoomId = data[0].id;
      router.push(`/travel-chat/rooms/${newRoomId}`);
    }
  };

  return (
    <div className="p-8 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Create New Trip</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input 
          placeholder="Trip Name" 
          value={name} 
          onChange={(e) => setName(e.target.value)} 
          className="w-full border p-2" 
          required
        />
        <input 
          placeholder="Hotel Name" 
          value={hotelName} 
          onChange={(e) => setHotelName(e.target.value)} 
          className="w-full border p-2" 
          required
        />
        <input 
          placeholder="Hotel Address" 
          value={hotelAddress} 
          onChange={(e) => setHotelAddress(e.target.value)} 
          className="w-full border p-2" 
          required
        />
        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-black text-white p-2 disabled:bg-gray-400"
        >
          {loading ? 'Creating...' : 'Create Trip'}
        </button>
      </form>
    </div>
  );
}