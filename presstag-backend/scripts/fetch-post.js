async function main() {
  const tenant = process.argv[2] || 'sportzpoint';
  const path = process.argv[3];
  if (!path) {
    console.error('Usage: node scripts/fetch-post.js <tenant> <path>');
    process.exit(1);
  }
  const url = `http://localhost:5001${path.startsWith('/') ? '' : '/'}${path}`;
  const res = await fetch(url, { headers: { 'x-tenant-id': tenant } });
  const data = await res.json().catch(() => null);
  console.log(JSON.stringify({ status: res.status, url, data }, null, 2));
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
