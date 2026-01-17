"use client";

import axios from "axios";
import Cookies from "js-cookie";
import React, { useState, useEffect } from "react";

const LiveBlogUpdates = ({ postId, onAddUpdate }) => {
  const [update, setUpdate] = useState("");
  const [updates, setUpdates] = useState([]);
  const [editingUpdate, setEditingUpdate] = useState(null);

  const fetchUpdates = async () => {
    try {
      const token = Cookies.get("token");
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/post/${postId}/live-blog/updates`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      setUpdate(response.data.updates[0].content);
    } catch (error) {
      console.error("Error fetching updates:", error);
    }
  };

  useEffect(() => {
    fetchUpdates();
  }, [postId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!update.trim()) return;

    try {
      const token = Cookies.get("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/posts/${postId}/live-blog/update`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ content: update }),
        },
      );

      if (response.ok) {
        setUpdate("");
        fetchUpdates();
      }
    } catch (error) {
      console.error("Error adding update:", error);
    }
  };

  const handleEdit = async (updateId, content) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/live-blog/update/${updateId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ content }),
        },
      );

      if (response.ok) {
        setEditingUpdate(null);
        fetchUpdates();
      }
    } catch (error) {
      console.error("Error editing update:", error);
    }
  };

  const handleDelete = async (updateId) => {
    if (!window.confirm("Are you sure you want to delete this update?")) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/live-blog/update/${updateId}`,
        {
          method: "DELETE",
        },
      );

      if (response.ok) {
        fetchUpdates();
      }
    } catch (error) {
      console.error("Error deleting update:", error);
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow mb-6">
      <h2 className="text-xl font-bold mb-4">Live Blog Updates</h2>

      {/* Add Update Form */}
      <form onSubmit={handleSubmit} className="mb-6">
        <textarea
          className="w-full p-2 border rounded-lg"
          value={update}
          onChange={(e) => setUpdate(e.target.value)}
          placeholder="Add a new update..."
          rows={3}
        />
        <button
          type="submit"
          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Add Update
        </button>
      </form>

      {/* Updates List */}
      <div className="space-y-4">
        {updates.map((item) => (
          <div key={item._id} className="p-4 border rounded-lg">
            {editingUpdate === item._id ? (
              <div>
                <textarea
                  className="w-full p-2 border rounded-lg"
                  value={item.content}
                  onChange={(e) => {
                    const newUpdates = updates.map((u) =>
                      u._id === item._id
                        ? { ...u, content: e.target.value }
                        : u,
                    );
                    setUpdates(newUpdates);
                  }}
                  rows={3}
                />
                <div className="mt-2 space-x-2">
                  <button
                    onClick={() => handleEdit(item._id, item.content)}
                    className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingUpdate(null)}
                    className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <p>{item.content}</p>
                <div className="mt-2 space-x-2">
                  <button
                    onClick={() => setEditingUpdate(item._id)}
                    className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(item._id)}
                    className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default LiveBlogUpdates;
