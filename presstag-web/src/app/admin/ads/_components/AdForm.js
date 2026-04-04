'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdForm({ initialData = {}, isEdit = false }) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    position: 'article_middle',
    priority: 10,
    isActive: true,
    insertionParameter: '',
    ...initialData,
    insertionParameter: initialData.displayConditions?.insertionParameter || ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const positions = [
    { value: 'header_top', label: 'Header Top' },
    { value: 'article_middle', label: 'Article Middle' },
    { value: 'article_bottom', label: 'Article Bottom' },
    { value: 'article_paragraph', label: 'After Paragraph (Dynamic)' },
    { value: 'article_image', label: 'After Image (Dynamic)' },
    { value: 'sidebar_top', label: 'Sidebar Top' },
    { value: 'sidebar_bottom', label: 'Sidebar Bottom' },
    { value: 'footer_top', label: 'Footer Top' },
  ];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const token = localStorage.getItem('token');
    if (!token) {
        setError('You must be logged in to save ads.');
        setLoading(false);
        return;
    }

    const payload = {
      name: formData.name,
      code: formData.code,
      position: formData.position,
      priority: parseInt(formData.priority),
      isActive: formData.isActive,
      displayConditions: {
        ...(initialData.displayConditions || {}),
        insertionParameter: formData.insertionParameter ? parseInt(formData.insertionParameter) : undefined
      }
    };

    try {
      const method = isEdit ? 'PUT' : 'POST';

      const { fetchWithTenant } = await import('../../../../lib/fetchWithTenant');
      const res = await fetchWithTenant(isEdit ? `/ad-blocks/${initialData._id}` : '/ad-blocks', {
        method,
        cache: 'no-store',
        headers: { 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save ad');
      }

      router.push('/admin/ads');
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const showInsertionInput = ['article_paragraph', 'article_image'].includes(formData.position);

  return (
    <form onSubmit={handleSubmit} className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
      
      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
          Name
        </label>
        <input
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          id="name"
          name="name"
          type="text"
          placeholder="Ad Block Name"
          value={formData.name}
          onChange={handleChange}
          required
        />
      </div>

      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="position">
          Position
        </label>
        <select
          className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          id="position"
          name="position"
          value={formData.position}
          onChange={handleChange}
        >
          {positions.map(pos => (
            <option key={pos.value} value={pos.value}>{pos.label}</option>
          ))}
        </select>
      </div>

      {showInsertionInput && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded">
          <label className="block text-blue-800 text-sm font-bold mb-2" htmlFor="insertionParameter">
            Insertion Index (e.g., 1 for "After 1st paragraph")
          </label>
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            id="insertionParameter"
            name="insertionParameter"
            type="number"
            min="1"
            placeholder="Index number"
            value={formData.insertionParameter}
            onChange={handleChange}
            required
          />
          <p className="text-xs text-blue-600 mt-1">
            Required for this position.
          </p>
        </div>
      )}

      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="code">
          Ad Code (HTML/JS)
        </label>
        <textarea
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline font-mono text-sm"
          id="code"
          name="code"
          rows="6"
          placeholder="<div...>"
          value={formData.code}
          onChange={handleChange}
          required
        />
      </div>

      <div className="flex mb-4 gap-4">
        <div className="w-1/2">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="priority">
            Priority (Lower = Higher)
            </label>
            <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            id="priority"
            name="priority"
            type="number"
            value={formData.priority}
            onChange={handleChange}
            />
        </div>
        <div className="w-1/2 flex items-center pt-6">
            <label className="flex items-center cursor-pointer">
                <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleChange}
                    className="form-checkbox h-5 w-5 text-blue-600"
                />
                <span className="ml-2 text-gray-700 font-bold">Active</span>
            </label>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          type="submit"
          disabled={loading}
        >
          {loading ? 'Saving...' : (isEdit ? 'Update Ad' : 'Create Ad')}
        </button>
        <button
          className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          type="button"
          onClick={() => router.back()}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
