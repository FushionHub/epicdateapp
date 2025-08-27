import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import { getMessages, sendMessage, sendMediaMessage, getProfile, sendIncomingCallSignal, editMessage, markMessageAsViewed } from '../services/supabaseService';
import OutgoingCallModal from '../components/OutgoingCallModal';
import ViewOnceMessage from '../components/ViewOnceMessage'; // Import the new component

const ChatPage = () => {
  const { matchId } = useParams();
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [editingMessage, setEditingMessage] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [loading, setLoading] = useState(true);
  const [otherUser, setOtherUser] = useState(null);
  const [isCalling, setIsCalling] = useState(false);
  const [isViewOnce, setIsViewOnce] = useState(false); // State for view-once checkbox
  const messagesEndRef = useRef(null);
  const supabaseChannelRef = useRef(null);
  const navigate = useNavigate();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      const initialMessages = await getMessages(matchId);
      setMessages(initialMessages);
      setLoading(false);
    };
    fetchInitialData();

    const channel = supabase.channel(`chat-${matchId}`);
    supabaseChannelRef.current = channel;

    channel
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages', filter: `match_id=eq.${matchId}` }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const fetchNewMessage = async () => {
            const { data } = await supabase.from('messages').select(`*, sender:profiles(name, photos)`).eq('id', payload.new.id).single();
            setMessages((prevMessages) => [...prevMessages, data]);
          };
          fetchNewMessage();
        }
        if (payload.eventType === 'UPDATE') {
          setMessages(prevMessages =>
            prevMessages.map(msg => msg.id === payload.new.id ? { ...msg, ...payload.new } : msg)
          );
        }
      })
      .on('broadcast', { event: 'call-accepted' }, ({ payload }) => {
          if (payload.callerId === currentUser.uid) {
              setIsCalling(false);
              navigate(`/call/${matchId}`);
          }
      })
      .on('broadcast', { event: 'call-declined' }, ({ payload }) => {
          if (payload.callerId === currentUser.uid) {
              setIsCalling(false);
              alert('Call declined.');
          }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [matchId, currentUser.uid, navigate]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (newMessage.trim() === '') return;
    await sendMessage(matchId, currentUser.uid, newMessage);
    setNewMessage('');
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const messageType = file.type.startsWith('image') ? 'image' : file.type.startsWith('video') ? 'video' : 'audio';
    await sendMediaMessage(matchId, currentUser.uid, file, messageType, isViewOnce);
    // Reset after sending
    setIsViewOnce(false);
    e.target.value = null; // Clear the file input
  };

  const handleStartCall = async () => {
    const { data: matchData } = await supabase.from('matches').select('user1_id, user2_id').eq('id', matchId).single();
    if (matchData) {
        const otherUserId = matchData.user1_id === currentUser.uid ? matchData.user2_id : matchData.user1_id;
        const profile = await getProfile(otherUserId);
        setOtherUser(profile);
        setIsCalling(true);
        await sendIncomingCallSignal(currentUser.uid, otherUserId, matchId);
    }
  };

  const handleEditClick = (message) => {
    setEditingMessage(message);
    setEditingText(message.text_content);
  };

  const handleSaveEdit = async () => {
    if (!editingMessage || editingText.trim() === '') return;
    await editMessage(editingMessage.id, editingText);
    setEditingMessage(null);
    setEditingText('');
  };

  if (loading) return <div>Loading chat...</div>;

  return (
    <div>
      {isCalling && otherUser && <OutgoingCallModal callee={otherUser} onCancel={() => setIsCalling(false)} />}
      <Link to="/matches">Back to Matches</Link>
      <button onClick={handleStartCall} style={{float: 'right'}}>Start Video Call</button>
      <h2>Chat</h2>
      <div style={{ height: '400px', overflowY: 'scroll', border: '1px solid #ccc', padding: '10px' }}>
        {messages.map(msg => (
          <div key={msg.id} style={{ textAlign: msg.sender_id === currentUser.uid ? 'right' : 'left', marginBottom: '10px' }}>
            <p><strong>{msg.sender.name}</strong></p>
            {editingMessage && editingMessage.id === msg.id ? (
              <div>
                <input type="text" value={editingText} onChange={(e) => setEditingText(e.target.value)} />
                <button onClick={handleSaveEdit}>Save</button>
                <button onClick={() => setEditingMessage(null)}>Cancel</button>
              </div>
            ) : (
              <>
                {msg.is_view_once ? (
                  <ViewOnceMessage message={msg} />
                ) : (
                  <>
                    {msg.message_type === 'text' && <p>{msg.text_content} {msg.is_edited && <em>(edited)</em>}</p>}
                    {msg.message_type === 'image' && <img src={msg.media_url} alt="chat" style={{ maxWidth: '200px' }} />}
                    {msg.message_type === 'video' && <video src={msg.media_url} controls style={{ maxWidth: '200px' }} />}
                    {msg.message_type === 'audio' && <audio src={msg.media_url} controls />}
                  </>
                )}
                {msg.sender_id === currentUser.uid && msg.message_type === 'text' && (
                  <button onClick={() => handleEditClick(msg)}>Edit</button>
                )}
              </>
            )}
            <small>{new Date(msg.created_at).toLocaleTimeString()}</small>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSendMessage}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
        />
        <button type="submit">Send</button>
      </form>
      <div>
        <input type="file" id="file-upload" onChange={handleFileUpload} style={{ display: 'none' }} />
        <label htmlFor="file-upload" style={{ cursor: 'pointer', padding: '5px', border: '1px solid #ccc', borderRadius: '4px' }}>
          Attach File
        </label>
        <label style={{ marginLeft: '10px' }}>
          <input
            type="checkbox"
            checked={isViewOnce}
            onChange={(e) => setIsViewOnce(e.target.checked)}
          />
          Send as View-Once
        </label>
      </div>
    </div>
  );
};

export default ChatPage;
