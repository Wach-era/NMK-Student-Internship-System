import React from 'react';

function Footer() {
    return (
        <footer className="bg-gray-800 text-white text-center py-6 mt-10 rounded-t-xl shadow-inner">
            <p>&copy; {new Date().getFullYear()} National Museums of Kenya. All rights reserved.</p>
        </footer>
    );
}

export default Footer;