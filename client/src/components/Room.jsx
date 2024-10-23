import React, { useEffect, useRef } from "react";

const Room = (props) => {
    const userVideo = useRef();
    const userStream = useRef();
    const partnerVideo = useRef();
    const peerRef = useRef();
    const webSocketRef = useRef();

    const openCamera = async () => {
        const allDevices = await navigator.mediaDevices.enumerateDevices();
        const cameras = allDevices.filter(
            (device) => device.kind === "videoinput"
        );

        if (cameras.length === 0) {
            console.error("No cameras found.");
            alert("No camera devices found. Please connect a camera.");
            return; // Exit the function if no cameras are available
        }

        console.log(cameras);

        const constraints = {
            audio: true,
            video: {
                deviceId: cameras[0].deviceId, // Use the first available camera
            },
        };

        try {
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            return stream; // Return the stream for use
        } catch (err) {
            console.log("Error accessing media devices:", err);
        }
    };

    useEffect(() => {
        openCamera().then((stream) => {
            userVideo.current.srcObject = stream;
            userStream.current = stream;

            // Determine the WebSocket protocol based on the current page protocol
            const protocol = window.location.protocol === "https:" ? "wss://" : "ws://";
            const webSocketURL = `${protocol}go-video-chat-backend.onrender.com/join?roomID=${props.match.params.roomID}`;

            webSocketRef.current = new WebSocket(webSocketURL);

            webSocketRef.current.addEventListener("open", () => {
                console.log("WebSocket connection established.");
                webSocketRef.current.send(JSON.stringify({ join: true }));
            });

            webSocketRef.current.addEventListener("error", (error) => {
                console.error("WebSocket error:", error);
            });

            webSocketRef.current.addEventListener("close", () => {
                console.log("WebSocket connection closed.");
            });

            webSocketRef.current.addEventListener("message", async (e) => {
                const message = JSON.parse(e.data);

                if (message.join) {
                    callUser();
                }

                if (message.offer) {
                    handleOffer(message.offer);
                }

                if (message.answer) {
                    console.log("Receiving Answer");
                    peerRef.current.setRemoteDescription(
                        new RTCSessionDescription(message.answer)
                    ).then(() => {
                        console.log("Remote description set successfully.");
                    }).catch(err => {
                        console.error("Error setting remote description:", err);
                    });
                }

                if (message.iceCandidate) {
                    console.log("Receiving and Adding ICE Candidate");
                    try {
                        await peerRef.current.addIceCandidate(
                            message.iceCandidate
                        );
                        console.log("ICE Candidate added successfully.");
                    } catch (err) {
                        console.log("Error Receiving ICE Candidate", err);
                    }
                }
            });
        });
    }, [props.match.params.roomID]); // Add dependency to useEffect

    const handleOffer = async (offer) => {
        console.log("Received Offer, Creating Answer");
        peerRef.current = createPeer();

        await peerRef.current.setRemoteDescription(
            new RTCSessionDescription(offer)
        ).then(() => {
            console.log("Remote description set successfully.");
        }).catch(err => {
            console.error("Error setting remote description:", err);
        });

        userStream.current.getTracks().forEach((track) => {
            peerRef.current.addTrack(track, userStream.current);
        });

        const answer = await peerRef.current.createAnswer();
        await peerRef.current.setLocalDescription(answer);

        webSocketRef.current.send(
            JSON.stringify({ answer: peerRef.current.localDescription })
        );
    };

    const callUser = () => {
        console.log("Calling Other User");
        peerRef.current = createPeer();

        userStream.current.getTracks().forEach((track) => {
            peerRef.current.addTrack(track, userStream.current);
        });
    };

    const createPeer = () => {
        console.log("Creating Peer Connection");
        const peer = new RTCPeerConnection({
            iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
        });

        peer.onnegotiationneeded = handleNegotiationNeeded;
        peer.onicecandidate = handleIceCandidateEvent;
        peer.ontrack = handleTrackEvent;

        peer.onconnectionstatechange = () => {
            console.log("Connection state changed to:", peer.connectionState);
            if (peer.connectionState === "connected") {
                console.log("Peer connection established successfully.");
            } else if (peer.connectionState === "disconnected") {
                console.log("Peer connection disconnected.");
            }
        };

        return peer;
    };

    const handleNegotiationNeeded = async () => {
        console.log("Creating Offer");

        try {
            const myOffer = await peerRef.current.createOffer();
            await peerRef.current.setLocalDescription(myOffer);

            webSocketRef.current.send(
                JSON.stringify({ offer: peerRef.current.localDescription })
            );
        } catch (err) {
            console.error("Error during negotiation:", err);
        }
    };

    const handleIceCandidateEvent = (e) => {
        console.log("Found Ice Candidate");
        if (e.candidate) {
            console.log(e.candidate);
            webSocketRef.current.send(
                JSON.stringify({ iceCandidate: e.candidate })
            );
        }
    };

    const handleTrackEvent = (e) => {
        console.log("Received Tracks");
        partnerVideo.current.srcObject = e.streams[0];
    };


    const copyToClipboard = () => {
        const roomUrl = window.location.href; 
        navigator.clipboard.writeText(roomUrl)
            .then(() => {
                alert("Room URL copied to clipboard!"); 
            })
            .catch(err => {
                console.error("Failed to copy: ", err);
            });
    };

    useEffect(() => {
    }, [props.match.params.roomID]);

    const styles = {
        container: {
            textAlign: 'center',
            marginTop: '20px',
        },
        videoContainer: {
            display: 'flex',
            justifyContent: 'center',
            marginBottom: '20px',
        },
        video: {
            width: '45%',
            margin: '0 10px',
            borderRadius: '8px',
            border: '2px solid #ccc',
        },
        button: {
            padding: '10px 20px',
            fontSize: '16px',
            color: 'white',
            backgroundColor: '#007bff',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            transition: 'background-color 0.3s ease',
        },
        buttonHover: {
            backgroundColor: '#0056b3',
        },
    };

    return (
        <div style={styles.container}>
            <h2>Room ID: {props.match.params.roomID}</h2>
            <div style={styles.videoContainer}>
                <video autoPlay controls={true} ref={userVideo} style={styles.video}></video>
                <video autoPlay controls={true} ref={partnerVideo} style={styles.video}></video>
            </div>
            <button 
                onClick={copyToClipboard} 
                style={styles.button}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = styles.buttonHover.backgroundColor} // Change color on hover
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = styles.button.backgroundColor} // Reset color
            >
                Copy Room URL
            </button>
        </div>
    );
};

export default Room;