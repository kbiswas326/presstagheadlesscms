"use client";

import MediaImagesSelector from "../media/MediaImagesSelector";
import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useTheme } from "context/ThemeContext";
import {
  Plus,
  Search,
  MoreVertical,
  Edit3,
  Trash2,
  X,
  Image as ImageIcon,
  Loader2,
} from "lucide-react";
import { getUsers, createUser, updateUser, deleteUser, uploadMedia } from "../../lib/api";

// Full Team Page
export default function TeamPage() {
  const { isDark } = useTheme();
  const [authors, setAuthors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingAuthor, setEditingAuthor] = useState(null);
  const [deletingAuthorId, setDeletingAuthorId] = useState(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isImageSelectorOpen, setIsImageSelectorOpen] = useState(false);

  const [openMenuIndex, setOpenMenuIndex] = useState(null);

  // Add/Edit form state
  const initialForm = {
    name: "",
    slug: "",
    email: "",
    password: "", // Added password field
    role: "writer",
    bio: "",
    seoTitle: "",
    seoDescription: "",
    image: null,
    preview: null,
  };
  const [formData, setFormData] = useState(initialForm);

  // Fetch users on mount
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const data = await getUsers();
      // Map _id to id for frontend consistency if needed, or use _id directly.
      // Backend returns { users: [...] } or just array. API lib handles it.
      const userList = (data.users || data || []).map(u => ({
        ...u,
        id: u._id || u.id,
        preview: u.image ? (typeof u.image === 'object' ? u.image.url : (u.image.startsWith('http') ? u.image : `${process.env.NEXT_PUBLIC_API_URL}${u.image}`)) : null
      }));
      setAuthors(userList);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-generate slug
  useEffect(() => {
    if (formData.name && !editingAuthor) {
      setFormData((prev) => ({
        ...prev,
        slug: prev.name.toLowerCase().replace(/\s+/g, "-"),
      }));
    }
  }, [formData.name, editingAuthor]);

  // Filter authors by search query
  const filteredAuthors = authors.filter((a) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      a.name?.toLowerCase().includes(q) || a.email?.toLowerCase().includes(q)
    );
  });

  // Handle add/edit save
  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      let imageUrl = formData.image; // Keep existing if string (URL)
      
      // If image is a File object, upload it
      if (formData.image instanceof File) {
        const uploadResult = await uploadMedia(formData.image);
        // Assuming uploadResult returns { url: ... } or similar.
        imageUrl = uploadResult.url || uploadResult.filePath || uploadResult.path;
      }

      const payload = {
        name: formData.name,
        slug: formData.slug,
        email: formData.email,
        role: formData.role,
        bio: formData.bio,
        seoTitle: formData.seoTitle,
        seoDescription: formData.seoDescription,
        image: imageUrl,
      };

      if (formData.password) {
        payload.password = formData.password;
      }

      if (editingAuthor) {
        const updated = await updateUser(editingAuthor.id, payload);
        setAuthors((prev) =>
          prev.map((a) =>
            a.id === editingAuthor.id ? { ...updated, id: updated._id || updated.id, preview: updated.image } : a
          )
        );
      } else {
        if (!payload.password) {
          alert("Password is required for new users");
          setIsSaving(false);
          return;
        }
        const created = await createUser(payload);
        setAuthors((prev) => [
          ...prev,
          { ...created, id: created._id || created.id, posts: 0, preview: created.image },
        ]);
      }
      
      setFormData(initialForm);
      setIsAddOpen(false);
      setEditingAuthor(null);
    } catch (error) {
      console.error("Failed to save user:", error);
      alert("Failed to save user: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    try {
      await deleteUser(deletingAuthorId);
      setAuthors((prev) => prev.filter((a) => a.id !== deletingAuthorId));
      setIsDeleteOpen(false);
      setDeletingAuthorId(null);
    } catch (error) {
      console.error("Failed to delete user:", error);
      alert("Failed to delete user");
    }
  };

  // Image select
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const preview = URL.createObjectURL(file);
    setFormData((prev) => ({ ...prev, image: file, preview }));
  };

  // Open edit
  const openEdit = (author) => {
    setEditingAuthor(author);
    setFormData({
      name: author.name,
      slug: author.slug || "",
      email: author.email,
      password: "", // Don't show password
      role: author.role,
      bio: author.bio || "",
      seoTitle: author.seoTitle || "",
      seoDescription: author.seoDescription || "",
      image: author.image, // URL string
      preview: author.preview,
    });
    setIsAddOpen(true);
    setOpenMenuIndex(null);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className={`text-xl font-semibold ${isDark ? "text-white" : ""}`}>Authors</h1>
        <button
          onClick={() => {
            setEditingAuthor(null);
            setFormData(initialForm);
            setIsAddOpen(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Plus size={18} /> Add New
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-4 max-w-md">
        <div className={`flex items-center gap-2 px-4 py-2 rounded-lg shadow border ${isDark ? "bg-gray-800 border-gray-700" : "bg-white"}`}>
          <Search size={18} className="text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search authors by name or email..."
            className={`flex-1 outline-none text-sm ${isDark ? "bg-transparent text-white placeholder-gray-400" : "text-gray-900"}`}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Authors Table */}
      <div className={`rounded-xl shadow overflow-x-auto ${isDark ? "bg-gray-800 border border-gray-700" : "bg-white"}`}>
        {isLoading ? (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="animate-spin text-blue-600" size={32} />
          </div>
        ) : (
          <table className="w-full text-left">
            <thead className={`${isDark ? "bg-gray-900 text-gray-300" : "bg-gray-100"}`}>
              <tr>
                <th className="px-4 py-3">Image</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                {/* <th className="px-4 py-3">Posts</th> */}
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAuthors.map((author) => (
                <AuthorRow
                  key={author.id}
                  author={author}
                  openMenuIndex={openMenuIndex}
                  setOpenMenuIndex={setOpenMenuIndex}
                  openEdit={openEdit}
                  setDeletingAuthorId={setDeletingAuthorId}
                  setIsDeleteOpen={setIsDeleteOpen}
                />
              ))}
              {filteredAuthors.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-6 text-gray-400">
                    No authors found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Add/Edit Modal */}
      {isAddOpen && (
        <Modal close={() => {setIsAddOpen(false); setEditingAuthor(null);}}>
          <h2 className="text-lg font-semibold mb-4">
            {editingAuthor ? "Edit Author" : "Add New Author"}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput
              label="Name"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
            <FormInput
              label="Slug"
              value={formData.slug}
              onChange={(e) => setFormData({...formData, slug: e.target.value})}
            />
            <FormInput
              label="Email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
            />
            <FormInput
              label={editingAuthor ? "New Password (leave blank to keep)" : "Password"}
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              type="password"
            />
            <div>
              <label className="text-sm font-medium">Role</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({...formData, role: e.target.value})}
                className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring-blue-500 focus:ring-2 focus:outline-none"
              >
                <option value="admin">Admin</option>
                <option value="editor">Editor</option>
                <option value="writer">Writer</option>
              </select>
            </div>
            <FormInput
              label="Bio"
              value={formData.bio}
              onChange={(e) => setFormData({...formData, bio: e.target.value})}
            />
            <FormInput
              label="SEO Title"
              value={formData.seoTitle}
              onChange={(e) => setFormData({...formData, seoTitle: e.target.value})}
            />
            <FormInput
              label="SEO Description"
              value={formData.seoDescription}
              onChange={(e) => setFormData({...formData, seoDescription: e.target.value})}
            />
            <div>
<label className="text-sm font-medium mb-1 block">Bio Image</label>
              <div className="mt-1 border rounded-lg p-4 flex flex-col items-center justify-center bg-gray-50 border-dashed border-gray-300">
                {formData.image ? (
                  <div className="relative w-full h-48">
                    <img 
                      src={formData.image.url || formData.preview} 
                      alt={formData.image.altText || "Bio Image"} 
                      className="w-full h-full object-cover rounded-lg" 
                    />
                    <button 
                      onClick={() => setFormData({...formData, image: null, preview: null})} 
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
                    <span className="text-sm">Select Bio Image</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={() => {setIsAddOpen(false); setEditingAuthor(null);}}
              className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Save"}
            </button>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation */}
      {isDeleteOpen && (
        <Modal close={() => setIsDeleteOpen(false)}>
          <h2 className="text-lg font-semibold mb-4">Delete Author</h2>
          <p className="mb-4 text-gray-600">
            Are you sure you want to delete this author? This action cannot be undone.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setIsDeleteOpen(false)}
              className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700"
            >
              Delete
            </button>
          </div>
        </Modal>
      )}

      {isImageSelectorOpen && (
        <MediaImagesSelector
          onClose={() => setIsImageSelectorOpen(false)}
          onSelect={(image) => {
            setFormData({ ...formData, image: image, preview: image.url });
            setIsImageSelectorOpen(false);
          }}
        />
      )}
    </div>
  );
}

/* ----------------- AUTHOR ROW ----------------- */

function AuthorRow({
  author,
  openMenuIndex,
  setOpenMenuIndex,
  openEdit,
  setDeletingAuthorId,
  setIsDeleteOpen,
}) {
  const { isDark } = useTheme();
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const buttonRef = useRef(null);
  const menuRef = useRef(null);

  // Close menu when clicked outside or scrolled
  useEffect(() => {
    const handleClickOutside = (event) => {
      // If click is on the button, ignore (let button handler work)
      if (buttonRef.current && buttonRef.current.contains(event.target)) {
        return;
      }
      // If click is outside the dropdown menu (and not button)
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenuIndex(null);
      }
    };
    
    // Close on scroll/resize to prevent detachment
    const handleScroll = () => {
      if (openMenuIndex === author.id) setOpenMenuIndex(null);
    };

    if (openMenuIndex === author.id) {
        document.addEventListener("mousedown", handleClickOutside);
        window.addEventListener("scroll", handleScroll, true);
        window.addEventListener("resize", handleScroll);
    }
    
    return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        window.removeEventListener("scroll", handleScroll, true);
        window.removeEventListener("resize", handleScroll);
    };
  }, [openMenuIndex, author.id, setOpenMenuIndex]);

  const toggleMenu = () => {
    if (openMenuIndex === author.id) {
      setOpenMenuIndex(null);
    } else {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuPos({
        top: rect.bottom + 5,
        left: rect.right - 160, // 160px = w-40
      });
      setOpenMenuIndex(author.id);
    }
  };

  return (
    <tr className={`border-b ${isDark ? "border-gray-700 text-gray-200" : "border-gray-200 text-gray-900"}`}>
      <td className="px-4 py-3">
        {author.preview ? (
          <img src={author.preview} className="w-12 h-12 object-cover rounded-md" />
        ) : (
          <div className="w-12 h-12 bg-gray-200 rounded-md flex items-center justify-center">
            <ImageIcon size={18} className="text-gray-500" />
          </div>
        )}
      </td>
      <td className="px-4 py-3 font-medium">{author.name}</td>
      <td className={`px-4 py-3 ${isDark ? "text-gray-400" : "text-gray-600"}`}>{author.email}</td>
      <td className="px-4 py-3 capitalize">{author.role}</td>
      {/* <td className="px-4 py-3">{author.posts || 0}</td> */}
      <td className="px-4 py-3">
        <button 
          ref={buttonRef}
          onClick={toggleMenu}
          className={`p-1 rounded ${isDark ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
        >
          <MoreVertical size={18} />
        </button>
        {openMenuIndex === author.id && createPortal(
          <div 
            ref={menuRef}
            className="fixed bg-white border rounded shadow-lg z-[9999] w-40"
            style={{ top: menuPos.top, left: menuPos.left }}
          >
            <button
              onClick={() => openEdit(author)}
              className="flex items-center gap-2 px-3 py-2 w-full hover:bg-gray-100 text-left text-gray-900"
            >
              <Edit3 size={16} /> Edit
            </button>
            <button
              onClick={() => {
                setDeletingAuthorId(author.id);
                setIsDeleteOpen(true);
                setOpenMenuIndex(null);
              }}
              className="flex items-center gap-2 px-3 py-2 w-full hover:bg-gray-100 text-red-600 text-left"
            >
              <Trash2 size={16} /> Delete
            </button>
          </div>,
          document.body
        )}
      </td>
    </tr>
  );
}

/* ----------------- MODAL ----------------- */
function Modal({ children, close }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-xl shadow-xl w-[600px] max-h-[90vh] overflow-y-auto relative text-gray-900">
        <button className="absolute right-4 top-4" onClick={close}>
          <X size={20} />
        </button>
        {children}
      </div>
    </div>
  );
}

/* ----------------- FORM INPUT ----------------- */
function FormInput({ label, value, onChange, type = "text" }) {
  return (
    <div>
      <label className="text-sm font-medium">{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring-blue-500 focus:ring-2 focus:outline-none"
      />
    </div>
  );
}
