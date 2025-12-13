import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const ClubContext = createContext();

export const useClub = () => {
    return useContext(ClubContext);
};

export const ClubProvider = ({ children }) => {
    const [clubData, setClubData] = useState(undefined);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');

    const fetchClubData = useCallback(async () => {
        if (userRole === 'club' && token) {
            setIsLoading(true);
            try {
                const res = await axios.get("/api/clubs/myclub", { headers: { 'x-auth-token': token } });
                setClubData(res.data);
            } catch (err) {
                console.error("ClubContext Error:", err.response?.data?.msg || err.message);
                if (err.response?.status === 401) navigate('/login');
                setError('Failed to load club data.');
                setClubData(null);
            } finally {
                setIsLoading(false);
            }
        } else {
            setIsLoading(false); 
        }
    }, [userRole, token, navigate]);

    useEffect(() => {
        fetchClubData();
    }, [fetchClubData]);

   
    const value = {
        clubData,     
        isLoading,     
        error,          
        refetchClubData: fetchClubData 
    };

    return (
        <ClubContext.Provider value={value}>
            {children}
        </ClubContext.Provider>
    );
};