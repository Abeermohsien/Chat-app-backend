const Profile = () => {
  const [bio, setBio] = useState('');
  const [profilePicture, setProfilePicture] = useState(null);

  const updateProfile = async () => {
    const formData = new FormData();
    formData.append('bio', bio);
    if (profilePicture) {
      formData.append('profilePicture', profilePicture);
    }

    await axios.post('http://localhost:5000/profile', formData, {
      headers: { Authorization: token, 'Content-Type': 'multipart/form-data' },
    });
  };

  return (
    <div>
      <input type="file" onChange={(e) => setProfilePicture(e.target.files[0])} />
      <input type="text" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Bio" />
      <button onClick={updateProfile}>Update Profile</button>
    </div>
  );
};
