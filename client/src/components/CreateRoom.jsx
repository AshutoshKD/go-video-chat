import React from "react";

const CreateRoom = (props) => {
    const create = async (e) => {
        e.preventDefault();

        const resp = await fetch(" https://go-video-chat-backend.onrender.com/create");
        const { room_id } = await resp.json();

		props.history.push(`/room/${room_id}`)
    };

    const styles = {
        container: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            backgroundColor: '#f0f4f8',
            fontFamily: 'Arial, sans-serif',
        },
        header: {
            fontSize: '2.5rem',
            marginBottom: '10px',
            color: '#333',
        },
        description: {
            fontSize: '1.2rem',
            marginBottom: '20px',
            color: '#666',
        },
        button: {
            padding: '10px 20px',
            fontSize: '1.2rem',
            color: '#fff',
            backgroundColor: '#007bff',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            transition: 'background-color 0.3s ease',
        },
        buttonHover: {
            backgroundColor: '#0056b3',
        }
    };

    return (
        <div style={styles.container}>
            <h1 style={styles.header}>Welcome to the Video Chat App</h1>
            <p style={styles.description}>Click below to create a new room and start chatting!</p>
            <button style={styles.button} onClick={create}>Create Room</button>
        </div>


    );
};

export default CreateRoom;
