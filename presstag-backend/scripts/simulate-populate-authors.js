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
    console.error('Usage: node scripts/simulate-populate-authors.js <tenant> <slug>');
    process.exit(1);
  }

  await connectDB();
  const db = getDB(tenant);
  const post = await db.collection('posts').findOne({ slug });
  if (!post) {
    console.error('Post not found');
    process.exit(1);
  }

  let author = null;
  const rawAuthor = post.author || post.authorId || post.userId || post.createdBy;
  if (rawAuthor) {
    const authorId = toObjectId(rawAuthor);
    if (authorId) {
      author = await db.collection('users').findOne({ _id: authorId }, { projection: { password: 0 } });
    } else if (typeof rawAuthor === 'string') {
      author = await db.collection('users').findOne({ slug: rawAuthor }, { projection: { password: 0 } });
    }
  }

  const rawAuthors = Array.isArray(post.authors) ? post.authors : [];
  const authorIds = rawAuthors.map((v) => toObjectId(v)).filter(Boolean);
  const authors = authorIds.length > 0
    ? await db.collection('users').find({ _id: { $in: authorIds } }, { projection: { password: 0 } }).toArray()
    : [];

  const primaryAuthorId = author ? String(author._id) : (rawAuthor ? String(rawAuthor._id || rawAuthor) : '');
  const authorById = new Map(authors.map((u) => [String(u._id), u]));
  const orderedAuthors = authorIds.map((id) => authorById.get(String(id))).filter(Boolean);

  const mergedAuthors = orderedAuthors.length > 0
    ? (
        primaryAuthorId
          ? [
              ...(authorById.get(primaryAuthorId) ? [authorById.get(primaryAuthorId)] : (author ? [author] : [])),
              ...orderedAuthors.filter((u) => String(u._id) !== String(primaryAuthorId)),
            ]
          : orderedAuthors
      )
    : (author ? [author] : []);

  let editor = null;
  const rawEditor = post.editor || post.editorId;
  if (rawEditor) {
    const editorId = toObjectId(rawEditor);
    if (editorId) {
      editor = await db.collection('users').findOne({ _id: editorId }, { projection: { password: 0 } });
    }
  }

  if (editor && author && String(editor._id) === String(author._id)) editor = null;

  const summarize = (u) => (u ? { _id: String(u._id), name: u.name } : null);

  console.log(JSON.stringify({
    slug: post.slug,
    stored: {
      author: post.author,
      authors: post.authors,
      editor: post.editor,
      editorName: post.editorName,
      authorName: post.authorName,
    },
    populated: {
      author: summarize(author),
      authors: mergedAuthors.map(summarize),
      editor: summarize(editor),
    },
    types: {
      mergedAuthors0: mergedAuthors[0]?.constructor?.name || null,
      editor: editor?.constructor?.name || null,
    },
  }, null, 2));

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
