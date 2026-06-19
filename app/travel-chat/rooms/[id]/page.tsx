'use client';

import { useState, useEffect, use } from 'react';
import { supabase } from '@/lib/supabaseClient';
import SafetyCard from '@/app/travel-chat/components/SafetyCard';
import ChatBox from '@/app/travel-chat/components/ChatBox';

export default function RoomPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const id = unwrappedParams.id;
  
  const [room, setRoom] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMember, setIsMember] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    if (!id) return;

    const init = async () => {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      // 1. Fetch Room Data
      const { data: roomData, error: roomError } = await supabase
        .from('travel_rooms')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (roomError) {
        console.error("DEBUG - Full Supabase Error:", JSON.stringify(roomError, null, 2));
        setError("Could not load trip details. Please ensure RLS policies are enabled.");
      } else if (!roomData) {
        setError("Trip not found.");
      } else {
        setRoom(roomData);
        
        // 2. Check membership
        if (user) {
          const { data: memberData } = await supabase
            .from('trip_members')
            .select('*')
            .eq('room_id', id)
            .eq('user_id', user.id)
            .maybeSingle();
            
          setIsMember(!!memberData || roomData.created_by === user.id);
        }
      }
      setLoading(false);
    };
    init();
  }, [id]);

  const joinTrip = async () => {
    if (!user) return alert("Please login to join.");
    
    const { error } = await supabase
      .from('trip_members')
      .insert([{ room_id: id, user_id: user.id }]);

    if (error) {
      alert("Error joining trip: " + error.message);
    } else {
      setIsMember(true);
      alert("Successfully joined the trip!");
    }
  };

  const copyInviteLink = () => {
    navigator.clipboard.writeText(window.location.href);
    alert("Invite link copied!");
  };

  if (loading) return <div className="p-10 text-center">Loading...</div>;
  if (error) return <div className="p-10 text-red-500 text-center">{error}</div>;
  if (!room) return <div className="p-10 text-center">Trip not found.</div>;

  return (
    <div className="flex flex-col h-screen bg-white p-6">
      <header className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{room.name}</h1>
        </div>
        <button onClick={copyInviteLink} className="bg-blue-600 text-white px-4 py-2 rounded-lg">
          Copy Invite Link
        </button>
      </header>

      {!isMember ? (
        <div className="flex-grow flex flex-col items-center justify-center border-2 border-dashed p-10">
          <h2 className="text-xl font-bold mb-4">You are not a member of this trip yet</h2>
          <button onClick={joinTrip} className="bg-green-600 text-white px-8 py-3 rounded-lg font-bold">
            Join This Trip
          </button>
        </div>
      ) : (
        <main className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Trip Details Section */}
          <div className="flex flex-col gap-6">
            <div className="bg-gray-50 p-4 rounded-lg border">
              <h2 className="text-lg font-semibold mb-2">Trip Overview</h2>
              <p><strong>Hotel:</strong> {room.hotel_name}</p>
              <p><strong>Location:</strong> {room.hotel_address}</p>
            </div>
            <SafetyCard hotelName={room.hotel_name} hotelAddress={room.hotel_address} />
          </div>

          {/* Chat Section */}
          <div className="flex flex-col">
            <h2 className="text-lg font-semibold mb-2">Group Chat</h2>
            <ChatBox roomId={id} />
          </div>
        </main>
      )}
    </div>
  );
}