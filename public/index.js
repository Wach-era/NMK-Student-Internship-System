// index.js

// --- IMPORTANT: We DO NOT import React or ReactDOM here ---
// They are available globally because they are loaded by <script> tags in index.html.

// --- We also DO NOT use 'require' here. 'require' is for Node.js (backend). ---
// This file is for the browser (frontend).

// --- NEW: Destructure React hooks from the global React object ---
const { useState, useEffect, useCallback } = React;

// --- Placeholder Image URL (for interns without a profile picture) ---
const PLACEHOLDER_IMAGE_URL = "https://placehold.co/50x50/aabbcc/ffffff?text=NP"; // NP = No Photo

const NMK_LOGO_URL = "https://museums.or.ke/wp-content/uploads/2023/12/logo.png"; // Found a plausible direct URL, please verify its validity and quality. If it doesn't work, replace it.


const departments = ['ICT', 'Human Resources', 'Finance', 'Marketing'];


// --- NEW: Reusable Logo Component ---
function LogoDisplay() {
    return (
        // REMOVED: bg-white p-2 rounded-full shadow-lg to remove the oval bubble
        // ADDED: flex justify-center to center the image within its container (if it had a fixed width)
        <div>
            <img
                src={NMK_LOGO_URL}
                alt="NMK Logo"
                // Adjusted sizing for potentially better appearance, centered within the natural flow
                // Increased width and height slightly, ensuring object-contain to prevent distortion.
                // Added mx-auto block to specifically center the image if its parent allows.
                className="w-44 h-44 object-contain mx-auto"
            />
        </div>
    );
}

// --- NEW: Header Component to ensure logo is always present ---
function Header({ isLoggedIn, userRole, userDepartment, onLogout }) {
    return (
        <header className="bg-gradient-to-r from-red-800 to-red-900 text-white py-6 md:py-8 shadow-lg rounded-b-xl">
            {/* Main container with flex properties to arrange items */}
            <div className="container mx-auto px-4 flex flex-col md:flex-row items-center md:justify-between">
                {/* Left Section: Logo and "National Museums of Kenya" subtitle */}
                <div className="flex items-center mb-4 md:mb-0">
                    {/* Logo is now handled by the LogoDisplay component */}
                    <LogoDisplay />
                    <div className="text-left ml-4"> {/* Added ml-4 for spacing */}
                        <p className="text-xl md:text-2xl font-light opacity-90"></p>
                    </div>
                </div>

                {/* Center Section: Main Application Title */}
                {/* This div will take up available space and center its text */}
                <div className="flex-grow text-center mb-4 md:mb-0">
                    <h1 className="text-3xl md:text-4xl font-extrabold tracking-wide">Student Internship Management</h1>
                </div>

                {/* Right Section: Logout Button */}
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


// Main App Component
function App() {
    const [currentPage, setCurrentPage] = useState('loading');
    const [interns, setInterns] = useState([]);
    const [editInternData, setEditInternData] = useState(null);

    // Authentication States
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userRole, setUserRole] = useState(null); // 'Staff' or 'HR'
    const [userEmail, setUserEmail] = useState(null);
    const [userDepartment, setUserDepartment] = useState(null);

useEffect(() => {
    const verifyAuth = async () => {
        const params = new URLSearchParams(window.location.search);
        const token = params.get('token');

        if (token) {
            // Handle magic link login
            try {
                window.history.replaceState({}, document.title, window.location.pathname);
                const response = await fetch('http://localhost:5000/auth/verify-magic-link', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token }),
                    credentials: 'include'
                });

                const result = await response.json();
                if (response.ok) {
                    handleLoginSuccess(result.user);
                } else {
                    throw new Error(result.message || 'Login failed');
                }
            } catch (err) {
                console.error('Login error:', err);
                setCurrentPage('login');
            }
        } else {
            // Check existing session
            try {
                const response = await fetch('http://localhost:5000/auth/check-session', {
                    credentials: 'include'
                });
                
                if (response.ok) {
                    const user = await response.json();
                    handleLoginSuccess(user);
                } else {
                    setCurrentPage('login');
                }
            } catch (error) {
                console.error('Session check failed:', error);
                setCurrentPage('login');
            }
        }
    };

    const handleLoginSuccess = (user) => {
        setIsLoggedIn(true);
        setUserEmail(user.email);
        setUserRole(user.role);
        setUserDepartment(user.department);
        setCurrentPage(user.role === 'HR' ? 'internsList' : 'landing');
    };

    verifyAuth();
}, []);

    const fetchInterns = useCallback(async () => {
        if (!isLoggedIn || !userRole) return;

        let url = 'http://localhost:5000/interns'; // Ensure port 5000
        if (userRole === 'Staff' && userDepartment) {
            url = `http://localhost:5000/interns?department=${encodeURIComponent(userDepartment)}`; // Ensure port 5000
        }

        try {
            const res = await fetch(url);
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            const data = await res.json();
            setInterns(data);
        } catch (err) {
            console.error('Error fetching interns:', err);
        }
    }, [isLoggedIn, userRole, userDepartment]);

    useEffect(() => {
        if (isLoggedIn && (currentPage === 'home' || currentPage === 'internsList')) {
            fetchInterns();
        }
    }, [fetchInterns, currentPage, isLoggedIn]);

    const handleLoginSuccess = (email, role, department) => {
        setIsLoggedIn(true);
        setUserEmail(email);
        setUserRole(role);
        setUserDepartment(department);

        if (role === 'Staff') {
            setCurrentPage('landing');
        } else if (role === 'HR') {
            setCurrentPage('internsList');
        }
    };

    const handleLogout = async () => {
  try {
    await fetch('http://localhost:5000/auth/logout', {
      method: 'POST',
      credentials: 'include'
    });
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    setIsLoggedIn(false);
    setUserEmail(null);
    setUserRole(null);
    setUserDepartment(null);
    setCurrentPage('login');
    setInterns([]);
    setEditInternData(null);
  }
};

    

    const handleEditIntern = (intern) => {
        setEditInternData(intern);
        setCurrentPage('home');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleFormSuccess = () => {
        setEditInternData(null);
        fetchInterns();
    };

    const renderPage = () => {
        if (currentPage === 'loading') {
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-100">
                    <p className="text-xl text-gray-700">Loading application...</p>
                </div>
            );
        }

        if (!isLoggedIn) {
            return <LoginComponent onLoginSuccess={handleLoginSuccess} />;
        }

        switch (currentPage) {
            case 'landing':
                return <LandingPage onEnterApp={() => setCurrentPage('home')} />;
            case 'home':
                return (
                    <>
                        <InternForm
                            internToEdit={editInternData}
                            onFormSuccess={handleFormSuccess}
                            userRole={userRole}
                            userEmail={userEmail}
                            userDepartment={userDepartment}
                        />
                        <RecentlyAddedInterns interns={interns} onViewFullList={() => setCurrentPage('internsList')} />
                    </>
                );
            case 'internsList':
                return (
                    <InternsListPage
                        interns={interns}
                        fetchInterns={fetchInterns}
                        onEditIntern={handleEditIntern}
                        onBackToHome={() => setCurrentPage('home')}
                        userRole={userRole}
                        userEmail={userEmail}
                        userDepartment={userDepartment}
                    />
                );
            default:
                return <p>Page not found</p>;
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 font-inter text-gray-800">
            {/* THIS IS THE CHANGE: Use your Header component here */}
            {/* The Header component itself already handles its internal content based on isLoggedIn */}
            {currentPage !== 'landing' && currentPage !== 'login' && ( // Only render header if not on landing or login page
                <Header
                    isLoggedIn={isLoggedIn}
                    userRole={userRole}
                    userDepartment={userDepartment}
                    onLogout={handleLogout}
                />
            )}

            <main className="container mx-auto px-4 my-8">
                {renderPage()}
            </main>

            {isLoggedIn && currentPage !== 'landing' && currentPage !== 'login' && (
                <footer className="bg-gray-800 text-white text-center py-6 mt-10 rounded-t-xl shadow-inner">
                    <p>&copy; {new Date().getFullYear()} National Museums of Kenya. All rights reserved.</p>
                </footer>
            )}
        </div>
    );
}


