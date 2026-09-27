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
