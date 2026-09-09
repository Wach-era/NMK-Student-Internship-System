import React, { useState, useEffect } from 'react';
import LogoDisplay from './LogoDisplay';

const departments = ['ICT', 'Human Resources', 'Finance', 'Marketing'];

function LoginComponent({ onLoginSuccess }) {
    // OTP states
    const [otpSent, setOtpSent] = useState(false);
    const [step, setStep] = useState('departmentSelection'); // 'otp' → 'departmentSelection' → 'checkEmail'// Change to otp after testing
    const [phoneNumber, setPhoneNumber] = useState('');
    const [code, setCode] = useState('');
    const [otpMessage, setOtpMessage] = useState('');
    const [otpMessageType, setOtpMessageType] = useState('');
    const [sending, setSending] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [resendTimer, setResendTimer] = useState(0);

    // Email/Direct login states
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('');

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    // Resend timer effect
    useEffect(() => {
        if (resendTimer > 0) {
            const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [resendTimer]);

    // --- OTP Handlers ---
    const handleSendCode = async (e) => {
        e.preventDefault();
        setOtpMessage('');
        setOtpMessageType('');
        setSending(true);

        try {
            const res = await fetch(`${API_URL}/auth/send-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phoneNumber }),
                credentials: 'include'
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

    const handleVerifyCode = async (e) => {
        e.preventDefault();
        setOtpMessage('');
        setOtpMessageType('');
        setVerifying(true);

        try {
            const res = await fetch(`${API_URL}/auth/verify-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phoneNumber, code }),
                credentials: 'include'
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

    // --- Department Selection Handler ---
    const handleSelectDepartment = async (department) => {
        setMessage('');
        setMessageType('');

        try {
            const response = await fetch(`${API_URL}/auth/request-magic-link`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ department }),
                credentials: 'include'
            });

            const result = await response.json();

            if (response.ok) {
                setEmail(result.email);
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

                {/* Step 1: OTP Verification */}
                {step === 'otp' && (
                    <form onSubmit={otpSent ? handleVerifyCode : handleSendCode} className="space-y-5">
                        <div>
                            <label htmlFor="phoneNumber" className="block text-gray-700 text-sm font-medium mb-1">
                                Enter your phone number to verify you're human:
                            </label>
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
                                <label htmlFor="code" className="block text-gray-700 text-sm font-medium mb-1">
                                    Enter the code sent to your phone:
                                </label>
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

                {/* Step 2: Department Selection */}
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

                {/* Step 3: Check Email */}
                {step === 'checkEmail' && (
                    <div className="text-center">
                        <p className="text-gray-700 text-lg mb-4">
                            A login link has been sent to <strong>{email}</strong>.
                        </p>
                        <p className="text-gray-600 text-sm mb-6">
                            Please check your email and click the link to log in. The link is valid for 15 minutes.
                        </p>
                        <button
                            onClick={() => {
                                setStep('departmentSelection');
                                setEmail('');
                                setMessage('');
                                setMessageType('');
                            }}
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

export default LoginComponent;