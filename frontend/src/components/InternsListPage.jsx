import React, { useState, useMemo } from 'react';

const PLACEHOLDER_IMAGE_URL = "https://placehold.co/50x50/aabbcc/ffffff?text=NP";

function InternsListPage({ interns, fetchInterns, onEditIntern, onBackToHome, userRole, userEmail, userDepartment }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [departmentFilter, setDepartmentFilter] = useState(userRole === 'Staff' ? userDepartment : 'All');
    const [institutionFilter, setInstitutionFilter] = useState('All');
    const [statusFilter, setStatusFilter] = useState('All');
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
    const [currentSortLabel, setCurrentSortLabel] = useState('');
    const [showCommentModal, setShowCommentModal] = useState(false);
    const [currentInternForComments, setCurrentInternForComments] = useState(null);
    const [newComment, setNewComment] = useState('');
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('');
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportType, setReportType] = useState('all');
    const [selectedInternId, setSelectedInternId] = useState('');
    const [reportStatusFilter, setReportStatusFilter] = useState('All');
    const [reportInstitutionFilter, setReportInstitutionFilter] = useState('All');
    const [reportDepartmentFilter, setReportDepartmentFilter] = useState('All');
    const [reportFields, setReportFields] = useState({
        fullName: true, idNumber: true, institution: true, department: true,
        monthJoined: true, startDate: true, endDate: true, phoneNumber: true,
        amountPaid: true, receiptNumber: true, institutionSupervisor: true,
        status: true, progress: true, comments: true,
    });
    const [customReportContent, setCustomReportContent] = useState('');

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

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

    const uniqueDepartments = useMemo(() => {
        if (userRole === 'Staff' && userDepartment) {
            return ['All', userDepartment].sort();
        }
        const departments = interns.map(intern => intern.department).filter(Boolean);
        return ['All', ...new Set(departments)].sort();
    }, [interns, userRole, userDepartment]);

    const uniqueInstitutions = useMemo(() => {
        const institutions = interns.map(intern => intern.institution).filter(Boolean);
        return ['All', ...new Set(institutions)].sort();
    }, [interns]);

    const allStatuses = ['All', 'Active', 'Suspended', 'Expelled', 'Completed'];

    const sortedAndFilteredInterns = useMemo(() => {
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
            currentInterns = currentInterns.filter(intern => {
                if (statusFilter === 'Completed') {
                    const progressStatus = calculateProgress(intern.startDate, intern.endDate);
                    return intern.status === 'Completed' || progressStatus === 'COMPLETED';
                }
                return intern.status === statusFilter;
            });
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

    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });

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

    const handleDeleteIntern = async (idNumber) => {
        if (!confirm('Are you sure you want to delete this intern? This action cannot be undone.')) {
            return;
        }
        try {
            const res = await fetch(`${API_URL}/interns/${idNumber}`, { method: 'DELETE' });
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
            const res = await fetch(`${API_URL}/interns/${idNumber}/status`, {
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

    const handleAddComment = async () => {
        if (!newComment.trim() || !currentInternForComments) return;

        try {
            const response = await fetch(`${API_URL}/interns/${currentInternForComments.idNumber}/comments`, {
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

    const handleGenerateReport = (internId = null) => {
        const internsToReport = internId ? interns.filter(i => i.idNumber === internId) : sortedAndFilteredInterns;

        if (internsToReport.length === 0) {
            setMessage('No interns to generate report for.');
            setMessageType('error');
            return;
        }

        let reportHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Internship Report</title>
                <style>
                    body { font-family: sans-serif; margin: 20px; color: #333; }
                    h1 { color: #8B0000; text-align: center; }
                    h2 { color: #A0522D; border-bottom: 1px solid #eee; padding-bottom: 5px; margin-top: 30px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #f2f2f2; }
                    img { max-width: 80px; border-radius: 50%; border: 2px solid #ccc; }
                    .section { margin-bottom: 30px; padding: 15px; border: 1px solid #eee; border-radius: 8px; background: #fdfdfd; }
                    .report-meta { font-size: 0.9em; color: #555; margin-bottom: 20px; }
                </style>
            </head>
            <body>
                <h1>National Museums of Kenya Internship Report</h1>
                <div class="report-meta">
                    <p>Generated By: <strong>${userEmail} (${userRole})</strong></p>
                    <p>Generated On: ${new Date().toLocaleString()}</p>
                    <p>Total Interns: <strong>${internsToReport.length}</strong></p>
                </div>
        `;

        internsToReport.forEach(intern => {
            reportHtml += `
                <div class="section">
                    <h2>${intern.fullName} (ID: ${intern.idNumber})</h2>
                    <p><strong>Institution:</strong> ${intern.institution}</p>
                    <p><strong>Department:</strong> ${intern.department}</p>
                    <p><strong>Progress:</strong> ${calculateProgress(intern.startDate, intern.endDate)}</p>
                    <p><strong>Status:</strong> ${intern.status}</p>
                </div>
            `;
        });

        reportHtml += `</body></html>`;

        const newWindow = window.open('', '_blank');
        newWindow.document.write(reportHtml);
        newWindow.document.close();
        newWindow.focus();
    };

    return (
        <section className="bg-white p-6 md:p-8 rounded-xl shadow-lg">
            <div className="flex justify-between items-center mb-6 border-b-2 border-yellow-600 pb-3">
                <h2 className="text-3xl font-semibold text-red-800">Full Intern List</h2>
                {userRole === 'Staff' && (
                    <button onClick={onBackToHome} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300 ease-in-out transform hover:scale-105 shadow-md flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                            <path d="M12 5v14M5 12h14"/>
                        </svg>
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Search Interns</label>
                    <input
                        type="text"
                        placeholder="Search interns..."
                        className="form-input pl-16 h-12 w-full"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="w-full md:w-48">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                    <select
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
                <div className="w-full md:w-48">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Institution</label>
                    <select
                        className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 sm:text-sm rounded-md"
                        value={institutionFilter}
                        onChange={(e) => setInstitutionFilter(e.target.value)}
                    >
                        {uniqueInstitutions.map((inst) => (
                            <option key={inst} value={inst}>{inst}</option>
                        ))}
                    </select>
                </div>
                <div className="w-full md:w-48">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                        className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 sm:text-sm rounded-md"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        {allStatuses.map((status) => (
                            <option key={status} value={status}>{status}</option>
                        ))}
                    </select>
                </div>
                {userRole === 'HR' && (
                    <button
                        onClick={() => setShowReportModal(true)}
                        className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300 ease-in-out shadow-md"
                    >
                        Generate Reports
                    </button>
                )}
            </div>

            {/* Table - Same as original */}
            {sortedAndFilteredInterns.length === 0 ? (
                <p className="text-gray-600 text-center py-8">No interns found matching your criteria.</p>
            ) : (
                <div className="overflow-x-auto rounded-lg shadow-md">
                    {currentSortLabel && (
                        <div className="bg-gray-50 p-2 text-sm font-medium text-gray-600">
                            {currentSortLabel}
                        </div>
                    )}
                    <table className="min-w-full bg-white border-collapse">
                        <thead className="bg-yellow-100 sticky top-0">
                            <tr>
                                <th className="table-header">Picture</th>
                                <th className="table-header cursor-pointer hover:bg-yellow-200" onClick={() => requestSort('idNumber')}>
                                    ID Number {sortConfig.key === 'idNumber' ? (sortConfig.direction === 'ascending' ? '↑' : '↓') : null}
                                </th>
                                <th className="table-header cursor-pointer hover:bg-yellow-200" onClick={() => requestSort('fullName')}>
                                    Full Name {sortConfig.key === 'fullName' ? (sortConfig.direction === 'ascending' ? '↑' : '↓') : null}
                                </th>
                                <th className="table-header cursor-pointer hover:bg-yellow-200" onClick={() => requestSort('institution')}>
                                    Institution {sortConfig.key === 'institution' ? (sortConfig.direction === 'ascending' ? '↑' : '↓') : null}
                                </th>
                                <th className="table-header cursor-pointer hover:bg-yellow-200" onClick={() => requestSort('department')}>
                                    Department {sortConfig.key === 'department' ? (sortConfig.direction === 'ascending' ? '↑' : '↓') : null}
                                </th>
                                <th className="table-header cursor-pointer hover:bg-yellow-200" onClick={() => requestSort('monthJoined')}>
                                    Month Joined {sortConfig.key === 'monthJoined' ? (sortConfig.direction === 'ascending' ? '↑' : '↓') : null}
                                </th>
                                <th className="table-header cursor-pointer hover:bg-yellow-200" onClick={() => requestSort('status')}>
                                    Status {sortConfig.key === 'status' ? (sortConfig.direction === 'ascending' ? '↑' : '↓') : null}
                                </th>
                                <th className="table-header">Progress</th>
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
                                            <img
                                                src={intern.profilePicture ? `/${intern.profilePicture}` : PLACEHOLDER_IMAGE_URL}
                                                alt={intern.fullName}
                                                className="w-10 h-10 rounded-full object-cover border-2 border-blue-300 shadow-sm"
                                                onError={(e) => { e.target.onerror = null; e.target.src = PLACEHOLDER_IMAGE_URL; }}
                                            />
                                        </td>
                                        <td className="table-cell" data-label="ID Number">{intern.idNumber}</td>
                                        <td className="table-cell" data-label="Full Name">{intern.fullName}</td>
                                        <td className="table-cell" data-label="Institution">{intern.institution}</td>
                                        <td className="table-cell" data-label="Department">{intern.department}</td>
                                        <td className="table-cell" data-label="Month Joined">{intern.monthJoined}</td>
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
                                            ) : (
                                                <div className="w-24 bg-gray-200 rounded-full h-2.5">
                                                    <div className="bg-green-600 h-2.5 rounded-full" style={{ width: `${parseFloat(progressStatus)}%` }}></div>
                                                    <span className="text-xs text-gray-500">{progressStatus}</span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="table-cell" data-label="Comments">
                                            <button
                                                onClick={() => { setCurrentInternForComments(intern); setShowCommentModal(true); }}
                                                className="action-btn bg-blue-500 hover:bg-blue-600 text-white flex items-center"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                                                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V3a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                                                </svg>
                                                ({intern.comments ? intern.comments.length : 0})
                                            </button>
                                        </td>
                                        <td className="table-cell" data-label="Actions">
                                            <div className="flex space-x-2">
                                                {userRole === 'Staff' && (
                                                    <>
                                                        <button onClick={() => onEditIntern(intern)} className="action-btn bg-green-500 hover:bg-green-600 text-white" title="Edit Intern">
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
                                                            </svg>
                                                        </button>
                                                        <button onClick={() => handleDeleteIntern(intern.idNumber)} className="action-btn bg-red-500 hover:bg-red-600 text-white" title="Delete Intern">
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                                                            </svg>
                                                        </button>
                                                    </>
                                                )}
                                                <button onClick={() => handleGenerateReport(intern.idNumber)} className="action-btn bg-purple-500 hover:bg-purple-600 text-white" title="Generate Report">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                                                        <polyline points="14 2 14 8 20 8"/>
                                                    </svg>
                                                </button>
                                                {userRole === 'HR' && intern.status === 'Active' && (
                                                    <button onClick={() => handleSuspendExpelIntern(intern.idNumber, 'Suspended')} className="action-btn bg-yellow-600 hover:bg-yellow-700 text-white" title="Suspend">
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/>
                                                        </svg>
                                                    </button>
                                                )}
                                                {userRole === 'HR' && intern.status === 'Suspended' && (
                                                    <>
                                                        <button onClick={() => handleSuspendExpelIntern(intern.idNumber, 'Active')} className="action-btn bg-green-600 hover:bg-green-700 text-white" title="Reactivate">
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/>
                                                            </svg>
                                                        </button>
                                                        <button onClick={() => handleSuspendExpelIntern(intern.idNumber, 'Expelled')} className="action-btn bg-red-600 hover:bg-red-700 text-white" title="Expel">
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
                                                            </svg>
                                                        </button>
                                                    </>
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
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/>
                                </svg>
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
                        <button onClick={handleAddComment} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300 ease-in-out shadow-md">
                            Submit Comment
                        </button>
                    </div>
                </div>
            )}
        </section>
    );
}

export default InternsListPage;