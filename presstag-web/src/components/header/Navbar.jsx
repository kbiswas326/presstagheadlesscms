"use client";
import Image from "next/image";
import React, { useState, useEffect } from "react";
import { FaSearch } from "react-icons/fa";
import { RxCross2 } from "react-icons/rx";
import { HiMenuAlt3 } from "react-icons/hi";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import usePostStore from "../../store/postStore";
import { usePathname } from 'next/navigation';
import AdSpot from "../AdSpot";

const NavigationBar = ({navigationItems, top_nav, after_nav, branding}) => {
  const [search, setSearch] = useState("remove");
  const [searchQuery, setSearchQuery] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();
  const {liveScoreToggle}=usePostStore()
  const pathname = usePathname();
  
  const primaryColor = branding?.primaryColor || '#006356';
  const siteTitle = branding?.siteTitle || 'PressTag';
  const siteTagline = branding?.siteTagline || '';
  const logoUrl = branding?.logo || null;
  const displayMode = branding?.logoDisplayMode || 'both'; // 'both', 'logo', 'text'
  const showTaglineInHeader = branding?.showTaglineInHeader !== false;

  const showLogo = (displayMode === 'logo' || displayMode === 'both') && logoUrl;
  const showTitle = (displayMode === 'text' || displayMode === 'both') && siteTitle;
  
  // Handle search input change
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
  };

  // Handle search submit
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setSearch("remove");
    router.push(`/search/${encodeURIComponent(searchQuery)}`);
    setSearchQuery("");
  };

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        setSearch("remove");
        setSearchQuery("");
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, []);

  return (
    
    <nav className={`${liveScoreToggle===true?'hidden':'block'} sticky top-0 z-[998]`}>
      {/* Main navigation bar with dynamic background */}
      <div style={{ backgroundColor: primaryColor }} className="text-white">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between h-12">
            {/* Logo section */}
            <div className="flex-shrink-0">
              <Link href="/" className="flex items-center gap-3 cursor-pointer">
                {/* Logo Image */}
                {showLogo && (
                    <img 
                      src={logoUrl} 
                      alt={siteTitle}
                      className="h-9 w-auto max-w-[180px] object-contain"
                    />
                )}

                {/* Site Title */}
                {showTitle && (
                    <div className={`${showLogo ? 'hidden md:flex' : 'flex'} flex-col justify-center bg-white py-0.5 px-1.5 rounded-sm hover:opacity-90 transition-opacity`}>
                      <span style={{ color: primaryColor }} className="font-bold text-xl tracking-tighter leading-none">
                        {siteTitle}
                      </span>
                      {showTaglineInHeader && siteTagline && (
                        <span style={{ color: primaryColor }} className="text-[10px] tracking-wide leading-none opacity-80 mt-0.5">
                            {siteTagline}
                        </span>
                      )}
                    </div>
                )}
              </Link>
            </div>

            {/* Navigation items - Desktop */}
            <div className="hidden lg:flex flex-1 justify-start space-x-5 ml-6">
              {navigationItems && navigationItems.map((item,index) => (
                <Link
                  key={index}
                  href={item.slug || '/'}
                  className="text-white hover:text-gray-200 px-2 py-1 text-[13px] font-medium  whitespace-nowrap"
                >
                  {item.label} 
                </Link>
              ))}
            </div>

            {/* Header Ad Spot */}
            <div className="hidden lg:block mx-4">
                <AdSpot position="header_inside" className="!my-0" />
            </div>

            {/* Search and Menu buttons */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() =>
                  setSearch(search === "remove" ? "add" : "remove")
                }
                className="text-white hover:text-gray-200 p-1"
                aria-label="Search"
              >
                <FaSearch className="h-4 w-4" />
              </button>

              {/* Hamburger Menu Button - Mobile only */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="lg:hidden text-white hover:text-gray-200 p-1"
                aria-label="Menu"
              >
                <HiMenuAlt3 className="h-6 w-6" />
              </button>
            </div>
          </div>
          
          {/* Mobile Menu */}
           <AnimatePresence>
            {isMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="lg:hidden bg-white text-black border-t border-gray-200 shadow-lg"
              >
                <ul className="flex flex-col py-2">
                  {navigationItems && navigationItems.map((item, index) => (
                    <li key={index}>
                      <Link
                        href={item.slug || '/'}
                        className="block px-4 py-2 hover:bg-gray-100 text-sm font-medium"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}
          </AnimatePresence>
          
           {/* Search Overlay */}
          <AnimatePresence>
            {search === "add" && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-12 left-0 w-full bg-white shadow-md p-4 flex items-center gap-2"
              >
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit(e)}
                  className="flex-1 border border-gray-300 rounded px-3 py-2 text-black focus:outline-none focus:border-emerald-600"
                  autoFocus
                />
                <button 
                    onClick={handleSearchSubmit}
                    className="bg-emerald-600 text-white px-4 py-2 rounded hover:bg-emerald-700"
                >
                    Search
                </button>
                <button 
                    onClick={() => setSearch("remove")}
                    className="text-gray-500 hover:text-gray-700"
                >
                    <RxCross2 className="h-6 w-6" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </nav>
  );
};

export default NavigationBar;