// --- NEW: LoginComponent with OTP as bot filter, then email magic link ---
function LoginComponent({ onLoginSuccess }) {
    // [1] OTP-related states (commented out)
    const [otpSent, setOtpSent] = useState(false);
    const [step, setStep] = useState('otp'); // 'otp' or 'email'
    const [phoneNumber, setPhoneNumber] = useState('');
    const [code, setCode] = useState('');
    const [otpMessage, setOtpMessage] = useState('');
    const [otpMessageType, setOtpMessageType] = useState('');
    const [sending, setSending] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [resendTimer, setResendTimer] = useState(0);

    // Skip OTP by default - set step directly to email
    //const [step, setStep] = useState('departmentSelection');
    // Email login states (keep these)
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('');
    const [emailStep, setEmailStep] = useState('request'); 

    // [2] OTP useEffect commented out
    useEffect(() => {
        if (resendTimer > 0) {
            const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [resendTimer]);

    // [3] OTP handlers commented out
    const handleSendCode = async (e) => {
        e.preventDefault();
        setOtpMessage('');
        setOtpMessageType('');
        setSending(true);
        try {
            const res = await fetch('http://localhost:5000/auth/send-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phoneNumber }),
            });
            const result = await res.json();
            if (res.ok) {
                setOtpMessage('OTP sent! Please check your phone.');
                setOtpMessageType('success');
                setResendTimer(30);
                setOtpSent(true);
            } else {
                setOtpMessage(result.message || 'Failed to send OTP.');
                setOtpMessageType('error');
            }
        } catch (err) {
            setOtpMessage('Network error. Please try again.');
            setOtpMessageType('error');
        }
        setSending(false);
    };

    // [4] OTP verification commented out
    const handleVerifyCode = async (e) => {
        e.preventDefault();
        setOtpMessage('');
        setOtpMessageType('');
        setVerifying(true);
        try {
            const res = await fetch('http://localhost:5000/auth/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phoneNumber, code }),
            });
            const result = await res.json();
            if (res.ok && result.success) {
                setOtpMessage('Phone verified! Continue with email login.');
                setOtpMessageType('success');
                 setStep('departmentSelection');
            } else {
                setOtpMessage(result.message || 'Invalid code.');
                setOtpMessageType('error');
            }
        } catch (err) {
            setOtpMessage('Network error. Please try again.');
            setOtpMessageType('error');
        } finally {
            setVerifying(false);
        }
    };

   // NEW HANDLER: Sends a request based on the selected department
    const handleSelectDepartment = async (department) => {
        setMessage('');
        setMessageType('');

        try {
            // [5] Send a POST request to the backend with the selected department
            const response = await fetch('http://localhost:5000/auth/request-magic-link', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ department }), // Sending the department instead of the email
            });

            const result = await response.json();

            if (response.ok) {
                // [6] Update state to show the "Check your email" message
                setEmail(result.email); // The backend should return the email that was sent to
                setMessage(result.message || `Login link sent to the ${department} department email.`);
                setMessageType('success');
                setStep('checkEmail');
            } else {
                setMessage(result.message || 'Failed to send magic link. Please try again.');
                setMessageType('error');
            }
        } catch (err) {
            setMessage('Network error. Could not request magic link.');
            setMessageType('error');
            console.error('Magic link request fetch error:', err);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-800 to-red-900 p-4">
            <div className="bg-white rounded-xl shadow-2xl p-8 md:p-10 w-full max-w-md">
                <LogoDisplay />
                <h2 className="text-3xl font-bold text-center text-red-800 mb-6">Login</h2>
                
                {/* [5] Entire OTP form section commented out */}
                 {step === 'otp' && (
                    <form onSubmit={otpSent ? handleVerifyCode : handleSendCode} className="space-y-5">
                        <div>
                            <label htmlFor="phoneNumber" className="block text-gray-700 text-sm font-medium mb-1">Enter your phone number to verify you're human:</label>
                            <input
                                type="tel"
                                id="phoneNumber"
                                className="form-input"
                                value={phoneNumber}
                                onChange={e => setPhoneNumber(e.target.value)}
                                required
                                placeholder="+254712345678"
                                disabled={otpSent || sending || verifying} 
                            />
                        </div>
                        {otpMessage && (
                            <div className={`p-3 mb-4 rounded-md text-sm ${otpMessageType === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {otpMessage}
                            </div>
                        )}
                        {otpSent ? (
                            <>
                                <label htmlFor="code" className="block text-gray-700 text-sm font-medium mb-1">Enter the code sent to your phone:</label>
                                <input
                                    type="text"
                                    id="code"
                                    className="form-input"
                                    value={code}
                                    onChange={e => setCode(e.target.value)}
                                    required
                                    maxLength={6}
                                    placeholder="6-digit code"
                                    disabled={verifying}
                                />
                                <button
                                    type="submit"
                                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition duration-300 ease-in-out shadow-md text-lg"
                                    disabled={!code || verifying}
                                >
                                    {verifying ? "Verifying..." : "Verify & Continue"}
                                </button>
                                <button
                                    type="button"
                                    className="w-full mt-2 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition duration-300"
                                    onClick={handleSendCode}
                                    disabled={resendTimer > 0 || sending || verifying}
                                >
                                    {resendTimer > 0 ? `Resend Code (${resendTimer}s)` : "Resend Code"}
                                </button>
                            </>
                        ) : (
                            <button
                                type="submit"
                                className="w-full bg-yellow-500 hover:bg-yellow-600 text-red-900 font-bold py-3 px-4 rounded-lg transition duration-300 ease-in-out shadow-md text-lg"
                                disabled={!phoneNumber || sending}
                            >
                                {sending ? "Sending..." : "Send Code"}
                            </button>
                        )}
                    </form>
                )} 

                {/* Email form section (keep this) */}
                 {step === 'departmentSelection' && (
                    <div className="space-y-4">
                        <p className="text-gray-700 text-center font-medium">Please select your department to log in:</p>
                        {departments.map(dept => (
                            <button
                                key={dept}
                                onClick={() => handleSelectDepartment(dept)}
                                className="w-full bg-red-800 hover:bg-red-900 text-white font-bold py-3 px-4 rounded-lg transition duration-300 ease-in-out shadow-md text-lg"
                            >
                                {dept}
                            </button>
                        ))}
                    </div>
                )}

                {step === 'checkEmail' && (
                    <div className="text-center">
                        <p className="text-gray-700 text-lg mb-4">
                            A login link has been sent to <strong>{email}</strong>.
                        </p>
                        <p className="text-gray-600 text-sm mb-6">
                            Please check your email and click the link to log in. The link is valid for 15 minutes.
                        </p>
                        <button
                            onClick={() => { setStep('departmentSelection'); setEmail(''); setMessage(''); setMessageType(''); }}
                            className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition duration-300 ease-in-out shadow-md"
                        >
                            Go Back
                        </button>
                    </div>
                )}
                
                {message && (
                    <div className={`p-3 mb-4 rounded-md text-sm mt-4 ${messageType === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {message}
                    </div>
                )}
                
                <p className="text-center text-gray-600 text-sm mt-6">
                    Demo Accounts:<br />
                    Staff: <code>hillarybrucewachira@gmail.com</code><br />
                    HR: <code>hillarybswift2003@outlook.com</code>
                </p>
            </div>
        </div>
    );
}

// LandingPage Component (No changes from previous version)
function LandingPage({ onEnterApp }) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-800 to-red-900 p-4 relative"> {/* Added relative for logo positioning */}
            {/* Logo in top-left corner */}
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
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="M12 8v8M8 12h8"/></svg>
                    Enter Application
                </button>
            </div>
        </div>
    );
}

// Intern Form Component (No functional changes, just prop passing)
function InternForm({ internToEdit, onFormSuccess, userRole, userEmail, userDepartment }) {
    const [formData, setFormData] = useState({
        idNumber: '', fullName: '', institution: '',
        department: '',
        monthJoined: '',
        startDate: '', endDate: '', phoneNumber: '', amountPaid: '',
        receiptNumber: '', institutionSupervisor: '',
        status: 'Active',
    });
    const [profilePictureFile, setProfilePictureFile] = useState(null);
    const [files, setFiles] = useState({});
    const [isEditing, setIsEditing] = useState(false);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('');

    useEffect(() => {
        if (internToEdit) {
            setFormData({
                idNumber: internToEdit.idNumber || '',
                fullName: internToEdit.fullName || '',
                institution: internToEdit.institution || '',
                department: internToEdit.department || '',
                monthJoined: internToEdit.monthJoined || '',
                startDate: internToEdit.startDate ? new Date(internToEdit.startDate).toISOString().split('T')[0] : '',
                endDate: internToEdit.endDate ? new Date(internToEdit.endDate).toISOString().split('T')[0] : '',
                phoneNumber: internToEdit.phoneNumber || '',
                amountPaid: internToEdit.amountPaid || '',
                receiptNumber: internToEdit.receiptNumber || '',
                institutionSupervisor: internToEdit.institutionSupervisor || '',
                status: internToEdit.status || 'Active',
            });
            setIsEditing(true);
            setFiles({});
            setProfilePictureFile(null);
        } else {
            setFormData({
                idNumber: '', fullName: '', institution: '',
                department: userRole === 'Staff' ? userDepartment : '',
                monthJoined: '',
                startDate: '', endDate: '', phoneNumber: '', amountPaid: '',
                receiptNumber: '', institutionSupervisor: '',
                status: 'Active',
            });
            setIsEditing(false);
            setFiles({});
            setProfilePictureFile(null);
        }
        setMessage('');
    }, [internToEdit, userRole, userDepartment]);

    const handleChange = (e) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleFileChange = (e) => {
        const { id, files: selectedFiles } = e.target;
        if (id === 'profilePicture') {
            setProfilePictureFile(selectedFiles[0]);
        } else {
            setFiles(prev => ({ ...prev, [id]: selectedFiles[0] }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');

        const data = new FormData();
        const submissionData = { ...formData };
        if (userRole === 'Staff') {
            submissionData.department = userDepartment;
        }

        for (const key in submissionData) {
            data.append(key, submissionData[key]);
        }
        for (const key in files) {
            if (files[key]) {
                data.append(key, files[key]);
            }
        }
        if (profilePictureFile) {
            data.append('profilePicture', profilePictureFile);
        }
        if (userEmail) {
            data.append('staffEmail', userEmail);
        }

        try {
            let response;
            if (isEditing) {
                response = await fetch(`/interns/${formData.idNumber}`, {
                    method: 'PUT',
                    body: data,
                });
            } else {
                response = await fetch('/interns', {
                    method: 'POST',
                    body: data,
                });
            }

            const result = await response.json();
            if (response.ok) {
                setMessage(`Intern ${isEditing ? 'updated' : 'added'} successfully!`);
                setMessageType('success');
                onFormSuccess();
            } else {
                const errorMessages = result.errors ? Object.values(result.errors).map(err => err.message).join(', ') : result.message;
                setMessage(`Error: ${errorMessages || 'Something went wrong.'}`);
                setMessageType('error');
                console.error('Server error:', result);
            }
        } catch (err) {
            setMessage('Network error. Could not connect to server.');
            setMessageType('error');
            console.error('Fetch error:', err);
        }
    };

    if (userRole !== 'Staff') {
        return (
            <section className="bg-white p-6 md:p-8 rounded-xl shadow-lg mb-8 text-center text-gray-700">
                <h2 className="text-3xl font-semibold text-red-800 mb-4">Access Denied</h2>
                <p>Only Staff members can add or update intern details.</p>
            </section>
        );
    }

    return (
        <section className="bg-white p-6 md:p-8 rounded-xl shadow-lg mb-8">
            <h2 className="text-3xl font-semibold text-red-800 mb-6 border-b-2 border-yellow-600 pb-3">
                {isEditing ? 'Update Intern Details' : 'Add New Intern'}
            </h2>
            {message && (
                <div className={`p-3 mb-4 rounded-md text-sm ${messageType === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {message}
                </div>
            )}
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <div>
                    <label htmlFor="idNumber" className="block text-gray-700 text-sm font-medium mb-1">ID Number <span className="text-red-500">*</span></label>
                    <input type="text" id="idNumber" className="form-input" value={formData.idNumber} onChange={handleChange} required disabled={isEditing} />
                    {isEditing && <p className="text-xs text-gray-500 mt-1">ID Number cannot be changed when editing.</p>}
                </div>
                <div>
                    <label htmlFor="fullName" className="block text-gray-700 text-sm font-medium mb-1">Full Name <span className="text-red-500">*</span></label>
                    <input type="text" id="fullName" className="form-input" value={formData.fullName} onChange={handleChange} required />
                </div>
                <div>
                    <label htmlFor="institution" className="block text-gray-700 text-sm font-medium mb-1">Institution <span className="text-red-500">*</span></label>
                    <input type="text" id="institution" className="form-input" value={formData.institution} onChange={handleChange} required />
                </div>
                <div>
                    <label htmlFor="department" className="block text-gray-700 text-sm font-medium mb-1">Department <span className="text-red-500">*</span></label>
                    {userRole === 'Staff' ? (
                        <input type="text" id="department" className="form-input bg-gray-200 cursor-not-allowed" value={userDepartment || ''} disabled />
                    ) : (
                        <input type="text" id="department" className="form-input" value={formData.department} onChange={handleChange} required />
                    )}
                </div>
                <div>
                    <label htmlFor="monthJoined" className="block text-gray-700 text-sm font-medium mb-1">Month Joined (e.g. July 2025) <span className="text-red-500">*</span></label>
                    <input type="text" id="monthJoined" className="form-input" value={formData.monthJoined} onChange={handleChange} required />
                </div>
                <div>
                    <label htmlFor="startDate" className="block text-gray-700 text-sm font-medium mb-1">Start Date <span className="text-red-500">*</span></label>
                    <input type="date" id="startDate" className="form-input" value={formData.startDate} onChange={handleChange} required />
                </div>
                <div>
                    <label htmlFor="endDate" className="block text-gray-700 text-sm font-medium mb-1">End Date <span className="text-red-500">*</span></label>
                    <input type="date" id="endDate" className="form-input" value={formData.endDate} onChange={handleChange} required />
                </div>
                <div>
                    <label htmlFor="phoneNumber" className="block text-gray-700 text-sm font-medium mb-1">Phone Number <span className="text-red-500">*</span></label>
                    <input type="tel" id="phoneNumber" className="form-input" value={formData.phoneNumber} onChange={handleChange} required />
                </div>
                <div>
                    <label htmlFor="amountPaid" className="block text-gray-700 text-sm font-medium mb-1">Amount Paid <span className="text-red-500">*</span></label>
                    <input type="number" id="amountPaid" className="form-input" value={formData.amountPaid} onChange={handleChange} required />
                </div>
                <div>
                    <label htmlFor="receiptNumber" className="block text-gray-700 text-sm font-medium mb-1">Receipt Number <span className="text-red-500">*</span></label>
                    <input type="text" id="receiptNumber" className="form-input" value={formData.receiptNumber} onChange={handleChange} required />
                </div>
                <div>
                    <label htmlFor="institutionSupervisor" className="block text-gray-700 text-sm font-medium mb-1">Institution Supervisor <span className="text-red-500">*</span></label>
                    <input type="text" id="institutionSupervisor" className="form-input" value={formData.institutionSupervisor} onChange={handleChange} required />
                </div>
                <input type="hidden" id="status" value={formData.status} />


                {/* Profile Picture Upload */}
                <div className="md:col-span-2 border-t pt-6 mt-4 border-gray-200">
                    <h3 className="text-xl font-medium text-gray-800 mb-4">Profile Picture (Optional)</h3>
                    <div>
                        <label htmlFor="profilePicture" className="block text-gray-700 text-sm font-medium mb-1">Upload Profile Picture:</label>
                        <input type="file" id="profilePicture" name="profilePicture" accept="image/*" className="form-input file-input" onChange={handleFileChange} />
                        {internToEdit && internToEdit.profilePicture && (
                            <p className="text-xs text-gray-500 mt-1">Current: <a href={`/${internToEdit.profilePicture}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{internToEdit.profilePicture.split('/').pop()}</a></p>
                        )}
                    </div>
                </div>

                <div className="md:col-span-2 border-t pt-6 mt-4 border-gray-200">
                    <h3 className="text-xl font-medium text-gray-800 mb-4">Upload Documents (Optional for Update)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                        <div>
                            <label htmlFor="letter" className="block text-gray-700 text-sm font-medium mb-1">Institution Letter:</label>
                            <input type="file" id="letter" name="letter" accept=".pdf,.jpg,.jpeg,.png" className="form-input file-input" onChange={handleFileChange} required={!isEditing} />
                        </div>
                        <div>
                            <label htmlFor="idCopy" className="block text-gray-700 text-sm font-medium mb-1">ID Copy:</label>
                            <input type="file" id="idCopy" name="idCopy" accept=".pdf,.jpg,.jpeg,.png" className="form-input file-input" onChange={handleFileChange} required={!isEditing} />
                        </div>
                        <div>
                            <label htmlFor="acceptanceLetter" className="block text-gray-700 text-sm font-medium mb-1">Acceptance Letter:</label>
                            <input type="file" id="acceptanceLetter" name="acceptanceLetter" accept=".pdf,.jpg,.jpeg,.png" className="form-input file-input" onChange={handleFileChange} required={!isEditing} />
                        </div>
                        <div>
                            <label htmlFor="receiptCopy" className="block text-gray-700 text-sm font-medium mb-1">Receipt Copy:</label>
                            <input type="file" id="receiptCopy" name="receiptCopy" accept=".pdf,.jpg,.jpeg,.png" className="form-input file-input" onChange={handleFileChange} required={!isEditing} />
                        </div>
                    </div>
                </div>

                <div className="md:col-span-2 mt-6">
                    <button type="submit" className="w-full bg-green-700 hover:bg-green-800 text-white font-bold py-3 px-4 rounded-lg transition duration-300 ease-in-out transform hover:scale-105 shadow-md">
                        {isEditing ? 'Update Intern' : 'Save Intern'}
                    </button>
                    {isEditing && (
                        <button type="button" onClick={() => { setEditInternData(null); setIsEditing(false); setFormData({}); }} className="w-full bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-4 rounded-lg mt-3 transition duration-300 ease-in-out transform hover:scale-105 shadow-md">
                            Cancel Edit
                        </button>
                    )}
                </div>
            </form>
        </section>
    );
}

// Recently Added Interns Component (No functional changes)
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
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
                    View Full Intern List
                </button>
            </div>
        </section>
    );
}

function InternsListPage({ interns, fetchInterns, onEditIntern, onBackToHome, userRole, userEmail, userDepartment }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [departmentFilter, setDepartmentFilter] = useState(userRole === 'Staff' ? userDepartment : 'All');
    const [institutionFilter, setInstitutionFilter] = useState('All');
    const [statusFilter, setStatusFilter] = useState('All');

    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
    const [currentSortLabel, setCurrentSortLabel] = useState(''); // Added for sorting label
    const [showCommentModal, setShowCommentModal] = useState(false);
    const [currentInternForComments, setCurrentInternForComments] = useState(null);
    const [newComment, setNewComment] = useState('');
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('');
    const [showReportModal, setShowReportModal] = useState(false);
    const [customReportContent, setCustomReportContent] = useState('');

    // --- Report Modal State ---
    const [reportType, setReportType] = useState('all');
    const [selectedInternId, setSelectedInternId] = useState('');
    const [selectedInternIds, setSelectedInternIds] = useState([]);
    const [reportStatusFilter, setReportStatusFilter] = useState('All');
    const [reportInstitutionFilter, setReportInstitutionFilter] = useState('All');
    const [reportDepartmentFilter, setReportDepartmentFilter] = useState('All');
    const [individualInternSearch, setIndividualInternSearch] = useState('');
    const [reportFields, setReportFields] = useState({
        fullName: true,
        idNumber: true,
        institution: true,
        department: true,
        monthJoined: true,
        startDate: true,
        endDate: true,
        phoneNumber: true,
        amountPaid: true,
        receiptNumber: true,
        institutionSupervisor: true,
        status: true,
        progress: true,
        comments: true,
    });

    const uniqueDepartments = React.useMemo(() => {
        if (userRole === 'Staff' && userDepartment) {
            return ['All', userDepartment].sort();
        }
        const departments = interns.map(intern => intern.department).filter(Boolean);
        return ['All', ...new Set(departments)].sort();
    }, [interns, userRole, userDepartment]);

    const uniqueInstitutions = React.useMemo(() => {
        const institutions = interns.map(intern => intern.institution).filter(Boolean);
        return ['All', ...new Set(institutions)].sort();
    }, [interns]);

    const allStatuses = ['All', 'Active', 'Suspended', 'Expelled', 'Completed'];

    const sortedAndFilteredInterns = React.useMemo(() => {
        let currentInterns = [...interns];

        if (userRole === 'Staff' && userDepartment) {
            currentInterns = currentInterns.filter(intern => intern.department === userDepartment);
        } else if (departmentFilter !== 'All') {
            currentInterns = currentInterns.filter(intern => intern.department === departmentFilter);
        }

        if (institutionFilter !== 'All') {
            currentInterns = currentInterns.filter(intern => intern.institution === institutionFilter);
        }

        if (statusFilter !== 'All') {
            currentInterns = currentInterns.filter(intern => intern.status === statusFilter);
        }

        if (searchTerm) {
            currentInterns = currentInterns.filter(intern =>
                Object.values(intern).some(value =>
                    String(value).toLowerCase().includes(searchTerm.toLowerCase())
                )
            );
        }

        if (sortConfig.key) {
            currentInterns.sort((a, b) => {
                const aValue = a[sortConfig.key];
                const bValue = b[sortConfig.key];

                if (aValue < bValue) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }
        return currentInterns;
    }, [interns, sortConfig, searchTerm, departmentFilter, institutionFilter, statusFilter, userRole, userDepartment]);

    const internsPerDepartment = React.useMemo(() => {
        const counts = {};
        sortedAndFilteredInterns.forEach(intern => {
            counts[intern.department] = (counts[intern.department] || 0) + 1;
        });
        return counts;
    }, [sortedAndFilteredInterns]);

    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
        
        // Set human-readable sort label
        const labels = {
            idNumber: 'ID Number',
            fullName: 'Full Name',
            institution: 'Institution',
            department: 'Department',
            monthJoined: 'Month Joined',
            startDate: 'Start Date',
            endDate: 'End Date',
            phoneNumber: 'Phone Number',
            amountPaid: 'Amount Paid',
            receiptNumber: 'Receipt Number',
            institutionSupervisor: 'Supervisor',
            status: 'Status'
        };
        setCurrentSortLabel(`Sorted by: ${labels[key]} (${direction})`);
    };

    const getSortIcon = (key) => {
        if (sortConfig.key !== key) return null;
        return (
            <span className="inline-flex items-center ml-1">
                {sortConfig.direction === 'ascending' ? '↑' : '↓'}
            </span>
        );
    };

    const calculateProgress = (startDate, endDate) => {
        if (!startDate || !endDate) return 'N/A';
        const start = new Date(startDate);
        const end = new Date(endDate);
        const now = new Date();

        if (now < start) return 'Not Started';
        if (now > end) return 'COMPLETED';

        const totalDuration = end.getTime() - start.getTime();
        const elapsedDuration = now.getTime() - start.getTime();

        if (totalDuration <= 0) return 'N/A';

        const progress = Math.min(100, Math.max(0, (elapsedDuration / totalDuration) * 100));
        return `${progress.toFixed(0)}%`;
    };

    const handleDeleteIntern = async (idNumber) => {
        if (!confirm('Are you sure you want to delete this intern? This action cannot be undone.')) {
            return;
        }
        try {
            const res = await fetch(`/interns/${idNumber}`, { method: 'DELETE' });
            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }
            setMessage('Intern deleted successfully!');
            setMessageType('success');
            fetchInterns();
        } catch (err) {
            setMessage('Failed to delete intern.');
            setMessageType('error');
            console.error('Error deleting intern:', err);
        }
    };

    const handleSuspendExpelIntern = async (idNumber, status) => {
        if (!confirm(`Are you sure you want to set this intern's status to "${status}"?`)) {
            return;
        }
        try {
            const res = await fetch(`/interns/${idNumber}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: status, hrEmail: userEmail }),
            });
            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }
            setMessage(`Intern status updated to ${status} successfully!`);
            setMessageType('success');
            fetchInterns();
        } catch (err) {
            setMessage(`Failed to update intern status to ${status}.`);
            setMessageType('error');
            console.error(`Error updating intern status to ${status}:`, err);
        }
    };


    const handleGenerateReport = (internId = null) => {
        setMessage('');
        const internsToReport = internId ? interns.filter(i => i.idNumber === internId) : sortedAndFilteredInterns;

        if (internsToReport.length === 0) {
            setMessage('No interns to generate report for.');
            setMessageType('error');
            return;
        }

        let reportHtml = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Internship Report</title>
                <style>
                    body { font-family: sans-serif; margin: 20px; color: #333; }
                    h1 { color: #8B0000; text-align: center; margin-bottom: 20px; }
                    h2 { color: #A0522D; border-bottom: 1px solid #eee; padding-bottom: 5px; margin-top: 30px; }
                    h3 { color: #4CAF50; margin-top: 20px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #f2f2f2; }
                    img { max-width: 80px; height: auto; border-radius: 50%; object-fit: cover; border: 2px solid #ccc; }
                    .section { margin-bottom: 30px; padding: 15px; border: 1px solid #eee; border-radius: 8px; background-color: #fdfdfd; }
                    .report-meta { font-size: 0.9em; color: #555; margin-bottom: 20px; }
                    .custom-content { background-color: #e6f7ff; border-left: 5px solid #2196F3; padding: 15px; margin-bottom: 20px; }
                </style>
            </head>
            <body>
                <h1>National Museums of Kenya Internship Report</h1>
                <div class="report-meta">
                    <p>Generated By: <strong>${userEmail} (${userRole})</strong></p>
                    <p>Generated On: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
                    ${departmentFilter !== 'All' ? `<p>Filtered Department: <strong>${departmentFilter}</strong></p>` : ''}
                    ${institutionFilter !== 'All' ? `<p>Filtered Institution: <strong>${institutionFilter}</strong></p>` : ''}
                    ${statusFilter !== 'All' ? `<p>Filtered Status: <strong>${statusFilter}</strong></p>` : ''}
                    ${searchTerm ? `<p>Search Term: <strong>"${searchTerm}"</strong></p>` : ''}
                    <p>Total Interns in Report: <strong>${internsToReport.length}</strong></p>
                </div>
        `;

        if (customReportContent) {
            reportHtml += `
                <div class="custom-content">
                    <h2>Custom Report Notes:</h2>
                    <p>${customReportContent.replace(/\n/g, '<br>')}</p>
                </div>
            `;
        }

        internsToReport.forEach(intern => {
            const progressStatus = calculateProgress(intern.startDate, intern.endDate);
            reportHtml += `
                <div class="section">
                    <h2>${intern.fullName} (ID: ${intern.idNumber})</h2>
                    ${intern.profilePicture ? `<p><img src="/${intern.profilePicture}" alt="Profile Picture"></p>` : ''}
                    <p><strong>Institution:</strong> ${intern.institution}</p>
                    <p><strong>Department:</strong> ${intern.department}</p>
                    <p><strong>Joined:</strong> ${intern.monthJoined}</p>
                    <p><strong>Dates:</strong> ${new Date(intern.startDate).toLocaleDateString()} - ${new Date(intern.endDate).toLocaleDateString()}</p>
                    <p><strong>Phone:</strong> ${intern.phoneNumber}</p>
                    <p><strong>Amount Paid:</strong> KES ${intern.amountPaid ? intern.amountPaid.toLocaleString() : '0'}</p>
                    <p><strong>Receipt:</strong> ${intern.receiptNumber}</p>
                    <p><strong>Supervisor:</strong> ${intern.institutionSupervisor}</p>
                    <p><strong>Status:</strong> ${intern.status}</p>
                    <p><strong>Progress:</strong> ${progressStatus}</p>
                    ${intern.addedByStaffEmail ? `<p><strong>Added By:</strong> ${intern.addedByStaffEmail}</p>` : ''}
                    ${intern.updatedByStaffEmail ? `<p><strong>Last Updated By:</strong> ${intern.updatedByStaffEmail}</p>` : ''}
                    ${intern.statusChangedByHREmail ? `<p><strong>Status Changed By:</strong> ${intern.statusChangedByHREmail}</p>` : ''}
                    <h3>Documents:</h3>
                    <ul>
                        ${intern.attachments && intern.attachments.length > 0 ?
                            intern.attachments.map(file => `<li><a href="/${file}" target="_blank">${file.split('/').pop()}</a></li>`).join('')
                            : '<li>No documents uploaded.</li>'}
                    </ul>
                    <h3>Comments:</h3>
                    <ul>
                        ${intern.comments && intern.comments.length > 0 ?
                            intern.comments.map(comment => `<li><strong>${comment.author} (${comment.authorEmail}) (${new Date(comment.timestamp).toLocaleDateString()}):</strong> ${comment.text}</li>`).join('')
                            : '<li>No comments available.</li>'}
                    </ul>
                </div>
            `;
        });

        reportHtml += `</body></html>`;

        const newWindow = window.open('', '_blank');
        newWindow.document.write(reportHtml);
        newWindow.document.close();
        newWindow.focus();
        setMessage(`Report generated for ${internId ? internId : 'all filtered interns'}.`);
        setMessageType('success');
        setShowReportModal(false);
        setCustomReportContent('');
    };

    const handleAddComment = async () => {
        if (!newComment.trim() || !currentInternForComments) return;

        try {
            const response = await fetch(`/interns/${currentInternForComments.idNumber}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: newComment, author: `${userRole} (Demo)`, authorEmail: userEmail }),
            });

            const result = await response.json();
            if (response.ok) {
                setMessage('Comment added successfully!');
                setMessageType('success');
                setNewComment('');
                setShowCommentModal(false);
                fetchInterns();
            } else {
                setMessage(`Error adding comment: ${result.message || 'Something went wrong.'}`);
                setMessageType('error');
                console.error('Server error adding comment:', result);
            }
        } catch (err) {
            setMessage('Network error. Could not add comment.');
            setMessageType('error');
            console.error('Fetch error adding comment:', err);
        }
    };

    // --- Render Report Preview ---
    function renderReportPreview() {
        // Filter interns for preview
        let previewInterns = reportType === 'individual' && selectedInternId
            ? interns.filter(i => i.idNumber === selectedInternId)
            : interns.filter(i => {
                let statusMatch = reportStatusFilter === 'All' || i.status === reportStatusFilter;
                let instMatch = reportInstitutionFilter === 'All' || i.institution === reportInstitutionFilter;
                let deptMatch = reportDepartmentFilter === 'All' || i.department === reportDepartmentFilter;
                return statusMatch && instMatch && deptMatch;
            });
        if (previewInterns.length === 0) {
            return <div className="text-gray-500 italic">No interns match the selected criteria.</div>;
        }
        return (
            <div>
                <div className="mb-2 text-sm text-gray-700">
                    <strong>Report for:</strong> {reportType === 'individual' ? previewInterns[0]?.fullName : `${previewInterns.length} interns`}
                    {reportStatusFilter !== 'All' && ` | Status: ${reportStatusFilter}`}
                    {reportInstitutionFilter !== 'All' && ` | Institution: ${reportInstitutionFilter}`}
                    {reportDepartmentFilter !== 'All' && ` | Department: ${reportDepartmentFilter}`}
                </div>
                {customReportContent && (
                    <div className="mb-2 p-2 bg-blue-50 border-l-4 border-blue-400 text-blue-900 text-sm rounded">
                        <strong>Custom Notes:</strong> <span dangerouslySetInnerHTML={{__html: customReportContent.replace(/\n/g, '<br/>')}} />
                    </div>
                )}
                {previewInterns.map((intern, idx) => (
                    <div key={intern.idNumber} className="mb-4 p-3 bg-white border rounded shadow-sm">
                        <div className="flex items-center mb-2">
                            {reportFields.profilePicture && (
                                <img src={intern.profilePicture ? `/${intern.profilePicture}` : PLACEHOLDER_IMAGE_URL} alt={intern.fullName} className="w-14 h-14 rounded-full object-cover border-2 border-gray-300 mr-4" onError={e => {e.target.onerror=null; e.target.src=PLACEHOLDER_IMAGE_URL;}} />
                            )}
                            {reportFields.fullName && <span className="font-bold text-lg text-gray-800 mr-2">{intern.fullName}</span>}
                            {reportFields.idNumber && <span className="text-gray-600 text-sm">(ID: {intern.idNumber})</span>}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                            {reportFields.institution && <div><strong>Institution:</strong> {intern.institution}</div>}
                            {reportFields.department && <div><strong>Department:</strong> {intern.department}</div>}
                            {reportFields.monthJoined && <div><strong>Month Joined:</strong> {intern.monthJoined}</div>}
                            {reportFields.startDate && <div><strong>Start Date:</strong> {intern.startDate ? new Date(intern.startDate).toLocaleDateString() : 'N/A'}</div>}
                            {reportFields.endDate && <div><strong>End Date:</strong> {intern.endDate ? new Date(intern.endDate).toLocaleDateString() : 'N/A'}</div>}
                            {reportFields.phoneNumber && <div><strong>Phone:</strong> {intern.phoneNumber}</div>}
                            {reportFields.amountPaid && <div><strong>Amount Paid:</strong> KES {intern.amountPaid ? intern.amountPaid.toLocaleString() : '0'}</div>}
                            {reportFields.receiptNumber && <div><strong>Receipt:</strong> {intern.receiptNumber}</div>}
                            {reportFields.institutionSupervisor && <div><strong>Supervisor:</strong> {intern.institutionSupervisor}</div>}
                            {reportFields.status && <div><strong>Status:</strong> {intern.status}</div>}
                            {reportFields.progress && <div><strong>Progress:</strong> {calculateProgress(intern.startDate, intern.endDate)}</div>}
                        </div>
                        {reportFields.documents && (
                            <div className="mt-2">
                                <strong>Documents:</strong>
                                <ul className="list-disc ml-6">
                                    {(intern.attachments && intern.attachments.length > 0)
                                        ? intern.attachments.map((file, i) => <li key={i}><a href={`/${file}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{file.split('/').pop()}</a></li>)
                                        : <li className="text-gray-500 italic">No documents uploaded.</li>}
                                </ul>
                            </div>
                        )}
                       {reportFields.comments && intern.comments && intern.comments.length > 0 && (
    <div className="mt-2">
        <strong>Comments:</strong>
        <ul className="list-disc ml-6">
            {intern.comments.map((comment, i) => (
                <li key={i}>
                    <span className="font-medium">{comment.author}</span> 
                    <span className="text-xs text-gray-500"> ({new Date(comment.timestamp).toLocaleDateString()})</span>: {comment.text}
                </li>
            ))}
        </ul>
    </div>
)}


                    </div>
                ))}
            </div>
        );
    }

    // --- Export PDF ---
    async function handleExportPDF(e) {
        e.preventDefault();

        // Use window.jspdf.jsPDF for browser global (CDN)
        const pdf = new window.jspdf.jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });


        const previewInterns = reportType === 'individual' && selectedInternId
            ? interns.filter(i => i.idNumber === selectedInternId)
            : interns.filter(i => {
                let statusMatch = reportStatusFilter === 'All' || i.status === reportStatusFilter;
                let instMatch = reportInstitutionFilter === 'All' || i.institution === reportInstitutionFilter;
                let deptMatch = reportDepartmentFilter === 'All' || i.department === reportDepartmentFilter;
                return statusMatch && instMatch && deptMatch;
            });

        // 1. Prepare columns
        const columns = [];
        if (reportFields.profilePicture) columns.push({ header: 'Photo', dataKey: 'profilePicture' });
        if (reportFields.fullName) columns.push({ header: 'Full Name', dataKey: 'fullName' });
        if (reportFields.idNumber) columns.push({ header: 'ID Number', dataKey: 'idNumber' });
        if (reportFields.institution) columns.push({ header: 'Institution', dataKey: 'institution' });
        if (reportFields.department) columns.push({ header: 'Department', dataKey: 'department' });
        if (reportFields.monthJoined) columns.push({ header: 'Month Joined', dataKey: 'monthJoined' });
        if (reportFields.startDate) columns.push({ header: 'Start Date', dataKey: 'startDate' });
        if (reportFields.endDate) columns.push({ header: 'End Date', dataKey: 'endDate' });
        if (reportFields.phoneNumber) columns.push({ header: 'Phone', dataKey: 'phoneNumber' });
        if (reportFields.amountPaid) columns.push({ header: 'Amount Paid', dataKey: 'amountPaid' });
        if (reportFields.receiptNumber) columns.push({ header: 'Receipt', dataKey: 'receiptNumber' });
        if (reportFields.institutionSupervisor) columns.push({ header: 'Supervisor', dataKey: 'institutionSupervisor' });
        if (reportFields.status) columns.push({ header: 'Status', dataKey: 'status' });
        if (reportFields.progress) columns.push({ header: 'Progress', dataKey: 'progress' });

        // 2. Prepare rows
        const rows = previewInterns.map(intern => {
            const row = {};
            if (reportFields.profilePicture) row.profilePicture = intern.profilePicture ? 'Photo' : 'N/A';
            if (reportFields.fullName) row.fullName = intern.fullName;
            if (reportFields.idNumber) row.idNumber = intern.idNumber;
            if (reportFields.institution) row.institution = intern.institution;
            if (reportFields.department) row.department = intern.department;
            if (reportFields.monthJoined) row.monthJoined = intern.monthJoined;
            if (reportFields.startDate) row.startDate = intern.startDate ? new Date(intern.startDate).toLocaleDateString() : 'N/A';
            if (reportFields.endDate) row.endDate = intern.endDate ? new Date(intern.endDate).toLocaleDateString() : 'N/A';
            if (reportFields.phoneNumber) row.phoneNumber = intern.phoneNumber;
            if (reportFields.amountPaid) row.amountPaid = intern.amountPaid ? `KES ${intern.amountPaid.toLocaleString()}` : '0';
            if (reportFields.receiptNumber) row.receiptNumber = intern.receiptNumber;
            if (reportFields.institutionSupervisor) row.institutionSupervisor = intern.institutionSupervisor;
            if (reportFields.status) row.status = intern.status;
            if (reportFields.progress) row.progress = calculateProgress(intern.startDate, intern.endDate);
            return row;
        });

        // 3. Now call autoTable
        pdf.autoTable({
            startY: 120, // Use a fixed value or define 'y' above, e.g. let y = 120;
            head: [columns.map(col => col.header)],
            body: rows.map(row => columns.map(col => row[col.dataKey])),
            styles: {
                font: 'helvetica',
                fontSize: 11,
                cellPadding: 6,
                textColor: [44, 62, 80],
                fillColor: [245, 245, 245],
                lineWidth: 0
            },
            headStyles: {
                fillColor: [139, 0, 0],
                textColor: [255, 255, 255],
                fontStyle: 'bold',
                lineWidth: 0
            },
            alternateRowStyles: {
                fillColor: [255, 255, 255],
            },
            margin: { left: 40, right: 40 },
            theme: 'plain',
        });

        

        pdf.save(`NMK_Intern_Report_${new Date().toISOString().slice(0,10)}.pdf`);
    }

    return (
        <section className="bg-white p-6 md:p-8 rounded-xl shadow-lg">
            <div className="flex justify-between items-center mb-6 border-b-2 border-yellow-600 pb-3">
                <h2 className="text-3xl font-semibold text-red-800">Full Intern List</h2>
                {userRole === 'Staff' && (
                    <button onClick={onBackToHome} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300 ease-in-out transform hover:scale-105 shadow-md flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M12 5v14M5 12h14"/></svg>
                        Add/Update Intern
                    </button>
                )}
            </div>

            {message && (
                <div className={`p-3 mb-4 rounded-md text-sm ${messageType === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {message}
                </div>
            )}

            <div className="mb-6 flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
                <div className="relative flex-grow">
                    <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">
            Search Interns
        </label>
                    <input
                        type="text"
                        placeholder="Search interns..."
                        // --- FIX: Increased padding-left and input height for search input ---
                        className="form-input pl-16 h-12 w-full"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {/* Search icon */}
                    </div>
                {/* Department Filter */}
    <div className="w-full md:w-48">
        <label htmlFor="department-filter" className="block text-sm font-medium text-gray-700 mb-1">
            Department
        </label>
        <div className="relative">
            <select
                id="department-filter"
                className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 sm:text-sm rounded-md"
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                disabled={userRole === 'Staff'}
            >
                {uniqueDepartments.map((dept) => (
                    <option key={dept} value={dept}>{dept}</option>
                ))}
            </select>
        </div>
    </div>

    {/* Institution Filter */}
    <div className="w-full md:w-48">
        <label htmlFor="institution-filter" className="block text-sm font-medium text-gray-700 mb-1">
            Institution
        </label>
        <div className="relative">
            <select
                id="institution-filter"
                className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 sm:text-sm rounded-md"
                value={institutionFilter}
                onChange={(e) => setInstitutionFilter(e.target.value)}
            >
                {uniqueInstitutions.map((inst) => (
                    <option key={inst} value={inst}>{inst}</option>
                ))}
            </select>
        </div>
    </div>

    {/* Status Filter */}
    <div className="w-full md:w-48">
        <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">
            Status
        </label>
        <div className="relative">
            <select
                id="status-filter"
                className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 sm:text-sm rounded-md"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
            >
                {allStatuses.map((status) => (
                    <option key={status} value={status}>{status}</option>
                ))}
            </select>
        </div>
    </div>
{userRole === 'HR' && (
    <button
        type="button"
        onClick={() => { setCustomReportContent(''); setShowReportModal(true); }}
        className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300 ease-in-out shadow-md"
    >
        Generate Reports
    </button>
)}
                
            </div>

            {departmentFilter !== 'All' && internsPerDepartment[departmentFilter] !== undefined && (
                <div className="mb-4 text-lg font-semibold text-gray-700">
                    Total Interns in {departmentFilter}: {internsPerDepartment[departmentFilter]}
                </div>
            )}
            {departmentFilter === 'All' && (
                 <div className="mb-4 text-lg font-semibold text-gray-700">
                    Total Interns: {sortedAndFilteredInterns.length}
                </div>
            )}

            {sortedAndFilteredInterns.length === 0 ? (
                <p className="text-gray-600 text-center py-8">No interns found matching your criteria.</p>
            ) : (
                <div className="overflow-x-auto rounded-lg shadow-md">
                    {/* Sorting label display */}
                    {currentSortLabel && (
                        <div className="bg-gray-50 p-2 text-sm font-medium text-gray-600">
                            {currentSortLabel}
                        </div>
                    )}
                    
                    <table className="min-w-full bg-white border-collapse">
                        <thead className="bg-yellow-100 sticky top-0">
                            <tr>
                                <th className="table-header">Picture</th>
                                <th 
                                    className="table-header cursor-pointer hover:bg-yellow-200" 
                                    onClick={() => requestSort('idNumber')}
                                >
                                    <div className="flex items-center">
                                        ID Number
                                        <span className="ml-1">
                                            {sortConfig.key === 'idNumber' ? (
                                                sortConfig.direction === 'ascending' ? '↑' : '↓'
                                            ) : null}
                                        </span>
                                    </div>
                                </th>
                                <th 
                                    className="table-header cursor-pointer hover:bg-yellow-200" 
                                    onClick={() => requestSort('fullName')}
                                >
                                    <div className="flex items-center">
                                        Full Name
                                        <span className="ml-1">
                                            {sortConfig.key === 'fullName' ? (
                                                sortConfig.direction === 'ascending' ? '↑' : '↓'
                                            ) : null}
                                        </span>
                                    </div>
                                </th>
                                <th 
                                    className="table-header cursor-pointer hover:bg-yellow-200" 
                                    onClick={() => requestSort('institution')}
                                >
                                    <div className="flex items-center">
                                        Institution
                                        <span className="ml-1">
                                            {sortConfig.key === 'institution' ? (
                                                sortConfig.direction === 'ascending' ? '↑' : '↓'
                                            ) : null}
                                        </span>
                                    </div>
                                </th>
                                <th 
                                    className="table-header cursor-pointer hover:bg-yellow-200" 
                                    onClick={() => requestSort('department')}
                                >
                                    <div className="flex items-center">
                                        Department
                                        <span className="ml-1">
                                            {sortConfig.key === 'department' ? (
                                                sortConfig.direction === 'ascending' ? '↑' : '↓'
                                            ) : null}
                                        </span>
                                    </div>
                                </th>
                                <th 
                                    className="table-header cursor-pointer hover:bg-yellow-200" 
                                    onClick={() => requestSort('monthJoined')}
                                >
                                    <div className="flex items-center">
                                        Month Joined
                                        <span className="ml-1">
                                            {sortConfig.key === 'monthJoined' ? (
                                                sortConfig.direction === 'ascending' ? '↑' : '↓'
                                            ) : null}
                                        </span>
                                    </div>
                                </th>
                                <th 
                                    className="table-header cursor-pointer hover:bg-yellow-200" 
                                    onClick={() => requestSort('startDate')}
                                >
                                    <div className="flex items-center">
                                        Start Date
                                        <span className="ml-1">
                                            {sortConfig.key === 'startDate' ? (
                                                sortConfig.direction === 'ascending' ? '↑' : '↓'
                                            ) : null}
                                        </span>
                                    </div>
                                </th>
                                <th 
                                    className="table-header cursor-pointer hover:bg-yellow-200" 
                                    onClick={() => requestSort('endDate')}
                                >
                                    <div className="flex items-center">
                                        End Date
                                        <span className="ml-1">
                                            {sortConfig.key === 'endDate' ? (
                                                sortConfig.direction === 'ascending' ? '↑' : '↓'
                                            ) : null}
                                        </span>
                                    </div>
                                </th>
                                <th 
                                    className="table-header cursor-pointer hover:bg-yellow-200" 
                                    onClick={() => requestSort('phoneNumber')}
                                >
                                    <div className="flex items-center">
                                        Phone
                                        <span className="ml-1">
                                            {sortConfig.key === 'phoneNumber' ? (
                                                sortConfig.direction === 'ascending' ? '↑' : '↓'
                                            ) : null}
                                        </span>
                                    </div>
                                </th>
                                <th 
                                    className="table-header cursor-pointer hover:bg-yellow-200" 
                                    onClick={() => requestSort('amountPaid')}
                                >
                                    <div className="flex items-center">
                                        Amount Paid
                                        <span className="ml-1">
                                            {sortConfig.key === 'amountPaid' ? (
                                                sortConfig.direction === 'ascending' ? '↑' : '↓'
                                            ) : null}
                                        </span>
                                    </div>
                                </th>
                                <th 
                                    className="table-header cursor-pointer hover:bg-yellow-200" 
                                    onClick={() => requestSort('receiptNumber')}
                                >
                                    <div className="flex items-center">
                                        Receipt
                                        <span className="ml-1">
                                            {sortConfig.key === 'receiptNumber' ? (
                                                sortConfig.direction === 'ascending' ? '↑' : '↓'
                                            ) : null}
                                        </span>
                                    </div>
                                </th>
                                <th 
                                    className="table-header cursor-pointer hover:bg-yellow-200" 
                                    onClick={() => requestSort('institutionSupervisor')}
                                >
                                    <div className="flex items-center">
                                        Supervisor
                                        <span className="ml-1">
                                            {sortConfig.key === 'institutionSupervisor' ? (
                                                sortConfig.direction === 'ascending' ? '↑' : '↓'
                                            ) : null}
                                        </span>
                                    </div>
                                </th>
                                <th 
                                    className="table-header cursor-pointer hover:bg-yellow-200" 
                                    onClick={() => requestSort('status')}
                                >
                                    <div className="flex items-center">
                                        Status
                                        <span className="ml-1">
                                            {sortConfig.key === 'status' ? (
                                                sortConfig.direction === 'ascending' ? '↑' : '↓'
                                            ) : null}
                                        </span>
                                    </div>
                                </th>
                                <th className="table-header">Progress</th>
                                <th className="table-header">Documents</th>
                                <th className="table-header">Comments</th>
                                <th className="table-header">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedAndFilteredInterns.map((intern) => {
                                const progressStatus = calculateProgress(intern.startDate, intern.endDate);

                                return (
                                    <tr key={intern.idNumber} className="border-b border-gray-200 hover:bg-gray-50 transition-colors duration-150">
                                        <td className="table-cell" data-label="Picture">
                                            <a href={intern.profilePicture ? `/${intern.profilePicture}` : PLACEHOLDER_IMAGE_URL} target="_blank" rel="noopener noreferrer">
                                                <img
                                                    src={intern.profilePicture ? `/${intern.profilePicture}` : PLACEHOLDER_IMAGE_URL}
                                                    alt={intern.fullName}
                                                    className="w-10 h-10 rounded-full object-cover border-2 border-blue-300 shadow-sm transition-transform duration-200 hover:scale-110"
                                                    onError={(e) => { e.target.onerror = null; e.target.src = PLACEHOLDER_IMAGE_URL; }}
                                                />
                                            </a>
                                        </td>
                                        <td className="table-cell" data-label="ID Number">{intern.idNumber}</td>
                                        <td className="table-cell" data-label="Full Name">{intern.fullName}</td>
                                        <td className="table-cell" data-label="Institution">{intern.institution}</td>
                                        <td className="table-cell" data-label="Department">{intern.department}</td>
                                        <td className="table-cell" data-label="Month Joined">{intern.monthJoined}</td>
                                        <td className="table-cell" data-label="Start Date">{intern.startDate ? new Date(intern.startDate).toLocaleDateString() : 'N/A'}</td>
                                        <td className="table-cell" data-label="End Date">{intern.endDate ? new Date(intern.endDate).toLocaleDateString() : 'N/A'}</td>
                                        <td className="table-cell" data-label="Phone Number">{intern.phoneNumber}</td>
                                        <td className="table-cell" data-label="Amount Paid">KES {intern.amountPaid ? intern.amountPaid.toLocaleString() : '0'}</td>
                                        <td className="table-cell" data-label="Receipt Number">{intern.receiptNumber}</td>
                                        <td className="table-cell" data-label="Supervisor">{intern.institutionSupervisor}</td>
                                        <td className="table-cell" data-label="Status">
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                                intern.status === 'Active' ? 'bg-green-100 text-green-800' :
                                                intern.status === 'Suspended' ? 'bg-yellow-100 text-yellow-800' :
                                                intern.status === 'Expelled' ? 'bg-red-100 text-red-800' :
                                                'bg-gray-100 text-gray-800'
                                            }`}>
                                                {intern.status}
                                            </span>
                                                                                                                     </td>
                                        <td className="table-cell" data-label="Progress">
                                            {progressStatus === 'COMPLETED' ? (
                                                <span className="font-bold text-green-700">{progressStatus}</span>
                                            ) : progressStatus === 'Not Started' ? (
                                               
                                                <span className="font-bold text-gray-500">{progressStatus}</span>
                                            )  : (
                                                <div className="w-24 bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                                                    <div
                                                        className="bg-green-600 h-2.5 rounded-full"
                                                        style={{ width: `${parseFloat(progressStatus)}%` }}
                                                        title={`${progressStatus}`}
                                                    ></div>
                                                    <span className="text-xs text-gray-500">{progressStatus}</span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="table-cell" data-label="Documents">
                                            {(intern.attachments || []).map((file, index) => {
                                                const fileName = file.split('/').pop();
                                                return (
                                                    <a key={index} href={`/${file}`} target="_blank" rel="noopener noreferrer"
                                                       className="inline-flex items-center text-blue-600 hover:text-blue-800 hover:underline text-sm mr-2 mb-1"
                                                       title={`View ${fileName}`}
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="M8 12h8"/><path d="M8 18h8"/><path d="M8 15h8"/></svg>
                                                        {fileName}
                                                    </a>
                                                );
                                            })}
                                        </td>
                                        <td className="table-cell" data-label="Comments">
                                            <button
                                                onClick={() => { setCurrentInternForComments(intern); setShowCommentModal(true); }}
                                                className="action-btn bg-blue-500 hover:bg-blue-600 text-white flex items-center"
                                                title="View/Add Comments"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V3a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                                                ({intern.comments ? intern.comments.length : 0})
                                            </button>
                                        </td>
                                        <td className="table-cell" data-label="Actions">
                                            <div className="flex space-x-2">
                                                {userRole === 'Staff' && (
                                                    <>
                                                        <button onClick={() => onEditIntern(intern)} className="action-btn bg-green-500 hover:bg-green-600 text-white" title="Edit Intern">
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
                                                        </button>
                                                        <button onClick={() => handleDeleteIntern(intern.idNumber)} className="action-btn bg-red-500 hover:bg-red-600 text-white" title="Delete Intern">
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                                                        </button>
                                                    </>
                                                )}
                                                <button onClick={() => { setCustomReportContent(''); setShowReportModal(true); handleGenerateReport(intern.idNumber); }} className="action-btn bg-purple-500 hover:bg-purple-600 text-white" title="Generate Report">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="M8 12h8"/><path d="M8 18h8"/><path d="M8 15h8"/></svg>
                                                </button>
                                                {userRole === 'HR' && intern.status === 'Active' && (
                                                    <button onClick={() => handleSuspendExpelIntern(intern.idNumber, 'Suspended')} className="action-btn bg-yellow-600 hover:bg-yellow-700 text-white" title="Suspend Intern">
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>
                                                    </button>
                                                )}
                                                {userRole === 'HR' && intern.status === 'Suspended' && (
                                                    <button onClick={() => handleSuspendExpelIntern(intern.idNumber, 'Expelled')} className="action-btn bg-orange-600 hover:bg-orange-700 text-white" title="Expel Intern">
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                                                    </button>
                                                )}
                                                {userRole === 'HR' && (intern.status === 'Suspended' || intern.status === 'Expelled') && (
                                                    <button onClick={() => handleSuspendExpelIntern(intern.idNumber, 'Active')} className="action-btn bg-green-600 hover:bg-green-700 text-white" title="Reactivate Intern">
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Comment Modal */}
            {showCommentModal && currentInternForComments && (
                <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                        <div className="flex justify-between items-center border-b pb-3 mb-4">
                            <h3 className="text-xl font-semibold text-gray-800">Comments for {currentInternForComments.fullName}</h3>
                            <button onClick={() => setShowCommentModal(false)} className="text-gray-500 hover:text-gray-700">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>
                            </button>
                        </div>
                        <div className="max-h-60 overflow-y-auto mb-4 border p-3 rounded bg-gray-50">
                            {currentInternForComments.comments && currentInternForComments.comments.length > 0 ? (
                                currentInternForComments.comments.map((comment, index) => (
                                    <div key={index} className="mb-3 p-2 bg-white rounded shadow-sm text-sm">
                                        <p className="font-medium text-gray-900">{comment.author} <span className="text-gray-500 text-xs">- {new Date(comment.timestamp).toLocaleDateString()}</span></p>
                                        <p className="text-gray-700">{comment.text}</p>
                                    </div>
                                ))
                            ) : (
                                <p className="text-gray-600 italic">No comments yet.</p>
                            )}
                        </div>
                        <div className="mb-4">
                            <label htmlFor="newComment" className="block text-gray-700 text-sm font-medium mb-1">Add New Comment:</label>
                            <textarea
                                id="newComment"
                                className="form-input w-full h-24"
                                value={newComment}
                                onChange={e => setNewComment(e.target.value)}
                                placeholder="Type your comment here..."
                            ></textarea>
                        </div>
                        <button
                            onClick={handleAddComment}
                            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300 ease-in-out shadow-md"
                        >
                            Submit Comment
                        </button>
                    </div>
                </div>
            )}

            {/* Enhanced Report Generation Modal */}
            {showReportModal && (
                <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl p-4 w-full max-w-5xl flex flex-col md:flex-row md:h-[600px]">
                        {/* Left: Controls */}
                        <div className="md:w-1/2 w-full md:pr-6 md:border-r border-gray-200 flex flex-col overflow-y-auto">
                            <div className="flex justify-between items-center border-b pb-3 mb-4">
                                <h3 className="text-xl font-semibold text-gray-800">Generate Custom Report</h3>
                                <button onClick={() => setShowReportModal(false)} className="text-gray-500 hover:text-gray-700">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>
                                </button>
                            </div>
                            <form className="mb-4">
                                <div className="mb-4 grid grid-cols-1 gap-4">
                                    <div>
                                        <label className="block text-gray-700 text-sm font-medium mb-1">Report Type:</label>
                                        <select className="form-input w-full" value={reportType} onChange={e => setReportType(e.target.value)}>
                                            <option value="all">All Interns</option>
                                            <option value="individual">Individual Intern</option>
                                        </select>
                                    </div>
                                    <div className="mb-4">
                                        <label id="selectIntern" htmlFor="selectIntern" className="block text-gray-700 text-sm font-medium mb-1">Generate Report for:</label>
                                        <select className="form-input w-full" value={selectedInternId || ''} onChange={e => setSelectedInternId(e.target.value)}>
                                            <option value="">-- All Interns --</option>
                                             {interns.map(intern => (
                                            <option key={intern.idNumber} value={intern.idNumber}>
                                             {intern.fullName} ({intern.idNumber})
                                            </option>
                                            ))}</select>
                                    </div>
                                    {/* Department Filter */}
                                    <div>
                                        <label className="block text-gray-700 text-sm font-medium mb-1">Department Filter:</label>
                                        <select className="form-input w-full" value={reportDepartmentFilter} onChange={e => setReportDepartmentFilter(e.target.value)}>
                                            <option value="All">All</option>
                                            {uniqueDepartments.filter(d => d !== 'All').map(d => (
                                                <option key={d} value={d}>{d}</option>
                                            ))}</select>
                                    </div>
                                    <div>
                                        <label className="block text-gray-700 text-sm font-medium mb-1">Institution Filter:</label>
                                        <select className="form-input w-full" value={reportInstitutionFilter} onChange={e => setReportInstitutionFilter(e.target.value)}>
                                            <option value="All">All</option>
                                            {uniqueInstitutions.filter(i => i !== 'All').map(i => (
                                                <option key={i} value={i}>{i}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="mb-4">
                                    <label className="block text-gray-700 text-sm font-medium mb-2">Fields to Include:</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {["profilePicture","fullName","idNumber","institution","department","monthJoined","startDate","endDate","phoneNumber","amountPaid","receiptNumber","institutionSupervisor","status","progress","documents","comments"].map(field => (
                                            <label key={field} className="inline-flex items-center">
                                                <input type="checkbox" className="form-checkbox" checked={reportFields[field]} onChange={e => setReportFields({ ...reportFields, [field]: e.target.checked })} />
                                                <span className="ml-2 capitalize">{field.replace(/([A-Z])/g, ' $1')}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <div className="mb-4">
                                    <label htmlFor="reportContent" className="block text-gray-700 text-sm font-medium mb-1">Custom Notes (Optional):</label>
                                    <textarea
                                        id="reportContent"
                                        className="form-input w-full h-20"
                                        value={customReportContent}
                                        onChange={e => setCustomReportContent(e.target.value)}
                                        placeholder="E.g., 'This report summarizes Q3 intern performance...' "
                                    ></textarea>
                                </div>
                            </form>
                        </div>
                        {/* Right: Preview & Actions */}
                        <div className="md:w-1/2 w-full flex flex-col pl-0 md:pl-6 pt-4 md:pt-0 overflow-y-auto">
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-medium mb-2">Report Preview:</label>
                                <div id="report-preview" className="border rounded p-4 bg-gray-50 max-h-[420px] overflow-y-auto">
                                    {/* Render a preview based on selected filters and fields */}
                                    {renderReportPreview()}
                                </div>
                            </div>
                            <div className="flex gap-4 mt-auto">
                                <button
                                    onClick={handleExportPDF}
                                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300 ease-in-out shadow-md"
                                >
                                    Export as PDF
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}

// Tailwind CSS classes for form inputs (can be moved to style.css if preferred)
const tailwindStyles = `
    .form-input {
        display: block;
        width: 100%;
        padding: 0.75rem 1rem;
        border: 1px solid #d1d5db;
        border-radius: 0.5rem;
        box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
        outline: none;
        transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
    }
    .form-input:focus {
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.5);
    }
    .file-input {
        &::file-selector-button {
            margin-right: 1rem;
            padding-top: 0.5rem;
            padding-bottom: 0.5rem;
            padding-left: 1rem;
            padding-right: 1rem;
            border-radius: 0.5rem;
            border: 0;
            font-size: 0.875rem;
            font-weight: 600;
            background-color: #eff6ff;
            color: #1d4ed8;
            cursor: pointer;
            transition: background-color 0.15s ease-in-out;
        }
        &:hover::file-selector-button {
            background-color: #dbeafe;
        }
    }
    .action-btn {
        padding: 0.5rem;
        border-radius: 0.375rem;
        transition: transform 0.15s ease-in-out, background-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
        box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
        display: inline-flex;
        justify-content: center;
        align-items: center;
    }
    .action-btn:hover {
        transform: scale(1.05);
    }
    .table-header {
        padding: 0.75rem 1.5rem;
        text-align: left;
        font-size: 0.75rem;
        font-weight: 500;
        color: #4b5563;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        cursor: pointer;
        border: none !important; /* Hide table header borders */
        background: #f9fafb;
    }
    .table-cell {
        padding: 1rem 1.5rem;
        white-space: nowrap;
        font-size: 0.875rem;
        color: #1f2937;
        border: none !important; /* Hide table cell borders */
    }
    table, th, td {
        border: none !important; /* Hide all table borders */
    }

    @media (max-width: 768px) {
        .table-header {
            display: none;
        }
        .table-cell {
            display: block;
            text-align: right;
            position: relative;
            padding-left: 10rem;
        }
        .table-cell::before {
            content: attr(data-label);
            position: absolute;
            left: 0;
            width: 9.5rem;
            padding-right: 1rem;
            text-align: left;
            font-weight: 600;
            color: #4b5563;
        }
        .table tbody tr {
            display: block;
            margin-bottom: 1rem;
            border: 1px solid #e5e7eb;
            border-radius: 0.5rem;
            box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
        }
    }
`;

const styleTag = document.createElement('style');
styleTag.innerHTML = tailwindStyles;
document.head.appendChild(styleTag);

const container = document.getElementById('root');
const root = ReactDOM.createRoot(container);
root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
