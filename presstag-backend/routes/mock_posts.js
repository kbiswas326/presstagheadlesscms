const MOCK_POSTS = [
    {
        _id: "6764582f3c3a4b001e3b5a1a",
        title: "Five Youngsters to Watch Out for in Cricket in 2026",
        slug: "five-youngsters-to-watch-out-for-in-cricket-in-2026",
        summary: "As the cricketing world evolves, a new generation of talent is ready to take center stage. From explosive batters to lethal bowlers, here are five youngsters who are destined for greatness in 2026.",
        content: `
            <p>The game of cricket is constantly evolving, and with every passing year, new stars emerge to capture the imagination of fans worldwide. As we look ahead to 2026, several young talents have shown immense promise and are poised to become household names.</p>
            <h3>1. The Next Batting Sensation</h3>
            <p>Hailing from India, this 19-year-old prodigy has already broken records in domestic cricket. With impeccable technique and a hunger for runs, he is being touted as the next big thing in world cricket.</p>
            <h3>2. The Speed Merchant</h3>
            <p>A tearaway pacer from Australia, clocking 150kmph consistently. His raw pace and ability to swing the ball both ways make him a nightmare for batsmen.</p>
            <h3>3. The Spin Wizard</h3>
            <p>From the dust bowls of the subcontinent, a mystery spinner has emerged. His variations are unreadable, and he has already baffled some of the best in the business.</p>
            <h3>4. The All-Round Dynamo</h3>
            <p>England has produced a gem who can smash the ball out of the park and pick up crucial wickets. A true match-winner in the making.</p>
            <h3>5. The Wicketkeeping Marvel</h3>
            <p>Sharp behind the stumps and explosive in front of them, this South African youngster is redefining the role of a wicketkeeper-batter.</p>
            <p>Keep an eye on these names as they are set to light up the cricketing world in 2026!</p>
        `,
        featuredImage: {
            url: "https://images.unsplash.com/photo-1531415074968-036ba1b575da?q=80&w=1000&auto=format&fit=crop",
            caption: "Cricket - The Gentleman's Game"
        },
        status: "published",
        publishedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        author: { _id: "mock_author_1", name: "SportzPoint Desk", email: "editor@sportzpoint.com" },
        categories: [{ _id: "mock_cat_1", name: "Cricket", slug: "cricket" }],
        tags: [{ _id: "mock_tag_1", name: "Future Stars", slug: "future-stars" }, { _id: "mock_tag_2", name: "Analysis", slug: "analysis" }],
        ai_pointers: [
            "A new generation of cricket stars is set to dominate by 2026, featuring talents from India, Australia, and England.",
            "Key players to watch include a 19-year-old Indian batting prodigy and a 150kmph Australian speedster.",
            "Spin bowling continues to evolve with a mystery spinner from the subcontinent baffling top batsmen.",
            "Wicketkeeper-batters are redefining the role, with a South African youngster leading the charge."
        ]
    },
    {
        _id: "6764582f3c3a4b001e3b5a1b",
        title: "Results of Every ICC Women's T20 World Cup",
        slug: "results-of-every-icc-women-s-t20-world-cup",
        summary: "A comprehensive list of winners and runners-up from every edition of the ICC Women's T20 World Cup.",
        content: `
            <p>The ICC Women's T20 World Cup has seen some thrilling contests over the years. Here is the list of winners from every edition.</p>
            <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse mt-4">
            <thead>
            <tr class="bg-gray-100">
            <th class="border-b p-3 font-bold">Year</th>
            <th class="border-b p-3 font-bold">Winner</th>
            <th class="border-b p-3 font-bold">Runner-up</th>
            <th class="border-b p-3 font-bold">Venue</th>
            </tr>
            </thead>
            <tbody>
            <tr class="hover:bg-gray-50">
            <td class="p-3 border-b">2009</td>
            <td class="p-3 border-b">England</td>
            <td class="p-3 border-b">New Zealand</td>
            <td class="p-3 border-b">England</td>
            </tr>
            <tr class="hover:bg-gray-50">
            <td class="p-3 border-b">2010</td>
            <td class="p-3 border-b">Australia</td>
            <td class="p-3 border-b">New Zealand</td>
            <td class="p-3 border-b">West Indies</td>
            </tr>
            <tr class="hover:bg-gray-50">
            <td class="p-3 border-b">2012</td>
            <td class="p-3 border-b">Australia</td>
            <td class="p-3 border-b">England</td>
            <td class="p-3 border-b">Sri Lanka</td>
            </tr>
            <tr class="hover:bg-gray-50">
            <td class="p-3 border-b">2014</td>
            <td class="p-3 border-b">Australia</td>
            <td class="p-3 border-b">England</td>
            <td class="p-3 border-b">Bangladesh</td>
            </tr>
            <tr class="hover:bg-gray-50">
            <td class="p-3 border-b">2016</td>
            <td class="p-3 border-b">West Indies</td>
            <td class="p-3 border-b">Australia</td>
            <td class="p-3 border-b">India</td>
            </tr>
            <tr class="hover:bg-gray-50">
            <td class="p-3 border-b">2018</td>
            <td class="p-3 border-b">Australia</td>
            <td class="p-3 border-b">England</td>
            <td class="p-3 border-b">West Indies</td>
            </tr>
            <tr class="hover:bg-gray-50">
            <td class="p-3 border-b">2020</td>
            <td class="p-3 border-b">Australia</td>
            <td class="p-3 border-b">India</td>
            <td class="p-3 border-b">Australia</td>
            </tr>
            <tr class="hover:bg-gray-50">
            <td class="p-3 border-b">2023</td>
            <td class="p-3 border-b">Australia</td>
            <td class="p-3 border-b">South Africa</td>
            <td class="p-3 border-b">South Africa</td>
            </tr>
            <tr class="hover:bg-gray-50">
            <td class="p-3 border-b">2024</td>
            <td class="p-3 border-b">New Zealand</td>
            <td class="p-3 border-b">South Africa</td>
            <td class="p-3 border-b">UAE</td>
            </tr>
            </tbody>
            </table>
            </div>
        `,
        featuredImage: {
            url: "https://images.unsplash.com/photo-1624194092873-199672688b50?q=80&w=1000&auto=format&fit=crop",
            caption: "New Zealand Women's Team celebrating their T20 World Cup 2024 victory"
        },
        status: "published",
        publishedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        author: { _id: "mock_author_1", name: "SportzPoint Desk", email: "editor@sportzpoint.com" },
        categories: [{ _id: "mock_cat_1", name: "Cricket", slug: "cricket" }, { _id: "mock_cat_2", name: "Women's Cricket", slug: "womens-cricket" }],
        tags: [{ _id: "mock_tag_3", name: "T20 World Cup", slug: "t20-world-cup" }, { _id: "mock_tag_4", name: "ICC", slug: "icc" }, { _id: "mock_tag_5", name: "Records", slug: "records" }],
        ai_pointers: []
    }
];

module.exports = MOCK_POSTS;