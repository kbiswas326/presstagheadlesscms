"use client";

import { useState, useEffect } from "react";
import { useTheme } from "context/ThemeContext";
import MediaImagesSelector from "../media/MediaImagesSelector";
import {
  getTags,
  createTag,
  updateTag,
  deleteTag,
} from "../../lib/api";
import {
  Plus,
  Search,
  MoreVertical,
  Edit3,
  Trash2,
  X,
  Tag,
  AlertTriangle,
  Loader2,
  Image as ImageIcon
} from "lucide-react";

export default function TagsPage() {
  const { isDark } = useTheme();
  const [tags, setTags] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTag, setEditingTag] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [openMenuIndex, setOpenMenuIndex] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isImageSelectorOpen, setIsImageSelectorOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    image: null,
    metaTitle: "",
    metaDescription: "",
  });

  // Fetch tags on mount
  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    try {
      setIsLoading(true);
      const data = await getTags();
      const t = Array.isArray(data.tags) ? data.tags : (Array.isArray(data) ? data : []);
      const mappedTags = t.map(tag => ({
        ...tag,
        id: tag._id || tag.id,
      }));
      setTags(mappedTags);
    } catch (error) {
      console.error("Failed to fetch tags:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-generate slug
  useEffect(() => {
    // Only auto-generate if not editing existing slug or if it's empty
    if (!editingTag || !formData.slug) {
      const slug = formData.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
      setFormData((prev) => ({ ...prev, slug }));
    }
  }, [formData.name, editingTag]);

  const filteredTags = tags.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = async () => {
    try {
      setIsSaving(true);
      if (editingTag) {
        // Update
        const updated = await updateTag(editingTag.id, formData);
        setTags((prev) =>
          prev.map((t) =>
            t.id === editingTag.id ? { ...updated, id: updated._id || updated.id, postCount: t.postCount } : t
          )
        );
      } else {
        // Create
        const newTag = await createTag(formData);
        setTags((prev) => [
          ...prev,
          { ...newTag, id: newTag._id || newTag.id, postCount: 0 },
        ]);
      }

      setIsModalOpen(false);
      setEditingTag(null);
      resetForm();
    } catch (error) {
      console.error("Failed to save tag:", error);
      alert("Failed to save tag. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      slug: "",
      description: "",
      image: null,
      metaTitle: "",
      metaDescription: "",
    });
  };

  const handleDelete = async () => {
    try {
      await deleteTag(deleteId);
      setTags((prev) => prev.filter((t) => t.id !== deleteId));
      setDeleteId(null);
      setIsDeleteConfirmOpen(false);
    } catch (error) {
      console.error("Failed to delete tag:", error);
      alert("Failed to delete tag. Please try again.");
    }
  };

  const openEdit = (tag) => {
    setEditingTag(tag);
    setFormData({
      name: tag.name,
      slug: tag.slug,
      description: tag.description || "",
      image: tag.image || null,
      metaTitle: tag.metaTitle || "",
      metaDescription: tag.metaDescription || "",
    });
    setIsModalOpen(true);
    setOpenMenuIndex(null);
  };

  return (
    <div className="p-6">
      {/* Breadcrumb */}
      <div className={`flex items-center text-sm mb-4 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
        <a href="/" className={`hover:underline ${isDark ? "text-gray-300" : ""}`}>Home</a>
        <span className="mx-2">›</span>
        <span className="text-blue-600 font-semibold">Tags</span>
      </div>

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className={`text-xl font-semibold flex items-center gap-2 ${isDark ? "text-white" : ""}`}>
          <Tag size={20} /> Tags
        </h1>

        <button
          onClick={() => {
            resetForm();
            setEditingTag(null);
            setIsModalOpen(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Plus size={18} /> Add Tag
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className={`flex items-center gap-2 px-4 py-2 rounded-lg shadow border max-w-md ${isDark ? "bg-gray-800 border-gray-700" : "bg-white"}`}>
          <Search className="text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search tags..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`flex-1 outline-none text-sm ${isDark ? "bg-transparent text-white placeholder-gray-400" : "text-gray-900"}`}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Tag List */}
      <div className={`border rounded-xl shadow ${isDark ? "bg-gray-800 border-gray-700" : "bg-white"}`}>
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="animate-spin text-blue-600" size={32} />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className={`text-left ${isDark ? "bg-gray-900 text-gray-300" : "bg-gray-50 text-gray-900"}`}>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Slug</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Posts</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredTags.map((tag) => (
                <tr key={tag.id} className={`border-t ${isDark ? "border-gray-700 text-gray-200" : "border-gray-200 text-gray-900"}`}>
                  <td className="px-4 py-3 font-medium">{tag.name}</td>
                  <td className={`px-4 py-3 ${isDark ? "text-gray-400" : "text-gray-600"}`}>{tag.slug}</td>
                  <td className={`px-4 py-3 ${isDark ? "text-gray-400" : "text-gray-600"}`}>{tag.description || "—"}</td>
                  <td className={`px-4 py-3 ${isDark ? "text-gray-400" : "text-gray-600"}`}>{tag.postCount || 0}</td>

                  <td className="px-4 py-3 text-right relative">
                    <button
                      onClick={() =>
                        setOpenMenuIndex(
                          openMenuIndex === tag.id ? null : tag.id
                        )
                      }
                      className={`p-1 rounded ${isDark ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
                    >
                      <MoreVertical size={18} />
                    </button>

                    {openMenuIndex === tag.id && (
                      <div className={`absolute right-0 mt-2 w-40 shadow-lg border rounded-lg z-50 ${isDark ? "bg-gray-800 border-gray-700 text-white" : "bg-white text-gray-900"}`}>
                        <button
                          onClick={() => openEdit(tag)}
                          className={`flex w-full px-3 py-2 text-left gap-2 ${isDark ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
                        >
                          <Edit3 size={16} /> Edit
                        </button>

                        <button
                          onClick={() => {
                            setDeleteId(tag.id);
                            setIsDeleteConfirmOpen(true);
                            setOpenMenuIndex(null);
                          }}
                          className={`flex w-full px-3 py-2 text-left text-red-600 gap-2 ${isDark ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
                        >
                          <Trash2 size={16} /> Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}

              {filteredTags.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center text-gray-400 py-10">
                    No tags found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Add / Edit Tag Modal */}
      {isModalOpen && (
        <TagModal
          formData={formData}
          setFormData={setFormData}
          close={() => setIsModalOpen(false)}
          save={handleSave}
          editingTag={editingTag}
          isSaving={isSaving}
          setIsImageSelectorOpen={setIsImageSelectorOpen}
        />
      )}

      {isImageSelectorOpen && (
        <MediaImagesSelector
          onSelect={(img) => {
            setFormData(prev => ({ ...prev, image: img }));
            setIsImageSelectorOpen(false);
          }}
          onClose={() => setIsImageSelectorOpen(false)}
        />
      )}

      {/* Delete Confirmation */}
      {isDeleteConfirmOpen && (
        <DeleteConfirmModal
          onConfirm={handleDelete}
          onCancel={() => setIsDeleteConfirmOpen(false)}
        />
      )}
    </div>
  );
}

/* ---------------------- TAG MODAL ---------------------- */

function TagModal({ formData, setFormData, close, save, editingTag, isSaving, setIsImageSelectorOpen }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-xl shadow-lg w-[600px] max-h-[90vh] overflow-y-auto relative">
        <button className="absolute right-4 top-4" onClick={close}>
          <X size={20} />
        </button>

        <h2 className="text-lg font-semibold mb-4">
          {editingTag ? "Edit Tag" : "Add Tag"}
        </h2>

        {/* Name */}
        <FormInput
          label="Tag Name"
          value={formData.name}
          onChange={(e) =>
            setFormData({ ...formData, name: e.target.value })
          }
        />

        {/* Slug */}
        <FormInput
          label="Slug"
          value={formData.slug}
          onChange={(e) =>
            setFormData({ ...formData, slug: e.target.value })
          }
          className="mt-4"
        />

        {/* Description */}
        <FormTextarea
          label="Description"
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
        />

        {/* Feature Image */}
        <div className="mt-4">
          <label className="text-sm font-medium">Feature Image</label>
          <div className="mt-1 border rounded-lg p-4 flex flex-col items-center justify-center bg-gray-50 border-dashed border-gray-300">
             {formData.image ? (
               <div className="relative w-full h-48">
                 <img 
                   src={formData.image.url} 
                   alt={formData.image.altText || "Tag Image"} 
                   className="w-full h-full object-cover rounded-lg" 
                 />
                 <button 
                   onClick={() => setFormData({...formData, image: null})} 
                   className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full hover:bg-red-700"
                   title="Remove Image"
                 >
                   <X size={16}/>
                 </button>
               </div>
             ) : (
               <button 
                 onClick={() => setIsImageSelectorOpen(true)} 
                 className="flex flex-col items-center text-gray-500 hover:text-blue-600 transition-colors"
               >
                 <ImageIcon size={32} className="mb-2" />
                 <span className="text-sm">Select Feature Image</span>
               </button>
             )}
          </div>
        </div>

        {/* SEO */}
        <div className="mt-6 border-t pt-4">
          <h3 className="font-medium text-sm mb-3">SEO Fields</h3>

          <FormInput
            label="Meta Title"
            value={formData.metaTitle}
            onChange={(e) =>
              setFormData({ ...formData, metaTitle: e.target.value })
            }
          />

          <FormTextarea
            label="Meta Description"
            value={formData.metaDescription}
            onChange={(e) =>
              setFormData({
                ...formData,
                metaDescription: e.target.value,
              })
            }
          />
        </div>

        <button
          onClick={save}
          disabled={isSaving}
          className="w-full mt-6 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 flex justify-center items-center"
        >
          {isSaving ? (
            <>
              <Loader2 className="animate-spin mr-2" size={18} /> Saving...
            </>
          ) : (
            editingTag ? "Save Changes" : "Add Tag"
          )}
        </button>
      </div>
    </div>
  );
}

/* ---------------------- DELETE CONFIRM MODAL ---------------------- */

function DeleteConfirmModal({ onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-xl w-[400px] shadow-xl">
        <div className="flex items-center gap-3 mb-3">
          <div className="bg-red-100 p-2 rounded-full">
            <AlertTriangle className="text-red-600" size={24} />
          </div>
          <h2 className="text-lg font-semibold">Delete Tag</h2>
        </div>

        <p className="text-gray-600 mb-6">
          Are you sure you want to delete this tag?
          Posts using this tag will not be deleted.
        </p>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 bg-gray-200 py-2 rounded-lg hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------------- INPUT COMPONENTS ---------------------- */

function FormInput({ label, value, onChange }) {
  return (
    <div className="mt-4">
      <label className="text-sm font-medium">{label}</label>
      <input
        value={value}
        onChange={onChange}
        className="w-full mt-1 px-3 py-2 border rounded-lg"
      />
    </div>
  );
}

function FormTextarea({ label, value, onChange }) {
  return (
    <div className="mt-4">
      <label className="text-sm font-medium">{label}</label>
      <textarea
        value={value}
        onChange={onChange}
        rows={3}
        className="w-full mt-1 px-3 py-2 border rounded-lg"
      />
    </div>
  );
}
