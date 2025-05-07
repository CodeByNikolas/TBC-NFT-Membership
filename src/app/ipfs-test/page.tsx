import IPFSCollectionUpdater from '@/components/IPFSCollectionUpdater';

export const metadata = {
  title: 'IPFS Collection Test | TBC NFT',
  description: 'Test page for IPFS collection creation and updates',
}

export default function IPFSTestPage() {
  return (
    <main className="flex min-h-screen flex-col items-center p-6 md:p-12 bg-gray-50">
      <div className="max-w-4xl w-full mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">IPFS Collection Management Test</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 md:p-8">
          <IPFSCollectionUpdater />
        </div>
        
        <div className="mt-12 p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">API Testing Instructions</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium mb-2">Creating a New Collection</h3>
              <p className="text-gray-700 mb-2">Leave the CID field empty and upload some files to create a new collection.</p>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
                {`// Sample API Request for new collection
fetch('/api/update-collection', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-pinata-api-key': 'your-pinata-api-key',
    'x-pinata-api-secret': 'your-pinata-api-secret'
  },
  body: JSON.stringify({
    oldCID: '',  // Empty for new collection
    changes: [
      { 
        path: 'metadata.json', 
        content: 'base64EncodedContentString' 
      },
      { 
        path: 'images/1.png', 
        content: 'base64EncodedContentString' 
      }
    ],
    allFilePaths: ['metadata.json', 'images/1.png']
  })
})`}
              </pre>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-2">Updating an Existing Collection</h3>
              <p className="text-gray-700 mb-2">Enter the existing CID and upload changed/new files to update the collection.</p>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
                {`// Sample API Request for updating collection
fetch('/api/update-collection', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-pinata-api-key': 'your-pinata-api-key',
    'x-pinata-api-secret': 'your-pinata-api-secret'
  },
  body: JSON.stringify({
    oldCID: 'QmExisting1234567890CID',  // Existing CID to update
    changes: [
      { 
        path: 'metadata.json', 
        content: 'base64EncodedContentString' 
      }
    ],
    allFilePaths: ['metadata.json', 'images/1.png', 'images/2.png']
  })
})`}
              </pre>
              <p className="text-gray-600 mt-2">
                Notice in this example, we only include 'metadata.json' in changes, but the allFilePaths includes 
                all files. The unchanged files will be fetched from the existing CID.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-2">API Response Format</h3>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
                {`// Success Response
{
  "success": true,
  "newCID": "QmNewCID1234567890",
  "isNewCollection": false  // or true for new collections
}

// Error Response
{
  "success": false,
  "error": "Error message details"
}`}
              </pre>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-2">Testing Tips</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Make sure your Pinata API key and secret are set in the Settings panel</li>
                <li>For testing, you can create a small collection first, then update it</li>
                <li>Use the returned CID to verify your files were properly uploaded</li>
                <li>The API handles directory structures automatically</li>
                <li>All files must be base64 encoded before sending to the API</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
} 