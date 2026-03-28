"use client";
import { useState, useRef, useEffect } from "react";
import { FaTimes, FaCamera, FaFacebookF, FaLinkedinIn } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import Image from "next/image";
import Cookies from "js-cookie";
import toast from "react-hot-toast";
import ImageGalleryPopup from "./ImageGalleryPopup";
const DEFAULT_AVATAR =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI2NjY2NjYyI+PHBhdGggZD0iTTEyIDJDNi40OCAyIDIgNi40OCAyIDEyczQuNDggMTAgMTAgMTAgMTAtNC40OCAxMC0xMFMxNy41MiAyIDEyIDJ6bTAgM2MyLjY3IDAgNC44NCAyLjE3IDQuODQgNC44NCAwIDIuNjctMi4xNyA0Ljg0LTQuODQgNC44NC0yLjY3IDAtNC44NC0yLjE3LTQuODQtNC44NCAwLTIuNjcgMi4xNy00Ljg0IDQuODQtNC44NHptMCAxMmE5Ljk4IDkuOTggMCAwIDEtOC4xNi00LjIzYy4wNS0yLjcyIDUuNDQtNC4yMiA4LjE2LTQuMjJzOC4xMSAxLjUgOC4xNiA0LjIyYTkuOTggOS45OCAwIDAgMS04LjE2IDQuMjN6Ii8+PC9zdmc+";

const ProfileModal = ({ isOpen, onClose, userData }) => {
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    name: userData?.data?.name || "",
    avatar: userData?.data?.profile_picture || "",
    bio: userData?.data?.bio || "",
    twitter: userData?.data?.social_profiles?.twitter || "",
    facebook: userData?.data?.social_profiles?.facebook || "",
    linkedin: userData?.data?.social_profiles?.linkedin || "",
  });
  
  const [previewUrl, setPreviewUrl] = useState(DEFAULT_AVATAR);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch user data when modal opens
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = Cookies.get("token");
        const userId = localStorage.getItem("id");

        if (!token || !userId) {
          throw new Error("Authentication token or user ID not found");
        }

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/user/${userId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch user data");
        }

        const data = await response.json();

        setFormData((prev) => ({
          ...prev,
          name: data.data?.name || "",
          avatar: data.data?.profile_picture || "",

          bio: data.data?.bio || "",
          twitter: data.data.social_profiles?.twitter || "",
          facebook: data.data.social_profiles?.facebook || "",
          linkedin: data.data.social_profiles?.linkedin || "",
        }));

        console.log("data", data, formData);

        // Update avatar preview
        if (data.data.profile_picture) {
          setPreviewUrl(data.data.profile_picture);
        } else {
          setPreviewUrl(DEFAULT_AVATAR);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        toast.error("Failed to load user data");
      }
    };

    if (isOpen) {
      fetchUserData();
    }
  }, [isOpen]);

  const [imageGallarys, setimageGallarys] = useState(false);
  const takeImageFromImageGallary = () => {
    setimageGallarys(!imageGallarys);
  };
  const selectImage = (img) => {
    setFormData((prev) => {
      return {
        ...prev,
        avatar: img,
      };
    });
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const token = Cookies.get("token");
      const userId = localStorage.getItem("id"); // This should already have the user _id from MongoDB.

      if (!token || !userId) {
        throw new Error("Authentication token or user ID not found");
      }

      // Prepare the data to send
      const dataToSend = {
        profile_picture: formData.avatar || "",
        name: formData.name?.trim() || "",
        bio: formData.bio, // Send bio as is
        social_profiles: {
          twitter: formData.twitter?.trim() || "",
          facebook: formData.facebook?.trim() || "",
          linkedin: formData.linkedin?.trim() || "",
        },
      };

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/user/my-profile/update/${userId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json", // Ensure content type is set
          },
          body: JSON.stringify(dataToSend),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Update failed: ${response.status}`);
      }

      if (data.user) {
        // Update local storage
        localStorage.setItem("name", data.user.name || "");

        // Update form state with all fields including bio and social profiles
        setFormData((prev) => ({
          ...prev,
          name: data.user.name || prev.name,

          bio: data.user.bio || prev.bio,
          avatar: data.user.profile_picture || "",
          twitter: data.user.social_profiles?.twitter || prev.twitter,
          facebook: data.user.social_profiles?.facebook || prev.facebook,
          linkedin: data.user.social_profiles?.linkedin || prev.linkedin,
        }));

        toast.success("Profile updated successfully");
      } else {
        throw new Error("Invalid response format from server");
      }
    } catch (err) {
      console.error("Profile update error:", err);
      setError(err.message || "Failed to update profile");
      toast.error(err.message || "Failed to update profile");
    } finally {
      setLoading(false);
      onClose();
    }
  };
  if (!isOpen) return null;

  return (
    <>
      {imageGallarys === true && (
        <ImageGalleryPopup onClose={setimageGallarys} onSelect={selectImage} />
      )}
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Edit Profile
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <FaTimes className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Avatar Upload */}
            <div className="flex justify-center">
              <div className="relative">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100">
                  <Image
                    src={
                      formData.avatar !== ""
                        ? `${process.env.NEXT_PUBLIC_API_URL_IMG}/${formData.avatar}`
                        : DEFAULT_AVATAR
                    }
                    alt={`${formData.avatar}`}
                    width={100}
                    height={100}
                    quality={100}
                    className="w-full h-full object-cover"
                    onError={() => setPreviewUrl(DEFAULT_AVATAR)}
                  />
                </div>
                <button
                  type="button"
                  onClick={takeImageFromImageGallary}
                  className="absolute bottom-0 right-0 bg-blue-600 p-2 rounded-full text-white hover:bg-blue-700 transition-colors"
                >
                  <FaCamera className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700"
                >
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData((prev) => ({ ...prev, name: e.target.value }));
                  }}
                  className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="bio"
                  className="block text-sm font-medium text-gray-700"
                >
                  Bio
                </label>
                <textarea
                  id="bio"
                  name="bio"
                  value={formData.bio}
                  onChange={(e) => {
                    setFormData((prev) => ({ ...prev, bio: e.target.value }));
                  }}
                  rows={3}
                  className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2"
                  placeholder="Write something about yourself..."
                />
              </div>

              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700">
                  Social Links
                </label>

                <div className="flex items-center">
                  <span className="p-2 bg-gray-50 border border-r-0 border-gray-300 rounded-l-md">
                    <FaXTwitter className="w-5 h-5 text-gray-400" />
                  </span>
                  <input
                    type="url"
                    value={formData.twitter}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        twitter: e.target.value,
                      }))
                    }
                    placeholder="Twitter profile URL"
                    className="flex-1 rounded-r-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2"
                  />
                </div>

                <div className="flex items-center">
                  <span className="p-2 bg-gray-50 border border-r-0 border-gray-300 rounded-l-md">
                    <FaFacebookF className="w-5 h-5 text-gray-400" />
                  </span>
                  <input
                    type="url"
                    value={formData.facebook}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        facebook: e.target.value,
                      }))
                    }
                    placeholder="Facebook profile URL"
                    className="flex-1 rounded-r-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2"
                  />
                </div>

                <div className="flex items-center">
                  <span className="p-2 bg-gray-50 border border-r-0 border-gray-300 rounded-l-md">
                    <FaLinkedinIn className="w-5 h-5 text-gray-400" />
                  </span>
                  <input
                    type="url"
                    value={formData.linkedin}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        linkedin: e.target.value,
                      }))
                    }
                    placeholder="LinkedIn profile URL"
                    className="flex-1 rounded-r-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? "Updating..." : "Update Profile"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default ProfileModal;
