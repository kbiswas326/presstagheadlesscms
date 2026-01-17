'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import AdForm from '../_components/AdForm';

export default function EditAdPage() {
  const { id } = useParams();
  const [ad, setAd] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
        fetchAd(id);
    }
  }, [id]);

  const fetchAd = async (adId) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/ad-blocks/${adId}`);
      if (res.ok) {
        const data = await res.json();
        setAd(data);
      } else {
        console.error('Ad not found');
      }
    } catch (error) {
      console.error('Failed to fetch ad', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;
  if (!ad) return <div className="p-8">Ad not found</div>;

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Edit Ad Block</h1>
      <div className="max-w-2xl">
        <AdForm initialData={ad} isEdit={true} />
      </div>
    </div>
  );
}
