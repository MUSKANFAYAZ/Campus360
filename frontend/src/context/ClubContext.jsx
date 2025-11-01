import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const ClubContext = createContext();

// Create a custom hook to easily access the context
export const useClub = () => {
    return useContext(ClubContext);
};

export const ClubProvider = ({ children }) => {
    const [clubData, setClubData] = useState(undefined); // undefined = loading
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');

    // This function fetches the data.
    const fetchClubData = useCallback(async () => {
        // Only fetch if the user is a club rep
        if (userRole === 'club' && token) {
            setIsLoading(true);
            try {
                const res = await axios.get("/api/clubs/myclub", { headers: { 'x-auth-token': token } });
                setClubData(res.data); // Store the full response (or null)
            } catch (err) {
                console.error("ClubContext Error:", err.response?.data?.msg || err.message);
                if (err.response?.status === 401) navigate('/login');
                setError('Failed to load club data.');
                setClubData(null); // Set to null on error
            } finally {
                setIsLoading(false);
            }
        } else {
            setIsLoading(false); // Not a club user, stop loading
        }
    }, [userRole, token, navigate]);

    // Fetch data when the provider loads
    useEffect(() => {
        fetchClubData();
    }, [fetchClubData]);

    // The value provided to all child components
    const value = {
        clubData,       // The { clubDetails, ... } object or null
        isLoading,      // Is the context loading?
        error,          // Any fetch error
        refetchClubData: fetchClubData // A function to manually refresh
    };

    return (
        <ClubContext.Provider value={value}>
            {children}
        </ClubContext.Provider>
    );
};