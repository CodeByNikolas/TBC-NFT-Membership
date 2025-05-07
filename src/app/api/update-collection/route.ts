import pinataSDK from '@pinata/sdk';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { NextRequest, NextResponse } from 'next/server';

// --- Helper Function: Ensure Directory Exists ---
async function ensureDirExists(dirPath: string) {
    try {
        await fs.promises.mkdir(dirPath, { recursive: true });
    } catch (error: any) {
        if (error.code !== 'EEXIST') { // Ignore error if directory already exists
            throw error;
        }
    }
}

// --- Helper Function: Fetch from IPFS Gateway ---
async function fetchFromGateway(cid: string, filePath: string) {
    const IPFS_GATEWAY = 'https://gateway.pinata.cloud'; // Or your preferred gateway
    const url = `${IPFS_GATEWAY}/ipfs/${cid}/${filePath}`;
    
    try {
        const response = await fetch(url);
        if (!response.ok) {
            // Handle common errors like 404 Not Found gracefully
            if (response.status === 404) {
                console.warn(`File not found on gateway: ${url}`);
                return null; // Indicate file wasn't found
            }
            throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
        }
        // Return content as a Buffer
        return Buffer.from(await response.arrayBuffer());
    } catch (error) {
        console.error(`Error fetching from gateway ${url}:`, error);
        throw error; // Rethrow to potentially halt the update process
    }
}

export async function POST(req: NextRequest) {
    try {
        // Get Pinata credentials from request headers
        const pinataApiKey = req.headers.get('x-pinata-api-key');
        const pinataApiSecret = req.headers.get('x-pinata-api-secret');

        if (!pinataApiKey || !pinataApiSecret) {
            return NextResponse.json(
                { success: false, error: 'Pinata API Key and Secret are required in headers' },
                { status: 401 }
            );
        }

        // Initialize Pinata SDK
        const pinata = new pinataSDK(pinataApiKey, pinataApiSecret);

        // Temporary directory path (using os.tmpdir() for cross-platform compatibility)
        let tempDir = '';

        try {
            // --- 1. Receive Data from Frontend ---
            const body = await req.json();
            const {
                oldCID,         // CID of the directory being updated (can be empty for new collections)
                changes,        // Array: [{ path: 'path/within/dir/file.json', content: 'base64DataString' }, ...]
                allFilePaths    // Array: ['path/file1.json', 'images/img1.png', ...] List of *all* paths expected in the *new* directory
            } = body;

            // Basic Validation for required fields
            if (!changes || !Array.isArray(changes) || !allFilePaths || !Array.isArray(allFilePaths)) {
                return NextResponse.json(
                    { success: false, error: 'Missing or invalid parameters: changes (array) and allFilePaths (array) are required.' },
                    { status: 400 }
                );
            }
            
            // Check if we're creating a new collection or updating existing one
            const isNewCollection = !oldCID || oldCID.trim() === '';
            
            // Create a unique temporary directory
            tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'pinata-update-'));
            console.log(`Created temporary directory: ${tempDir}`);

            // Map changes for quick lookup
            const changesMap = new Map(changes.map(c => [c.path, Buffer.from(c.content, 'base64')])); // Assuming frontend sends base64 content

            // --- 2. Process All Expected Files ---
            for (const filePath of allFilePaths) {
                const targetPath = path.join(tempDir, filePath);
                const targetSubDir = path.dirname(targetPath);

                // Ensure subdirectory exists within tempDir
                await ensureDirExists(targetSubDir);

                if (changesMap.has(filePath)) {
                    // --- 2a. Write New/Updated File from 'changes' ---
                    console.log(`Writing file: ${filePath}`);
                    const contentBuffer = changesMap.get(filePath);
                    await fs.promises.writeFile(targetPath, contentBuffer);
                } else if (!isNewCollection) {
                    // --- 2b. Fetch Unchanged File from Old CID (only if updating existing collection) ---
                    console.log(`Fetching unchanged file: ${filePath} from ${oldCID}`);
                    const contentBuffer = await fetchFromGateway(oldCID, filePath);
                    if (contentBuffer) {
                        await fs.promises.writeFile(targetPath, contentBuffer);
                    } else {
                        // File wasn't found in old CID - this might be okay if it's truly a new file
                        // listed in allFilePaths but not provided in changes (shouldn't happen with good frontend logic).
                        // Or it could indicate an error. Add logging or error handling if needed.
                        console.warn(`Could not fetch ${filePath} from old CID ${oldCID}, file will be missing in new upload unless provided in 'changes'.`);
                    }
                } else {
                    // For new collections, all files should be in changes
                    console.warn(`File ${filePath} listed in allFilePaths but not provided in changes. It will be missing in the upload.`);
                }
            }

            // --- 3. Pin the Updated Directory from Temp Folder ---
            console.log(`Pinning ${isNewCollection ? 'new' : 'updated'} directory from ${tempDir} to Pinata...`);
            const options = {
                pinataMetadata: {
                    name: `NFT Collection ${isNewCollection ? 'Creation' : 'Update'} - ${new Date().toISOString()}`,
                    // keyvalues: {} // Add custom keyvalues if needed
                },
                pinataOptions: {
                    cidVersion: 1 as 0 | 1,
                },
            };

            const result = await pinata.pinFromFS(tempDir, options);
            console.log("Pinata pinFromFS Result:", result);

            // --- 4. Send Success Response ---
            return NextResponse.json({ 
                success: true, 
                newCID: result.IpfsHash,
                isNewCollection: isNewCollection
            });

        } finally {
            // --- 5. Cleanup Temporary Directory ---
            if (tempDir) {
                try {
                    console.log(`Cleaning up temporary directory: ${tempDir}`);
                    await fs.promises.rm(tempDir, { recursive: true, force: true });
                } catch (cleanupError) {
                    console.error(`Error cleaning up temporary directory ${tempDir}:`, cleanupError);
                    // Log cleanup error, but don't override the original error response
                }
            }
        }
    } catch (error: any) {
        console.error('Error during collection update:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to update collection on Pinata' },
            { status: 500 }
        );
    }
}

export const config = {
    api: {
        bodyParser: {
            sizeLimit: '10mb', // Increase if needed, be mindful of serverless limits
        },
    },
}; 