// Config file for the NFT editing page
export const runtime = 'edge'; // Use edge runtime to prevent issues with useSearchParams in CI/CD

// Make sure the page is always client-side rendered with fresh data
export const dynamic = 'force-dynamic'; 