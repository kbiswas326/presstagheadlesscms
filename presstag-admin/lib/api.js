///lib/api.js///
const API_URL = process.env.NEXT_PUBLIC_API_URL + '/api' || 'http://localhost:5000/api';

/**
 * Wrapper for API calls that handles token refresh on 401 errors
 */
async function apiCall(url, options = {}) {
  const token = localStorage.getItem('token');
  
  // Store the original body since it can only be used once
  const originalBody = options.body;
  
  // Add authorization header
  if (token) {
    options.headers = {
      ...options.headers,
      'Authorization': `Bearer ${token}`
    };
  }

  let response = await fetch(url, options);

  // If 401 Unauthorized, try to refresh token and retry once
  if (response.status === 401 && token) {
    console.log('🔄 Token expired, attempting refresh...');
    try {
      const refreshRes = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (refreshRes.ok) {
        const refreshData = await refreshRes.json();
        if (refreshData.token) {
          console.log('✅ Token refreshed successfully');
          localStorage.setItem('token', refreshData.token);

          // Retry original request with new token
          // Reconstruct the request with the original body
          const retryOptions = {
            ...options,
            body: originalBody,
            headers: {
              ...options.headers,
              'Authorization': `Bearer ${refreshData.token}`
            }
          };
          response = await fetch(url, retryOptions);
        }
      } else {
        console.error('❌ Token refresh failed:', refreshRes.status);
        // Token refresh failed, clear session
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    } catch (error) {
      console.error('❌ Error refreshing token:', error);
    }
  }

  return response;
}

/* =====================================================
   AUTH
===================================================== */
export const auth = {
  async login(data) {
    try {
      console.log('🔐 Attempting login...');
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.text();
        console.error('❌ Login failed:', error);
        throw new Error("Login failed");
      }

      const result = await res.json();
      console.log('✅ Login successful');
      return result;
    } catch (err) {
      console.error('❌ Login error:', err.message);
      throw err;
    }
  },

  async me() {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.log('⚠️ No token found');
        return null;
      }

      const res = await fetch(`${API_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.status === 401) {
        console.log('⚠️ Me endpoint failed with 401');
        return null;
      }

      if (!res.ok) {
        console.log('⚠️ Me endpoint failed:', res.status);
        throw new Error(`Server error: ${res.status}`);
      }

      const result = await res.json();
      console.log('✅ User info loaded');
      return result;
    } catch (err) {
      console.error('❌ Me endpoint error:', err.message);
      throw err; // Throw instead of returning null for non-401 errors
    }
  },

  logout() {
    try {
      localStorage.removeItem("token");
      console.log('✅ Logged out successfully');
    } catch (err) {
      console.error('❌ Logout error:', err.message);
    }
  },
};

/* =====================================================
   POSTS
===================================================== */
export const posts = {
  async getById(id) {
    try {
      console.log('🔍 API: Fetching post with ID:', id);
      const token = localStorage.getItem("token");
      console.log('🔑 Token present:', !!token);

      const res = await apiCall(`${API_URL}/posts?status=${status}&limit=200`, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log('📡 API Response status:', res.status);

      if (!res.ok) {
        const errorText = await res.text();
        console.error('❌ API Error Response:', res.status, errorText);
        throw new Error(`API returned ${res.status}`);
      }

      const text = await res.text();
      console.log('📦 API Response text length:', text.length);

      if (!text) {
        console.error('❌ Empty response from API');
        return null;
      }

      const data = JSON.parse(text);
      console.log('✅ Parsed response, title:', data.title);
      console.log('✅ Categories:', data.categories?.length || 0);
      console.log('✅ Tags:', data.tags?.length || 0);
      return data;
    } catch (err) {
      console.error('❌ getById error:', err.message);
      throw err;
    }
  },

  async getByStatus(status) {
    try {
      console.log('🔍 Fetching posts with status:', status);
      const token = localStorage.getItem("token");
      console.log('🔑 Token present:', !!token);

      const res = await apiCall(`${API_URL}/posts?status=${status}`, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log('📡 Response status:', res.status);

      if (!res.ok) {
        const errorText = await res.text();
        console.error('❌ Error:', errorText);
        throw new Error(`Failed to fetch posts: ${res.status}`);
      }

      const text = await res.text();
      
      if (!text) {
        console.error('❌ Empty response from API');
        return [];
      }

      const data = JSON.parse(text);
      
      // Backend returns array directly
      const fetchedPosts = Array.isArray(data) ? data : (data.posts || []);
      console.log('✅ Posts fetched:', fetchedPosts.length);
      
      if (fetchedPosts.length > 0) {
        console.log('📋 First post:', {
          title: fetchedPosts[0].title,
          categories: fetchedPosts[0].categories?.length || 0,
          publishDate: fetchedPosts[0].publishDate,
          publishTime: fetchedPosts[0].publishTime,
        });
      }
      
      return fetchedPosts;
    } catch (err) {
      console.error('❌ getByStatus error:', err.message);
      throw err;
    }
  },

  async create(data) {
    try {
      console.log('➕ Creating new post:', data.title);
      console.log('📝 Post data:', {
        status: data.status,
        categories: data.categories?.length || 0,
        tags: data.tags?.length || 0,
        publishDate: data.publishDate,
        publishTime: data.publishTime,
      });

      const res = await apiCall(`${API_URL}/posts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      console.log('📡 Create response status:', res.status);

      if (!res.ok) {
        const errorText = await res.text();
        console.error('❌ Create error:', errorText);
        throw new Error(`Failed to create post: ${res.status}`);
      }

      const text = await res.text();
      
      if (!text) {
        console.error('❌ Empty response from API');
        return { success: true };
      }

      const result = JSON.parse(text);
      console.log('✅ Post created with ID:', result._id || result.id);
      return result;
    } catch (err) {
      console.error('❌ create error:', err.message);
      throw err;
    }
  },

  async update(id, data) {
    try {
      console.log('✏️ Updating post:', id);
      console.log('📝 Update data:', {
        title: data.title,
        status: data.status,
        categories: data.categories?.length || 0,
        tags: data.tags?.length || 0,
        publishDate: data.publishDate,
        publishTime: data.publishTime,
      });

      const res = await apiCall(`${API_URL}/posts/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      console.log('📡 Update response status:', res.status);

      if (!res.ok) {
        const errorText = await res.text();
        console.error('❌ Update error:', errorText);
        throw new Error(`Failed to update post: ${res.status}`);
      }

      const text = await res.text();
      
      if (!text) {
        console.log('✅ Post updated (empty response)');
        return { success: true };
      }

      const result = JSON.parse(text);
      
      if (!result) {
        console.error('❌ Update returned null result');
        const refetchRes = await apiCall(`${API_URL}/posts/${id}`, {
          headers: {
            "Content-Type": "application/json",
          },
        });
        if (refetchRes.ok) {
          const refText = await refetchRes.text();
          if (refText) {
            const refData = JSON.parse(refText);
            if (refData) {
              console.log('✅ Refetched updated post');
              return refData;
            }
          }
        }
        return { error: 'Update failed: Post not found or returned null' };
      }

      console.log('✅ Post updated:', id);
      console.log('✅ Updated categories:', result.categories?.length || 0);
      console.log('✅ Updated tags:', result.tags?.length || 0);
      return result;
    } catch (err) {
      console.error('❌ update error:', err.message);
      throw err;
    }
  },

  async remove(id) {
    const token = localStorage.getItem("token");

    try {
      console.log('🗑️ Deleting post:', id);

      const res = await fetch(`${API_URL}/posts/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('📡 Delete response status:', res.status);

      if (!res.ok) {
      if (res.status === 401) {
        // Do not redirect automatically to prevent data loss
        throw new Error("Session expired");
      }
      const errorText = await res.text();
        console.error('❌ Delete error:', errorText);
        throw new Error(`Failed to delete post: ${res.status}`);
      }

      const text = await res.text();
      
      if (!text) {
        console.log('✅ Post deleted (empty response)');
        return { success: true };
      }

      const result = JSON.parse(text);
      console.log('✅ Post deleted');
      return result;
    } catch (err) {
      console.error('❌ remove error:', err.message);
      throw err;
    }
  },
};

