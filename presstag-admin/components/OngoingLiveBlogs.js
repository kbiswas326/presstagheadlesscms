import axios from "axios";
import Link from "next/link";
import React, { useEffect, useState } from "react";

const OngoingLiveBlogs = ({ onStopLive, onAddUpdate }) => {
  const [ongoingPosts, setOngoingPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch ongoing live blogs
  const fetchOngoingLiveBlogs = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/liveblogs`,
      );

      setOngoingPosts(response.data.liveBlogs);
    } catch (error) {
      console.error("Error fetching ongoing live blogs:", error);
      setError("Failed to load ongoing live blogs");
      setOngoingPosts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOngoingLiveBlogs();
    // Set up polling to refresh data every 30 seconds
    const interval = setInterval(fetchOngoingLiveBlogs, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleStopLive = async (postId) => {
    if (!window.confirm("Are you sure you want to stop this live blog?"))
      return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/post/stop-live/${postId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        throw new Error("Failed to stop live blog");
      }

      // Refresh the list after stopping a live blog
      fetchOngoingLiveBlogs();
    } catch (error) {
      console.error("Error stopping live blog:", error);
      alert("Failed to stop live blog. Please try again.");
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Ongoing Live Blogs</h2>

      {loading && <p>Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {!loading && !error && (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2 border">Title</th>
                <th className="px-4 py-2 border">Category</th>
                <th className="px-4 py-2 border">Updates Count</th>
                <th className="px-4 py-2 border">Last Updated</th>
                <th className="px-4 py-2 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {ongoingPosts.map((blog) => (
                <tr key={blog._id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 border">{blog.title}</td>
                  <td className="px-4 py-2 border">
                    {blog.primary_category?.[0]?.name || "Uncategorized"}
                  </td>
                  <td className="px-4 py-2 border text-center">
                    {blog.live_blog_updates?.length || 0}
                  </td>
                  <td className="px-4 py-2 border">
                    {new Date(blog.updated_at_datetime).toLocaleString()}
                  </td>
                  <td className="px-4 py-2 border">
                    <div className="flex gap-2 justify-center">
                      <Link href={`/posts/live-blog/${blog._id}`}>
                        <button
                          onClick={() => onAddUpdate(blog._id)}
                          className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                        >
                          Add Update
                        </button>
                      </Link>
                      <button
                        onClick={() => onStopLive(blog._id)}
                        className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                      >
                        Stop Live
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && !error && ongoingPosts.length === 0 && (
        <p className="text-center text-gray-500">No ongoing live blogs found</p>
      )}
    </div>
  );
};

export default OngoingLiveBlogs;

