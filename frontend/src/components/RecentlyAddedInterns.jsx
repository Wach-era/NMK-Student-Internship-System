import React from 'react';

const PLACEHOLDER_IMAGE_URL = "https://placehold.co/50x50/aabbcc/ffffff?text=NP";

function RecentlyAddedInterns({ interns, onViewFullList }) {
    const recentInterns = interns.slice(0, 5);

    return (
        <section className="bg-white p-6 md:p-8 rounded-xl shadow-lg">
            <h2 className="text-3xl font-semibold text-red-800 mb-6 border-b-2 border-yellow-600 pb-3">Recently Added Interns</h2>
            {recentInterns.length === 0 ? (
                <p className="text-gray-600">No interns added yet. Add one using the form above!</p>
            ) : (
                <div className="space-y-4">
                    {recentInterns.map((intern) => (
                        <div key={intern.idNumber} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg shadow-sm">
                            <div className="flex items-center">
                                <a href={intern.profilePicture ? `/${intern.profilePicture}` : PLACEHOLDER_IMAGE_URL} target="_blank" rel="noopener noreferrer" className="mr-4">
                                    <img
                                        src={intern.profilePicture ? `/${intern.profilePicture}` : PLACEHOLDER_IMAGE_URL}
                                        alt={intern.fullName}
                                        className="w-12 h-12 rounded-full object-cover border-2 border-yellow-500 shadow-md transition-transform duration-200 hover:scale-110"
                                        onError={(e) => { e.target.onerror = null; e.target.src = PLACEHOLDER_IMAGE_URL; }}
                                    />
                                </a>
                                <div>
                                    <p className="font-semibold text-lg text-gray-900">{intern.fullName}</p>
                                    <p className="text-sm text-gray-600">{intern.institution} - {intern.monthJoined}</p>
                                    <p className="text-xs text-gray-500">Department: {intern.department}</p>
                                </div>
                            </div>
                            <span className="text-sm text-gray-500">ID: {intern.idNumber}</span>
                        </div>
                    ))}
                </div>
            )}
            <div className="mt-6 text-center">
                <button onClick={onViewFullList} className="bg-blue-700 hover:bg-blue-800 text-white font-bold py-3 px-6 rounded-lg transition duration-300 ease-in-out transform hover:scale-105 shadow-md flex items-center justify-center mx-auto">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                        <polyline points="14 2 14 8 20 8"/>
                    </svg>
                    View Full Intern List
                </button>
            </div>
        </section>
    );
}

export default RecentlyAddedInterns;