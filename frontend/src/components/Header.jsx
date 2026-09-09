import React from 'react';
import LogoDisplay from './LogoDisplay';

function Header({ isLoggedIn, userRole, userDepartment, onLogout }) {
    return (
        <header className="bg-gradient-to-r from-red-800 to-red-900 text-white py-6 md:py-8 shadow-lg rounded-b-xl">
            <div className="container mx-auto px-4 flex flex-col md:flex-row items-center md:justify-between">
                <div className="flex items-center mb-4 md:mb-0">
                    <LogoDisplay />
                    <div className="text-left ml-4">
                        <p className="text-xl md:text-2xl font-light opacity-90"></p>
                    </div>
                </div>

                <div className="flex-grow text-center mb-4 md:mb-0">
                    <h1 className="text-3xl md:text-4xl font-extrabold tracking-wide">Student Internship Management</h1>
                </div>

                {isLoggedIn && (
                    <div className="mt-4 md:mt-0 md:ml-auto">
                        <button
                            onClick={onLogout}
                            className="bg-yellow-500 hover:bg-yellow-600 text-red-900 font-bold py-2 px-4 rounded-full transition duration-300 ease-in-out transform hover:scale-105 shadow-md text-sm"
                        >
                            Logout ({userRole}) {userDepartment ? `(${userDepartment})` : ''}
                        </button>
                    </div>
                )}
            </div>
        </header>
    );
}

export default Header;