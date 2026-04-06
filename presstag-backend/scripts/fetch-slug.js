async function main() {
  const tenant = process.argv[2] || 'sportzpoint';
  const slug = process.argv[3];
  if (!slug) {
    console.error('Provide a slug');
    process.exit(1);
  }
  const url = `http://localhost:5001/api/posts/slug/${slug}`;
  const res = await fetch(url, { headers: { 'x-tenant-id': tenant } });
  const data = await res.json().catch(() => null);
  console.log(JSON.stringify({
    status: res.status,
    slug: data?.slug,
    author: data?.author,
    authors: data?.authors,
    editor: data?.editor,
    editorName: data?.editorName,
  }, null, 2));
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
