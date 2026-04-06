const { connectDB, getDB } = require('../config/db');

async function main() {
  const tenant = process.argv[2] || 'sportzpoint';
  const slug = process.argv[3];
  if (!slug) {
    console.error('Usage: node scripts/inspect-post-types.js <tenant> <slug>');
    process.exit(1);
  }

  await connectDB();
  const db = getDB(tenant);
  const post = await db.collection('posts').findOne({ slug });
  if (!post) {
    console.error('Post not found');
    process.exit(1);
  }

  const typeOf = (v) => {
    if (v === null) return 'null';
    if (v === undefined) return 'undefined';
    if (Array.isArray(v)) return 'array';
    return typeof v;
  };

  const ctor = (v) => {
    if (v === null || v === undefined) return null;
    if (Array.isArray(v)) return 'Array';
    return v?.constructor?.name || null;
  };

  const sampleArr = (arr) => {
    if (!Array.isArray(arr) || arr.length === 0) return null;
    const v = arr[0];
    return { type: typeOf(v), ctor: ctor(v), value: v };
  };

  console.log(JSON.stringify({
    slug: post.slug,
    author: { type: typeOf(post.author), ctor: ctor(post.author), value: post.author },
    authors: { type: typeOf(post.authors), ctor: ctor(post.authors), sample: sampleArr(post.authors) },
    editor: { type: typeOf(post.editor), ctor: ctor(post.editor), value: post.editor },
    primary_category: { type: typeOf(post.primary_category), ctor: ctor(post.primary_category), sample: sampleArr(post.primary_category) },
    categories: { type: typeOf(post.categories), ctor: ctor(post.categories), sample: sampleArr(post.categories) },
  }, null, 2));

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
