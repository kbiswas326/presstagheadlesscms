"use client";

import { useState, useEffect } from "react";
import { MoreVertical, Play, Square } from "lucide-react";
import { posts, getUsers } from "@/lib/api";
import { useTheme } from "context/ThemeContext";

export default function LiveBlogs() {
  const { isDark } = useTheme();

  const handleNavigation = (url) => {
    window.location.href = url;
  };

  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [filterAuthor, setFilterAuthor] = useState("All");

  const [currentPageOngoing, setCurrentPageOngoing] = useState(1);
  const [currentPageCompleted, setCurrentPageCompleted] = useState(1);

  const [openMenuIndex, setOpenMenuIndex] = useState(null);
  const [confirmActionIndex, setConfirmActionIndex] = useState(null);
  const [actionType, setActionType] = useState(null);
  const [deleteStepIndex, setDeleteStepIndex] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

  const [liveBlogs, setLiveBlogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true
    });
  };

  const fetchLiveBlogs = async () => {
    setLoading(true);
    try {
      // Fetch published posts AND users in parallel
      const [allPublished, usersData] = await Promise.all([
        posts.getByStatus('published'),
        getUsers()
      ]);

      const users = usersData.users || usersData || [];
      const authorMap = {};
      users.forEach(u => {
        authorMap[u._id || u.id] = u.name;
      });
      
      // Filter for live-blog type and map to component structure
      const blogs = allPublished
        .filter(p => p.type === 'live-blog')
        .map(p => {
            let authorName = "Editor Team";
            if (p.author) {
                if (typeof p.author === 'object' && p.author.name) {
                    authorName = p.author.name;
                } else if (typeof p.author === 'string') {
                    authorName = authorMap[p.author] || "Editor Team"; 
                }
            }

            return {
              id: p._id || p.id,
              title: p.title,
              category: Array.isArray(p.categories) ? (typeof p.categories[0] === 'string' ? p.categories[0] : p.categories[0]?.name) : (p.categories || "Uncategorized"),
              author: authorName,
              startedOn: formatDate(p.publishedAt || p.createdAt),
              status: p.isLive ? "ongoing" : "completed",
              seoScore: p.seoScore || 0,
              lastModified: new Date(p.updatedAt || p.publishedAt).getTime(),
              originalPost: p
            };
        });
      
      setLiveBlogs(blogs);
    } catch (err) {
      console.error("Failed to fetch live blogs", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveBlogs();
  }, []);

  const postsPerPage = 10;

  const countByStatus = (status) => liveBlogs.filter((b) => b.status === status).length;

  const handleStopLiveBlog = async (blogId) => {
    console.log("Stopping blog with id:", blogId);
    try {
      await posts.update(blogId, { isLive: false });
      setLiveBlogs(prevBlogs => {
        const updated = prevBlogs.map(b => 
          b.id === blogId ? { ...b, status: "completed", lastModified: Date.now() } : b
        );
        return updated;
      });
    } catch (err) {
      console.error("Failed to stop live blog", err);
      alert("Failed to stop live blog");
    }
    setConfirmActionIndex(null);
    setOpenMenuIndex(null);
    setActionType(null);
  };

  const handleResumeLiveBlog = async (blogId) => {
    console.log("Resuming blog with id:", blogId);
    try {
      await posts.update(blogId, { isLive: true });
      setLiveBlogs(prevBlogs => {
        const updated = prevBlogs.map(b => 
          b.id === blogId ? { ...b, status: "ongoing", lastModified: Date.now() } : b
        );
        return updated;
      });
    } catch (err) {
      console.error("Failed to resume live blog", err);
      alert("Failed to resume live blog");
    }
    setConfirmActionIndex(null);
    setOpenMenuIndex(null);
    setActionType(null);
  };

  const handleDeleteLiveBlog = async (blogId) => {
    console.log("Deleting blog with id:", blogId);
    try {
      await posts.remove(blogId);
      setLiveBlogs(prevBlogs => prevBlogs.filter(b => b.id !== blogId));
    } catch (err) {
      console.error("Failed to delete live blog", err);
      alert("Failed to delete live blog");
    }
    setDeleteStepIndex(null);
    setOpenMenuIndex(null);
  };

  const filtered = liveBlogs.filter((b) => {
    return (
      b.title.toLowerCase().includes(search.toLowerCase()) &&
      (filterCategory === "All" || b.category === filterCategory) &&
      (filterAuthor === "All" || b.author === filterAuthor)
    );
  });

  const ongoingBlogs = filtered.filter((b) => b.status === "ongoing").sort((a, b) => {
    if (a.lastModified && b.lastModified) {
      return b.lastModified - a.lastModified;
    }
    return 0;
  });
  const completedBlogs = filtered.filter((b) => b.status === "completed").sort((a, b) => {
    if (a.lastModified && b.lastModified) {
      return b.lastModified - a.lastModified;
    }
    return 0;
  });

  const totalPagesOngoing = Math.ceil(ongoingBlogs.length / postsPerPage);
  const totalPagesCompleted = Math.ceil(completedBlogs.length / postsPerPage);

  const paginatedOngoing = ongoingBlogs.slice(
    (currentPageOngoing - 1) * postsPerPage,
    currentPageOngoing * postsPerPage
  );

  const paginatedCompleted = completedBlogs.slice(
    (currentPageCompleted - 1) * postsPerPage,
    currentPageCompleted * postsPerPage
  );

  const seoClass = (score) => {
    return (
      "px-2 py-1 rounded text-xs font-semibold " +
      (score > 80
        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
        : score >= 60
        ? "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400"
        : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400")
    );
  };

  const handleMenuClick = (e, key) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const menuHeight = 200;
    const viewportHeight = window.innerHeight;
    const spaceBelow = viewportHeight - rect.bottom;
    
    let topPosition;
    if (spaceBelow < menuHeight) {
      topPosition = rect.top - menuHeight - 8;
    } else {
      topPosition = rect.bottom + 8;
    }
    
    setMenuPosition({
      top: Math.max(8, topPosition),
      left: rect.left - 200
    });
    setOpenMenuIndex(openMenuIndex === key ? null : key);
    setConfirmActionIndex(null);
  };

  // Extract unique categories and authors for filters
  const uniqueCategories = ["All", ...new Set(liveBlogs.map(b => b.category).filter(Boolean))];
  const uniqueAuthors = ["All", ...new Set(liveBlogs.map(b => b.author).filter(Boolean))];

  return (
    <div className={`p-6 min-h-screen transition-colors duration-200 ${isDark ? 'bg-gray-900' : 'bg-gray-100'}`}>
      {/* Breadcrumb */}
      <nav className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
        <ol className="flex space-x-2">
          <li><a href="/" className={`hover:underline ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>Home</a></li>
          <li>/</li>
          <li><a href="/posts" className={`hover:underline ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>Posts</a></li>
          <li>/</li>
          <li className={`font-semibold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>Live Blogs</li>
        </ol>
      </nav>

      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Live Blogs</h1>
          <p className={`mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Manage ongoing and completed live coverage.</p>
        </div>
        <button
          onClick={() => handleNavigation("/posts/live-blog/edit/new")}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium"
        >
          + New Live Blog
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Stat label="Total Live Blogs" value={liveBlogs.length} isDark={isDark} />
        <Stat label="Ongoing" value={countByStatus("ongoing")} highlight="green" isDark={isDark} />
        <Stat label="Completed" value={countByStatus("completed")} highlight="gray" isDark={isDark} />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap md:flex-row gap-4 mb-8">
        <input
          className={`px-3 py-2 rounded-lg w-full md:w-96 shadow-sm border ${
            isDark 
              ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' 
              : 'bg-white border-transparent text-gray-900 placeholder-gray-400'
          }`}
          placeholder="Search live blogs..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <Filter value={filterCategory} setValue={setFilterCategory} label="Categories" options={uniqueCategories.filter(c => c !== "All")} isDark={isDark} />

        <Filter value={filterAuthor} setValue={setFilterAuthor} label="Author" options={uniqueAuthors.filter(a => a !== "All")} isDark={isDark} />
      </div>

      {loading ? (
        <div className={`text-center py-10 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Loading live blogs...</div>
      ) : (
        <>
          {/* ONGOING LIVE BLOGS */}
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 rounded-full bg-red-600 animate-pulse"></div>
              <h2 className={`text-2xl font-normal ${isDark ? 'text-white' : 'text-gray-900'}`}>Ongoing Live Blogs</h2>
              <span className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>({ongoingBlogs.length})</span>
            </div>

            <div className={`shadow rounded-xl overflow-visible max-h-96 overflow-y-auto ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white'}`}>
              <table className={`w-full text-left divide-y ${isDark ? 'divide-gray-700' : 'divide-gray-200'}`}>
                <thead className={`sticky top-0 ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <tr>
                    <th className={`px-4 py-3 text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Title</th>
                    <th className={`px-4 py-3 text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Category</th>
                    <th className={`px-4 py-3 text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Author</th>
                    <th className={`px-4 py-3 text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Started</th>
                    <th className={`px-4 py-3 text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>SEO</th>
                    <th className={`px-4 py-3 text-sm font-medium text-right ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Actions</th>
                  </tr>
                </thead>

                <tbody className={`divide-y ${isDark ? 'divide-gray-700' : 'divide-gray-200'}`}>
                  {paginatedOngoing.map((blog) => (
                    <tr key={blog.id} className={`${isDark ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'} transition-colors`}>
                      <td className={`px-4 py-3 ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>{blog.title}</td>
                      <td className={`px-4 py-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{blog.category}</td>
                      <td className={`px-4 py-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{blog.author}</td>
                      <td className={`px-4 py-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{blog.startedOn}</td>
                      <td className="px-4 py-3">
                        <span className={seoClass(blog.seoScore)}>{blog.seoScore}</span>
                      </td>

                      <td className="px-4 py-3 text-right">
                        <button
                          data-menu-button
                          className={`p-2 rounded ${isDark ? 'hover:bg-gray-600 text-gray-300' : 'hover:bg-gray-200 text-gray-600'}`}
                          onClick={(e) => handleMenuClick(e, `ongoing-${blog.id}`)}
                        >
                          <MoreVertical size={18} />
                        </button>

                        {openMenuIndex === `ongoing-${blog.id}` && (
                          <div 
                            className={`fixed border rounded shadow z-50 w-48 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
                            style={{
                              top: `${menuPosition.top}px`,
                              left: `${menuPosition.left}px`
                            }}
                          >
                            <ul className="py-1">
                              <li>
                                <button
                                  onClick={() => {
                                    handleNavigation(`/posts/live-blog/edit/${blog.id}`);
                                  }}
                                  className={`px-4 py-2 w-full text-left ${isDark ? 'hover:bg-gray-700 text-gray-200' : 'hover:bg-gray-100 text-gray-700'}`}
                                >
                                  Edit
                                </button>
                              </li>

                              <li>
                                {confirmActionIndex === `ongoing-${blog.id}` && actionType === "stop" ? (
                                  <div className="px-4 py-2">
                                    <p className="text-sm text-yellow-600 mb-2">
                                      Stop this live blog?
                                    </p>
                                    <div className="flex justify-between gap-2">
                                      <button
                                        onClick={() => handleStopLiveBlog(blog.id)}
                                        className="bg-yellow-600 text-white px-2 py-1 rounded text-xs font-medium"
                                      >
                                        Yes, stop
                                      </button>
                                      <button
                                        onClick={() => {
                                          setConfirmActionIndex(null);
                                          setActionType(null);
                                        }}
                                        className={`px-2 py-1 text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => {
                                      setConfirmActionIndex(`ongoing-${blog.id}`);
                                      setActionType("stop");
                                    }}
                                    className={`px-4 py-2 w-full text-left text-yellow-600 ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                                  >
                                    Stop Live Blog
                                  </button>
                                )}
                              </li>

                              <li>
                                <button className={`px-4 py-2 w-full text-left ${isDark ? 'hover:bg-gray-700 text-gray-200' : 'hover:bg-gray-100 text-gray-700'}`}>
                                  View Live
                                </button>
                              </li>
                            </ul>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}

                  {paginatedOngoing.length === 0 && (
                    <tr>
                      <td colSpan="6" className={`text-center py-6 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        No ongoing live blogs
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination for Ongoing */}
            {totalPagesOngoing > 1 && (
              <div className="flex justify-center gap-2 mt-4">
                <button
                  disabled={currentPageOngoing === 1}
                  onClick={() => setCurrentPageOngoing((p) => p - 1)}
                  className={`px-3 py-2 border rounded disabled:opacity-50 ${
                    isDark 
                      ? 'bg-gray-800 border-gray-700 text-gray-300' 
                      : 'bg-white border-gray-200 text-gray-700'
                  }`}
                >
                  Prev
                </button>

                {[...Array(totalPagesOngoing)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPageOngoing(i + 1)}
                    className={`px-3 py-2 border rounded ${
                      currentPageOngoing === i + 1 
                        ? 'bg-blue-600 text-white border-blue-600' 
                        : isDark 
                          ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700' 
                          : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}

                <button
                  disabled={currentPageOngoing === totalPagesOngoing}
                  onClick={() => setCurrentPageOngoing((p) => p + 1)}
                  className={`px-3 py-2 border rounded disabled:opacity-50 ${
                    isDark 
                      ? 'bg-gray-800 border-gray-700 text-gray-300' 
                      : 'bg-white border-gray-200 text-gray-700'
                  }`}
                >
                  Next
                </button>
              </div>
            )}
          </div>

          {/* COMPLETED LIVE BLOGS */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                <span className="text-white text-sm">✓</span>
              </div>
              <h2 className={`text-2xl font-normal ${isDark ? 'text-white' : 'text-gray-900'}`}>Completed Live Blogs</h2>
              <span className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>({completedBlogs.length})</span>
            </div>

            <div className={`shadow rounded-xl overflow-hidden ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white'}`}>
              <table className={`w-full text-left divide-y ${isDark ? 'divide-gray-700' : 'divide-gray-200'}`}>
                <thead className={`${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <tr>
                    <th className={`px-4 py-3 text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Title</th>
                    <th className={`px-4 py-3 text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Category</th>
                    <th className={`px-4 py-3 text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Author</th>
                    <th className={`px-4 py-3 text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Completed</th>
                    <th className={`px-4 py-3 text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>SEO</th>
                    <th className={`px-4 py-3 text-sm font-medium text-right ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Actions</th>
                  </tr>
                </thead>

                <tbody className={`divide-y ${isDark ? 'divide-gray-700' : 'divide-gray-200'}`}>
                  {paginatedCompleted.map((blog) => (
                    <tr key={blog.id} className={`${isDark ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'} transition-colors`}>
                      <td className={`px-4 py-3 ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>{blog.title}</td>
                      <td className={`px-4 py-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{blog.category}</td>
                      <td className={`px-4 py-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{blog.author}</td>
                      <td className={`px-4 py-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{blog.startedOn}</td>
                      <td className="px-4 py-3">
                        <span className={seoClass(blog.seoScore)}>{blog.seoScore}</span>
                      </td>

                      <td className="px-4 py-3 text-right">
                        <button
                          data-menu-button
                          className={`p-2 rounded ${isDark ? 'hover:bg-gray-600 text-gray-300' : 'hover:bg-gray-200 text-gray-600'}`}
                          onClick={(e) => handleMenuClick(e, `completed-${blog.id}`)}
                        >
                          <MoreVertical size={18} />
                        </button>

                        {openMenuIndex === `completed-${blog.id}` && (
                          <div 
                            className={`fixed border rounded shadow z-50 w-48 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
                            style={{
                              top: `${menuPosition.top}px`,
                              left: `${menuPosition.left}px`
                            }}
                          >
                            <ul className="py-1">
                              <li>
                                <button
                                  onClick={() => {
                                    handleNavigation(`/posts/live-blog/edit/${blog.id}`);
                                  }}
                                  className={`px-4 py-2 w-full text-left ${isDark ? 'hover:bg-gray-700 text-gray-200' : 'hover:bg-gray-100 text-gray-700'}`}
                                >
                                  Edit
                                </button>
                              </li>

                              <li>
                                {confirmActionIndex === `completed-${blog.id}` && actionType === "resume" ? (
                                  <div className="px-4 py-2">
                                    <p className="text-sm text-blue-600 mb-2">
                                      Resume this live blog?
                                    </p>
                                    <div className="flex justify-between gap-2">
                                      <button
                                        onClick={() => handleResumeLiveBlog(blog.id)}
                                        className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium"
                                      >
                                        Yes, resume
                                      </button>
                                      <button
                                        onClick={() => {
                                          setConfirmActionIndex(null);
                                          setActionType(null);
                                        }}
                                        className={`px-2 py-1 text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => {
                                      setConfirmActionIndex(`completed-${blog.id}`);
                                      setActionType("resume");
                                    }}
                                    className={`px-4 py-2 w-full text-left text-blue-600 ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                                  >
                                    Resume Live Blog
                                  </button>
                                )}
                              </li>

                              <li>
                                <button className={`px-4 py-2 w-full text-left ${isDark ? 'hover:bg-gray-700 text-gray-200' : 'hover:bg-gray-100 text-gray-700'}`}>
                                  View Post
                                </button>
                              </li>

                              <li>
                                {deleteStepIndex === `completed-${blog.id}` ? (
                                  deleteStepIndex === `completed-${blog.id}-confirmed` ? (
                                    <div className="px-4 py-2">
                                      <p className="text-sm text-red-600 mb-2 font-medium">
                                        Permanently delete?
                                      </p>
                                      <div className="flex justify-between gap-2">
                                        <button
                                          onClick={() => handleDeleteLiveBlog(blog.id)}
                                          className="bg-red-600 text-white px-2 py-1 rounded text-xs font-medium"
                                        >
                                          Yes, delete
                                        </button>
                                        <button
                                          onClick={() => setDeleteStepIndex(null)}
                                          className={`px-2 py-1 text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}
                                        >
                                          Cancel
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="px-4 py-2">
                                      <p className="text-sm text-red-600 mb-2">
                                        Delete this live blog?
                                      </p>
                                      <div className="flex justify-between gap-2">
                                        <button
                                          onClick={() => setDeleteStepIndex(`completed-${blog.id}-confirmed`)}
                                          className="bg-red-600 text-white px-2 py-1 rounded text-xs font-medium"
                                        >
                                          Yes, delete
                                        </button>
                                        <button
                                          onClick={() => setDeleteStepIndex(null)}
                                          className={`px-2 py-1 text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}
                                        >
                                          Cancel
                                        </button>
                                      </div>
                                    </div>
                                  )
                                ) : (
                                  <button
                                    onClick={() => setDeleteStepIndex(`completed-${blog.id}`)}
                                    className={`px-4 py-2 w-full text-left text-red-600 ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                                  >
                                    Delete
                                  </button>
                                )}
                              </li>
                            </ul>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}

                  {paginatedCompleted.length === 0 && (
                    <tr>
                      <td colSpan="6" className={`text-center py-6 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        No completed live blogs
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination for Completed */}
            {totalPagesCompleted > 1 && (
              <div className="flex justify-center gap-2 mt-4">
                <button
                  disabled={currentPageCompleted === 1}
                  onClick={() => setCurrentPageCompleted((p) => p - 1)}
                  className={`px-3 py-2 border rounded disabled:opacity-50 ${
                    isDark 
                      ? 'bg-gray-800 border-gray-700 text-gray-300' 
                      : 'bg-white border-gray-200 text-gray-700'
                  }`}
                >
                  Prev
                </button>

                {[...Array(totalPagesCompleted)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPageCompleted(i + 1)}
                    className={`px-3 py-2 border rounded ${
                      currentPageCompleted === i + 1 
                        ? 'bg-blue-600 text-white border-blue-600' 
                        : isDark 
                          ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700' 
                          : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}

                <button
                  disabled={currentPageCompleted === totalPagesCompleted}
                  onClick={() => setCurrentPageCompleted((p) => p + 1)}
                  className={`px-3 py-2 border rounded disabled:opacity-50 ${
                    isDark 
                      ? 'bg-gray-800 border-gray-700 text-gray-300' 
                      : 'bg-white border-gray-200 text-gray-700'
                  }`}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function Stat({ label, value, highlight = "blue", isDark }) {
  const colors = {
    green: { 
      bg: isDark ? "bg-green-900/20" : "bg-green-50", 
      text: isDark ? "text-green-400" : "text-green-600" 
    },
    red: { 
      bg: isDark ? "bg-red-900/20" : "bg-red-50", 
      text: isDark ? "text-red-400" : "text-red-600" 
    },
    gray: { 
      bg: isDark ? "bg-gray-800" : "bg-gray-50", 
      text: isDark ? "text-gray-400" : "text-gray-600" 
    },
    blue: { 
      bg: isDark ? "bg-blue-900/20" : "bg-blue-50", 
      text: isDark ? "text-blue-400" : "text-blue-600" 
    }
  };

  const theme = colors[highlight] || colors.gray;

  return (
    <div className={`${theme.bg} shadow rounded-xl p-5 ${isDark ? 'border border-gray-700 shadow-none' : ''}`}>
      <span className={`text-sm ${theme.text} font-medium`}>{label}</span>
      <span className={`text-2xl font-semibold mt-1 block ${isDark ? 'text-white' : 'text-gray-900'}`}>
        {value}
      </span>
    </div>
  );
}

function Filter({ value, setValue, label, options, isDark }) {
  return (
    <select
      value={value}
      onChange={(e) => setValue(e.target.value)}
      className={`border px-3 py-2 pr-6 rounded-lg ${
        isDark 
          ? 'bg-gray-800 border-gray-700 text-white' 
          : 'bg-gray-50 border-gray-200 text-gray-900'
      }`}
    >
      <option value="All">{label}</option>
      {options.map((o) => (
        <option key={o}>{o}</option>
      ))}
    </select>
  );
}
