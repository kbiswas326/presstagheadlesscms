const { ObjectId } = require('mongodb');
const { connectDB, getDB } = require('../config/db');

const toObjectId = (value) => {
  if (!value) return null;
  if (value instanceof ObjectId) return value;
  if (typeof value === 'string' && ObjectId.isValid(value)) return new ObjectId(value);
  if (typeof value === 'object') {
    const candidate = value._id || value.id;
    if (candidate instanceof ObjectId) return candidate;
    if (typeof candidate === 'string' && ObjectId.isValid(candidate)) return new ObjectId(candidate);
  }
  return null;
};

async function main() {
  const tenant = process.argv[2] || 'sportzpoint';
  const slug = process.argv[3];
  if (!slug) {
    console.error('Usage: node scripts/debug-populate-post.js <tenant> <slug>');
    process.exit(1);
  }

  await connectDB();
  const db = getDB(tenant);
  const post = await db.collection('posts').findOne({ slug });
  if (!post) {
    console.error('Post not found');
    process.exit(1);
  }

  const editorId = toObjectId(post.editor);
  const authorId = toObjectId(post.author);
  const authorDoc = authorId ? await db.collection('users').findOne({ _id: authorId }, { projection: { password: 0 } }) : null;
  const editorDoc = editorId ? await db.collection('users').findOne({ _id: editorId }, { projection: { password: 0 } }) : null;

  const rawAuthors = Array.isArray(post.authors) ? post.authors : [];
  const authorIds = rawAuthors.map((v) => toObjectId(v)).filter(Boolean);
  const authorDocs = authorIds.length > 0
    ? await db.collection('users').find({ _id: { $in: authorIds } }, { projection: { password: 0 } }).toArray()
    : [];

  console.log(JSON.stringify({
    tenant,
    slug: post.slug,
    stored: {
      author: post.author,
      authors: post.authors,
      editor: post.editor,
      authorName: post.authorName,
      editorName: post.editorName,
    },
    resolvedIds: {
      authorId: authorId ? String(authorId) : null,
      editorId: editorId ? String(editorId) : null,
      authorIds: authorIds.map((id) => String(id)),
    },
    lookedUp: {
      authorFound: !!authorDoc,
      authorName: authorDoc?.name || null,
      editorFound: !!editorDoc,
      editorName: editorDoc?.name || null,
      authorsFound: authorDocs.map((u) => ({ _id: String(u._id), name: u.name })),
    },
  }, null, 2));
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
