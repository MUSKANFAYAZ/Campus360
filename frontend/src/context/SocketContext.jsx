import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { toast } from 'react-toastify';
import axios from 'axios';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const token = localStorage.getItem('token');

    useEffect(() => {
        //Initialize Socket Connection
        const newSocket = io('http://localhost:5000');
        setSocket(newSocket);

        newSocket.on("receive_notification", (data) => {

            try {
                const audio = new Audio('/notification.mp3'); 
                audio.play().catch(err => {
                    // Browsers block audio if user hasn't interacted with page yet
                    console.warn("Audio blocked:", err);
                });
            } catch (e) {
                console.error("Audio error", e);
            }
            // Displaying the pop-up using React Toastify
            toast.info(
                <div>
                    <strong>{data.title}</strong>
                    <br/>
                    {data.message}
                </div>, 
                { position: "top-right", autoClose: 5000 }
            );
        });

        if (token) {
            // We need to fetch the list of clubs the user follows to join their rooms
            axios.get('/api/auth/me', { headers: { 'x-auth-token': token } })
                .then(res => {
                    const followedClubs = res.data.followedClubs || [];
                    const clubIds = followedClubs.map(club => club._id); 
                    
                    // to backend: "I want updates for these clubs"
                    newSocket.emit("join_club_rooms", clubIds);
                })
                .catch(err => console.error("Socket Room Error:", err));
        }

        return () => newSocket.close();
    }, [token]);

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
};