/* =====================================================
   MEDIA
===================================================== */
export async function uploadMedia(file, metadata = {}) {
  try {
    const formData = new FormData();
    formData.append("file", file);

    if (metadata.altText) formData.append("altText", metadata.altText);
    if (metadata.title) formData.append("title", metadata.title);
    if (metadata.caption) formData.append("caption", metadata.caption);
    if (metadata.credits) formData.append("credits", metadata.credits);

    let token = localStorage.getItem("token");

    console.log('📤 Uploading media:', file.name);
    console.log('🔑 Token available:', !!token && token !== 'undefined' && token !== 'null');

    // Validate token exists and is valid before proceeding
    if (!token || token === 'undefined' || token === 'null' || typeof token !== 'string' || token.length === 0) {
      console.error('❌ No valid token in localStorage - user must be logged in');
      throw new Error("You must be logged in to upload images. Please log in and try again.");
    }

    // Build headers object
    const headers = {
      'Authorization': `Bearer ${token}`
    };

    const res = await fetch(`${API_URL}/media/upload`, {
      method: "POST",
      headers: headers,
      body: formData,
    });

    if (!res.ok) {
      if (res.status === 401) {
        // Try to refresh token and retry
        console.log('🔄 Upload got 401, attempting token refresh...');
        
        try {
          const refreshRes = await fetch(`${API_URL}/auth/refresh`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          });

          if (refreshRes.ok) {
            const refreshData = await refreshRes.json();
            if (refreshData.token) {
              console.log('✅ Token refreshed, retrying upload...');
              localStorage.setItem('token', refreshData.token);
              token = refreshData.token;

              // Rebuild headers with new token
              const newHeaders = {
                'Authorization': `Bearer ${token}`
              };

              // Retry upload with new token
              const retryRes = await fetch(`${API_URL}/media/upload`, {
                method: "POST",
                headers: newHeaders,
                body: formData,
              });

              if (!retryRes.ok) {
                const errorText = await retryRes.text();
                console.error('❌ Upload retry failed:', errorText);
                throw new Error("Media upload failed after token refresh");
              }

              const result = await retryRes.json();
              console.log('✅ Media uploaded after token refresh');
              return result;
            }
          } else {
            console.error('❌ Token refresh failed:', refreshRes.status);
            throw new Error("Session expired - Please log in again");
          }
        } catch (error) {
          console.error('❌ Token refresh error:', error);
          throw new Error("Session expired - Please log in again");
        }
      }

      const errorText = await res.text();
      console.error('❌ Upload error:', errorText);
      throw new Error("Media upload failed: " + errorText);
    }

    const result = await res.json();
    console.log('✅ Media uploaded');
    return result;
  } catch (err) {
    console.error('❌ uploadMedia error:', err.message);
    throw err;
  }
}

