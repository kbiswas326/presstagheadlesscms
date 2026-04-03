import { create } from "zustand";
import Cookies from 'js-cookie';

const useAllPostDataStore = create((set, get) => ({
    allPosts: [],
    loading: true,
    error: null,
    totalPages: 0,
    currentPage: 1,
    totalPostCount:  0,
    liveBlogs: [],

   
    pendingApprovalCount: 0,
    fetchPendingCount: async (type) => {
        try {
            const token = Cookies.get('token');
            if (!token) {
                throw new Error("No token found in cookies");
            }

            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/posts/pending-approval/all?type=${type}&limit=1&page=1`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'x-tenant-id': 'sportzpoint',
                    },
                }
            );

            if (!response.ok) {
                throw new Error("Failed to fetch pending count");
            }

            const data = await response.json();
            set({ pendingApprovalCount: data.pagination?.total || 0 });
        } catch (error) {
            console.error("Error fetching pending count:", error);
        }
    },
    fetchAllPostedData: async (url, type) => {
        set((state) => ({ 
            loading: state.loading ? state.loading : true, 
            error: null 
        }));
        try {
            const token = Cookies.get('token');

            if (!token) {
                throw new Error("No token found in cookies");
            }

            const response = await fetch(url, {
                method: "GET",
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'x-tenant-id': 'sportzpoint',
                },
            });

            if (!response.ok) {
                throw new Error("Failed to fetch data");
            }

            const data = await response.json();

            // If this is a pending approval request, update the pending count
            if (url.includes('pending-approval')) {
                set(() => ({
                    totalPages: data.pagination?.totalPages || 0,
                    currentPage: data.pagination?.page || 1,
                    pendingApprovalCount: data.pagination?.total || 0,
                    allPosts: data.articles || [],
                    loading: false,
                }));
            } else {
                set(() => ({
                    totalPages: data.pagination?.totalPages || 0,
                    currentPage: data.pagination?.page || 1,
                    totalPostCount: data.pagination?.total || 0,
                    allPosts: data.articles || [],
                    loading: false,
                }));
            }
        } catch (error) {
            set({ error: error.message, loading: false });
            console.error("Error fetching data:", error);
        }
    },
    customisePostData: (type, data) => {
        const currentPosts = get().allPosts; // Use `get` to access the current state

        if (type === 'Add') {
            const newPosts = [...currentPosts, data]; // Add new post to the array
            set({ allPosts: newPosts }); // Update the state with `set`
        }
    },
    customiseLivePostData: (type, data) => {
        console.log("type, data",);
        
        const { liveBlogs } = get();
        if (type === 'Add') {
            // Remove any existing post with the same _id
            const updatedPosts = liveBlogs.filter((post) => post._id !== data._id);
    
            // Add the new post at the beginning
            const newPosts = [data, ...updatedPosts];
    
            // Update the state using `set`
            set({ liveBlogs: newPosts });
        }else if (type === 'Delete') {
            const updatedPosts = liveBlogs.filter((post) => post._id !== data);
            set({ liveBlogs: updatedPosts });
        }
    },
    
    
    fetchLiveBlogs: async (url) => {
        // Only set loading to true if not already loading
        set((state) => ({
            loading: state.loading ? state.loading : true,
            error: null
        }));
        try {
            // Retrieve the token from cookies
            const token = Cookies.get('token');

            if (!token) {
                throw new Error("No token found in cookies");
            }

            const response = await fetch(url, {
                method: "GET",
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'x-tenant-id': 'sportzpoint'
                },
            });

            if (!response.ok) {
                throw new Error("Failed to fetch data");
            }

            const data = await response.json();
            
            set(() => ({
                
                liveBlogs:data,
              
                loading: false,
            }));
        } catch (error) {
            set({ error: error.message, loading: false });
            console.error("Error fetching data:", error);
        }
    },
    
}));

export default useAllPostDataStore;
