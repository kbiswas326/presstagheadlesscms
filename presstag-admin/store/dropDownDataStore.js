import { create } from "zustand";
import Cookies from 'js-cookie';

const useDropDownDataStore = create((set) => ({
  allTags: [],
  allCategory: [],
  allRoleBaseUser: [],
  liveBlogs: [],
  loading: false,
  error: null,

  // Fetch dropdown data dynamically
  fetchDropDownData: async (url, type) => {
    set({ loading: true, error: null });
  
    // Retrieve the token from cookies using js-cookie
    const token = Cookies.get('token'); // Replace 'token' with the name of your cookie key
   
    try {
      const response = await fetch(url, {
        method: 'GET', // Ensure the correct method is set (GET is assumed here)
        headers: {
          'Content-Type': 'application/json', // or other appropriate content type
          'Authorization': `Bearer ${token}`, // Add token to Authorization header
        },
      });
  
      if (!response.ok) {
        throw new Error("Failed to fetch dropdown data");
      }
  
      const data = await response.json();
      
      // Dynamically update the correct field based on the type
      set((state) => {
        if (type === "tag") {
          return { allTags: data.tags || [], loading: false };
        } else if (type === "category") {
          return { allCategory: data.categories || [], loading: false };
        } else if (type === "roleBaseUser") {
          
          
          return { allRoleBaseUser: data.users || [], loading: false };
        }
        return { loading: false };
      });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

 
  
}));

export default useDropDownDataStore;
