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
    displayConditions: {
      devices: ['desktop', 'tablet', 'mobile'],
      pageTypes: ['home', 'post', 'page', 'category', 'tag', 'author', 'search'],
      countryMode: 'include',
      countries: [],
      minimumAge: '',
      maximumAge: '',
      startDate: '',
      endDate: '',
      ...(initialData.displayConditions || {})
    },
    insertionParameter: initialData.displayConditions?.insertionParameter || ''
  });
  const [countryCodes, setCountryCodes] = useState((initialData.displayConditions?.countries || []).join(', '));
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

  const handleDisplayConditionChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      displayConditions: { ...prev.displayConditions, [name]: value }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const countries = countryCodes.split(',').map(country => country.trim().toUpperCase()).filter(Boolean);
    if (countries.some(country => !/^[A-Z]{2}$/.test(country))) {
      setError('Enter country codes as two-letter ISO codes, separated by commas.');
      setLoading(false);
      return;
    }
    const { minimumAge, maximumAge, startDate, endDate } = formData.displayConditions;
    if ((minimumAge !== '' && (!Number.isInteger(Number(minimumAge)) || Number(minimumAge) < 0 || Number(minimumAge) > 120)) ||
        (maximumAge !== '' && (!Number.isInteger(Number(maximumAge)) || Number(maximumAge) < 0 || Number(maximumAge) > 120))) {
      setError('Age limits must be whole numbers from 0 to 120.');
      setLoading(false);
      return;
    }
    if (minimumAge !== '' && maximumAge !== '' && Number(minimumAge) > Number(maximumAge)) {
      setError('Minimum age cannot be greater than maximum age.');
      setLoading(false);
      return;
    }
    if (startDate && endDate && startDate > endDate) {
      setError('The end date must be on or after the start date.');
      setLoading(false);
      return;
    }

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
        ...formData.displayConditions,
        countries: [...new Set(countries)],
        minimumAge: minimumAge === '' ? undefined : Number(minimumAge),
        maximumAge: maximumAge === '' ? undefined : Number(maximumAge),
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
            Insertion Index (e.g., 1 for &quot;After 1st paragraph&quot;)
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

      <section className="mb-4 p-4 bg-gray-50 border rounded">
        <h2 className="text-sm font-bold text-gray-700 mb-3">Audience targeting</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="countryMode">Countries</label>
            <select
              id="countryMode"
              className="border rounded w-full py-2 px-3 text-gray-700"
              value={formData.displayConditions.countryMode || 'include'}
              onChange={e => handleDisplayConditionChange('countryMode', e.target.value)}
            >
              <option value="include">Show only in these countries</option>
              <option value="exclude">Hide in these countries</option>
            </select>
            <input
              className="border rounded w-full py-2 px-3 mt-2 text-gray-700"
              type="text"
              value={countryCodes}
              onChange={e => setCountryCodes(e.target.value)}
              placeholder="US, GB, IN"
              aria-label="Two-letter country codes"
            />
            <p className="text-xs text-gray-500 mt-1">Comma-separated ISO country codes; targeting uses the edge location.</p>
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Age range</label>
            <div className="flex gap-2">
              <input
                className="border rounded w-full py-2 px-3 text-gray-700"
                type="number"
                min="0"
                max="120"
                value={formData.displayConditions.minimumAge}
                onChange={e => handleDisplayConditionChange('minimumAge', e.target.value)}
                placeholder="Min age"
                aria-label="Minimum age"
              />
              <input
                className="border rounded w-full py-2 px-3 text-gray-700"
                type="number"
                min="0"
                max="120"
                value={formData.displayConditions.maximumAge}
                onChange={e => handleDisplayConditionChange('maximumAge', e.target.value)}
                placeholder="Max age"
                aria-label="Maximum age"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Requires a first-party <code>pt-verified-age</code> cookie from your age-verification provider. Missing age hides this ad; this is not legal age verification.</p>
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">Schedule (UTC)</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              className="border rounded w-full py-2 px-3 text-gray-700"
              type="date"
              value={formData.displayConditions.startDate || ''}
              onChange={e => handleDisplayConditionChange('startDate', e.target.value)}
              aria-label="Ad start date in UTC"
            />
            <input
              className="border rounded w-full py-2 px-3 text-gray-700"
              type="date"
              value={formData.displayConditions.endDate || ''}
              onChange={e => handleDisplayConditionChange('endDate', e.target.value)}
              aria-label="Ad end date in UTC"
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">Start and end dates are inclusive. Leave blank for no schedule limit.</p>
        </div>
      </section>

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
