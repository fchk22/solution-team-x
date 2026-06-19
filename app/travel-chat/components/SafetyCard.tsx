interface SafetyCardProps {
  hotelName: string;
  hotelAddress: string;
}

export default function SafetyCard({ hotelName, hotelAddress }: SafetyCardProps) {
  const handleSOS = () => {
    alert("SOS signal sent to emergency contacts!");
  };

  return (
    <div className="p-6 border border-red-200 rounded-xl shadow-md bg-red-50 mt-8 max-w-lg">
      <h3 className="font-bold text-xl text-red-900 mb-2">Safety Information</h3>
      <div className="text-sm text-red-800 space-y-1 mb-4">
        <p><strong>Hotel:</strong> {hotelName}</p>
        <p><strong>Address:</strong> {hotelAddress}</p>
      </div>
      <button 
        onClick={handleSOS}
        className="w-full bg-red-600 text-white font-bold py-3 rounded-lg hover:bg-red-700 transition"
      >
        SOS / EMERGENCY
      </button>
    </div>
  );
}