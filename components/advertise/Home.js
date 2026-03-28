"use client";

import React, { useState, useEffect } from "react";
import Cookies from 'js-cookie';

const Home = ({ home_page }) => {
    const [homePageData, setHomePageData] = useState({
        article_card: {
            before: "",
            after: "",
        },
        card_add: [],
    });

    const [editArticleCard, setEditArticleCard] = useState(false);
    const [editCardAdd, setEditCardAdd] = useState(null); // To track the index of the card add being edited

    // Set the initial state when the page is rendered
    useEffect(() => {
        setHomePageData(home_page); // Initialize with the prop data
    }, [home_page]);

    const handleEditArticleCard = async() => {
        setEditArticleCard(!editArticleCard); // Toggle the edit mode
    };

    // Update article card sections (before/after)
    const handleUpdateArticleCard = (key, value) => {
        setHomePageData((prevData) => ({
            ...prevData,
            article_card: {
                ...prevData.article_card,
                [key]: value,
            },
        }));
    };

    // Add new card ad
    const handleAddCardAd = () => {
        setHomePageData((prevData) => ({
            ...prevData,
            card_add: [
                ...prevData.card_add,
                {
                    sectionPosition: null,
                    article_card: {
                        position: null,
                    },
                    ad_content: "", // Initialize the new ad_content
                },
            ],
        }));
    };

    // Update card ad details
    const handleUpdateCardAd = (index, key, value) => {
        const updatedCardAdd = [...homePageData.card_add];
        updatedCardAdd[index][key] = value;
        setHomePageData((prevData) => ({
            ...prevData,
            card_add: updatedCardAdd,
        }));
    };

    // Delete a specific card ad with backend sync
    const handleDeleteCardAd = async (index) => {
        const token = Cookies.get('token');
        const updatedCardAdd = homePageData.card_add.filter((_, i) => i !== index);

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/customize`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    home_page: {
                        ...homePageData,
                        card_add: updatedCardAdd
                    }
                })
            });

            if (!response.ok) {
                throw new Error("Failed to delete card ad");
            }

            setHomePageData((prevData) => ({
                ...prevData,
                card_add: updatedCardAdd
            }));

            alert('Card Ad deleted successfully!');
        } catch (error) {
            console.error("Error deleting card ad", error);
            alert('Failed to delete card ad. Please try again.');
        }
    };

    // Save all data with comprehensive backend interaction
    const handleSaveAll = async () => {
        const token = Cookies.get('token');
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/customize`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    home_page: {
                        article_card: homePageData.article_card,
                        card_add: homePageData.card_add
                    }
                })
            });

            if (!response.ok) {
                throw new Error("Failed to save home page ads");
            }

            const data = await response.json();
            alert('Home Page Ads saved successfully!');
            // Optionally update state with backend response
            setHomePageData(data.home_page || homePageData);
        } catch (error) {
            console.error("Error saving home page ads", error);
            alert('Failed to save home page ads. Please try again.');
        }
    };

    // Reset to original data from prop
    const handleResetAll = () => {
        setHomePageData(home_page || {
            article_card: {
                before: null,
                after: null,
            },
            card_add: [],
        });
    };

    return (
        <div className="p-4 max-w-3xl mx-auto">
           

            {/* Article Card Section */}
            <div className="border p-3 rounded-md shadow-sm mb-4">
                <h3 className="font-semibold">Article Card Ads</h3>
                {editArticleCard ? (
                    <>
                        <input
                            type="text"
                            value={homePageData.article_card.before}
                            onChange={(e) => handleUpdateArticleCard("before", e.target.value)}
                            className="border p-2 w-full my-2"
                            placeholder="Before Article Ad"
                        />
                        <input
                            type="text"
                            value={homePageData.article_card.after}
                            onChange={(e) => handleUpdateArticleCard("after", e.target.value)}
                            className="border p-2 w-full my-2"
                            placeholder="After Article Ad"
                        />
                        <button
                            onClick={()=>{handleEditArticleCard();handleSaveAll()}}
                            className="bg-green-500 text-white px-4 py-2 rounded-md mt-2"
                        >
                            Save
                        </button>
                    </>
                ) : (
                    <>
                        <p><strong>Before:</strong> {homePageData?.article_card.before}</p>
                        <p><strong>After:</strong> {homePageData?.article_card.after}</p>
                        <button
                            onClick={()=>setEditArticleCard(!editArticleCard)}
                            className="bg-blue-500 text-white px-4 py-2 rounded-md mt-2"
                        >
                            Edit
                        </button>
                    </>
                )}
            </div>

            {/* Card Add Section */}
            <div className="mt-4">
                <h3 className="font-semibold">Card Add Ads</h3>
                {homePageData?.card_add.map((card, index) => (
                    <div
                        key={index}
                        className="border p-3 rounded-md shadow-sm mb-2 flex items-center space-x-2"
                    >
                        {editCardAdd === index ? (
                            <>
                                <input
                                    type="number"
                                    value={card.sectionPosition}
                                    onChange={(e) => handleUpdateCardAd(index, "sectionPosition", Number(e.target.value))}
                                    className="border p-2 w-1/4"
                                    placeholder="Section Position"
                                />
                                <input
                                    type="number"
                                    value={card.article_card.position}
                                    onChange={(e) =>
                                        handleUpdateCardAd(index, "article_card", {
                                            ...card.article_card,
                                            position: Number(e.target.value),
                                        })
                                    }
                                    className="border p-2 w-1/4"
                                    placeholder="Article Card Position"
                                />
                                <textarea
                                    value={card.ad_content}
                                    onChange={(e) => handleUpdateCardAd(index, "ad_content", e.target.value)}
                                    className="border p-2 w-full my-2"
                                    placeholder="Ad Content"
                                />
                                <button
                                    onClick={() => {setEditCardAdd(null);handleSaveAll()}}
                                    className="bg-green-500 text-white px-3 py-1 rounded-md"
                                >
                                    Save
                                </button>
                            </>
                        ) : (
                            <>
                                <p><strong>Section Position:</strong> {card.sectionPosition}</p>
                                <p><strong>Article Card Position:</strong> {card.article_card.position}</p>
                                <p><strong>Ad Content:</strong> {card.ad_content}</p>
                                <button
                                    onClick={() => setEditCardAdd(index)}
                                    className="bg-blue-500 text-white px-3 py-1 rounded-md"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => handleDeleteCardAd(index)}
                                    className="bg-red-500 text-white px-3 py-1 rounded-md"
                                >
                                    Delete
                                </button>
                            </>
                        )}
                    </div>
                ))}
                <button
                    onClick={handleAddCardAd}
                    className="bg-blue-500 text-white px-4 py-2 rounded-md mt-2"
                >
                    + Add Card Ad
                </button>
            </div>
        </div>
    );
};

export default Home;
