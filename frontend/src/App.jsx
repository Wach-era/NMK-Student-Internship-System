import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import LoginComponent from './components/LoginComponent';
import LandingPage from './components/LandingPage';
import InternForm from './components/InternForm';
import RecentlyAddedInterns from './components/RecentlyAddedInterns';
import InternsListPage from './components/InternsListPage';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function App() {
    const [currentPage, setCurrentPage] = useState('loading');
    const [interns, setInterns] = useState([]);
    const [editInternData, setEditInternData] = useState(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userRole, setUserRole] = useState(null);
    const [userEmail, setUserEmail] = useState(null);
    const [userDepartment, setUserDepartment] = useState(null);

    useEffect(() => {
        const verifyAuth = async () => {
            const params = new URLSearchParams(window.location.search);
            const token = params.get('token');

            if (token) {
                try {
                    window.history.replaceState({}, document.title, window.location.pathname);
                    const response = await fetch(`${API_URL}/auth/verify-magic-link`, {
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
                try {
                    const response = await fetch(`${API_URL}/auth/check-session`, {
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

        let url = `${API_URL}/interns`;
        if (userRole === 'Staff' && userDepartment) {
            url = `${API_URL}/interns?department=${encodeURIComponent(userDepartment)}`;
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
            await fetch(`${API_URL}/auth/logout`, {
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
        <div className="min-h-screen bg-gray-100 font-sans antialiased text-gray-800">
            {currentPage !== 'landing' && currentPage !== 'login' && (
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
                <Footer />
            )}
        </div>
    );
}

export default App;