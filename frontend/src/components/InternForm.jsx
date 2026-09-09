import React, { useState, useEffect } from 'react';

const PLACEHOLDER_IMAGE_URL = "https://placehold.co/50x50/aabbcc/ffffff?text=NP";

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

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

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
                response = await fetch(`${API_URL}/interns/${formData.idNumber}`, {
                    method: 'PUT',
                    body: data,
                });
            } else {
                response = await fetch(`${API_URL}/interns`, {
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
                    <label htmlFor="monthJoined" className="block text-gray-700 text-sm font-medium mb-1">Month Joined <span className="text-red-500">*</span></label>
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

                {/* Documents Upload */}
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
                        <button type="button" onClick={() => { onFormSuccess(); }} className="w-full bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-4 rounded-lg mt-3 transition duration-300 ease-in-out transform hover:scale-105 shadow-md">
                            Cancel Edit
                        </button>
                    )}
                </div>
            </form>
        </section>
    );
}

export default InternForm;