
export function getEditPath(post) {
  const map = {
    article: 'article',
    video: 'video',
    'live-blog': 'live-blog',
    'photo-gallery': 'photo-gallery',
    'web-story': 'web-story',
  };

  console.log('🔍 getEditPath called with post:', post);
  console.log('   post._id:', post?._id);
  console.log('   post.type:', post?.type);
  console.log('   Map keys:', Object.keys(map));
  console.log('   post.type in map?', map[post?.type]);

  if (!post?._id || !map[post?.type]) {
    console.log('❌ Failed: Missing _id or type not in map');
    return null;
  }

  const path = `/posts/${map[post.type]}/edit/${post._id}`;
  console.log('✅ Generated path:', path);
  
  return path;
}