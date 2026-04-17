import { syncFromSandbox } from '@/lib/hsbc-sync';

export default function AdminPage() {
  return (
    <div className="p-20 bg-black min-h-screen text-white">
      <h1 className="text-2xl font-bold mb-4">SolutionTeamX Control Panel</h1>
      <form action={async () => {
        'use server';
        // Updated to the new Sandbox-specific function
        await syncFromSandbox();
      }}>
        <button className="bg-red-600 px-4 py-2 rounded hover:bg-red-700 transition">
          🚀 Sync Live HSBC Sandbox Data
        </button>
      </form>
      <p className="mt-4 text-gray-400 text-sm">
        Status: Connected to HSBC Developer Portal via Client Credentials
      </p>
    </div>
  );
}