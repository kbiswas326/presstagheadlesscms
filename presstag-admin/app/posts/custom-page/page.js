'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getLayoutConfig, posts as postsApi } from '../../../lib/api';
import { useTheme } from '../../context/ThemeContext';

export default function CustomPagesListPage() {
  const router = useRouter();
  const { isDark } = useTheme();

  const [status, setStatus] = useState('published');
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 20;

  const [items, setItems] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [siteUrl, setSiteUrl] = useState('');
  const [pageUrlStructure, setPageUrlStructure] = useState('/{slug}');

  useEffect(() => {
    (async () => {
      try {
        const cfg = await getLayoutConfig();
        setSiteUrl(String(cfg?.branding?.siteUrl || '').trim());
        setPageUrlStructure(String(cfg?.seo?.pageUrlStructure || '/{slug}'));
      } catch {}
    })();
  }, []);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      try {
        const res = await postsApi.getByStatus(status, { page: currentPage, limit, type: 'CustomPage' });
        const list = Array.isArray(res) ? res : (res.posts || []);
        setItems(list);
        const nextTotalPages = (!Array.isArray(res) && res?.pagination?.totalPages) ? res.pagination.totalPages : 1;
        setTotalPages(nextTotalPages || 1);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [status, currentPage]);

  const baseFront = useMemo(() => {
    const s = String(siteUrl || '').trim().replace(/\/+$/, '');
    return s || '';
  }, [siteUrl]);

  const resolvePagePath = (page) => {
    const slug = String(page?.slug || page?._id || '').trim();
    if (!slug) return '';
    const structure = String(pageUrlStructure || '/{slug}').trim() || '/{slug}';
    const path = (structure.startsWith('/') ? structure : `/${structure}`).replace('{slug}', slug);
    return path;
  };

  const containerClass = isDark ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900';
  const cardClass = isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const btnClass = isDark ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600';

  return (
    <div className={`${containerClass} min-h-screen`}>
      <div className="max-w-6xl mx-auto p-6">
        <div className={`rounded-xl border ${cardClass}`}>
          <div className="p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-200/20">
            <div>
              <h1 className="text-xl font-semibold">Custom Pages</h1>
              <div className={isDark ? 'text-sm text-gray-400' : 'text-sm text-gray-600'}>
                Create About, Contact, Terms, Privacy pages and manage their SEO.
              </div>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setCurrentPage(1);
                }}
                className={isDark ? 'bg-gray-900 border border-gray-700 rounded-md px-3 py-2' : 'bg-white border border-gray-300 rounded-md px-3 py-2'}
              >
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
              <button
                type="button"
                onClick={() => router.push('/posts/custom-page/edit/new')}
                className={`text-white px-4 py-2 rounded-md ${btnClass}`}
              >
                New Page
              </button>
            </div>
          </div>

          <div className="p-5">
            {isLoading ? (
              <div className={isDark ? 'text-gray-400' : 'text-gray-600'}>Loading…</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className={isDark ? 'text-gray-300' : 'text-gray-600'}>
                      <th className="text-left py-2">Title</th>
                      <th className="text-left py-2">Slug</th>
                      <th className="text-left py-2">Status</th>
                      <th className="text-right py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody className={isDark ? 'divide-y divide-gray-700' : 'divide-y divide-gray-200'}>
                    {items.map((p) => {
                      const id = String(p?._id || p?.id || '');
                      const slug = String(p?.slug || '');
                      const path = resolvePagePath(p);
                      const href = path ? (baseFront ? `${baseFront}${path}` : path) : '';
                      return (
                        <tr key={id || slug}>
                          <td className="py-3">{p?.title || '(Untitled)'}</td>
                          <td className="py-3">{slug}</td>
                          <td className="py-3">{p?.status || status}</td>
                          <td className="py-3 text-right">
                            <div className="flex justify-end gap-2">
                              {href ? (
                                <button
                                  type="button"
                                  onClick={() => window.open(href, '_blank')}
                                  className={isDark ? 'px-3 py-1 rounded-md bg-gray-700 hover:bg-gray-600' : 'px-3 py-1 rounded-md bg-gray-100 hover:bg-gray-200'}
                                >
                                  View
                                </button>
                              ) : null}
                              <button
                                type="button"
                                onClick={() => router.push(`/posts/custom-page/edit/${id}`)}
                                className={isDark ? 'px-3 py-1 rounded-md bg-gray-700 hover:bg-gray-600' : 'px-3 py-1 rounded-md bg-gray-100 hover:bg-gray-200'}
                              >
                                Edit
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {items.length === 0 ? (
                      <tr>
                        <td colSpan={4} className={`py-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          No pages found.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            )}

            <div className="mt-5 flex items-center justify-between">
              <div className={isDark ? 'text-sm text-gray-400' : 'text-sm text-gray-600'}>
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className={isDark ? 'px-3 py-1 rounded-md bg-gray-700 disabled:opacity-50' : 'px-3 py-1 rounded-md bg-gray-100 disabled:opacity-50'}
                >
                  Prev
                </button>
                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className={isDark ? 'px-3 py-1 rounded-md bg-gray-700 disabled:opacity-50' : 'px-3 py-1 rounded-md bg-gray-100 disabled:opacity-50'}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}









