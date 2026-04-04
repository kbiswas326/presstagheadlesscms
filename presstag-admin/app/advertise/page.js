"use client";

import React, { useEffect, useState } from "react";
import Category from '../../components/advertise/Category'
import Home from '../../components/advertise/Home'
import BlogsAdd from '../../components/advertise/BlogsAdd'
import Cookies from 'js-cookie';
import AllSlug from '../../components/advertise/AllSlug'
import HeadScript from '../../components/advertise/HeadScript'
import RouteGuard from '../../components/RouteGuard';
import { getTenantId } from "../../lib/api";
const Advertise = () => {
  const BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000').replace(/\/api$/, '');
  const [top_nav, setTop_nav] = useState(null);
  const [after_nav, setAfter_nav] = useState(null);
  const [before_home_body, setBefore_home_body] = useState(null);
  const [after_home_body, setAfter_home_body] = useState(null);
  const [before_latest_post, setBefore_latest_post] = useState(null);
  const [after_latest_post, setAfter_latest_post] = useState(null);
  const [before_featured_category, setBefore_featured_category] = useState(null);
  const [after_featured_category, setAfter_featured_category] = useState(null);
  const [categoryAdd, setCategoryAdd] = useState([]);
  const [home_page, setHome_page] = useState(null);
  const [blog_post, setBlog_post] = useState(null);
  const [html_head, setHtml_head] = useState([]);
  const [all_cat_tag, setAll_cat_tag] = useState(null);




  const [editField, setEditField] = useState(null);

  const handleUpdate = async (key, value) => {

    try {
      let updateData = {};
      updateData = { adInserter: { key: value } };
      // Depending on the customization key, format the update data
      switch (key) {
        case "top_nav":
          updateData = { top_nav: value };
          break;
        case "after_nav":
          updateData = { after_nav: value };
          break;
        case "before_home_body":
          updateData = { before_home_body: value };
          break;
        case "after_home_body":
          updateData = { after_home_body: value };
          break;
        case "before_latest_post":
          updateData = { before_latest_post: value };
          break;
        case "after_latest_post":
          updateData = { after_latest_post: value };
          break;
        case "before_featured_category":
          updateData = { before_featured_category: value };
          break;
        case "after_featured_category":
          updateData = { after_featured_category: value };
          break;
        default:
          return;
      }

      // Add token for authentication
      const token = Cookies.get('token');

      // Send a POST request to the backend
      const response = await fetch(`${BASE}/admin/customize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-tenant-id': getTenantId()
        },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        throw new Error('Failed to save customization');
      }

      const result = await response.json();

      // Handle the success response (e.g., update state or show an alert)
      alert('Customization saved successfully!');
      return result;

    } catch (error) {
      console.error('Error saving customization:', error);
      alert('Failed to save customization. Please try again.');
    }
  };


  useEffect(() => {
    const fetchLayoutStructure = async () => {

      try {
        const data = await fetch(`${BASE}/structure`, {
          headers: {
            'x-tenant-id': getTenantId()
          }
        })

        const {
          top_nav,
          after_nav,
          before_home_body,
          after_home_body,
          before_latest_post,
          after_latest_post,
          before_featured_category,
          after_featured_category, category_page, home_page, blog_post, html_head, all_cat_tag } = await data.json();
        setBlog_post(blog_post)
        setHome_page(home_page)
        setCategoryAdd(category_page)
        setTop_nav(top_nav)
        setAfter_nav(after_nav)
        setBefore_home_body(before_home_body)
        setAfter_home_body(after_home_body)
        setBefore_latest_post(before_latest_post)
        setAfter_latest_post(after_latest_post)
        setBefore_featured_category(before_featured_category)
        setAfter_featured_category(after_featured_category)
        setHtml_head(html_head)
        setAll_cat_tag(all_cat_tag)
      } catch (error) {
        console.log(error);

      }

    }
    fetchLayoutStructure()

  }, [])





  const handleDelete = async (key) => {
    try {
      // Prepare the data to send with the key set to null
      let updateData = {};

      // Adjust the structure to match your schema by updating the adInserter field
      switch (key) {
        case "top_nav":
          updateData = { top_nav: null };
          setTop_nav(null)

          break;
        case "after_nav":
          updateData = { after_nav: null };
          setAfter_nav(null)

          break;
        case "before_home_body":
          updateData = { before_home_body: null };
          setBefore_home_body(null)

          break;
        case "after_home_body":
          updateData = { after_home_body: null };
          setAfter_home_body(null)

          break;
        case "before_latest_post":
          updateData = { before_latest_post: null };
          setBefore_latest_post(null)

          break;
        case "after_latest_post":
          updateData = { after_latest_post: null };
          setAfter_latest_post(null)

          break;
        case "before_featured_category":
          updateData = { before_featured_category: null };
          setBefore_featured_category(null)

          break;
        case "after_featured_category":
          updateData = { after_featured_category: null };
          setAfter_featured_category(null)

          break;
        default:
          return;
      }
      const token = Cookies.get('token');

      // Send the updated data to the API route to reset the field
      const response = await fetch(`${BASE}/admin/customize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-tenant-id': getTenantId()
        },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        throw new Error("Failed to delete ad");
      }

      // Optionally update the UI state after the delete operation (you can adjust this based on your app structure)
      // Reset the value in the frontend
      setEditField(null); // Clear any selected edit field

      alert("Ad deleted successfully!");
    } catch (error) {
      console.error("Error deleting ad:", error);
      alert("Failed to delete ad. Please try again.");
    }
  };


  return (
    <>
      <div className="p-4  mx-auto my-10 grid grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-bold mb-4">Manage Advertisements</h2>

          <div className="">
            {[
              { key: "top_nav", state: top_nav, setState: setTop_nav },
              { key: "after_nav", state: after_nav, setState: setAfter_nav },
              { key: "before_home_body", state: before_home_body, setState: setBefore_home_body },
              { key: "after_home_body", state: after_home_body, setState: setAfter_home_body },
              { key: "before_latest_post", state: before_latest_post, setState: setBefore_latest_post },
              { key: "after_latest_post", state: after_latest_post, setState: setAfter_latest_post },
              { key: "before_featured_category", state: before_featured_category, setState: setBefore_featured_category },
              { key: "after_featured_category", state: after_featured_category, setState: setAfter_featured_category },
            ].map(({ key, state, setState }) => (
              <div key={key} className="border p-3 rounded-md shadow-sm flex items-center justify-between">
                {editField === key ? (
                  <input
                    type="text"
                    value={state || ""}
                    onChange={(e) => setState(e.target.value)}
                    className="border p-2 w-full mr-2"
                  />
                ) : (
                  <div className="p-2 bg-gray-100 rounded-md w-full">
                    <strong>{key.replace(/_/g, " ")}:</strong> {state ? state : "No Data"}
                  </div>
                )}

                <div className="flex space-x-2">
                  {editField === key ? (
                    <button
                      onClick={() => { setEditField(null); handleUpdate(key, state) }}
                      className="bg-green-500 text-white px-3 py-1 rounded-md"
                    >
                      Save
                    </button>
                  ) : (
                    <button
                      onClick={() => setEditField(key)}
                      className="bg-blue-500 text-white px-3 py-1 rounded-md"
                    >
                      Edit
                    </button>
                  )}

                  <button
                    onClick={() => handleDelete(key)}
                    className="bg-red-500 text-white px-3 py-1 rounded-md"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div>

          <Category categoryAdd={categoryAdd} />
          <Home home_page={home_page} />

        </div>

      </div>
      <div className="flex ">
        <div className="">

          <HeadScript initialHeadScript={html_head} />
          <AllSlug allSlugs={all_cat_tag} />
        </div>


        <BlogsAdd blog_post={blog_post} />
      </div>
    </>
  );
};

const Page = () => {
  return (
    <RouteGuard requiredRole="Admin">
      <Advertise />
    </RouteGuard>
  );
};

export default Page;
