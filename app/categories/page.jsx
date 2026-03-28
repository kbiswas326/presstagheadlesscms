"use client";

import { useState, useEffect } from "react";
import { useTheme } from "../context/ThemeContext";
import MediaImagesSelector from "../media/MediaImagesSelector";
import { Image as ImageIcon } from "lucide-react";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../../lib/api";
import {
  Plus,
  Search,
  MoreVertical,
  Edit3,
  Trash2,
  X,
  Layers,
  AlertTriangle,
  Loader2,
} from "lucide-react";

export default function CategoriesPage() {
  const { isDark } = useTheme();
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [openMenuIndex, setOpenMenuIndex] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isImageSelectorOpen, setIsImageSelectorOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
      slug: "",
      parent: "",
      image: null,
    description: "",
    metaTitle: "",
    metaDescription: "",
  });

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      const data = await getCategories();
      // Ensure we have an array
      const cats = Array.isArray(data.categories) ? data.categories : (Array.isArray(data) ? data : []);
      // Map _id to id if needed
      const mappedCats = cats.map(cat => ({
        ...cat,
        id: cat._id || cat.id,
      }));
      setCategories(mappedCats);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-generate slug
  useEffect(() => {
    // Only auto-generate if not editing existing slug or if it's empty
    if (!editingCategory || !formData.slug) {
      let slug = formData.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

      if (formData.parent) {
        const parentCat = categories.find(
          (c) => c.id === formData.parent
        );
        if (parentCat) slug = `${parentCat.slug}/${slug}`;
      }

      setFormData((prev) => ({ ...prev, slug }));
    }
  }, [formData.name, formData.parent, categories, editingCategory]);

  // Filtered list
  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(search.toLowerCase())
  );

  // Save category
  const handleSave = async () => {
    try {
      setIsSaving(true);
      if (editingCategory) {
        // Update
        const updated = await updateCategory(editingCategory.id, formData);
        setCategories((prev) =>
          prev.map((cat) =>
            cat.id === editingCategory.id
              ? { ...updated, id: updated._id || updated.id, postCount: cat.postCount }
              : cat
          )
        );
      } else {
        // Create new
        const newCat = await createCategory(formData);
        setCategories((prev) => [
          ...prev,
          { ...newCat, id: newCat._id || newCat.id, postCount: 0 },
        ]);
      }

      setIsModalOpen(false);
      setEditingCategory(null);
      resetForm();
    } catch (error) {
      console.error("Failed to save category:", error);
      alert(error.message || "Failed to save category. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      slug: "",
      parent: "",
      description: "",
      metaTitle: "",
      metaDescription: "",
    });
  };

  // Delete category
  const handleDelete = async () => {
    try {
      await deleteCategory(deleteId);
      setCategories((prev) => prev.filter((cat) => cat.id !== deleteId));
      setDeleteId(null);
      setIsDeleteConfirmOpen(false);
    } catch (error) {
      console.error("Failed to delete category:", error);
      alert("Failed to delete category. Please try again.");
    }
  };

  // Open edit modal
  const openEdit = (cat) => {
    setEditingCategory(cat);
    setFormData({
      name: cat.name,
      slug: cat.slug,
      parent: cat.parent || "",
      image: cat.image || null,
      description: cat.description || "",
      metaTitle: cat.metaTitle || "",
      metaDescription: cat.metaDescription || "",
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
        <span className="text-blue-600 font-semibold">Categories</span>
      </div>

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className={`text-xl font-semibold flex items-center gap-2 ${isDark ? "text-white" : ""}`}>
          <Layers size={20} /> Categories
        </h1>

        <button
          onClick={() => {
            resetForm();
            setEditingCategory(null);
            setIsModalOpen(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Plus size={18} /> Add Category
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className={`flex items-center gap-2 px-4 py-2 rounded-lg shadow border max-w-md ${isDark ? "bg-gray-800 border-gray-700" : "bg-white"}`}>
          <Search className="text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search categories..."
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

      {/* Category List */}
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
              {filteredCategories.map((cat) => (
                <tr key={cat.id} className={`border-t ${isDark ? "border-gray-700 text-gray-200" : "border-gray-200 text-gray-900"}`}>
                  <td className="px-4 py-3 font-medium">{cat.name}</td>
                  <td className={`px-4 py-3 ${isDark ? "text-gray-400" : "text-gray-600"}`}>{cat.slug}</td>
                  <td className={`px-4 py-3 ${isDark ? "text-gray-400" : "text-gray-600"}`}>{cat.description || "—"}</td>
                  <td className={`px-4 py-3 ${isDark ? "text-gray-400" : "text-gray-600"}`}>{cat.postCount || 0}</td>

                  <td className="px-4 py-3 text-right relative">
                    <button
                      onClick={() =>
                        setOpenMenuIndex(
                          openMenuIndex === cat.id ? null : cat.id
                        )
                      }
                      className={`p-1 rounded ${isDark ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
                    >
                      <MoreVertical size={18} />
                    </button>

                    {openMenuIndex === cat.id && (
                      <div className="absolute right-0 mt-2 w-40 bg-white shadow-lg border rounded-lg z-50 text-gray-900">
                        <button
                          onClick={() => openEdit(cat)}
                          className="flex w-full px-3 py-2 text-left hover:bg-gray-100 gap-2"
                        >
                          <Edit3 size={16} /> Edit
                        </button>

                        <button
                          onClick={() => {
                            setDeleteId(cat.id);
                            setIsDeleteConfirmOpen(true);
                            setOpenMenuIndex(null);
                          }}
                          className="flex w-full px-3 py-2 text-left hover:bg-gray-100 text-red-600 gap-2"
                        >
                          <Trash2 size={16} /> Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}

              {filteredCategories.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center text-gray-400 py-10">
                    No categories found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Add / Edit Category Modal */}
      {isModalOpen && (
        <CategoryModal
          formData={formData}
          setFormData={setFormData}
          close={() => setIsModalOpen(false)}
          save={handleSave}
          categories={categories}
          editingCategory={editingCategory}
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

/* ---------------------- CATEGORY MODAL ---------------------- */

function CategoryModal({
  formData,
  setFormData,
  close,
  save,
  categories,
  editingCategory,
  isSaving,
  setIsImageSelectorOpen,
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-xl shadow-lg w-[600px] max-h-[90vh] overflow-y-auto relative">
        <button className="absolute right-4 top-4" onClick={close}>
          <X size={20} />
        </button>

        <h2 className="text-lg font-semibold mb-4">
          {editingCategory ? "Edit Category" : "Add Category"}
        </h2>

        {/* Name */}
        <FormInput
          label="Category Name"
          value={formData.name}
          onChange={(e) =>
            setFormData({ ...formData, name: e.target.value })
          }
        />

        {/* Parent Category */}
        <div className="mt-4">
          <label className="text-sm font-medium">Parent Category</label>
          <select
            value={formData.parent}
            onChange={(e) =>
              setFormData({ ...formData, parent: e.target.value })
            }
            className="w-full mt-1 px-3 py-2 border rounded-lg"
          >
            <option value="">None</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

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
                   alt={formData.image.altText || "Category Image"} 
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

        {/* SEO Fields */}
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
            editingCategory ? "Save Changes" : "Add Category"
          )}
        </button>
      </div>
    </div>
  );
}

/* ---------------------- DELETE CONFIRMATION MODAL ---------------------- */

function DeleteConfirmModal({ onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-xl w-[400px] shadow-xl">
        <div className="flex items-center gap-3 mb-3">
          <div className="bg-red-100 p-2 rounded-full">
            <AlertTriangle className="text-red-600" size={24} />
          </div>
          <h2 className="text-lg font-semibold">Delete Category</h2>
        </div>

        <p className="text-gray-600 mb-6">
          Are you sure you want to delete this category?  
          Posts under this category will not be deleted.
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
