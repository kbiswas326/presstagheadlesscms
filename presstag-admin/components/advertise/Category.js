"use client";

import React, { useState, useEffect } from "react";
import Cookies from 'js-cookie';

const Advertise = ({  categoryAdd }) => {
  const [categoryPage, setCategoryPage] = useState([]);

  // Initialize the categoryPage state with the passed categoryAdd prop
  useEffect(() => {
    if (categoryAdd && categoryAdd.length > 0) {
      setCategoryPage(categoryAdd);
    }
  }, [categoryAdd]);

  const handleAddCategory = () => {
    setCategoryPage([
      ...categoryPage,
      {
        slug: "",
        section_card: { before: "", after: "" },
        card_add: [],
      },
    ]);
  };

  const handleUpdateCategory = (index, key, value) => {
    const updatedCategories = [...categoryPage];
    updatedCategories[index][key] = value;
    setCategoryPage(updatedCategories);
  };

  const handleUpdateSectionCard = (index, key, value) => {
    const updatedCategories = [...categoryPage];
    updatedCategories[index].section_card[key] = value;
    setCategoryPage(updatedCategories);
  };

  const handleAddCardAd = (categoryIndex) => {
    const updatedCategories = [...categoryPage];
    updatedCategories[categoryIndex].card_add.push({ position: "", add_content: "" });
    setCategoryPage(updatedCategories);
  };

  const handleUpdateCardAd = (categoryIndex, cardIndex, key, value) => {
    const updatedCategories = [...categoryPage];
    updatedCategories[categoryIndex].card_add[cardIndex][key] = value;
    setCategoryPage(updatedCategories);
  };

  const handleDeleteCategory = async(index) => {
    const updatedCategories = categoryPage.filter((_, i) => i !== index);
    setCategoryPage(updatedCategories);
    const token = Cookies.get('token');
    // Send the updated data to the backend (you can use fetch, axios, or any other method)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/customize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({category_page:updatedCategories})
      });
     
      if (!response.ok) {
        throw new Error("Failed to delete ad");
      }
     
      const data = await response.json();
      setCategoryPage(data.data.category_page);
      alert("Ad delete success fully successfully!");
    } catch (error) {
      console.error("Error saving data:", error);
    }
  };

  const handleDeleteCardAd = async(categoryIndex, cardIndex) => {
    const updatedCategories = [...categoryPage];
    updatedCategories[categoryIndex].card_add = updatedCategories[categoryIndex].card_add.filter(
      (_, i) => i !== cardIndex
    );
    setCategoryPage(updatedCategories);

    


  };

      

  const handleSave = async () => {
    const token = Cookies.get('token');
    // Send the updated data to the backend (you can use fetch, axios, or any other method)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/customize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({category_page:categoryPage})
      });
     
      if (!response.ok) {
        throw new Error("Failed to delete ad");
      }
     
      const data = await response.json();
      setCategoryPage(data.data.category_page);
      alert("Ad updated success fully successfully!");
    } catch (error) {
      console.error("Error saving data:", error);
    }
  };

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h2 className="text-xl font-bold mb-4">Manage Category Advertisements</h2>

      {categoryPage.map((category, categoryIndex) => (
        <div key={categoryIndex} className="border p-3 rounded-md shadow-sm mb-4">
          {/* Category Slug */}
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={category.slug}
              onChange={(e) => handleUpdateCategory(categoryIndex, "slug", e.target.value)}
              className="border p-2 w-full"
              placeholder="Category Slug"
            />
            <button
              onClick={() => handleDeleteCategory(categoryIndex)}
              className="bg-red-500 text-white px-3 py-1 rounded-md"
            >
              Delete
            </button>
          </div>

          {/* Section Card (Before & After) */}
          <div className="mt-2">
            <label className="block font-semibold">Section Card Ads</label>
            <input
              type="text"
              value={category.section_card.before}
              onChange={(e) => handleUpdateSectionCard(categoryIndex, "before", e.target.value)}
              className="border p-2 w-full my-1"
              placeholder="Before Section Ad"
            />
            <input
              type="text"
              value={category.section_card.after}
              onChange={(e) => handleUpdateSectionCard(categoryIndex, "after", e.target.value)}
              className="border p-2 w-full my-1"
              placeholder="After Section Ad"
            />
          </div>

          {/* Card Ads */}
          <div className="mt-3">
            <label className="block font-semibold">Card Ads</label>
            {category.card_add.map((card, cardIndex) => (
              <div key={cardIndex} className="border p-2 rounded-md mt-2 flex items-center space-x-2">
                <input
                  type="number"
                  value={card.position}
                  onChange={(e) =>
                    handleUpdateCardAd(categoryIndex, cardIndex, "position", Number(e.target.value))
                  }
                  className="border p-2 w-1/4"
                  placeholder="Position"
                />
                <input
                  type="text"
                  value={card.add_content}
                  onChange={(e) =>
                    handleUpdateCardAd(categoryIndex, cardIndex, "add_content", e.target.value)
                  }
                  className="border p-2 w-full"
                  placeholder="Ad Content"
                />
                <button
                  onClick={() => handleDeleteCardAd(categoryIndex, cardIndex)}
                  className="bg-red-500 text-white px-3 py-1 rounded-md"
                >
                  X
                </button>
              </div>
            ))}
            <button
              onClick={() => handleAddCardAd(categoryIndex)}
              className="bg-blue-500 text-white px-3 py-1 rounded-md mt-2"
            >
              + Add Card Ad
            </button>
          </div>
        </div>
      ))}

      {/* Add New Category Button */}
      <button
        onClick={handleAddCategory}
        className="bg-green-500 text-white px-4 py-2 rounded-md mr-2"
      >
        + Add Category
      </button>

      {/* Save Button - Disabled if no categories exist */}
      <button
        onClick={handleSave}
        className={`px-4 py-2 rounded-md ${categoryPage.length === 0 ? "bg-gray-400 cursor-not-allowed" : "bg-purple-600 text-white"}`}
        disabled={categoryPage.length === 0}
      >
        Save
      </button>
    </div>
  );
};

export default Advertise;
