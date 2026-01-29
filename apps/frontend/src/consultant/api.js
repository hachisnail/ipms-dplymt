// api.js - Centralized API calls for Profile and Auth

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3006/api';
// Helper to get auth token
const getAuthToken = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.token || '';
};

// Helper to get user ID
const getUserId = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.id || null;
};

// ================================================================
// PROFILE API CALLS
// ================================================================

/**
 * Get current user profile from backend
 */
export const getProfile = async () => {
    try {
        const token = getAuthToken();
        const response = await fetch(`${API_BASE_URL}/auth/profile`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to fetch profile');
        }

        return {
            success: true,
            data: data.data
        };
    } catch (error) {
        console.error('Get profile error:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * Update user profile
 * @param {Object} profileData - { full_name, email, profile_picture }
 */
export const updateProfile = async (profileData) => {
    try {
        const token = getAuthToken();
        const response = await fetch(`${API_BASE_URL}/users/profile`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(profileData)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to update profile');
        }

        // Update localStorage with new data
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        localStorage.setItem('user', JSON.stringify({
            ...userData,
            fullName: profileData.full_name,
            email: profileData.email,
            profilePicture: profileData.profile_picture
        }));

        // Dispatch custom event to notify other components
        window.dispatchEvent(new CustomEvent('profileUpdated', {
            detail: {
                fullName: profileData.full_name,
                email: profileData.email,
                profilePicture: profileData.profile_picture
            }
        }));

        return {
            success: true,
            message: data.message
        };
    } catch (error) {
        console.error('Update profile error:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * Upload profile picture
 * @param {File} file - Image file
 */
export const uploadProfilePicture = async (file) => {
    try {
        const token = getAuthToken();
        const formData = new FormData();
        formData.append('profilePicture', file);

        const response = await fetch(`${API_BASE_URL}/users/profile-picture`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
                // Don't set Content-Type - browser will set it with boundary
            },
            credentials: 'include',
            body: formData
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to upload image');
        }

        // Update localStorage
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        const profilePictureUrl = `http://${API_BASE_URL.replace('/api', '')}/uploads/profile-pictures/${data.filename}`;
        
        localStorage.setItem('user', JSON.stringify({
            ...userData,
            profilePicture: profilePictureUrl
        }));

        // Dispatch event
        window.dispatchEvent(new CustomEvent('profileUpdated', {
            detail: {
                profilePicture: profilePictureUrl
            }
        }));

        return {
            success: true,
            filename: data.filename,
            url: profilePictureUrl
        };
    } catch (error) {
        console.error('Upload profile picture error:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * Delete profile picture (reset to default)
 */
export const deleteProfilePicture = async () => {
    try {
        const token = getAuthToken();
        const response = await fetch(`${API_BASE_URL}/users/profile-picture`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to delete image');
        }

        // Update localStorage
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        localStorage.setItem('user', JSON.stringify({
            ...userData,
            profilePicture: null
        }));

        // Dispatch event
        window.dispatchEvent(new CustomEvent('profileUpdated', {
            detail: {
                profilePicture: null
            }
        }));

        return {
            success: true,
            message: data.message
        };
    } catch (error) {
        console.error('Delete profile picture error:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

// ================================================================
// HELPER FUNCTIONS
// ================================================================

/**
 * Get profile picture URL (handles both relative and absolute paths)
 */
export const getProfilePictureUrl = (profilePicture) => {
    if (!profilePicture) {
        return 'https://placehold.co/140x140/3b82f6/ffffff?text=User';
    }
    
    // If already full URL, return as is
    if (profilePicture.startsWith('http')) {
        return profilePicture;
    }
    
    // If relative path, construct full URL
    return `http://${API_BASE_URL.replace('/api', '')}/uploads/profile-pictures/${profilePicture}`;
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = () => {
    const token = getAuthToken();
    return !!token;
};

/**
 * Logout user
 */
export const logout = async () => {
    try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const token = user.token;

        if (token) {
            await fetch(`${API_BASE_URL}/auth/logout`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ sessionToken: token })
            });
        }

        // Clear localStorage
        localStorage.clear();
        
        // Redirect to login
        window.location.href = '/';
    } catch (error) {
        console.error('Logout error:', error);
        // Even if API call fails, clear local storage and redirect
        localStorage.clear();
        window.location.href = '/';
    }
};

export default {
    getProfile,
    updateProfile,
    uploadProfilePicture,
    deleteProfilePicture,
    getProfilePictureUrl,
    isAuthenticated,
    logout
};