export async function getMediaLibrary() {
  try {
    const token = localStorage.getItem("token");

    console.log('📂 Fetching media library');

    const res = await fetch(`${API_URL}/media`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });

    if (!res.ok) {
      if (res.status === 401) {
        // Do not redirect automatically to prevent data loss
        throw new Error("Session expired");
      }
      const errorText = await res.text();
      console.error('❌ Fetch error:', errorText);
      throw new Error("Failed to fetch media library");
    }

    const result = await res.json();
    console.log('✅ Media library loaded');
    return result;
  } catch (err) {
    console.error('❌ getMediaLibrary error:', err.message);
    throw err;
  }
}

/* =====================================================
   USERS (used by author selector)
===================================================== */
export async function getUsers() {
  try {
    const token = localStorage.getItem("token");

    console.log('👥 Fetching users');

    const res = await fetch(`${API_URL}/users`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      if (res.status === 401) {
        // Do not redirect automatically to prevent data loss
        throw new Error("Session expired");
      }
      const errorText = await res.text();
      console.error('❌ Fetch error:', errorText);
      throw new Error("Failed to fetch users");
    }

    const result = await res.json();
    const users = result.users || result || [];
    console.log('✅ Users loaded:', users.length);
    return result;
  } catch (err) {
    console.error('❌ getUsers error:', err.message);
    throw err;
  }
}

