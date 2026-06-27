"use client";
import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

function ProfilePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const fileInputRef = useRef(null);

  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  useEffect(() => {
    const userId = searchParams.get('userId');
    if (userId) {
      fetchUserData(userId);
    } else {
      setLoading(false);
      setErrorMessage('No user ID provided');
    }
  }, [searchParams]);

  const fetchUserData = async (userId) => {
    try {
      setLoading(true);
      const response = await fetch("/api/get-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const result = await response.json();

      if (result.success) {
        setUserData(result.data);
        setEditData(result.data);
      } else {
        setErrorMessage(result.message || 'Failed to fetch user data');
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      setErrorMessage('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
    if (!isEditing) {
      setEditData(userData);
      setAvatarFile(null);
      setAvatarPreview(null);
    }
    setErrorMessage('');
    setSuccessMessage('');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditData(prev => ({ ...prev, [name]: value }));
  };

  const handleNestedInputChange = (e) => {
    const { name, value } = e.target;
    const [parent, child] = name.split('.');
    setEditData(prev => ({
      ...prev,
      [parent]: { ...prev[parent], [child]: value }
    }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        setErrorMessage('Please select a valid image file (JPEG, PNG, GIF, or WEBP)');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setErrorMessage('Image size should be less than 5MB');
        return;
      }
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setAvatarPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setErrorMessage('');
      const formData = new FormData();
      formData.append('userId', userData._id);
      formData.append('data', JSON.stringify(editData));
      if (avatarFile) formData.append('avatar', avatarFile);

      const response = await fetch("/api/update-profile", { method: "PUT", body: formData });
      const result = await response.json();

      if (result.success) {
        setUserData(result.data);
        setSuccessMessage('Profile updated.');
        setIsEditing(false);
        setAvatarFile(null);
        setAvatarPreview(null);
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setErrorMessage(result.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setErrorMessage('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const getAvatarDisplay = () => {
    if (!userData) return { type: 'initials', value: 'U' };
    const username = userData.username || 'User';
    const firstChar = username.charAt(0).toUpperCase();
    if (userData.avatarUrl) return { type: 'image', value: userData.avatarUrl };
    if (userData.avatar && userData.avatar.length > 1 && userData.avatar !== firstChar) {
      return { type: 'image', value: userData.avatar };
    }
    return { type: 'initials', value: firstChar };
  };

  const avatarDisplay = getAvatarDisplay();
  const completion = userData?.profileComplete || 0;

  // ---------- Loading ----------
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F6F3] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 rounded-full border-2 border-[#E4E1D8]"></div>
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#0F6B5C] animate-spin"></div>
          </div>
          <p className="text-sm text-[#6B6862] tracking-wide">Loading profile</p>
        </div>
      </div>
    );
  }

  // ---------- No data ----------
  if (!userData) {
    return (
      <div className="min-h-screen bg-[#F7F6F3] flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl border border-[#E4E1D8] shadow-sm p-10 max-w-sm w-full text-center">
          <div className="w-12 h-12 rounded-full bg-[#FBEAE9] flex items-center justify-center mx-auto mb-5">
            <svg className="w-6 h-6 text-[#C4453D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-[#3A3833] font-medium mb-1">Couldn't load this profile</p>
          <p className="text-sm text-[#8A8780] mb-6">{errorMessage || 'No user data available.'}</p>
          <Link
            href="/"
            className="inline-block px-5 py-2.5 bg-[#1C1B19] text-white text-sm rounded-lg hover:bg-[#33312D] transition-colors"
          >
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  const inputClass = "w-full mt-1.5 px-3 py-2 bg-white border border-[#E4E1D8] rounded-lg text-[15px] text-[#1C1B19] focus:outline-none focus:ring-2 focus:ring-[#0F6B5C]/30 focus:border-[#0F6B5C] transition-shadow placeholder:text-[#B6B3AB]";
  const fieldLabelClass = "text-[11px] font-semibold text-[#9A968D] uppercase tracking-[0.08em]";

  return (
    <div className="min-h-screen bg-[#F7F6F3] py-10 px-4">
      <div className="max-w-3xl mx-auto">

        {/* Toast messages */}
        {(successMessage || errorMessage) && (
          <div
            className={`mb-5 rounded-xl border px-4 py-3 flex items-center gap-3 text-sm ${
              successMessage
                ? 'bg-[#EAF4EF] border-[#CFE6DA] text-[#1F5C45]'
                : 'bg-[#FBEAE9] border-[#F3D0CD] text-[#8A2E27]'
            }`}
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {successMessage ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              )}
            </svg>
            <p>{successMessage || errorMessage}</p>
          </div>
        )}

        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-[#6B6862] hover:text-[#1C1B19] transition-colors mb-6 group"
        >
          <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to home
        </Link>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-[#E9E6DD] shadow-sm overflow-hidden">

          {/* Header */}
          <div className="px-7 md:px-9 pt-9 pb-7 border-b border-[#EFEDE6]">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">

              {/* Avatar */}
              <div className="relative flex-shrink-0">
                {isEditing ? (
                  <div
                    className="relative cursor-pointer group"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {avatarPreview || (avatarDisplay.type === 'image' ? avatarDisplay.value : null) ? (
                      <img
                        src={avatarPreview || avatarDisplay.value}
                        alt={userData.username}
                        className="w-24 h-24 rounded-full object-cover ring-4 ring-[#F7F6F3]"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-[#0F6B5C] text-white flex items-center justify-center text-3xl font-semibold ring-4 ring-[#F7F6F3]">
                        {avatarDisplay.value}
                      </div>
                    )}
                    <div className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/45 flex items-center justify-center transition-colors">
                      <svg className="w-7 h-7 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <span className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#1C1B19] text-white flex items-center justify-center ring-2 ring-white">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                      </svg>
                    </span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                  </div>
                ) : avatarDisplay.type === 'image' ? (
                  <img
                    src={avatarDisplay.value}
                    alt={userData.username}
                    className="w-24 h-24 rounded-full object-cover ring-4 ring-[#F7F6F3]"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-[#0F6B5C] text-white flex items-center justify-center text-3xl font-semibold ring-4 ring-[#F7F6F3]">
                    {avatarDisplay.value}
                  </div>
                )}
              </div>

              {/* Identity */}
              <div className="text-center sm:text-left flex-1 min-w-0">
                <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                  <h1 className="text-2xl font-semibold text-[#1C1B19] tracking-tight">{userData.username}</h1>
                  {userData.isVerified && (
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#0F6B5C]" title="Verified">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                  )}
                </div>
                <p className="text-[#8A8780] text-[15px] mt-0.5">{userData.email}</p>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-3">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#F7F6F3] text-[#54524C] border border-[#EFEDE6]">
                    <span className={`w-1.5 h-1.5 rounded-full ${userData.online ? 'bg-[#2F9E6E]' : 'bg-[#C8C5BC]'}`}></span>
                    {userData.online ? 'Online' : 'Offline'}
                  </span>
                  <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-[#F7F6F3] text-[#54524C] border border-[#EFEDE6] capitalize">
                    {userData.role}
                  </span>
                </div>
              </div>

              {/* Edit toggle - top right on desktop */}
              <button
                onClick={handleEditToggle}
                className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium text-[#54524C] border border-[#E4E1D8] hover:bg-[#F7F6F3] transition-colors flex-shrink-0"
              >
                {isEditing ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Cancel
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit profile
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="px-7 md:px-9 py-8">

            {/* Personal Information */}
            <section className="mb-9">
              <h2 className="text-[13px] font-semibold text-[#9A968D] uppercase tracking-[0.08em] mb-4">
                Personal information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-5">
                <div>
                  <label className={fieldLabelClass}>Username</label>
                  {isEditing ? (
                    <input type="text" name="username" value={editData.username || ''} onChange={handleInputChange} className={inputClass} />
                  ) : (
                    <p className="mt-1.5 text-[15px] text-[#1C1B19]">{userData.username}</p>
                  )}
                </div>
                <div>
                  <label className={fieldLabelClass}>Email</label>
                  {isEditing ? (
                    <input type="email" name="email" value={editData.email || ''} onChange={handleInputChange} className={inputClass} />
                  ) : (
                    <p className="mt-1.5 text-[15px] text-[#1C1B19]">{userData.email}</p>
                  )}
                </div>
                <div>
                  <label className={fieldLabelClass}>Phone</label>
                  {isEditing ? (
                    <input type="tel" name="phone" value={editData.phone || ''} onChange={handleInputChange} className={inputClass} />
                  ) : (
                    <p className="mt-1.5 text-[15px] text-[#1C1B19]">{userData.phone || '—'}</p>
                  )}
                </div>
                <div>
                  <label className={fieldLabelClass}>Location</label>
                  {isEditing ? (
                    <input type="text" name="location" value={editData.location || ''} onChange={handleInputChange} className={inputClass} placeholder="Your location" />
                  ) : (
                    <p className="mt-1.5 text-[15px] text-[#1C1B19]">{userData.location || '—'}</p>
                  )}
                </div>
                <div className="md:col-span-2">
                  <label className={fieldLabelClass}>Bio</label>
                  {isEditing ? (
                    <textarea name="bio" value={editData.bio || ''} onChange={handleInputChange} rows="3" className={`${inputClass} resize-none`} placeholder="Tell us about yourself..." />
                  ) : (
                    <p className="mt-1.5 text-[15px] text-[#1C1B19] leading-relaxed">{userData.bio || 'No bio yet.'}</p>
                  )}
                </div>
                <div>
                  <label className={fieldLabelClass}>Website</label>
                  {isEditing ? (
                    <input type="url" name="website" value={editData.website || ''} onChange={handleInputChange} className={inputClass} placeholder="https://yourwebsite.com" />
                  ) : userData.website ? (
                    <a href={userData.website} target="_blank" rel="noopener noreferrer" className="mt-1.5 block text-[15px] text-[#0F6B5C] hover:underline truncate">
                      {userData.website}
                    </a>
                  ) : (
                    <p className="mt-1.5 text-[15px] text-[#1C1B19]">—</p>
                  )}
                </div>
              </div>
            </section>

            <hr className="border-[#EFEDE6] mb-9" />

            {/* Social Links */}
            <section className="mb-9">
              <h2 className="text-[13px] font-semibold text-[#9A968D] uppercase tracking-[0.08em] mb-4">
                Social links
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-5">
                {['facebook', 'twitter', 'instagram', 'linkedin', 'github'].map((social) => (
                  <div key={social}>
                    <label className={`${fieldLabelClass} capitalize`}>{social}</label>
                    {isEditing ? (
                      <input
                        type="url"
                        name={`socialLinks.${social}`}
                        value={editData.socialLinks?.[social] || ''}
                        onChange={handleNestedInputChange}
                        className={inputClass}
                        placeholder={`Your ${social} URL`}
                      />
                    ) : userData.socialLinks?.[social] ? (
                      <a
                        href={userData.socialLinks[social]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1.5 block text-[15px] text-[#0F6B5C] hover:underline truncate"
                      >
                        {userData.socialLinks[social]}
                      </a>
                    ) : (
                      <p className="mt-1.5 text-[15px] text-[#1C1B19]">—</p>
                    )}
                  </div>
                ))}
              </div>
            </section>

            <hr className="border-[#EFEDE6] mb-9" />

            {/* Statistics */}
            <section className="mb-9">
              <h2 className="text-[13px] font-semibold text-[#9A968D] uppercase tracking-[0.08em] mb-4">
                Statistics
              </h2>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Messages', value: userData.stats?.totalMessages || 0 },
                  { label: 'Friends', value: userData.stats?.totalFriends || 0 },
                  { label: 'Groups', value: userData.stats?.totalGroups || 0 },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-xl border border-[#EFEDE6] bg-[#FBFAF8] px-4 py-5 text-center">
                    <p className="text-2xl font-semibold text-[#1C1B19] tabular-nums">{stat.value}</p>
                    <p className="text-xs text-[#9A968D] mt-1">{stat.label}</p>
                  </div>
                ))}
              </div>
            </section>

            <hr className="border-[#EFEDE6] mb-9" />

            {/* Account Details */}
            <section className="mb-9">
              <h2 className="text-[13px] font-semibold text-[#9A968D] uppercase tracking-[0.08em] mb-4">
                Account details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-5">
                <div>
                  <label className={fieldLabelClass}>Joined</label>
                  <p className="mt-1.5 text-[15px] text-[#1C1B19]">
                    {new Date(userData.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
                <div>
                  <label className={fieldLabelClass}>Last seen</label>
                  <p className="mt-1.5 text-[15px] text-[#1C1B19]">
                    {new Date(userData.lastSeen).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div>
                  <label className={fieldLabelClass}>Login count</label>
                  <p className="mt-1.5 text-[15px] text-[#1C1B19]">{userData.metadata?.loginCount || 0} times</p>
                </div>
                <div>
                  <label className={fieldLabelClass}>Status</label>
                  <p className="mt-1.5 text-[15px] text-[#1C1B19] flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${userData.isVerified ? 'bg-[#2F9E6E]' : 'bg-[#D6A03B]'}`}></span>
                    {userData.isVerified ? 'Verified' : 'Not verified'}
                  </p>
                </div>
              </div>
            </section>

            {/* Profile Completion */}
            <section className="mb-9">
              <div className="flex justify-between items-baseline mb-2.5">
                <h2 className="text-[13px] font-semibold text-[#9A968D] uppercase tracking-[0.08em]">
                  Profile completion
                </h2>
                <span className="text-sm font-semibold text-[#1C1B19] tabular-nums">{completion}%</span>
              </div>
              <div className="flex gap-1">
                {Array.from({ length: 20 }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-2 flex-1 rounded-sm transition-colors duration-500 ${
                      i < Math.round(completion / 5) ? 'bg-[#0F6B5C]' : 'bg-[#EFEDE6]'
                    }`}
                  />
                ))}
              </div>
              <p className="text-xs text-[#9A968D] mt-2.5">
                {completion < 100 ? 'Complete your profile to get the most out of the app.' : 'Profile complete.'}
              </p>
            </section>

            {/* Actions */}
            <div className="flex flex-wrap gap-2.5 pt-2">
              <button
                onClick={() => router.back()}
                className="flex-1 min-w-[110px] px-5 py-2.5 bg-white text-[#54524C] border border-[#E4E1D8] rounded-lg hover:bg-[#F7F6F3] transition-colors text-sm font-medium"
              >
                Go back
              </button>

              {isEditing ? (
                <>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 min-w-[110px] px-5 py-2.5 bg-[#0F6B5C] text-white rounded-lg hover:bg-[#0C5749] disabled:opacity-60 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                  >
                    {saving ? (
                      <>
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Saving
                      </>
                    ) : (
                      'Save changes'
                    )}
                  </button>
                  <button
                    onClick={handleEditToggle}
                    className="sm:hidden flex-1 min-w-[110px] px-5 py-2.5 bg-white text-[#54524C] border border-[#E4E1D8] rounded-lg hover:bg-[#F7F6F3] transition-colors text-sm font-medium"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={handleEditToggle}
                  className="sm:hidden flex-1 min-w-[110px] px-5 py-2.5 bg-[#1C1B19] text-white rounded-lg hover:bg-[#33312D] transition-colors text-sm font-medium"
                >
                  Edit profile
                </button>
              )}

              <button
                onClick={() => {
                  if (confirm('Are you sure you want to logout?')) router.push('/logout');
                }}
                className="flex-1 min-w-[110px] px-5 py-2.5 bg-white text-[#C4453D] border border-[#F3D0CD] rounded-lg hover:bg-[#FBEAE9] transition-colors text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;