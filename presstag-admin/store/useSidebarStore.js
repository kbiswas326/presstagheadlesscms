'use client'
import { create } from 'zustand';

const useSidebarStore = create((set, get) => ({
  collapsed: false,
  showPostSidebar: false,
  toggleSidebar: (val) => set({ collapsed: val }),
  togglePostSidebar: (val) => {
    set({ 
      showPostSidebar: val,
      // Auto collapse main sidebar when post sidebar is shown
      collapsed: val ? true : get().collapsed
    });
  }
}));

export default useSidebarStore;