/* =====================================================
   CATEGORIES
===================================================== */
export async function getCategories() {
  try {
    const token = localStorage.getItem("token");

    console.log('📂 Fetching categories');

    const res = await fetch(`${API_URL}/categories`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      if (res.status === 401) {
        // Do not redirect automatically to prevent data loss
        throw new Error("Session expired");
      }
      const errorText = await res.text();
      console.error('❌ Fetch error:', errorText);
      throw new Error("Failed to fetch categories");
    }

    const result = await res.json();
    const categories = result.categories || result || [];
    console.log('✅ Categories loaded:', categories.length);
    return result;
  } catch (err) {
    console.error('❌ getCategories error:', err.message);
    throw err;
  }
}

/* =====================================================
   TAGS
===================================================== */
export async function getTags() {
  try {
    const token = localStorage.getItem("token");

    console.log('🏷️ Fetching tags');

    const res = await fetch(`${API_URL}/tags`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      if (res.status === 401) {
        // Do not redirect automatically to prevent data loss
        throw new Error("Session expired");
      }
      const errorText = await res.text();
      console.error('❌ Fetch error:', errorText);
      throw new Error("Failed to fetch tags");
    }

    const result = await res.json();
    const tags = result.tags || result || [];
    console.log('✅ Tags loaded:', tags.length);
    return result;
  } catch (err) {
    console.error('❌ getTags error:', err.message);
    throw err;
  }
}

export async function createCategory(data) {
  try {
    const token = localStorage.getItem("token");
    console.log('➕ Creating category:', data.name);
    
    const res = await fetch(`${API_URL}/categories`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      if (res.status === 401) {
        // Do not redirect automatically to prevent data loss
        throw new Error("Session expired");
      }
      const errorText = await res.text();
      console.error('❌ Create category error:', errorText);
      let errorMessage = "Failed to create category";
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.error) {
          errorMessage = errorJson.error;
        }
      } catch (e) {
        // ignore
      }
      throw new Error(errorMessage);
    }

    const result = await res.json();
    console.log('✅ Category created');
    return result;
  } catch (err) {
    console.error('❌ createCategory error:', err.message);
    throw err;
  }
}

export async function updateCategory(id, data) {
  try {
    const token = localStorage.getItem("token");
    console.log('✏️ Updating category:', id);
    
    const res = await fetch(`${API_URL}/categories/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      if (res.status === 401) {
        // Do not redirect automatically to prevent data loss
        throw new Error("Session expired");
      }
      const errorText = await res.text();
      console.error('❌ Update category error:', errorText);
      throw new Error("Failed to update category");
    }

    const result = await res.json();
    console.log('✅ Category updated');
    return result;
  } catch (err) {
    console.error('❌ updateCategory error:', err.message);
    throw err;
  }
}

export async function deleteCategory(id) {
  try {
    const token = localStorage.getItem("token");
    console.log('🗑️ Deleting category:', id);
    
    const res = await fetch(`${API_URL}/categories/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      if (res.status === 401) {
        // Do not redirect automatically to prevent data loss
        throw new Error("Session expired");
      }
      const errorText = await res.text();
      console.error('❌ Delete category error:', errorText);
      throw new Error("Failed to delete category");
    }

    const result = await res.json();
    console.log('✅ Category deleted');
    return result;
  } catch (err) {
    console.error('❌ deleteCategory error:', err.message);
    throw err;
  }
}


