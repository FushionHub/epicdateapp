import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import { getMessages, sendMessage, sendMediaMessage } from '../services/supabaseService';

const ChatPage = () => {
  const { matchId } = useParams();
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const fetchMessages = async () => {
      const initialMessages = await getMessages(matchId);
      setMessages(initialMessages);
      setLoading(false);
    };
    fetchMessages();

    // Subscribe to real-time updates
    const channel = supabase.channel(`chat-${matchId}`);
    channel
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `match_id=eq.${matchId}` }, (payload) => {
        // We need to fetch the new message with the sender's profile info
        const fetchNewMessage = async () => {
          const { data } = await supabase.from('messages').select(`*, sender:profiles(name, photos)`).eq('id', payload.new.id).single();
          setMessages((prevMessages) => [...prevMessages, data]);
        };
        fetchNewMessage();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [matchId]);

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

    // Simple check for message type
    const messageType = file.type.startsWith('image') ? 'image' : file.type.startsWith('video') ? 'video' : 'audio';
    await sendMediaMessage(matchId, currentUser.uid, file, messageType);
  };

  const addEmoji = (emoji) => {
    setNewMessage(newMessage + emoji);
  };

  if (loading) return <div>Loading chat...</div>;

  return (
    <div>
      <Link to="/matches">Back to Matches</Link>
      <h2>Chat</h2>
      <div style={{ height: '400px', overflowY: 'scroll', border: '1px solid #ccc', padding: '10px' }}>
        {messages.map(msg => (
          <div key={msg.id} style={{ textAlign: msg.sender_id === currentUser.uid ? 'right' : 'left', marginBottom: '10px' }}>
            <p><strong>{msg.sender.name}</strong></p>
            {msg.message_type === 'text' && <p>{msg.text_content}</p>}
            {msg.message_type === 'image' && <img src={msg.media_url} alt="chat" style={{ maxWidth: '200px' }} />}
            {msg.message_type === 'video' && <video src={msg.media_url} controls style={{ maxWidth: '200px' }} />}
            {msg.message_type === 'audio' && <audio src={msg.media_url} controls />}
            <small>{new Date(msg.created_at).toLocaleTimeString()}</small>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div>
        {['😀', '😂', '❤️', '👍', '🙏'].map(emoji => (
          <button key={emoji} onClick={() => addEmoji(emoji)}>{emoji}</button>
        ))}
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
      <input type="file" onChange={handleFileUpload} />
    </div>
  );
};

export default ChatPage;
