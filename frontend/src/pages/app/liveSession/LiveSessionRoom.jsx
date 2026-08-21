import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import axios from "../../../services/axios";
import { useStore } from "../../../zustand/store";
import LiveSessionHostConsole from "./LiveSessionHostConsole";
import LiveSessionWaitingRoom from "./LiveSessionWaitingRoom";
import GroupVideoCallRoom from "./GroupVideoCallRoom";
import FullScreenLoader from "../../Loading";

export default function LiveSessionRoom() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useStore();

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);

  const socketRef = useRef(null);

  // Initialize Socket connection
  useEffect(() => {
    if (!user?._id) return;
    const backendUrl = import.meta.env.VITE_REACT_APP_BACKEND_URL || "http://localhost:4000";
    const s = io(backendUrl, {
      withCredentials: true,
      auth: { userId: String(user._id) },
      query: { userId: String(user._id) },
      transports: ["websocket", "polling"],
    });
    socketRef.current = s;
    setSocket(s);

    s.on("connect", () => {
      s.emit("live-session:join-room", { sessionId: id });
    });

    s.on("disconnect", () => {
      // keep socket object for reconnect
    });

    s.on("live-session:ended", () => {
      navigate("/live_sessions");
    });

    return () => {
      s.emit("live-session:leave-room", { sessionId: id });
      s.disconnect();
      setSocket(null);
    };
  }, [id, user?._id, navigate]);

  // Fetch session details
  const fetchSession = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/live-sessions/${id}`);
      if (res.data?.status === 1) {
        setSession(res.data.session);
      } else {
        navigate("/live_sessions");
      }
    } catch (err) {
      console.error("Error fetching session:", err);
      navigate("/live_sessions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchSession();
    }
  }, [id]);

  if (loading || !session) {
    return <FullScreenLoader message="Entering Live Session..." />;
  }

  const isHost = String(session.host?._id || session.host) === String(user?._id);

  // Group Call Experience (Zoom-style)
  if (session.sessionFormat === "Group Call") {
    return (
      <GroupVideoCallRoom
        session={session}
        socket={socket}
        onLeave={() => navigate("/live_sessions")}
      />
    );
  }

  // 1-to-1 Queue Experience (Host Console / Waiting Room)
  if (isHost) {
    return (
      <LiveSessionHostConsole
        session={session}
        socket={socket}
        onSessionUpdate={(updated) => setSession(updated)}
        onSessionDeleted={() => navigate("/live_sessions")}
      />
    );
  }

  return (
    <LiveSessionWaitingRoom
      session={session}
      socket={socket}
      onSessionUpdate={(updated) => setSession(updated)}
    />
  );
}
