import React, { useState } from 'react';
import axios from 'axios';

const Post = ({ post }) => {
  // Use the actual like data from backend for persistence
  const [isLiked, setIsLiked] = useState(post.is_liked || false);
  const [likeCount, setLikeCount] = useState(post.likes_count || 0);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState(post.comments || []);
  const [commentsLoading, setCommentsLoading] = useState(false);

  // Function to get CSRF token
  const getCSRFToken = () => {
    const name = 'csrftoken';
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
      const cookies = document.cookie.split(';');
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        if (cookie.substring(0, name.length + 1) === (name + '=')) {
          cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
          break;
        }
      }
    }
    return cookieValue;
  };

  const handleLike = async () => {
    try {
      if (isLiked) {
        // Unlike the post
        const response = await axios.delete(`http://127.0.0.1:8000/api/posts/${post.id}/like/`, {
          withCredentials: true
        });
        console.log('✅ Unlike successful:', response.data);
        setLikeCount(prev => prev - 1);
        setIsLiked(false);
      } else {
        // Like the post
        const response = await axios.post(`http://127.0.0.1:8000/api/posts/${post.id}/like/`, {}, {
          withCredentials: true
        });
        console.log('✅ Like successful:', response.data);
        setLikeCount(prev => prev + 1);
        setIsLiked(true);
      }
    } catch (error) {
      console.error('❌ Error liking post:', error);
      console.error('Error response:', error.response);
      
      // Even if API fails, update UI for better UX
      // But the correct state will be loaded on refresh
      if (!isLiked) {
        setLikeCount(prev => prev + 1);
        setIsLiked(true);
      } else {
        setLikeCount(prev => prev - 1);
        setIsLiked(false);
      }
    }
  };

  const loadComments = async () => {
    if (comments.length > 0 && showComments) {
      setShowComments(false);
      return;
    }
    
    setCommentsLoading(true);
    try {
      console.log('🔄 Loading comments for post:', post.id);
      
      const response = await axios.get(`http://127.0.0.1:8000/api/posts/${post.id}/comments/`, {
        withCredentials: true
      });
      
      console.log('✅ Comments loaded:', response.data);
      setComments(response.data);
      setShowComments(true);
    } catch (error) {
      console.error('❌ Error loading comments:', error);
      
      if (post.comments && Array.isArray(post.comments)) {
        console.log('✅ Using comments from post data');
        setComments(post.comments);
        setShowComments(true);
      } else {
        alert('No comments available for this post.');
      }
    } finally {
      setCommentsLoading(false);
    }
  };

  const handleAddComment = async () => {
    console.log('🔍 Starting comment submission...');
    console.log('Post ID:', post.id);
    
    const userData = localStorage.getItem('user');
    if (!userData) {
      alert('Please login to comment!');
      return;
    }

    if (!newComment.trim()) {
      alert('Please enter a comment!');
      return;
    }

    try {
      const user = JSON.parse(userData);
      const csrfToken = getCSRFToken();
      
      const response = await axios.post(
        `http://127.0.0.1:8000/api/posts/${post.id}/comments/`, 
        {
          content: newComment
        }, 
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken,
          }
        }
      );
      
      console.log('✅ COMMENT SUCCESS!', response.data);
      
      const newCommentWithUser = {
        ...response.data,
        user: {
          id: user.id,
          username: user.username
        }
      };
      
      setComments([...comments, newCommentWithUser]);
      setNewComment('');
      
    } catch (error) {
      console.error('❌ Error adding comment:', error);
      
      if (error.response?.status === 403 || error.response?.status === 401) {
        alert('Please login to comment.');
        localStorage.removeItem('user');
        window.location.href = '/login';
      } else if (error.response?.status === 404) {
        alert('Comments feature is not available yet.');
      } else {
        alert('Error adding comment. Please try again.');
      }
    }
  };

  const getInitial = (username) => {
    return username ? username.charAt(0).toUpperCase() : 'U';
  };

  const imageUrl = post.image_url;
  const user = localStorage.getItem('user');

  const handleImageLoad = () => {
    setImageLoaded(true);
    setImageError(false);
  };

  const handleImageError = () => {
    setImageError(true);
    setImageLoaded(false);
  };

  return (
    <div className="post">
      <div className="post-header">
        <div className="post-avatar">
          {getInitial(post.user?.username)}
        </div>
        <div className="post-username">{post.user?.username || 'Unknown User'}</div>
      </div>
      
      {/* Image Section */}
      {imageUrl && !imageError ? (
        <div style={{ position: 'relative' }}>
          <img 
            src={imageUrl} 
            alt="Post" 
            style={{
              width: '100%',
              height: '400px',
              objectFit: 'cover',
              display: imageLoaded ? 'block' : 'none'
            }}
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
          {!imageLoaded && (
            <div 
              className="post-image-placeholder"
              style={{ 
                display: 'flex',
                height: '400px'
              }}
            >
              Loading Image...
            </div>
          )}
        </div>
      ) : (
        <div className="post-image-placeholder">
          {imageError ? '❌ Image Failed to Load' : '📸 No Image'}
        </div>
      )}
      
      <div className="post-content">
        <div className="post-actions">
          <button 
            className="post-action" 
            onClick={handleLike}
            style={{ 
              color: isLiked ? '#ed4956' : '#262626',
              cursor: 'pointer'
            }}
            title={isLiked ? 'Unlike' : 'Like'}
          >
            {isLiked ? '❤️' : '🤍'}
          </button>
          <button 
            className="post-action" 
            onClick={loadComments}
            disabled={commentsLoading}
            title="View comments"
          >
            {commentsLoading ? '⏳' : '💬'}
          </button>
          <button className="post-action" title="Share">
            📤
          </button>
        </div>
        
        <div className="post-likes">{likeCount} likes</div>
        <div className="post-caption">
          <span className="post-username-caption">{post.user?.username || 'Unknown User'}</span> 
          {post.content}
        </div>

        {/* Comments Section */}
        {showComments && (
          <div className="comments-section" style={{ marginTop: '16px', borderTop: '1px solid #dbdbdb', paddingTop: '16px' }}>
            <h4>Comments ({comments.length})</h4>
            
            {/* Comment List */}
            {comments.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#8e8e8e', padding: '20px' }}>
                No comments yet. Be the first to comment!
              </div>
            ) : (
              comments.map(comment => (
                <div key={comment.id} style={{ marginBottom: '12px', padding: '8px', background: '#fafafa', borderRadius: '4px' }}>
                  <strong>{comment.user?.username}:</strong> {comment.content}
                  <div style={{ fontSize: '12px', color: '#8e8e8e' }}>
                    {new Date(comment.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))
            )}
            
            {/* Add Comment */}
            {user ? (
              <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                <input
                  type="text"
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '8px',
                    border: '1px solid #dbdbdb',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                />
                <button
                  onClick={handleAddComment}
                  disabled={!newComment.trim()}
                  style={{
                    padding: '8px 16px',
                    background: newComment.trim() ? '#0095f6' : '#b2dffc',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: newComment.trim() ? 'pointer' : 'not-allowed',
                    fontSize: '14px'
                  }}
                >
                  Post
                </button>
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: '#8e8e8e', marginTop: '12px' }}>
                <a href="/login" style={{ color: '#0095f6' }}>Login to comment</a>
              </div>
            )}
          </div>
        )}

        <div className="post-time">
          {new Date(post.created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>
      </div>
    </div>
  );
};

export default Post;