'use client';

import { useState, useCallback, useEffect } from 'react';
import { updateCollection, getPinataCredentials, fileToBase64, validateCollectionCID } from '../lib/pinataService';

interface CollectionFile {
  path: string;
  file?: File;
  content?: string;
}

// Define state type for validation result
interface ValidationResult {
  isValid: boolean | null; // null = not checked, true = valid, false = invalid/error
  message: string;
}

export default function IPFSCollectionUpdater() {
  const [oldCID, setOldCID] = useState('');
  const [newCID, setNewCID] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [files, setFiles] = useState<CollectionFile[]>([]);

  // --- State for CID Validation ---
  const [isValidatingCID, setIsValidatingCID] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult>({ isValid: null, message: '' });

  // --- Handle CID Input Change ---
  const handleOldCIDChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newCidValue = e.target.value;
      setOldCID(newCidValue);
      // Reset validation status when CID changes
      setValidationResult({ isValid: null, message: '' });
      setNewCID(''); // Clear previous success message
      setError(null); // Clear previous error
  };

  // --- Validate CID Handler ---
  const handleValidateCID = useCallback(async () => {
      if (!oldCID || oldCID.trim() === '') {
          setValidationResult({ isValid: false, message: 'Please enter a CID to validate.' });
          return;
      }
      setIsValidatingCID(true);
      setValidationResult({ isValid: null, message: 'Validating...' }); // Indicate loading
      try {
          const result = await validateCollectionCID(oldCID.trim());
          if (result.isValid) {
              setValidationResult({ isValid: true, message: 'CID appears valid (found expected file).' });
          } else {
              setValidationResult({ isValid: false, message: 'CID invalid or file not found via gateway.' });
          }
      } catch (err: any) {
          console.error("Validation API call failed:", err);
          setValidationResult({ isValid: false, message: 'Validation failed. Check console/network tab.' });
      } finally {
          setIsValidatingCID(false);
      }
  }, [oldCID]);

  // Handle file input
  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) return;
    
    const fileList = Array.from(event.target.files);
    const newFiles: CollectionFile[] = fileList.map(file => ({
      path: file.webkitRelativePath || file.name, // Use relative path if available (directory upload) or name
      file
    }));
    
    setFiles(prev => [...prev, ...newFiles]);
    setNewCID(''); // Clear previous success message
    setError(null); // Clear previous error
  }, []);

  // Handle removing a file from the list
  const handleRemoveFile = useCallback((index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Update the collection on Pinata
  const handleUpdateCollection = useCallback(async () => {
    // ADD A CHECK BEFORE RUNNING: Only run update if CID is valid (or new)
    const isNewCollection = !oldCID || oldCID.trim() === '';
    if (!isNewCollection && validationResult.isValid !== true) {
        setError('Please validate the existing CID before updating.');
        return;
    }
    
    try {
      setError(null);
      setIsLoading(true);
      
      // Check if there are files to upload IF creating new collection
      if (isNewCollection && files.length === 0) {
        setError('Please add files to create a new collection.');
        setIsLoading(false);
        return;
      }

      // Get Pinata credentials
      const credentials = getPinataCredentials();
      if (!credentials) {
        setError('Pinata credentials not found. Please set them in Settings.');
        setIsLoading(false); // Stop loading
        return;
      }

      // Process files selected in the UI and convert to base64
      const processedChanges = await Promise.all(
        files.map(async (item) => {
          if (item.file) {
            const base64Content = await fileToBase64(item.file);
            return {
              path: item.path, // Ensure path is correctly set
              content: base64Content
            };
          }
          return { path: item.path, content: item.content || '' };
        })
      );

      // Prepare the changes array for the API (only the files actually changed/added now)
      const changes = processedChanges.filter(item => item.content);

      // ****** CRITICAL FIX: Determine ALL expected file paths ******
      let finalFilePaths: string[] = [];

      if (isNewCollection) {
          finalFilePaths = processedChanges.map(item => item.path);
      } else {
          // --- Placeholder Logic: Replace with your actual method ---
          // This is where you MUST determine the full list of paths
          // For now, using a hardcoded example for demonstration
          console.warn("Using placeholder logic for existing file paths!");
           const existingPaths = ['testfile1.json', 'testfile1.png', 'testfile2.json', 'testfile2.png']; // *** REPLACE THIS PLACEHOLDER ***
          // --- End Placeholder ---

          const currentChangePaths = processedChanges.map(item => item.path);
          const combinedPaths = new Set([...existingPaths, ...currentChangePaths]);
          finalFilePaths = Array.from(combinedPaths);
      }

       if (finalFilePaths.length === 0) {
           setError('Could not determine the final list of file paths.');
           setIsLoading(false);
           return;
       }

      // Call the API to update the collection
      const newCIDResult = await updateCollection(
        oldCID.trim(), // Send trimmed CID
        changes,
        finalFilePaths,
        credentials.apiKey,
        credentials.apiSecret
      );

      setNewCID(newCIDResult);
      setFiles([]); // Clear the file input list after successful upload
      setOldCID(newCIDResult); // Optionally update the CID field to the new CID
      setValidationResult({ isValid: true, message: 'CID updated successfully.' }); // Mark new CID as valid
      
    } catch (err: any) {
      setError(err.message || 'An error occurred while processing the collection');
    } finally {
      setIsLoading(false);
    }
  }, [oldCID, files, validationResult]); // Add validationResult dependency

  const isUpdateMode = !(!oldCID || oldCID.trim() === ''); // Determine mode based on CID field

  return (
    <div className="w-full max-w-2xl mx-auto p-4 space-y-6">
      <h2 className="text-2xl font-bold mb-4">
        {isUpdateMode ? 'Update IPFS Collection' : 'Create New IPFS Collection'}
      </h2>

      {/* Old CID input and Validation Button */}
      <div>
        <label htmlFor="oldCID" className="block text-sm font-medium mb-1">
          Collection CID {isUpdateMode ? 'to Update' : '(Leave empty for new collection)'}
        </label>
        <div className="flex items-center space-x-2">
           <input
              id="oldCID"
              type="text"
              value={oldCID}
              onChange={handleOldCIDChange} // Use the new handler
              className="flex-grow p-2 border rounded focus:ring-2 focus:ring-blue-500"
              placeholder={isUpdateMode ? "Enter the CID of the existing collection" : "Leave empty to create a new collection"}
          />
          {isUpdateMode && ( // Only show validate button if there's a CID
             <button
               onClick={handleValidateCID}
               disabled={isValidatingCID || !oldCID}
               className="p-2 border rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
               title="Check if CID is accessible via gateway"
             >
               {isValidatingCID ? 'Validating...' : 'Validate CID'}
             </button>
          )}
        </div>
         {/* Validation Status Display */}
         {validationResult.message && (
             <p className={`mt-1 text-sm ${
                 validationResult.isValid === true ? 'text-green-600' :
                 validationResult.isValid === false ? 'text-red-600' :
                 'text-gray-600' // For 'Validating...' or initial state
             }`}>
                 {validationResult.message}
             </p>
         )}
      </div>

       {/* File input */}
       <div>
        <label htmlFor="fileInput" className="block text-sm font-medium mb-1">
          Add/Replace Files
        </label>
        {/* Consider adding 'directory' and 'webkitdirectory' for folder uploads if needed */}
        <input
          id="fileInput"
          type="file"
          multiple
          onChange={handleFileChange}
          className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
        />
        <p className="text-xs text-gray-500 mt-1">Select files to add or replace. File names determine their path (e.g., 'images/cat.png').</p>
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-2">Files Queued</h3>
          <ul className="space-y-2 max-h-40 overflow-y-auto border rounded p-2">
            {files.map((file, index) => (
              <li key={index} className="flex justify-between items-center p-1 bg-gray-50 rounded text-sm">
                <span className="truncate" title={file.path}>{file.path}</span>
                <button
                  onClick={() => handleRemoveFile(index)}
                  className="text-red-500 hover:text-red-700 ml-2"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Update/Create button */}
      <button
        onClick={handleUpdateCollection}
        disabled={isLoading || (isUpdateMode && validationResult.isValid !== true)} // Disable if loading or if updating invalid CID
        className="w-full p-3 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Processing...' : isUpdateMode ? 'Update Collection' : 'Create Collection'}
      </button>

      {/* Error message */}
      {error && (
        <div className="p-3 bg-red-100 text-red-800 rounded-md">
          {error}
        </div>
      )}

      {/* Success message */}
      {newCID && (
        <div className="p-3 bg-green-100 text-green-800 rounded-md">
          <p className="font-medium">
            Collection {isUpdateMode ? 'updated' : 'created'} successfully!
          </p>
          <p className="break-all">New CID: {newCID}</p>
          <p className="mt-2">
            <a
              href={`https://gateway.pinata.cloud/ipfs/${newCID}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline"
            >
              View on IPFS Gateway
            </a>
          </p>
        </div>
      )}
    </div>
  );
} 