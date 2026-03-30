/// Run this ONCE to seed your PressTag database with starter data
/// Command: node seed-data.js
/// Then DELETE this file after running

require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');

const MONGO_URI = process.env.MONGO_URI;

const categories = [
  { name: 'Cricket', slug: 'cricket', description: 'Cricket news and updates' },
  { name: 'Football', slug: 'football', description: 'Football news and updates' },
  { name: 'Basketball', slug: 'basketball', description: 'Basketball news and updates' },
  { name: 'Tennis', slug: 'tennis', description: 'Tennis news and updates' },
  { name: 'Breaking News', slug: 'breaking-news', description: 'Latest breaking news' },
];

const tags = [
  { name: 'IPL', slug: 'ipl' },
  { name: 'World Cup', slug: 'world-cup' },
  { name: 'Live Score', slug: 'live-score' },
  { name: 'Match Report', slug: 'match-report' },
  { name: 'Interview', slug: 'interview' },
  { name: 'Analysis', slug: 'analysis' },
];

async function seedData() {
  if (!MONGO_URI) {
    console.error('❌ MONGO_URI not found in .env');
    process.exit(1);
  }

  const client = new MongoClient(MONGO_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db('presstag');

    // ── Seed Categories ──────────────────────────────
    const existingCats = await db.collection('categories').countDocuments();
    if (existingCats > 0) {
      console.log(`⚠️  Categories already exist (${existingCats}), skipping...`);
    } else {
      const catDocs = categories.map(c => ({
        ...c,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));
      await db.collection('categories').insertMany(catDocs);
      console.log(`✅ Inserted ${catDocs.length} categories`);
    }

    // ── Seed Tags ────────────────────────────────────
    const existingTags = await db.collection('tags').countDocuments();
    if (existingTags > 0) {
      console.log(`⚠️  Tags already exist (${existingTags}), skipping...`);
    } else {
      const tagDocs = tags.map(t => ({
        ...t,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));
      await db.collection('tags').insertMany(tagDocs);
      console.log(`✅ Inserted ${tagDocs.length} tags`);
    }

    // ── Seed Test Posts ──────────────────────────────
    const existingPosts = await db.collection('posts').countDocuments();
    if (existingPosts > 0) {
      console.log(`⚠️  Posts already exist (${existingPosts}), skipping...`);
    } else {
      // Get the user and cricket category we just created
      const adminUser = await db.collection('users').findOne({ role: 'admin' });
      const cricketCat = await db.collection('categories').findOne({ slug: 'cricket' });
      const footballCat = await db.collection('categories').findOne({ slug: 'football' });
      const iplTag = await db.collection('tags').findOne({ slug: 'ipl' });
      const matchTag = await db.collection('tags').findOne({ slug: 'match-report' });

      const testPosts = [
        {
          title: 'India wins the Test series against Australia',
          slug: 'india-wins-test-series-australia',
          type: 'article',
          status: 'published',
          content: '<p>India clinched the Test series against Australia with a dominant performance.</p>',
          excerpt: 'India clinched the Test series against Australia.',
          categories: cricketCat ? [cricketCat._id] : [],
          tags: iplTag ? [iplTag._id] : [],
          authorName: adminUser?.name || 'Admin',
          authorId: adminUser?._id || null,
          featuredImage: null,
          publishedAt: new Date(),
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(),
        },
        {
          title: 'IPL 2025 Auction: Key players and their prices',
          slug: 'ipl-2025-auction-key-players',
          type: 'article',
          status: 'published',
          content: '<p>The IPL 2025 auction saw some surprising bids and big buys.</p>',
          excerpt: 'IPL 2025 auction highlights and analysis.',
          categories: cricketCat ? [cricketCat._id] : [],
          tags: matchTag ? [matchTag._id] : [],
          authorName: adminUser?.name || 'Admin',
          authorId: adminUser?._id || null,
          featuredImage: null,
          publishedAt: new Date(),
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(),
        },
        {
          title: 'Premier League: Manchester City vs Arsenal preview',
          slug: 'premier-league-man-city-arsenal-preview',
          type: 'article',
          status: 'pending',
          content: '<p>A massive clash awaits as Manchester City host Arsenal this weekend.</p>',
          excerpt: 'Preview of the Manchester City vs Arsenal clash.',
          categories: footballCat ? [footballCat._id] : [],
          tags: matchTag ? [matchTag._id] : [],
          authorName: adminUser?.name || 'Admin',
          authorId: adminUser?._id || null,
          featuredImage: null,
          createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
          updatedAt: new Date(),
        },
        {
          title: 'Draft: Upcoming cricket season preview',
          slug: 'draft-cricket-season-preview',
          type: 'article',
          status: 'draft',
          content: '<p>Work in progress — upcoming cricket season analysis.</p>',
          excerpt: 'Draft preview of the cricket season.',
          categories: cricketCat ? [cricketCat._id] : [],
          tags: [],
          authorName: adminUser?.name || 'Admin',
          authorId: adminUser?._id || null,
          featuredImage: null,
          createdAt: new Date(Date.now() - 30 * 60 * 1000),
          updatedAt: new Date(),
        },
      ];

      await db.collection('posts').insertMany(testPosts);
      console.log(`✅ Inserted ${testPosts.length} test posts`);
    }

    // ── Summary ──────────────────────────────────────
    const finalCats = await db.collection('categories').countDocuments();
    const finalTags = await db.collection('tags').countDocuments();
    const finalPosts = await db.collection('posts').countDocuments();

    console.log('');
    console.log('🎉 Seed complete!');
    console.log('─────────────────────────────');
    console.log(`   Categories : ${finalCats}`);
    console.log(`   Tags       : ${finalTags}`);
    console.log(`   Posts      : ${finalPosts}`);
    console.log('─────────────────────────────');
    console.log('✅ Refresh your dashboard to see real data!');
    console.log('⚠️  Delete seed-data.js after use!');

  } catch (err) {
    console.error('❌ Seed failed:', err.message);
  } finally {
    await client.close();
  }
}

seedData();