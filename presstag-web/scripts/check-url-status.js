async function main() {
  const url = process.argv[2] || 'http://localhost:3001/definitely-not-a-real-page-xyz';
  const res = await fetch(url);
  console.log(JSON.stringify({ status: res.status, url: res.url }, null, 2));
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

