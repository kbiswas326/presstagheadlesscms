"use client";

import React, { useState, useEffect } from "react";
import Cookies from "js-cookie";

const HeadScript = ({ initialHeadScript = [] }) => {
  // Initialize the state with an array of strings
  const [headScript, setHeadScript] = useState([]);

  // Update state when the initialHeadScript prop changes
  useEffect(() => {
    if (initialHeadScript && Array.isArray(initialHeadScript)) {
      setHeadScript(initialHeadScript);
    }
  }, [initialHeadScript]);

  // Add a new empty script entry to the array
  const handleAddScript = () => {
    setHeadScript([...headScript, ""]);
  };

  // Update a specific script entry
  const handleUpdateScript = (index, value) => {
    const updatedScripts = [...headScript];
    updatedScripts[index] = value;
    setHeadScript(updatedScripts);
  };

  // Delete a specific script entry
  const handleDeleteScript = (index) => {
    const updatedScripts = headScript.filter((_, i) => i !== index);
    setHeadScript(updatedScripts);
  };

  // Save the updated array to the backend
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
          body: JSON.stringify({ html_head: headScript }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to save head scripts");
      }

      const data = await response.json();
      // Update the state with the response data if necessary
      setHeadScript(data.data.html_head);
      alert("Head scripts updated successfully!");
    } catch (error) {
      console.error("Error saving head scripts:", error);
    }
  };

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h2 className="text-xl font-bold mb-4">Manage Head Scripts</h2>

      {headScript.map((script, index) => (
        <div key={index} className="flex items-center space-x-2 mb-2">
          <input
            type="text"
            value={script}
            onChange={(e) => handleUpdateScript(index, e.target.value)}
            className="border p-2 w-full"
            placeholder="Enter script"
          />
          <button
            onClick={() => handleDeleteScript(index)}
            className="bg-red-500 text-white px-3 py-1 rounded-md"
          >
            Delete
          </button>
        </div>
      ))}

      <button
        onClick={handleAddScript}
        className="bg-green-500 text-white px-4 py-2 rounded-md mr-2"
      >
        + Add Script
      </button>

      <button
        onClick={handleSave}
        className="bg-purple-600 text-white px-4 py-2 rounded-md"
      >
        Save
      </button>
    </div>
  );
};

export default HeadScript;
