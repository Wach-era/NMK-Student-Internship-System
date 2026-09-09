import React from 'react';

const NMK_LOGO_URL = "/logo.png";

function LogoDisplay() {
    return (
        <div>
            <img
                src={NMK_LOGO_URL}
                alt="NMK Logo"
                className="w-44 h-44 object-contain mx-auto"
            />
        </div>
    );
}

export default LogoDisplay;