'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useParams, useRouter } from 'next/navigation';
import { getLayoutConfig, posts as postsApi } from '../../../../../lib/api';
import { useTheme } from '../../../../context/ThemeContext';
import MediaImagesSelector from '../../../../media/MediaImagesSelector';

const Editor = dynamic(() => import('@tinymce/tinymce-react').then((mod) => mod.Editor), { ssr: false });

export default function CustomPageEditor() {
  const router = useRouter();
  const params = useParams();
  const { isDark } = useTheme();

  const postId = String(params?.id || 'new');
  const isNew = postId === 'new';

  const [siteUrl, setSiteUrl] = useState('');
  const [pageUrlStructure, setPageUrlStructure] = useState('/{slug}');

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [content, setContent] = useState('');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [schema, setSchema] = useState('');

  const [status, setStatus] = useState('draft');
  const [publishedAt, setPublishedAt] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const editorRef = useRef(null);
  const editorCallbackRef = useRef(null);
  const [showMediaSelector, setShowMediaSelector] = useState(false);

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
    if (isNew) return;
    (async () => {
      setIsLoading(true);
      try {
        const res = await postsApi.getById(postId);
        if (res?.error) {
          setError(String(res.error));
          return;
        }
        setTitle(String(res?.title || ''));
        setSlug(String(res?.slug || ''));
        setContent(String(res?.content || ''));
        setMetaTitle(String(res?.seo?.metaTitle || ''));
        setMetaDescription(String(res?.seo?.metaDescription || ''));
        setSchema(res?.seo?.schema ? JSON.stringify(res.seo.schema, null, 2) : '');
        setStatus(String(res?.status || 'draft'));
        setPublishedAt(String(res?.publishedAt || ''));
      } finally {
        setIsLoading(false);
      }
    })();
  }, [isNew, postId]);

  const resolvedPagePath = useMemo(() => {
    const s = String(pageUrlStructure || '/{slug}').trim() || '/{slug}';
    const path = (s.startsWith('/') ? s : `/${s}`).replace('{slug}', String(slug || '').trim());
    return path.includes('{slug}') ? '' : path;
  }, [pageUrlStructure, slug]);

  const previewUrl = useMemo(() => {
    const base = String(siteUrl || '').trim().replace(/\/+$/, '');
    if (!resolvedPagePath) return '';
    return base ? `${base}${resolvedPagePath}` : resolvedPagePath;
  }, [siteUrl, resolvedPagePath]);

  const handleSave = async (nextStatus) => {
    setIsLoading(true);
    setError('');
    setSuccess('');

    const now = new Date();
    const shouldPublish = nextStatus === 'published';
    const resolvedPublishedAt = shouldPublish
      ? (publishedAt ? publishedAt : now.toISOString())
      : null;

    let parsedSchema = null;
    const rawSchema = String(schema || '').trim();
    if (rawSchema) {
      try {
        parsedSchema = JSON.parse(rawSchema);
      } catch {
        setIsLoading(false);
        setError('Schema JSON is invalid.');
        return;
      }
    }

    const payload = {
      title: String(title || '').trim(),
      slug: String(slug || '').trim(),
      summary: '',
      content: String(content || ''),
      type: 'CustomPage',
      status: nextStatus,
      notifySubscribers: false,
      seo: {
        metaTitle: String(metaTitle || '').trim(),
        metaDescription: String(metaDescription || '').trim(),
        schema: parsedSchema,
      },
      ...(shouldPublish ? { publishedAt: resolvedPublishedAt } : {}),
    };

    try {
      const res = isNew ? await postsApi.create(payload) : await postsApi.update(postId, payload);
      if (res?.error) {
        setError(String(res.error));
        return;
      }
      setSuccess(nextStatus === 'published' ? 'Page published.' : 'Draft saved.');
      const nextId = String(res?._id || postId);
      if (isNew && nextId && nextId !== 'new') {
        router.replace(`/posts/custom-page/edit/${nextId}`);
      }
      if (nextStatus === 'published') {
        setStatus('published');
        setPublishedAt(String(res?.publishedAt || resolvedPublishedAt || ''));
      } else {
        setStatus('draft');
      }
    } catch (e) {
      setError(e?.message ? String(e.message) : 'Failed to save page.');
    } finally {
      setIsLoading(false);
    }
  };

  const shell = isDark ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900';
  const panel = isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const input = isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-300';
  const btn = isDark ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600';

  return (
    <div className={`${shell} min-h-screen`}>
      <div className="max-w-5xl mx-auto p-6">
        <div className={`rounded-xl border ${panel}`}>
          <div className="p-5 border-b border-gray-200/20 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="text-xl font-semibold">{isNew ? 'New Custom Page' : 'Edit Custom Page'}</div>
              <div className={isDark ? 'text-sm text-gray-400' : 'text-sm text-gray-600'}>
                Status: {status}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {previewUrl ? (
                <button
                  type="button"
                  onClick={() => window.open(previewUrl, '_blank')}
                  className={isDark ? 'px-3 py-2 rounded-md bg-gray-700 hover:bg-gray-600' : 'px-3 py-2 rounded-md bg-gray-100 hover:bg-gray-200'}
                >
                  Preview
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => router.push('/posts/custom-page')}
                className={isDark ? 'px-3 py-2 rounded-md bg-gray-700 hover:bg-gray-600' : 'px-3 py-2 rounded-md bg-gray-100 hover:bg-gray-200'}
              >
                Back
              </button>
              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleSave('draft')}
                className={`px-4 py-2 rounded-md text-white ${btn} disabled:opacity-50`}
              >
                Save Draft
              </button>
              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleSave('published')}
                className={`px-4 py-2 rounded-md text-white ${btn} disabled:opacity-50`}
              >
                {status === 'published' ? 'Update' : 'Publish'}
              </button>
            </div>
          </div>

          <div className="p-5 space-y-4">
            {error ? (
              <div className={isDark ? 'text-red-300' : 'text-red-600'}>{error}</div>
            ) : null}
            {success ? (
              <div className={isDark ? 'text-green-300' : 'text-green-600'}>{success}</div>
            ) : null}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Title</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={`mt-1 w-full px-3 py-2 rounded-md border ${input}`}
                  placeholder="About Us"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Slug</label>
                <input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className={`mt-1 w-full px-3 py-2 rounded-md border ${input}`}
                  placeholder="about-us"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Content</label>
              <div className="mt-1">
                <Editor
                  apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY}
                  onInit={(_, editor) => {
                    editorRef.current = editor;
                  }}
                  value={content}
                  onEditorChange={(v) => setContent(v)}
                  init={{
                    height: 520,
                    menubar: true,
                    branding: false,
                    promotion: false,
                    skin: isDark ? 'oxide-dark' : 'oxide',
                    content_css: isDark ? 'dark' : 'default',
                    extended_valid_elements: 'script[src|type|async|defer]',
                    valid_children: '+body[script],+head[script]',
                    verify_html: false,
                    plugins: 'link image media table lists code wordcount',
                    toolbar:
                      'blocks fontsize | bold italic | image media table link | alignleft aligncenter alignright | bullist numlist | writingcheck',
                    link_advanced_tab: true,
                    link_rel_list: [
                      { title: 'Do-follow', text: 'Do-follow', value: '' },
                      { title: 'No-follow', text: 'No-follow', value: 'nofollow' },
                    ],
                    browser_spellcheck: true,
                    file_picker_callback: function (callback, value, meta) {
                      if (meta.filetype === 'image') {
                        if (window.tinymce && window.tinymce.activeEditor) {
                          editorCallbackRef.current = { editor: window.tinymce.activeEditor };
                        } else {
                          editorCallbackRef.current = callback;
                        }
                        setShowMediaSelector(true);
                      }
                    },
                    setup: (editor) => {
                      editor.ui.registry.addButton('writingcheck', {
                        text: 'Check',
                        onAction: async () => {
                          try {
                            const text = editor.getContent({ format: 'text' }) || '';
                            const endpoint = process.env.NEXT_PUBLIC_LANGUAGETOOL_URL || 'https://api.languagetool.org/v2/check';
                            const body = new URLSearchParams({ text, language: 'en-US' });
                            const res = await fetch(endpoint, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                              body: body.toString(),
                            });
                            if (!res.ok) {
                              editor.windowManager.alert('Writing check failed.');
                              return;
                            }
                            const data = await res.json();
                            const matches = Array.isArray(data?.matches) ? data.matches : [];
                            if (matches.length === 0) {
                              editor.windowManager.alert('No issues found.');
                              return;
                            }
                            const lines = matches.slice(0, 10).map((m) => {
                              const msg = String(m?.message || 'Issue');
                              const repl = Array.isArray(m?.replacements) && m.replacements.length > 0 ? ` → ${m.replacements[0].value}` : '';
                              return `- ${msg}${repl}`;
                            });
                            const more = matches.length > 10 ? `\n(+${matches.length - 10} more)` : '';
                            editor.windowManager.alert(`${matches.length} issue(s) found:\n${lines.join('\n')}${more}`);
                          } catch {
                            editor.windowManager.alert('Writing check failed.');
                          }
                        },
                      });
                    },
                  }}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Meta Title</label>
                <input
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                  className={`mt-1 w-full px-3 py-2 rounded-md border ${input}`}
                  placeholder="About Us | Site Name"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Meta Description</label>
                <input
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  className={`mt-1 w-full px-3 py-2 rounded-md border ${input}`}
                  placeholder="Short description for Google"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Schema (JSON-LD)</label>
              <textarea
                value={schema}
                onChange={(e) => setSchema(e.target.value)}
                className={`mt-1 w-full px-3 py-2 rounded-md border ${input} min-h-[140px] font-mono text-xs`}
                placeholder='{"@context":"https://schema.org","@type":"WebPage"}'
              />
            </div>

            {showMediaSelector ? (
              <MediaImagesSelector
                onSelect={(image) => {
                  if (editorCallbackRef.current && editorCallbackRef.current.editor) {
                    const captionHtml = image.caption
                      ? `<figcaption class="absolute bottom-0 left-0 right-0 bg-black/60 text-white p-2 text-sm">${image.caption}</figcaption>`
                      : '';
                    const imgContent = `<figure class="relative rounded-lg overflow-hidden mb-6 block w-full">
                        <img src="${image.url}" alt="${image.altText || ''}" title="${image.title || ''}" class="w-full h-auto object-cover" />
                        ${captionHtml}
                    </figure><p></p>`;
                    editorCallbackRef.current.editor.insertContent(imgContent);
                    editorCallbackRef.current = null;
                  } else if (typeof editorCallbackRef.current === 'function') {
                    editorCallbackRef.current(image.url, { alt: image.altText, title: image.title });
                    editorCallbackRef.current = null;
                  } else if (editorRef.current) {
                    editorRef.current.insertContent(`<p><img src="${image.url}" alt="${image.altText || ''}" /></p>`);
                  }
                  setShowMediaSelector(false);
                }}
                onClose={() => {
                  setShowMediaSelector(false);
                  editorCallbackRef.current = null;
                }}
              />
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
