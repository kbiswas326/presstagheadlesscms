"use client";
import Image from "next/image";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import usePostStore from "../../store/postStore";
import { usePathname } from 'next/navigation';
import AdSpot from "../AdSpot";

const Icon = ({ title, children, className }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden={title ? undefined : true}
    role={title ? 'img' : 'presentation'}
  >
    {title ? <title>{title}</title> : null}
    {children}
  </svg>
);

const SearchIcon = (props) => (
  <Icon title="Search" {...props}>
    <circle cx="11" cy="11" r="7" />
    <path d="M21 21l-4.35-4.35" />
  </Icon>
);

const MenuIcon = (props) => (
  <Icon title="Menu" {...props}>
    <path d="M4 6h16" />
    <path d="M4 12h16" />
    <path d="M4 18h16" />
  </Icon>
);

const CloseIcon = (props) => (
  <Icon title="Close" {...props}>
    <path d="M18 6L6 18" />
    <path d="M6 6l12 12" />
  </Icon>
);

const NavigationBar = ({navigationItems, top_nav, after_nav, branding, templateId}) => {
  const [search, setSearch] = useState("remove");
  const [searchQuery, setSearchQuery] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();
  const {liveScoreToggle}=usePostStore()
  const pathname = usePathname();
  
  const primaryColor = branding?.primaryColor || '#006356';
  const siteTitle = branding?.siteTitle || 'PressTag';
  const logoUrl = branding?.logo || null;
  const displayMode = branding?.logoDisplayMode || 'both'; // 'both', 'logo', 'text'
  const tpl = String(templateId || '').trim().toLowerCase();
  const isBold = tpl === 'bold';
  const navBg = primaryColor;
  const logoChipBg = isBold ? 'bg-white/10' : 'bg-white';

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
      <div style={{ backgroundColor: navBg }} className="text-white relative">
        <div className="container mx-auto px-4 lg:px-8">
          <div className={`flex items-center justify-between ${isBold ? 'h-14' : 'h-12'}`}>
            {/* Logo section */}
            <div className="flex-shrink-0">
              <Link href="/" className="flex items-center gap-3 cursor-pointer">
                {/* Logo Image */}
                {showLogo && (
                    <Image
                      src={logoUrl}
                      alt={siteTitle}
                      width={180}
                      height={36}
                      sizes="180px"
                      className="h-9 w-auto max-w-[180px] object-contain"
                      priority
                    />
                )}

                {/* Site Title */}
                {showTitle && (
                    <div className={`${showLogo ? 'hidden md:flex' : 'flex'} flex-col justify-center ${logoChipBg} py-0.5 px-1.5 rounded-sm hover:opacity-90 transition-opacity`}>
                      <span style={{ color: primaryColor }} className="font-bold text-xl tracking-tighter leading-none">
                        {siteTitle}
                      </span>
                    </div>
                )}
              </Link>
            </div>

            {/* Navigation items - Desktop */}
            <div className={`hidden lg:flex flex-1 ${isBold ? 'justify-center space-x-7' : 'justify-start space-x-5 ml-6'}`}>
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
            {!isBold ? (
              <div className="hidden lg:block mx-4">
                  <AdSpot position="header_inside" className="!my-0" />
              </div>
            ) : null}

            {/* Search and Menu buttons */}
            <div className="flex items-center space-x-2">
              {isBold ? (
                <div className="hidden lg:flex items-center">
                  <button
                    type="button"
                    className="ml-2 px-4 py-2 rounded bg-orange-500 hover:bg-orange-600 transition-colors text-white text-[12px] font-bold"
                  >
                    Subscribe
                  </button>
                </div>
              ) : null}
              <button
                onClick={() =>
                  setSearch(search === "remove" ? "add" : "remove")
                }
                className="text-white hover:text-gray-200 p-1"
                aria-label="Search"
              >
                <SearchIcon className="h-4 w-4" />
              </button>

              {/* Hamburger Menu Button - Mobile only */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="lg:hidden text-white hover:text-gray-200 p-1"
                aria-label="Menu"
              >
                <MenuIcon className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>

        {isBold ? (
          <div className="bg-white text-gray-600 border-b border-gray-100">
            <div className="container mx-auto px-4 lg:px-8">
              <div className="h-11 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="text-gray-700 hover:text-gray-900 p-1"
                  aria-label="Menu"
                >
                  <MenuIcon className="h-5 w-5" />
                </button>
                <div className="text-xs font-medium text-gray-500 text-center flex-1 px-4">
                  Sign up for our Newsletter and stay updated
                </div>
                <button
                  type="button"
                  onClick={() => setSearch(search === "remove" ? "add" : "remove")}
                  className="text-gray-700 hover:text-gray-900 p-1"
                  aria-label="Search"
                >
                  <SearchIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        ) : null}

        <div
          className={`lg:hidden absolute left-0 right-0 ${isBold ? 'top-[100px]' : 'top-12'} bg-white text-black border-t border-gray-200 shadow-lg overflow-hidden transition-[max-height,opacity] duration-200 ease-out ${isMenuOpen ? 'max-h-[70vh] opacity-100' : 'max-h-0 opacity-0 pointer-events-none'}`}
        >
          <div className="container mx-auto px-4 lg:px-8">
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
          </div>
        </div>

        <div
          className={`absolute ${isBold ? 'top-[100px]' : 'top-12'} left-0 w-full bg-white shadow-md transition-[opacity,transform] duration-200 ease-out ${search === 'add' ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'}`}
        >
          <div className="container mx-auto px-4 lg:px-8 p-4 flex items-center gap-2">
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={handleSearchChange}
              onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit(e)}
              className="flex-1 border border-gray-300 rounded px-3 py-2 text-black focus:outline-none focus:border-emerald-600"
              autoFocus={search === 'add'}
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
              aria-label="Close search"
            >
              <CloseIcon className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default NavigationBar;
