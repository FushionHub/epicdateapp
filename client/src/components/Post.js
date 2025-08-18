import React from 'react';

const Post = ({ post }) => {
  return (
    <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '16px', margin: '16px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
        <img
          src={post.author.photos && post.author.photos.length > 0 ? post.author.photos[0] : 'https://via.placeholder.com/50'}
          alt={post.author.name}
          style={{ width: '50px', height: '50px', borderRadius: '50%', marginRight: '12px' }}
        />
        <div>
          <strong>{post.author.name}</strong>
          <p style={{ color: '#666', fontSize: '0.8rem', margin: 0 }}>
            {new Date(post.created_at).toLocaleString()}
          </p>
        </div>
      </div>
      <p>{post.text_content}</p>
      {post.image_url && (
        <img
          src={post.image_url}
          alt="Post content"
          style={{ maxWidth: '100%', borderRadius: '8px' }}
        />
      )}
      {/* Placeholder for like/comment buttons */}
    </div>
  );
};

export default Post;
