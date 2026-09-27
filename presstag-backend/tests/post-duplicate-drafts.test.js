const test = require('node:test');
const assert = require('node:assert/strict');
const { ObjectId } = require('mongodb');

const dbPath = require.resolve('../config/db');
const liveId = new ObjectId();

const mockDb = {
  collection: (name) => {
    if (name === 'users') {
      return {
        findOne: async ({ _id }) => ({ _id, name: 'Author' }),
        find: async () => ({ toArray: async () => [] }),
      };
    }

    if (name !== 'posts') {
      return {
        findOne: async () => null,
        find: async () => ({ toArray: async () => [] }),
      };
    }

    const insertOne = async (doc) => ({ insertedId: doc._id || new ObjectId() });
    const updateOne = async (filter, update) => ({ matchedCount: 1, ...update });
    const findOne = async (query) => {
      if (query && query.oldId && query.status === 'draft') {
        return {
          _id: new ObjectId(),
          oldId: liveId,
          status: 'draft',
          title: 'Existing draft copy',
          slug: 'existing-draft-copy',
        };
      }
      return null;
    };

    return {
      insertOne,
      updateOne,
      findOne,
      find: async () => ({ toArray: async () => [] }),
      findOneAndUpdate: async (filter, update, options) => ({
        value: { ...filter, ...update.$set, _id: filter._id },
      }),
    };
  },
};

require.cache[dbPath] = {
  id: dbPath,
  filename: dbPath,
  loaded: true,
  exports: { getDB: () => mockDb },
};

const Post = require('../models/Post');

test('create reuses an existing draft copy for a published article instead of inserting a duplicate', async () => {
  const existingDraft = {
    _id: new ObjectId(),
    oldId: liveId,
    status: 'draft',
    title: 'Existing draft copy',
    slug: 'existing-draft-copy',
  };

  mockDb.collection = (name) => {
    if (name === 'users') {
      return {
        findOne: async ({ _id }) => ({ _id, name: 'Author' }),
        find: async () => ({ toArray: async () => [] }),
      };
    }

    if (name !== 'posts') {
      return {
        findOne: async () => null,
        find: async () => ({ toArray: async () => [] }),
      };
    }

    return {
      insertOne: async () => {
        throw new Error('should not insert a new draft copy');
      },
      updateOne: async (filter, update) => {
        assert.deepEqual(filter, { _id: existingDraft._id });
        assert.ok(update.$set);
        return { matchedCount: 1 };
      },
      findOne: async (query) => {
        if (query && query.oldId && query.status === 'draft') {
          return existingDraft;
        }
        if (query && query._id) {
          return { _id: query._id, oldId: liveId, status: 'draft', title: 'Existing draft copy', slug: 'existing-draft-copy' };
        }
        return null;
      },
      find: async () => ({ toArray: async () => [] }),
      findOneAndUpdate: async (filter, update, options) => ({
        value: { ...filter, ...update.$set },
      }),
    };
  };

  const result = await Post.create({
    title: 'Updated article',
    slug: 'updated-article',
    status: 'draft',
    oldId: liveId,
    author: new ObjectId(),
    primary_category: [],
    categories: [],
    tags: [],
    seo: { metaTitle: 'Updated article' },
    type: 'article',
  });

  assert.equal(result._id.toString(), existingDraft._id.toString());
  assert.equal(result.oldId.toString(), liveId.toString());
});

test('publishing a draft copy updates the original live article instead of creating a new published copy', async () => {
  const draftId = new ObjectId();
  const publishedId = liveId;

  mockDb.collection = (name) => {
    if (name === 'users') {
      return {
        findOne: async () => null,
        find: async () => ({ toArray: async () => [] }),
      };
    }

    if (name !== 'posts') {
      return {
        findOne: async () => null,
        find: async () => ({ toArray: async () => [] }),
      };
    }

    return {
      findOne: async (query) => {
        if (query && query._id && String(query._id) === String(draftId)) {
          return {
            _id: draftId,
            title: 'Draft copy',
            slug: 'draft-copy',
            status: 'draft',
            oldId: publishedId,
          };
        }
        if (query && query._id && String(query._id) === String(publishedId)) {
          return {
            _id: publishedId,
            title: 'Original live article',
            slug: 'original-live-article',
            status: 'published',
            oldId: null,
          };
        }
        return null;
      },
      findOneAndUpdate: async (filter, update) => ({
        value: { ...filter, ...update.$set, _id: publishedId, status: 'published' },
      }),
      deleteOne: async (filter) => {
        assert.equal(String(filter._id), String(draftId));
        return { deletedCount: 1 };
      },
      find: async () => ({ toArray: async () => [] }),
      updateOne: async () => ({ matchedCount: 1 }),
      insertOne: async () => ({ insertedId: new ObjectId() }),
    };
  };

  const result = await Post.update(draftId.toString(), {
    title: 'Updated published article',
    slug: 'updated-published-article',
    status: 'published',
    oldId: publishedId,
  });

  assert.equal(String(result._id), String(publishedId));
  assert.equal(result.status, 'published');
});
