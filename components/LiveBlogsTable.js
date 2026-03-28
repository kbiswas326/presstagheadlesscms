'use client';

import React, { useState, useEffect } from 'react';
import { IoAddCircleOutline } from 'react-icons/io5';
import { BsStopCircle } from 'react-icons/bs';
import { FiClock } from 'react-icons/fi';
import Cookies from 'js-cookie';
import useAllPostDataStore from '../store/useAllPostDataStore';
import { formatDate } from "../utils/timeFormat";

import { RiLiveFill } from "react-icons/ri";

const LiveBlogsTable = ({ liveBlogIdpas, liveBlogId }) => {
  const { fetchLiveBlogs, liveBlogs,customiseLivePostData } = useAllPostDataStore();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        await fetchLiveBlogs(`${process.env.NEXT_PUBLIC_API_URL}/posts/live/all`);
      } catch (error) {
        console.error('Error fetching live blogs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBlogs();
  }, [fetchLiveBlogs]);

  useEffect(() => {
    setArticles(liveBlogs);
  }, [liveBlogs]);

  const handleToggle = async (id) => {
    const token = Cookies.get('token');
    if (!token) {
      alert('Unauthorized. Please log in.');
      return;
    }

    const data = { isLive: false };
    try {
      const url = `${process.env.NEXT_PUBLIC_API_URL}/article/update/${id}`;
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        customiseLivePostData("Delete", id);
        setArticles((prevArticles) => prevArticles.filter((a) => a._id !== id));
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Failed to update article.');
      }
    } catch (error) {
      console.error('Error updating article:', error);
    }
  };

  const formatDate = (date) => {
    return date ? new Date(date).toLocaleString() : 'Unknown';
  };

  return (
    <div className="bg-white rounded-lg shadow mb-6 p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Live Content</h2>
        <button className="ml-4 p-2 hover:bg-gray-100 rounded-full">
          <IoAddCircleOutline className="h-5 w-5 text-blue-600" />
        </button>
      </div>

      {loading ? (
        <div className="text-center text-gray-500">Loading...</div>
      ) : articles.length === 0 ? (
        <div className="text-center text-gray-500">No live blogs available.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Timeline
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {articles.map((article) => (
                <tr key={article._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {article.title?.slice(0, 50) || 'Untitled'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      {formatDate(article.updatedAt || article.createdAt)}
                      {formatDate.isLive}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                    <div className="flex justify-end space-x-2">

                      <button
                        className="p-2 hover:bg-gray-100 rounded-full text-red-600"
                        onClick={() => handleToggle(article._id)}
                      >
                        <BsStopCircle className="h-4 w-4" />
                      </button>


                      <button
                        className={`p-2 hover:bg-gray-100 rounded-full ${liveBlogId === article._id ? 'text-red-600' : 'text-zinc-400'} `}
                        onClick={() => liveBlogIdpas(article._id)}
                      >
                        <RiLiveFill />
                      </button>



                    </div>

                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default LiveBlogsTable;
