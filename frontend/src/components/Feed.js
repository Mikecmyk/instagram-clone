import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Post from './Post';

const Feed = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        console.log('🔄 Fetching posts from API...');
        setLoading(true);
        
        // First, get the posts endpoint URL
        const initialResponse = await axios.get('http://127.0.0.1:8000/api/posts/', {
          withCredentials: true
        });
        
        console.log('✅ Initial API Response:', initialResponse.data);
        
        // Check if we got a URL instead of direct posts data
        if (initialResponse.data.posts && typeof initialResponse.data.posts === 'string') {
          console.log('📡 Found posts URL, making second request...');
          
          // Make the second request to the actual posts endpoint
          const postsResponse = await axios.get(initialResponse.data.posts, {
            withCredentials: true
          });
          
          console.log('✅ Actual posts data:', postsResponse.data);
          
          if (Array.isArray(postsResponse.data)) {
            setPosts(postsResponse.data);
          } else {
            console.error('❌ Second API call did not return array:', postsResponse.data);
            setPosts([]);
            setError('Posts data format is invalid');
          }
        } 
        // If we got posts directly as array
        else if (Array.isArray(initialResponse.data)) {
          setPosts(initialResponse.data);
        }
        else {
          console.error('❌ Unexpected API response format:', initialResponse.data);
          setPosts([]);
          setError('Unexpected API response format');
        }
        
      } catch (err) {
        console.error('❌ Error fetching posts:', err);
        console.error('Error details:', err.response?.data || err.message);
        setError(err.response?.data?.message || err.message || 'Failed to load posts');
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h3>Loading posts...</h3>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h3>Error loading feed</h3>
        <p>{error}</p>
        <button 
          onClick={() => window.location.reload()}
          style={{
            padding: '10px 20px',
            background: '#0095f6',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  const postsToRender = Array.isArray(posts) ? posts : [];

  return (
    <div className="feed">
      {postsToRender.length === 0 ? (
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <h3>No posts found</h3>
          <p>Follow some users or create your first post!</p>
        </div>
      ) : (
        postsToRender.map(post => (
          <Post key={post.id} post={post} />
        ))
      )}
    </div>
  );
};

export default Feed;