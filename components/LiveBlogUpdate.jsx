"use client";

import React, { useEffect, useRef, useState } from "react";
import Cookies from "js-cookie";
import { CiMenuKebab } from "react-icons/ci";
import {
  AiOutlineEdit,
  AiOutlineDelete,
  AiOutlinePushpin,
} from "react-icons/ai";
import RichTextEditor from "./RichTextEditor"; // Adjust the path as necessary

const LiveBlogUpdate = ({ postId }) => {
  const [updates, setUpdates] = useState([]);
  const [error, setError] = useState(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [currentPost, setCurrentPost] = useState("");
  const [newUpdate, setNewUpdate] = useState({ title: "", content: "" });
  const [editPost, setEditPost] = useState("");
  const [post,setPost]=useState([])
  const fetchDataById = async (apiUrl) => {
    try {
      const response = await fetch(apiUrl, {
        method: "GET", // Method type is GET for fetching data
        headers: {
          "Content-Type": "application/json", // Optional, depends on the API
        },
      });
  
      // Check if the response is successful
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch data");
      }
      
      const data = await response.json();
     
      
      setPost(data.article)
  
      return data;
    } catch (error) {
      console.error("Error fetching data:", error);
      // Handle errors, maybe show an error message to the user
    }
  };
  useEffect(() => {
    const fetchUpdates = async () => {
      try {
        const token = Cookies.get("token");
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/post/${postId}/live-blog/updates`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );
        
        
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const data = await response.json();
       
        setUpdates(data.updates);
      } catch (err) {
        setError("Failed to fetch updates. Please try again later.");
        console.error(err);
      }
    };



    const fetchData = async () => {
      const data = await fetchDataById(
        `${process.env.NEXT_PUBLIC_API_URL}/article/${postId}`
      );
      if (data && data.article) {
        // Handle the fetched data
      } else {
        // Show a toast or handle the error state
        console.error("Data not found");
      }
    };

    fetchUpdates();
    fetchData()
  }, [postId]);

  




  const handlePin = async (id, value) => {
    try {
      if(post.status==='draft'){

        const {status,...restData}=status;
        
        
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/post/publish/${post._id}`, {
          method: isCreate ? "POST" : "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(transformedData),
        });
      }
      const token = Cookies.get("token");
      const data = { pinned: value };

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/live-blog/update/${id}`,
        {
          method: "PATCH",
          body: JSON.stringify(data),
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to update the post with ID: ${id}`);
      }

      const updatedPost = await response.json();
      setCurrentPost("");

      setUpdates((prevUpdates) => {
        const others = prevUpdates.filter((update) => update._id !== id);
        return [updatedPost.update, ...others];
      });
    } catch (err) {
      console.error(err);
      setError("Failed to update the post. Please try again later.");
    }
  };

  const handleEdit = (update) => {
    setEditPost(update._id);
    setEditData(update);
    setNewUpdate({ title: update.title, content: update.content });
    setIsPopupOpen(true);
    window.scrollTo(0, 70);
  };

  const handleDelete = async (id) => {
    try {
      const token = Cookies.get("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/live-blog/update/${id}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to delete update with ID: ${id}`);
      }

      setUpdates((prevUpdates) =>
        prevUpdates.filter((update) => update._id !== id)
      );
    } catch (err) {
      console.error(err);
      setError("Failed to delete the update. Please try again later.");
    }
  };

  const handlePublish = async () => {
    try {
      const token = Cookies.get("token");
      const endpoint =
        editPost !== ""
          ? `${process.env.NEXT_PUBLIC_API_URL}/live-blog/update/${editPost}`
          : `${process.env.NEXT_PUBLIC_API_URL}/posts/${postId}/live-blog/update`;

      const method = editPost !== "" ? "PATCH" : "POST";
      alert(endpoint);
      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: newUpdate.title,
          content: newUpdate.content,
        }),
      });

      if (!response.ok) {
        throw new Error(
          `Failed to ${editData ? "update" : "create"} the update.`
        );
      }

      const savedUpdate = await response.json();

      if (editPost !== "") {
        const deleteThisData = updates.filter((up) => up._id !== editPost);
        const newdata = [savedUpdate.update, ...deleteThisData];

        setUpdates(newdata);
      } else {
        setUpdates((prevUpdates) => [savedUpdate.update, ...prevUpdates]);
      }

      setIsPopupOpen(false);
      setEditData(null);
      setNewUpdate({ title: "", content: "" });
      setEditPost("");
    } catch (err) {
      console.error(err);
      setError("Failed to save the update. Please try again later.");
    }
  };

  const menuRef = useRef(null);
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setCurrentPost("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [currentPost]);

  return (
    <div className="py-6  bg-white shadow-md rounded-lg mb-5">
      {isPopupOpen && (
        <div className="w-full inset-0 bg-opacity-50 flex items-center justify-center">
          <div className="w-full bg-red-400 rounded-lg relative">
            <div className="bg-gray-100 p-4">
              <h2 className="text-xl font-bold mb-4">
                {editData ? "Edit Update" : "Create New Update "}
              </h2>
              <input
                type="text"
                placeholder="Title"
                value={newUpdate.title}
                onChange={(e) =>
                  setNewUpdate((prev) => ({ ...prev, title: e.target.value }))
                }
                className="w-full p-2 mb-4 border rounded"
              />
              <RichTextEditor
                content={newUpdate.content}
                htmlContentGrab={(content) =>
                  setNewUpdate((prev) => ({ ...prev, content }))
                }
              />
              <div className="flex justify-end space-x-4 mt-4">
                <button
                  onClick={() => setIsPopupOpen(false)}
                  className="px-4 py-2 text-gray-500 border rounded hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePublish}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  {editData ? "Update" : "Publish"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <h1 className="text-2xl font-bold text-center my-4">Live Blog Updates</h1>
      <div className="text-center mb-6 flex gap-2 justify-center">
        <button
          onClick={() => {
            setIsPopupOpen(true);
            setNewUpdate({ title: "", content: "" });
            setEditData(null);
            setEditPost("");
            window.scrollTo(0, 70);
          }}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Create a New Update
        </button>
      </div>
      {error ? (
        <p className="text-red-500 text-center">{error}</p>
      ) : (
        <div className="space-y-4 px-28 bg-gray-50 py-10">
          {updates
            .sort((a, b) => {
              if (b.pinned !== a.pinned) return b.pinned - a.pinned;
              return new Date(b.createdAt) - new Date(a.createdAt);
            })
            .map((update) => (
              <div
                key={update._id}
                className="bg-white p-4 shadow rounded flex justify-between relative"
              >
                <div className="w-full">
                  <div className="flex gap-3">
                    <p className="text-sm text-gray-500 mb-2">
                      {new Date(update.createdAt).toLocaleString("en-US", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </p>
                    {update.pinned && (
                      <AiOutlinePushpin color="" className="text-blue-500" />
                    )}
                  </div>
                  <div className="flex justify-between w-full">
                    <div className="text-lg w-full font-semibold mb-2">
                      {update.title}
                    </div>
                    <div className="shadow-inner shadow-gray-200 p-2 rounded relative group z-30">
                      <button onClick={() => setCurrentPost(update._id)}>
                        <CiMenuKebab
                          color="blue"
                          size={20}
                          className="cursor-pointer"
                        />
                      </button>
                    </div>
                    {currentPost === update._id && (
                      <div
                        ref={menuRef}
                        className="absolute bg-white border border-blue-200 end-3 top-24  p-2 rounded z-50"
                      >
                        <ul className="space-y-1 cursor-pointer">
                          <li
                            onClick={() => handleEdit(update)}
                            className="flex items-center gap-2 py-2 px-1 hover:bg-blue-200 text-xs rounded-md"
                          >
                            <AiOutlineEdit />
                            <span>Edit</span>
                          </li>
                          <li
                            onClick={() =>
                              handlePin(update._id, !update.pinned)
                            }
                            className="flex items-center gap-2 py-2 px-1 hover:bg-blue-200 text-xs rounded-md"
                          >
                            <AiOutlinePushpin />
                            <span> {update.pinned ? "Unpin" : " Pin"} </span>
                          </li>
                          <li
                            onClick={() => handleDelete(update._id)}
                            className="flex items-center gap-2 py-2 px-1 hover:bg-blue-200 text-xs rounded-md"
                          >
                            <AiOutlineDelete />
                            <span>Delete</span>
                          </li>
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
};

export default LiveBlogUpdate;
