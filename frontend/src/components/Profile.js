import React from 'react';
import { useParams } from 'react-router-dom';

const Profile = () => {
  const { userId } = useParams();
  
  return (
    <div style={{ marginTop: '80px', padding: '20px', textAlign: 'center' }}>
      <h2>User Profile</h2>
      <p>User ID: {userId}</p>
      <p>Profile page coming soon!</p>
    </div>
  );
};

export default Profile;