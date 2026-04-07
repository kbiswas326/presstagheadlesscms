async function main() {
  const url = process.argv[2] || 'http://localhost:3001/results-of-every-icc-womens-t20-world-cup';
  const res = await fetch(url);
  const html = await res.text();
  const hasFacebook = html.includes('aria-label=\"Share on Facebook\"') || html.includes("aria-label='Share on Facebook'");
  const hasTwitter = html.includes('aria-label=\"Share on X\"') || html.includes("aria-label='Share on X'");
  const hasWhatsapp = html.includes('aria-label=\"Share on WhatsApp\"') || html.includes("aria-label='Share on WhatsApp'");
  const hasCopy = html.includes('aria-label=\"Copy link\"') || html.includes("aria-label='Copy link'");
  console.log(JSON.stringify({ status: res.status, hasFacebook, hasTwitter, hasWhatsapp, hasCopy }, null, 2));
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

