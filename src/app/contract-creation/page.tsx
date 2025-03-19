'use client';

export default function ContractCreation() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto text-center">
        <h1 className="text-3xl font-bold mb-8">Contract Creation</h1>
        
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded-md shadow-md">
          <div className="flex items-center mb-4">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-12 w-12 text-yellow-500 mr-4" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
              />
            </svg>
            <h2 className="text-2xl font-semibold text-yellow-700">Under Construction</h2>
          </div>
          <p className="text-gray-600 text-lg">
            We&apos;re currently building this exciting feature. Check back soon for updates!
          </p>
        </div>
      </div>
    </div>
  );
} 