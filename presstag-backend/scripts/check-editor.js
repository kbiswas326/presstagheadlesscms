const { connectDB, getDB } = require('../config/db');

async function main() {
  const tenant = process.argv[2] || process.env.TENANT || 'sportzpoint';
  await connectDB();
  const db = getDB(tenant);
  const posts = await db
    .collection('posts')
    .find({ editor: { $ne: null } })
    .sort({ updatedAt: -1 })
    .limit(10)
    .project({ slug: 1, editor: 1, editorName: 1, author: 1, authorName: 1, authors: 1, status: 1 })
    .toArray();

  const rows = posts.map((p) => ({
    slug: p.slug,
    status: p.status,
    authorName: p.authorName,
    author: String(p.author || ''),
    editorName: p.editorName,
    editor: String(p.editor || ''),
    authors: Array.isArray(p.authors) ? p.authors.map((a) => String(a)) : [],
  }));

  console.log(JSON.stringify({ tenant, count: rows.length, rows }, null, 2));
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
