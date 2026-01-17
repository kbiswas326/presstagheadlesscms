'use client';
import React, { useRef, useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import TinyMCE with no SSR
const Editor = dynamic(
  () => import('@tinymce/tinymce-react').then(mod => mod.Editor),
  { ssr: false }
);

import ImageGalleryPopup from './ImageGalleryPopup';

const RichTextEditor = ({ content, htmlContentGrab }) => {
  const editorRef = useRef(null);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [imageCallback, setImageCallback] = useState(null);
  const [isEditorReady, setIsEditorReady] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const openImageGallery = (callback) => {
    setImageCallback(() => callback);
    setIsGalleryOpen(true);
  };

  const onImageSelect = (url, altText) => {
    if (imageCallback) {
      // Call the TinyMCE callback with the image URL
      // This ensures TinyMCE handles the image insertion with proper attributes
      imageCallback(url, { alt: altText });
    }
    setIsGalleryOpen(false);
  };

  if (!isMounted) {
    return (
      <div className="bg-white rounded-lg shadow-lg">
        <div className="border-b border-gray-200 p-4">
          <h2 className="text-xl font-semibold text-gray-800">Content</h2>
        </div>
        <div className="p-4 text-center text-gray-600">
          Loading editor...
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg">
      <div className="border-b border-gray-200 p-4">
        <h2 className="text-xl font-semibold text-gray-800">Content</h2>
      </div>
      {!isEditorReady && (
        <div className="p-4 text-center text-gray-600">
          Loading editor...
        </div>
      )}
      <Editor
        apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY || '8m2pony3qhnn3my1l3lr6czqoxm5uft2e82uymu7851l7sb6'}
        onInit={(evt, editor) => {
          editorRef.current = editor;
          setIsEditorReady(true);
        }}
        value={content}
        onEditorChange={(newContent) => {
          htmlContentGrab(newContent);
        }}
        init={{
          height: 500,
          menubar: true,
          branding: false,
          promotion: false,
          selector: 'textarea',
          extended_valid_elements: 'script[src|type|async|defer]',
          valid_children: '+body[script],+head[script]',
          verify_html: false,
          plugins: [
            'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
            'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
            'insertdatetime', 'media', 'table', 'help', 'wordcount', 'emoticons'
          ],
          toolbar: 'styles fontsize | bold italic | image media table link | alignleft aligncenter alignright | bullist numlist',
          browser_spellcheck: true,
          gecko_spellcheck: true,
          contextmenu: false,
          file_picker_callback: function(callback, value, meta) {
            // Only register callback for images
            if (meta.filetype === 'image') {
              openImageGallery((url, info) => {
                callback(url, info);
              });
            }
          },
          // Image settings
          image_caption: true,
          image_advtab: true,
          image_dimensions: true,
          image_description: true,
          image_title: true,
          automatic_uploads: false,
          images_upload_handler: null,
          image_uploadtab: false,
          // Extended image styles
          image_class_list: [
            { title: 'None', value: '' },
            { title: 'Responsive', value: 'img-fluid' }
          ],
          content_style: `
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif; font-size: 14px; line-height: 1.6; color: #333; margin: 1rem; }
            figure { margin: 1em 0; padding: 0; text-align: center; }
            figure img { max-width: 100%; height: auto; }
            figure figcaption { font-style: italic; color: #666; margin-top: 0.5em; font-size: 0.9em; }
            .img-fluid { max-width: 100%; height: auto; }
          `
        }}
      />
      {isGalleryOpen && (
        <ImageGalleryPopup
          onImageSelect={onImageSelect}
          onClose={() => setIsGalleryOpen(false)}
        />
      )}
    </div>
  );
};

export default RichTextEditor;
