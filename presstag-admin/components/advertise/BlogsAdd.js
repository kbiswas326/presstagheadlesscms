"use client";

import React, { useState, useEffect } from "react";
import Cookies from "js-cookie";

const BlogsAdd = ({ blog_post }) => {
  // Destructure blog_post with default empty object and null values
  const {
    after_banner = null, 
    before_banner = null, 
    after_content = null, 
    before_content = null,
    tag = []
  } = blog_post || {};

  const [blogPostData, setBlogPostData] = useState({
    after_banner: after_banner || "",
    before_banner: before_banner || "",
    after_content: after_content || "",
    before_content: before_content || "",
    tag: tag.length > 0 ? tag : []
  });

  const [editField, setEditField] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentTag, setCurrentTag] = useState({
    tagname: "",
    position: null,
    ad_content: ""
  });

  // Update effect to reset data when blog_post prop changes
  useEffect(() => {
    if (blog_post) {
      setBlogPostData({
        after_banner: blog_post.after_banner || "",
        before_banner: blog_post.before_banner || "",
        after_content: blog_post.after_content || "",
        before_content: blog_post.before_content || "",
        tag: blog_post.tag || []
      });
    }
  }, [blog_post]);

  // Update the fields
  const handleUpdateField = (field, value) => {
    setBlogPostData((prevData) => ({
      ...prevData,
      [field]: value,
    }));
  };

  // Update current tag being added
  const handleUpdateTag = (key, value) => {
    setCurrentTag((prevTag) => ({
      ...prevTag,
      [key]: value,
    }));
  };

  // Add a new tag
  const handleAddTag = async () => {
    try {
      setLoading(true);
      
      // Validate tag before adding
      if (!currentTag.tagname && !currentTag.position && !currentTag.ad_content) {
        alert("Please fill at least one tag field");
        return;
      }

      const token = Cookies.get('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const updatedTags = [...blogPostData.tag, currentTag];

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/customize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          blog_post: {
            ...blogPostData,
            tag: updatedTags
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add tag');
      }

      const responseData = await response.json();
      
      // Update state with response data
      setBlogPostData((prevData) => ({
        ...prevData,
        tag: responseData.data.blog_post.tag
      }));

      // Reset current tag
      setCurrentTag({
        tagname: "",
        position: null,
        ad_content: ""
      });

      alert('Tag added successfully!');
    } catch (err) {
      setError(err.message);
      console.error('Error adding tag:', err);
      alert(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Delete a specific tag
  const handleDeleteTag = async (indexToDelete) => {
    try {
      setLoading(true);
      
      const token = Cookies.get('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const updatedTags = blogPostData.tag.filter((_, index) => index !== indexToDelete);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/customize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          blog_post: {
            ...blogPostData,
            tag: updatedTags
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete tag');
      }

      const responseData = await response.json();
      
      // Update state with response data
      setBlogPostData((prevData) => ({
        ...prevData,
        tag: responseData.data.blog_post.tag
      }));

      alert('Tag deleted successfully!');
    } catch (err) {
      setError(err.message);
      console.error('Error deleting tag:', err);
      alert(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Edit the field
  const handleEditField = (field) => {
    setEditField(field);
  };

  // Save the specific field via API
  const handleSaveField = async (field) => {
    try {
      setLoading(true);
      setError(null);

      const token = Cookies.get('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      // Prepare the payload with the updated field
      const updatePayload = {
        blog_post: {
          after_banner: blogPostData.after_banner,
          before_banner: blogPostData.before_banner,
          after_content: blogPostData.after_content,
          before_content: blogPostData.before_content,
          tag: blogPostData.tag
        }
      };

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/customize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updatePayload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to save ${field}`);
      }

      const responseData = await response.json();
      
      // Update state with response data
      setBlogPostData((prevData) => ({
        ...prevData,
        ...responseData.blog_post
      }));

      setEditField(null);
      alert(`${field} saved successfully!`);
    } catch (err) {
      setError(err.message);
      console.error(`Error saving ${field}:`, err);
      alert(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Delete a specific field
  const handleDeleteField = async (field) => {
    try {
      setLoading(true);
      setError(null);

      const token = Cookies.get('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      // Prepare the payload with the field set to null
      const deletePayload = {
        blog_post: {
          after_banner: field === 'after_banner' ? null : blogPostData.after_banner,
          before_banner: field === 'before_banner' ? null : blogPostData.before_banner,
          after_content: field === 'after_content' ? null : blogPostData.after_content,
          before_content: field === 'before_content' ? null : blogPostData.before_content,
          tag: blogPostData.tag
        }
      };

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/customize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(deletePayload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to delete ${field}`);
      }

      const responseData = await response.json();
      
      // Update state with response data
      setBlogPostData(responseData.data.blog_post);

      setEditField(null);
      alert(`${field} deleted successfully!`);
    } catch (err) {
      setError(err.message);
      console.error(`Error deleting ${field}:`, err);
      alert(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Render method for each field section
  const renderFieldSection = (field, label) => {
    return (
      <div className="border p-3 rounded-md shadow-sm mb-4">
        <h3 className="font-semibold">{label}</h3>
        {editField === field ? (
          <>
            <input
              type="text"
              value={blogPostData[field]}
              onChange={(e) => handleUpdateField(field, e.target.value)}
              className="border p-2 w-full my-2"
              placeholder={label}
            />
            <button
              onClick={() => handleSaveField(field)}
              disabled={loading}
              className={`bg-green-500 text-white px-4 py-2 rounded-md mt-2 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
          </>
        ) : (
          <>
            <p>{blogPostData[field] || 'Not set'}</p>
            <button
              onClick={() => handleEditField(field)}
              className="bg-blue-500 text-white px-4 py-2 rounded-md mt-2"
            >
              Edit
            </button>
            <button
              onClick={() => handleDeleteField(field)}
              className="bg-red-500 text-white px-4 py-2 rounded-md mt-2 ml-2"
            >
              Delete
            </button>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h2 className="text-xl font-bold mb-4">Blog Post Management</h2>

      {renderFieldSection("after_banner", "After Banner")}
      {renderFieldSection("before_banner", "Before Banner")}
      {renderFieldSection("after_content", "After Content")}
      {renderFieldSection("before_content", "Before Content")}

      {/* Tags Section */}
      <div className="border p-3 rounded-md shadow-sm mb-4">
        <h3 className="font-semibold">Tags</h3>
        
        {/* Add New Tag Section */}
        <div className="mb-4">
          <h4 className="font-medium mb-2">Add New Tag</h4>
          <div className="grid grid-cols-3 gap-2">
            <input
              type="text"
              value={currentTag.tagname}
              onChange={(e) => handleUpdateTag("tagname", e.target.value)}
              className="border p-2"
              placeholder="Tag Name"
            />
            <input
              type="number"
              value={currentTag.position || ''}
              onChange={(e) => handleUpdateTag("position", Number(e.target.value))}
              className="border p-2"
              placeholder="Position"
            />
            <input
              type="text"
              value={currentTag.ad_content}
              onChange={(e) => handleUpdateTag("ad_content", e.target.value)}
              className="border p-2"
              placeholder="Ad Content"
            />
          </div>
          <button
            onClick={handleAddTag}
            disabled={loading}
            className={`bg-green-500 text-white px-4 py-2 rounded-md mt-2 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {loading ? 'Adding...' : 'Add Tag'}
          </button>
        </div>

        {/* Existing Tags List */}
        {blogPostData.tag.length > 0 ? (
          <div>
            <h4 className="font-medium mb-2">Existing Tags</h4>
            {blogPostData.tag.map((tagItem, index) => (
              <div 
                key={index} 
                className="border p-2 mb-2 rounded-md flex justify-between items-center"
              >
                <div>
                  <p><strong>Tag Name:</strong> {tagItem.tagname || 'N/A'}</p>
                  <p><strong>Position:</strong> {tagItem.position || 'N/A'}</p>
                  <p><strong>Ad Content:</strong> {tagItem.ad_content || 'N/A'}</p>
                </div>
                <button
                  onClick={() => handleDeleteTag(index)}
                  disabled={loading}
                  className={`bg-red-500 text-white px-3 py-1 rounded-md ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No tags added yet</p>
        )}
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          {error}
        </div>
      )}
    </div>
  );
};

export default BlogsAdd;
