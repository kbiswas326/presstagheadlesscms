'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function AdAdminPage() {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchAds();
  }, []);

  const fetchAds = async () => {
    try {
      const { fetchWithTenant } = await import('../../../lib/fetchWithTenant');
      const res = await fetchWithTenant('/ad-blocks', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setAds(data);
      }
    } catch (error) {
      console.error('Failed to fetch ads', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this ad block?')) return;

    const token = localStorage.getItem('token');
    if (!token) {
        alert('You must be logged in to delete ads.');
        return;
    }

    try {
      const { fetchWithTenant } = await import('../../../lib/fetchWithTenant');
      const res = await fetchWithTenant(`/ad-blocks/${id}`, {
        method: 'DELETE',
        cache: 'no-store',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setAds(ads.filter(ad => ad._id !== id));
      } else {
        alert('Failed to delete ad');
      }
    } catch (error) {
      console.error('Error deleting ad', error);
    }
  };

  if (loading) return <div className="p-8">Loading ads...</div>;

  return (
    <div className="container mx-auto p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Ad Blocks Manager</h1>
        <Link href="/admin/ads/new" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Create New Ad
        </Link>
      </div>

      <div className="bg-white shadow-md rounded my-6 overflow-x-auto">
        <table className="min-w-full table-auto">
          <thead>
            <tr className="bg-gray-200 text-gray-600 uppercase text-sm leading-normal">
              <th className="py-3 px-6 text-left">Name</th>
              <th className="py-3 px-6 text-left">Position</th>
              <th className="py-3 px-6 text-center">Priority</th>
              <th className="py-3 px-6 text-center">Active</th>
              <th className="py-3 px-6 text-left">Conditions</th>
              <th className="py-3 px-6 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="text-gray-600 text-sm font-light">
            {ads.map(ad => (
              <tr key={ad._id} className="border-b border-gray-200 hover:bg-gray-100">
                <td className="py-3 px-6 text-left whitespace-nowrap">
                  <span className="font-medium">{ad.name}</span>
                </td>
                <td className="py-3 px-6 text-left">
                  <span className="bg-purple-200 text-purple-600 py-1 px-3 rounded-full text-xs">
                    {ad.position}
                  </span>
                </td>
                <td className="py-3 px-6 text-center">
                  {ad.priority}
                </td>
                <td className="py-3 px-6 text-center">
                  <span className={`${ad.isActive ? 'bg-green-200 text-green-600' : 'bg-red-200 text-red-600'} py-1 px-3 rounded-full text-xs`}>
                    {ad.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="py-3 px-6 text-left">
                  {ad.displayConditions?.insertionParameter && (
                     <div className="text-xs">
                        After: {ad.displayConditions.insertionParameter}
                     </div>
                  )}
                </td>
                <td className="py-3 px-6 text-center">
                  <div className="flex item-center justify-center">
                    <Link href={`/admin/ads/${ad._id}`} className="w-4 mr-2 transform hover:text-purple-500 hover:scale-110">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </Link>
                    <button onClick={() => handleDelete(ad._id)} className="w-4 transform hover:text-red-500 hover:scale-110">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {ads.length === 0 && (
                <tr>
                    <td colSpan="6" className="py-6 text-center">No ad blocks found.</td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
