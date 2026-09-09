import React from 'react';
import LogoDisplay from './LogoDisplay';

function LandingPage({ onEnterApp }) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-800 to-red-900 p-4 relative">
            <div className="absolute top-8 left-8">
                <LogoDisplay />
            </div>

            <div className="text-center bg-white bg-opacity-10 backdrop-filter backdrop-blur-lg rounded-xl shadow-2xl p-8 md:p-12 max-w-2xl transform transition-all duration-500 ease-in-out scale-100 hover:scale-105">
                <h1 className="text-4xl md:text-6xl font-extrabold mb-6 text-yellow-300 drop-shadow-lg">
                    Welcome to NMK Intern Management
                </h1>
                <p className="text-lg md:text-xl mb-8 opacity-90 leading-relaxed">
                    Your comprehensive system for tracking, managing, and reporting on student internships at the National Museums of Kenya.
                </p>
                <button
                    onClick={onEnterApp}
                    className="bg-yellow-500 hover:bg-yellow-600 text-red-900 font-bold py-3 px-8 rounded-full transition duration-300 ease-in-out transform hover:scale-110 shadow-lg text-lg flex items-center justify-center mx-auto"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                        <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/>
                        <path d="M12 8v8M8 12h8"/>
                    </svg>
                    Enter Application
                </button>
            </div>
        </div>
    );
}

export default LandingPage;