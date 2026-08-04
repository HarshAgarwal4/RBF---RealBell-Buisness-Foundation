import React from 'react';

const FullScreenLoader = () => {
  return (
    <div className="fixed inset-0 bg-white bg-opacity-80 z-9999 flex items-center justify-center">
      <div className="flex flex-col items-center">

        <div className="
          w-12 h-12 border-4 border-gray-200 border-t-4 border-t-blue-500 
          rounded-full animate-spin
        ">
        </div>

        <p className="mt-4 text-lg text-blue-600 font-semibold">
          Loading Data...
        </p>
      </div>
    </div>
  );
};

export default FullScreenLoader;