'use client';

export default function NFTEditing() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto text-center">
        <h1 className="text-3xl font-bold mb-8">NFT Editing</h1>
        
        <div className="bg-blue-50 border-l-4 border-blue-400 p-6 rounded-md shadow-md">
          <div className="flex items-center mb-4">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-12 w-12 text-blue-500 mr-4" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" 
              />
            </svg>
            <h2 className="text-2xl font-semibold text-blue-700">Under Construction</h2>
          </div>
          <p className="text-gray-600 text-lg">
            Our team is working hard on building this NFT editing feature. Please check back later!
          </p>
        </div>
      </div>
    </div>
  );
} 