export async function createTag(data) {
  try {
    const token = localStorage.getItem("token");
    console.log('➕ Creating tag:', data.name);
    
    const res = await fetch(`${API_URL}/tags`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      if (res.status === 401) {
        // Do not redirect automatically to prevent data loss
        throw new Error("Session expired");
      }
      const errorText = await res.text();
      console.error('❌ Create tag error:', errorText);
      throw new Error("Failed to create tag");
    }

    const result = await res.json();
    console.log('✅ Tag created');
    return result;
  } catch (err) {
    console.error('❌ createTag error:', err.message);
    throw err;
  }
}

export async function updateTag(id, data) {
  try {
    const token = localStorage.getItem("token");
    console.log('✏️ Updating tag:', id);
    
    const res = await fetch(`${API_URL}/tags/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      if (res.status === 401) {
        // Do not redirect automatically to prevent data loss
        throw new Error("Session expired");
      }
      const errorText = await res.text();
      console.error('❌ Update tag error:', errorText);
      throw new Error("Failed to update tag");
    }

    const result = await res.json();
    console.log('✅ Tag updated');
    return result;
  } catch (err) {
    console.error('❌ updateTag error:', err.message);
    throw err;
  }
}

export async function deleteTag(id) {
  try {
    const token = localStorage.getItem("token");
    console.log('🗑️ Deleting tag:', id);
    
    const res = await fetch(`${API_URL}/tags/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      if (res.status === 401) {
        // Do not redirect automatically to prevent data loss
        throw new Error("Session expired");
      }
      const errorText = await res.text();
      console.error('❌ Delete tag error:', errorText);
      throw new Error("Failed to delete tag");
    }

    const result = await res.json();
    console.log('✅ Tag deleted');
    return result;
  } catch (err) {
    console.error('❌ deleteTag error:', err.message);
    throw err;
  }
}


export async function createUser(data) {
  try {
    const token = localStorage.getItem("token");
    console.log('➕ Creating user:', data.name);
    
    // Using auth/register because it handles password hashing and creation
    const res = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      if (res.status === 401) {
        // Do not redirect automatically to prevent data loss
        throw new Error("Session expired");
      }
      const errorText = await res.text();
      console.error('❌ Create user error:', errorText);
      throw new Error("Failed to create user");
    }

    const result = await res.json();
    console.log('✅ User created');
    return result;
  } catch (err) {
    console.error('❌ createUser error:', err.message);
    throw err;
  }
}

export async function updateUser(id, data) {
  try {
    const token = localStorage.getItem("token");
    console.log('✏️ Updating user:', id);
    
    const res = await fetch(`${API_URL}/users/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      if (res.status === 401) {
        // Do not redirect automatically to prevent data loss
        throw new Error("Session expired");
      }
      const errorText = await res.text();
      console.error('❌ Update user error:', errorText);
      throw new Error("Failed to update user");
    }

    const result = await res.json();
    console.log('✅ User updated');
    return result;
  } catch (err) {
    console.error('❌ updateUser error:', err.message);
    throw err;
  }
}

export async function deleteUser(id) {
  try {
    const token = localStorage.getItem("token");
    console.log('🗑️ Deleting user:', id);
    
    const res = await fetch(`${API_URL}/users/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      if (res.status === 401) {
        // Do not redirect automatically to prevent data loss
        throw new Error("Session expired");
      }
      const errorText = await res.text();
      console.error('❌ Delete user error:', errorText);
      throw new Error("Failed to delete user");
    }

    const result = await res.json();
    console.log('✅ User deleted');
    return result;
  } catch (err) {
    console.error('❌ deleteUser error:', err.message);
    throw err;
  }
}
