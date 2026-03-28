"use client";
import Cookies from "js-cookie";

import RichTextEditor from "./RichTextEditor";
import WebStoryEditor from "./WebStory";
import { IoMdArrowBack } from "react-icons/io";
import RestOfPostEdit from "./RestOfPostEdit";
import ArticlePostEditComponent from "./ArticlePostEditComponent";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import useAllPostDataStore from "../store/useAllPostDataStore";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { validateSlug } from "../utils/validateSlug";
import SeoScoreModal from "./SeoScoreModal";

function ManagePostProperties({ type, id }) {
  const router = useRouter();
  const { allPosts, customisePostData } = useAllPostDataStore();
  const pathname = usePathname();
  const [post, setPost] = useState(null);
  const [live, setLive] = useState(false);
  const [webStory, setWebStory] = useState([]);
  const [chnageStatus, setChnageStatus] = useState("");
  const [publishAtTime, setPublishAtTime] = useState("");
  const [quiz_html, setQuiz_html] = useState("");

  const [postedIdDraft, setPostedIdDraft] = useState(() => {
    const pathParts = pathname.split("/");
    return pathParts[3] === "new-post" ? "" : pathParts[3];
  });

  const showToast = (message, options = {}) => {
    const toastConfig = {
      position: "top-right",
      autoClose: 3000,

      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    };

    if (options.type === "warning") {
      toast.warn(message, toastConfig);
    } else if (options.type === "error") {
      toast.error(message, toastConfig);
    } else {
      toast.success(message, toastConfig);
    }
  };
  const showSlugError = () => {
    showToast(
      "English Title (Permalink) must not contain special characters such as #, @, &, or *.",
      {
        type: "error",
      }
    );
  };
  const [formData, setFormData] = useState({
    primaryCategory: null,
    additionalCategories: [],
    tags: [],
    credits: [],
    focusKeyphrase: "",
  });

  const [formDataPostEdit, setFormDataPostEdit] = useState({
    title: "",
    slug: "",
    summary: "",
    seo_desc: "",
    banner_image: "",
    banner_desc: "",
    banner_caption: "",
    video: "",
    video_caption: "",
  });

  const [htmlContent, setHtmlContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [edting, setEdting] = useState(false);

  const useDebouncedSubmit = (delay = 900) => {
    const debounceTimeout = useRef(null);

    const debounceSubmit = useCallback(
      (callback) => {
        if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
        debounceTimeout.current = setTimeout(() => {
          callback();
        }, delay);
      },
      [delay]
    );

    return debounceSubmit;
  };

  const debounceSubmit = useDebouncedSubmit();

  // State and handlers
  const htmlContentGrab = (data) => {
    if (htmlContent !== data) {
      setEdting(true);
    }

    setHtmlContent((prev) => {
      const updated = data;
      return updated;
    });
  };

  const htmlJsonGrab = (data) => {
    setEdting(true);

    setWebStory((prev) => {
      const updated = data;
      return updated;
    });
  };

  const handleArticleFromData = (name, value) => {
    setEdting(true);
    setFormDataPostEdit((prev) => {
      const updated = { ...prev, [name]: value };

      return updated;
    });
  };

  const handleChange = (value, field) => {
    setEdting(true);

    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      return updated;
    });
  };

  useEffect(() => {
    if (edting === true) {
      // Only auto-save if we're not editing a published article for the first time
      // If post is published and postedIdDraft equals the published post ID, don't auto-save
      const isEditingPublishedForFirstTime = post && 
        post.published_at_datetime !== null && 
        postedIdDraft === post._id &&
        !post.oldId; // Not already a draft copy

      if (!isEditingPublishedForFirstTime) {
        debounceSubmit(() => submitData("draft"));
      }
    }
  }, [formDataPostEdit, htmlContent, webStory, formData]);

  const fetchDataById = async (apiUrl) => {
    try {
      // Replace the URL with the actual endpoint you're fetching from

      // Make the GET request
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

      // Parse the response data
      const data = await response.json();

      return data; // Return the fetched data if needed
    } catch (error) {
      console.error("Error fetching data:", error);
      // Handle errors, maybe show an error message to the user
    }
  };

  useEffect(() => {
    const initializeData = async () => {
      const parts = pathname.split("/");
      const type = parts[2];
      const id = parts[3];

      if (id === "new-post") {
        // Reset states for a new post
        setWebStory([]);
        setPost(null);
        setHtmlContent("");
        setQuiz_html("")
        setFormData({
          primaryCategory: null,
          additionalCategories: [],
          tags: [],
          credits: [],
          focusKeyphrase: "",
        });
        setFormDataPostEdit({
          title: "",
          slug: "",
          summary: "",
          seo_desc: "",
          banner_image: "",
          banner_desc: "",
          banner_caption: "",
          video: "",
          video_caption: "",
        });
        setPublishAtTime(new Date());
      } else {
        // Fetch data for an existing post
        let requiredData = null;

        if (!requiredData) {
          try {
            const data = await fetchDataById(
              `${process.env.NEXT_PUBLIC_API_URL}/article/${id}`
            );
            if (data && data.article) {
              requiredData = data.article;
              setLive(data.article.isLive && data.article.isLive);
            } else {
              showToast("Data not found", { type: "error" });
              return;
            }
          } catch (error) {
            showToast("Failed to fetch data", { type: "error" });
            console.error("Error fetching data:", error);
            return;
          }
        }

        // Set fetched or locally available data
        setPublishAtTime(
          requiredData.published_at_datetime
            ? requiredData.published_at_datetime
            : requiredData.temp_published_at_datetime || new Date()
        );
        setPost(requiredData);
        setHtmlContent(requiredData.content || "");
        setWebStory(requiredData.web_story || []);
        setFormData({
          primaryCategory: requiredData.primary_category?.[0]
            ? {
                value: requiredData.primary_category[0]._id,
                label: requiredData.primary_category[0].name?.replace(/Ã—/g, "").replace(/×/g, "").trim(),
              }
            : null,
          additionalCategories: requiredData.categories
            ? requiredData.categories.map((cat) => ({
                value: cat._id,
                label: cat.name?.replace(/Ã—/g, "").replace(/×/g, "").trim(),
              }))
            : [],
          tags: requiredData.tags
            ? requiredData.tags.map((t) => ({
                value: t._id,
                label: t.name?.replace(/Ã—/g, "").replace(/×/g, "").trim(),
              }))
            : [],
          credits: requiredData.credits
            ? requiredData.credits.map((credit) => ({
                value: credit._id,
                label: credit.name?.replace(/Ã—/g, "").replace(/×/g, "").trim(),
              }))
            : [],
          focusKeyphrase: requiredData.focusKeyphrase || "",
        });
        setQuiz_html(requiredData?.quiz_html)
        setFormDataPostEdit({
          title: requiredData.title || "",
          slug: requiredData.slug || "",
          summary: requiredData.summary || "",
          seo_desc: requiredData.seo_desc || "",
          banner_image: requiredData.banner_image || "",
          banner_desc: requiredData.banner_desc || "",
          banner_caption: requiredData.banner_caption || "",
          video: requiredData.video || "",
          video_caption: requiredData.video_caption || "",
        });
      }
    };

    if (pathname) {
      initializeData();
    }
  }, [pathname, allPosts]);

  const submitData = async (status) => {
    try {
      setIsSubmitting(true);
      setChnageStatus(status);
      const token = Cookies.get("token");
      if (!token) {
        throw new Error("No token found. Please login again.");
      }

      // Safely get author ID
      let authorId;
      try {
        const storedId =
          typeof window !== "undefined" ? localStorage.getItem("id") : null;
        if (!storedId) return;
        authorId = storedId ? storedId.replace(/^"(.*)"$/, "$1") : null;

        if (!authorId) {
          throw new Error("No author ID found. Please login again.");
        }
      } catch (e) {
        console.error("Error getting author ID:", e);
        throw new Error("Authentication error. Please login again.");
      }

      const transformedData = {
        primary_category: formData.primaryCategory
          ? [formData.primaryCategory.value]
          : [],
        title: formDataPostEdit.title.trim(),
        summary: formDataPostEdit.summary.trim(),
        legacy_url:
          pathname.split("/")[3] === "new-post"
            ? formDataPostEdit.title.trim().toLowerCase().split(" ").join("-")
            : formDataPostEdit.title.trim().toLowerCase().split(" ").join("-"),

        live_blog_updates:
          pathname.split("/")[3] === "new-post" ? [] : post.live_blog_updates,

        tags: formData.tags.map((tag) => tag.value),
        categories: formData.additionalCategories.map((cat) => cat.value),
        video: formDataPostEdit.video.trim(),
        video_caption: formDataPostEdit.video_caption,
        isLive: live,
        banner_desc: formDataPostEdit.banner_desc.trim(),
        banner_image: formDataPostEdit.banner_image.trim(),
        credits: formData.credits.map((credit) => credit.value),
        focusKeyphrase: formData.focusKeyphrase.trim(),
        banner_caption: formDataPostEdit.banner_caption,
        content: htmlContent.trim(),
        quiz_html: quiz_html,
        status: status,

        author: authorId,
        slug: formDataPostEdit.slug.trim().toLowerCase().split(" ").join("-"),
        type:
          pathname.split("/")[2] === "Web%20Story"
            ? "Web Story"
            : pathname.split("/")[2],
        seo_desc: formDataPostEdit.seo_desc.trim(),
      };

      if (status === "published") {
        transformedData.published_at_datetime = new Date();
      }

      if (status === "update") {
        transformedData.published_at_datetime = publishAtTime;
      }
      if (status === "draft" || status === "pending_approval") {
        transformedData.temp_published_at_datetime = publishAtTime;
        transformedData.published_at_datetime = null;
      }

      if (pathname && pathname.split("/")[2] === "Web%20Story") {
        transformedData.web_story = webStory;
      }

      if (status === "draft") {
        let isCreate = postedIdDraft === "";

        transformedData.status = "draft";

        // Check if we're editing a published article
        if (post !== null && post.published_at_datetime !== null) {
          // We're editing a published article - need to create a draft copy
          transformedData.oldId = post._id;
          transformedData.published_at_datetime = null;
          transformedData.status = "draft";
          
          // Only set isCreate to true if we haven't already created a draft for this article
          if (postedIdDraft === "" || postedIdDraft === post._id) {
            isCreate = true;
            // Reset postedIdDraft to empty so we create a new draft
            setPostedIdDraft("");
            
            setPost((pre) => ({
              ...pre,
              published_at_datetime: null,
              status: "draft",
            }));
          }
        }

        const apiUrl = isCreate
          ? `${process.env.NEXT_PUBLIC_API_URL}/article/create`
          : `${process.env.NEXT_PUBLIC_API_URL}/article/update/${postedIdDraft}`;

        const isAnyFieldNonEmpty = Object.entries(transformedData)
          .filter(
            ([key]) => !["author", "status", "type"].includes(key) // Exclude author, status, and type
          )
          .some(
            ([, value]) =>
              value !== "" &&
              value !== null &&
              value !== undefined &&
              !(Array.isArray(value) && value.length === 0)
          );

        if (!isAnyFieldNonEmpty) {
          return; // Prevent server call
        }
        
        const response = await fetch(apiUrl, {
          method: isCreate ? "POST" : "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(transformedData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          toast.error(
            errorData.message || 
            `Failed to ${isCreate ? "create" : "update"} article`
          );
          throw new Error(
            errorData.message ||
              `Failed to ${isCreate ? "create" : "update"} article`
          );
        }

        const responseData = await response.json();
        
        toast.success(
          `Article saved as draft`
        );

        // Update local state with the draft data
        setPublishAtTime(responseData.article.temp_published_at_datetime);
        setPostedIdDraft(responseData.article._id);
        
        // Update the post state to reflect we're now working with a draft
        if (isCreate && responseData.article._id !== post._id) {
          setPost(responseData.article);
          
          // If we created a new draft from a published article, update the URL
          const currentPath = pathname;
          const newPath = currentPath.replace(/\/[^\/]+$/, `/${responseData.article._id}`);
          if (newPath !== currentPath) {
            // Use router.replace to update URL without adding to history
            router.replace(newPath);
          }
        }
      } else {
        if (
          !transformedData.credits.length ||
          !transformedData.primary_category.length ||
          !transformedData.slug.trim() ||
          !transformedData.title.trim()
        ) {
          showToast(
            "Please fill Categories, Primary Category, Slug, and Title properly.",
            {
              type: "warning",
            }
          );
          return;
        } else {
          let isCreate = false;

          if (!validateSlug(transformedData.slug)) {
            showSlugError();
            return; // Stop further execution
          }

          const apiUrl = isCreate
            ? `${process.env.NEXT_PUBLIC_API_URL}/article/create`
            : `${process.env.NEXT_PUBLIC_API_URL}${
                status === "published" || status === "update"
                  ? `/admin/post/publish/${postedIdDraft}`
                  : `/article/update/${postedIdDraft}`
              }`;

          const response = await fetch(apiUrl, {
            method: isCreate ? "POST" : "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(transformedData),
          });
          if (!response.ok) {
            const errorData = await response.json();
            toast.error(
              errorData.message || 
              `Failed to ${isCreate ? "create" : "update"} article`
            );
            throw new Error(
              errorData.message ||
                `Failed to ${isCreate ? "create" : "update"} article`
            );
          }
          
          const uploadPostData = await response.json();
          
          toast.success(
            `Article ${
              status === "draft"
                ? "saved as Draft"
                : status === "published"
                ? "published"
                : status === "update"
                ? "updated"
                : status === "pending_approval"
                ? "sent for approval"
                : "has an unknown status"
            }`
          );
          
          if (
            uploadPostData.article.status === "published" &&
            status === "published"
          ) {
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/send`, {
              method: "POST", // Specify the HTTP method
              headers: {
                "Content-Type": "application/json", // Set the content type to JSON
              },
              body: JSON.stringify({
                title: uploadPostData.article.title, // Pass your title here
                featureImage: `${process.env.NEXT_PUBLIC_API_URL_IMG}/${uploadPostData.article.banner_image}`,
                url:uploadPostData.article.type==="Quiz"?`https://quiz.sportzpoint.com/${uploadPostData.article.primary_category[0].slug}/${uploadPostData.article.slug}` :`${process.env.NEXT_PUBLIC_API_URL_CLIENT}/${uploadPostData.article.primary_category[0].slug}/${uploadPostData.article.slug}`,
                body: uploadPostData.article.summary.slice(0, 55) + "...",
              }),
            })
              .then((response) => response.json()) // Convert the response to JSON
              .then((data) => {
                // Handle the response data here
                console.log("Success:", data);
              })
              .catch((error) => {
                // Handle errors here
                console.error("Error:", error);
              });
          }
        }
      }

      return;
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsSubmitting(false);
      setChnageStatus("");
    }
  };
  console.log("quiz html",quiz_html)
  const renderView = () => {
    return (
      <div className="flex gap-6">
        <div className="w-[70%]">
          <div className="space-y-6">
            <ArticlePostEditComponent
              handleArticleFromData={handleArticleFromData}
              formDataPostEdit={formDataPostEdit}
            />

            {pathname.split("/")[2] === "Quiz" && (
              <div className="bg-gray-100 p-4 rounded-lg shadow-md w-full">
                <label
                  htmlFor="quizInput"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Quiz HTML:
                </label>
                <textarea
                  id="quizInput"
                  value={quiz_html}
                  onChange={(e) => setQuiz_html(e.target.value)}
                  className="w-full h-40 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  placeholder="Enter Quiz HTML..."
                  cols="50" // Adjust as needed
                />
              </div>
            )}

            {pathname.split("/")[2] === "Web%20Story" ? (
              <WebStoryEditor content={webStory} htmlJsonGrab={htmlJsonGrab} />
            ) : (
              <RichTextEditor
                content={htmlContent}
                htmlContentGrab={htmlContentGrab}
              />
            )}

            <RestOfPostEdit formData={formData} handleChange={handleChange} />
          </div>
        </div>

        <div className="w-[30%]">
          <div className="fixed w-[23%] top-[7rem] right-6 bottom-6 overflow-y-auto z-30">
            <SeoScoreModal
              content={htmlContent}
              title={formDataPostEdit.title}
              slug={formDataPostEdit.slug}
              summary={formDataPostEdit.summary}
              seoDesc={formDataPostEdit.seo_desc}
              formData={formData}
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <ToastContainer />
      <div className="flex flex-col min-h-screen">
        {/* Draft Copy Banner */}
        {post && post.oldId && post.status === 'draft' && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  <strong>Editing Draft Copy:</strong> You are editing a draft version of a published article. Changes will not affect the live article until you publish this draft.
                </p>
              </div>
            </div>
          </div>
        )}
        
        <div className="sticky top-0 left-0 right-0 z-40 bg-white border-b border-gray-100 shadow-sm">
          <div className="w-full px-4 sm:px-6 py-3">
            <div className="flex gap-4 justify-between">
              <button
                className="border rounded text-zinc-600 text-sm px-3 flex gap-1 items-center"
                onClick={() => router.back()}
              >
                <IoMdArrowBack /> Back
              </button>
              <div>
                <button
                  disabled={isSubmitting}
                  className={`px-4 py-2 text-sm font-medium transition-colors duration-200 ${
                    isSubmitting
                      ? "text-gray-400 cursor-not-allowed"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                  onClick={() => submitData("draft")}
                >
                  {chnageStatus === "draft" ? (
                    <span className="flex items-center justify-center">
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-400"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Article Saving... As Draft
                    </span>
                  ) : (
                    "Save as Draft"
                  )}
                </button>

                <button
                  disabled={isSubmitting}
                  className={`px-4 py-2 text-sm font-medium transition-colors duration-200 ${
                    isSubmitting
                      ? "text-blue-300 cursor-not-allowed"
                      : "text-blue-600 hover:text-blue-800"
                  }`}
                  onClick={() => submitData("pending_approval")}
                >
                  {chnageStatus === "pending_approval" ? (
                    <span className="flex items-center justify-center">
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-400"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Article Sending... For Approval
                    </span>
                  ) : (
                    "Send for Approval"
                  )}
                </button>

                {typeof window !== "undefined" && 
                 window.localStorage && 
                 (JSON.parse(localStorage.getItem("role"))[0] === "Admin" ||
                  JSON.parse(localStorage.getItem("role"))[0] === "Editor") && (
                  <button
                    disabled={isSubmitting}
                    className={`px-4 py-2 text-sm font-medium transition-colors duration-200 ${
                      isSubmitting
                        ? "text-green-300 cursor-not-allowed"
                        : "text-green-600 hover:text-green-800"
                    }`}
                    onClick={() => submitData("published")}
                  >
                    {chnageStatus === "published" ? (
                      <span className="flex items-center justify-center">
                        <svg
                          className="animate-spin -ml-1 mr-2 h-4 w-4 text-green-400"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Article Publishing...
                      </span>
                    ) : (
                      "Publish"
                    )}
                  </button>
                )}

                <button
                  disabled={isSubmitting}
                  className={`px-4 py-2 text-sm font-medium transition-colors duration-200 ${
                    isSubmitting
                      ? "text-yellow-300 cursor-not-allowed"
                      : "text-yellow-600 hover:text-yellow-800"
                  }`}
                  onClick={() => submitData("update")}
                >
                  {chnageStatus === "update" ? (
                    <span className="flex items-center justify-center">
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-green-400"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Article Updating...
                    </span>
                  ) : (
                    "Update"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="flex-1 p-6">{renderView()}</div>
      </div>
    </>
  );
}

export default ManagePostProperties;
