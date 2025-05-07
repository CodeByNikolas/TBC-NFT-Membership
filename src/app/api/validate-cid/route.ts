import { NextResponse } from 'next/server';

// --- Configuration ---
const IPFS_GATEWAY = 'https://gateway.pinata.cloud';
// Choose a file path that SHOULD exist in your valid collection directories
const FILE_TO_CHECK = '1.json'; // Or 'metadata.json', or another common file

export async function POST(request: Request) {
    try {
        const { cid } = await request.json();

        if (!cid || typeof cid !== 'string' || cid.trim() === '') {
            return NextResponse.json({ success: false, error: 'CID is required.' }, { status: 400 });
        }

        // Basic CID format check (optional, can be more robust)
        if (!cid.startsWith('Qm') && !cid.startsWith('bafy')) {
             // Might want a more thorough regex check for base32/base58
             console.warn(`Potentially invalid CID format: ${cid}`);
             // Allow it to proceed for the fetch attempt anyway
        }

        const validationUrl = `${IPFS_GATEWAY}/ipfs/${cid}/${FILE_TO_CHECK}`;
        console.log(`Validating CID by checking URL: ${validationUrl}`);

        // Use HEAD request for efficiency - we only care if it exists, not the content
        const response = await fetch(validationUrl, { method: 'HEAD' });

        const isValid = response.ok; // Status 200-299 means it likely exists

        console.log(`Validation result for ${cid} (${FILE_TO_CHECK}): Status ${response.status}, IsValid: ${isValid}`);

        // We return success: true because the API call itself worked.
        // isValid indicates if the file check via gateway succeeded.
        return NextResponse.json({ success: true, isValid: isValid });

    } catch (error: any) {
        console.error(`Error validating CID:`, error);
        // Return success: false because the API call failed
        return NextResponse.json({ success: false, error: error.message || 'Failed to validate CID' }, { status: 500 });
    }
} 