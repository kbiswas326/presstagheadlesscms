"use client";

import React, { useState, useEffect } from "react";
import Cookies from "js-cookie";

const AllSlug = ({ allSlugs }) => {
  // Initialize with an object instead of an array.
  const [allSlug, setAllSlug] = useState({
    section_card: { before: "", after: "" },
    card_add: [],
  });

  // Initialize the allSlug state with the passed allSlugs prop
  useEffect(() => {
    if (allSlugs) {
      // Ensure card_add is an array in case it isn't provided
      setAllSlug({
        ...allSlugs,
        card_add: allSlugs.card_add || [],
      });
    }
  }, [allSlugs]);

  // Update Section Card fields (Before & After)
  const handleUpdateSectionCard = (key, value) => {
    setAllSlug((prev) => ({
      ...prev,
      section_card: {
        ...prev.section_card,
        [key]: value,
      },
    }));
  };

  // Add a new Card Ad to the card_add array
  const handleAddCardAd = () => {
    setAllSlug((prev) => ({
      ...prev,
      card_add: [
        ...prev.card_add,
        { position: "", add_content: "" },
      ],
    }));
  };

  // Update a specific Card Ad field
  const handleUpdateCardAd = (cardIndex, key, value) => {
    const updatedCardAds = [...allSlug.card_add];
    updatedCardAds[cardIndex][key] = value;
    setAllSlug((prev) => ({
      ...prev,
      card_add: updatedCardAds,
    }));
  };

  // Delete a specific Card Ad
  const handleDeleteCardAd = (cardIndex) => {
    const updatedCardAds = allSlug.card_add.filter((_, i) => i !== cardIndex);
    setAllSlug((prev) => ({
      ...prev,
      card_add: updatedCardAds,
    }));
  };

  // Save the updated data to the backend
  const handleSave = async () => {
    const token = Cookies.get("token");

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/customize`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ all_cat_tag: allSlug }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update advertisement data");
      }

      const data = await response.json();

      alert("Ad updated successfully!");
    } catch (error) {
      console.error("Error saving data:", error);
    }
  };

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h2 className="text-xl font-bold mb-4">Manage AllSlug Advertisements</h2>

      <div className="border p-3 rounded-md shadow-sm mb-4">
        {/* Section Card Ads */}
        <div>
          <label className="block font-semibold">Section Card Ads</label>
          <input
            type="text"
            value={allSlug?.section_card?.before}
            onChange={(e) =>
              handleUpdateSectionCard("before", e.target.value)
            }
            className="border p-2 w-full my-1"
            placeholder="Before Section Ad"
          />
          <input
            type="text"
            value={allSlug?.section_card?.after}
            onChange={(e) =>
              handleUpdateSectionCard("after", e.target.value)
            }
            className="border p-2 w-full my-1"
            placeholder="After Section Ad"
          />
        </div>

        {/* Card Ads */}
        <div className="mt-3">
          <label className="block font-semibold">Card Ads</label>
          {allSlug?.card_add?.map((card, cardIndex) => (
            <div
              key={cardIndex}
              className="border p-2 rounded-md mt-2 flex items-center space-x-2"
            >
              <input
                type="number"
                value={card.position}
                onChange={(e) =>
                  handleUpdateCardAd(
                    cardIndex,
                    "position",
                    Number(e.target.value)
                  )
                }
                className="border p-2 w-1/4"
                placeholder="Position"
              />
              <input
                type="text"
                value={card.add_content}
                onChange={(e) =>
                  handleUpdateCardAd(cardIndex, "add_content", e.target.value)
                }
                className="border p-2 w-full"
                placeholder="Ad Content"
              />
              <button
                onClick={() => handleDeleteCardAd(cardIndex)}
                className="bg-red-500 text-white px-3 py-1 rounded-md"
              >
                X
              </button>
            </div>
          ))}
          <button
            onClick={handleAddCardAd}
            className="bg-blue-500 text-white px-3 py-1 rounded-md mt-2"
          >
            + Add Card Ad
          </button>
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        className={`px-4 py-2 rounded-md ${
          !allSlug
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-purple-600 text-white"
        }`}
        disabled={!allSlug}
      >
        Save
      </button>
    </div>
  );
};

export default AllSlug;
