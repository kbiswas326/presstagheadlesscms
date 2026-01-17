'use client';
import AdForm from '../_components/AdForm';

export default function NewAdPage() {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Create New Ad Block</h1>
      <div className="max-w-2xl">
        <AdForm />
      </div>
    </div>
  );
}
