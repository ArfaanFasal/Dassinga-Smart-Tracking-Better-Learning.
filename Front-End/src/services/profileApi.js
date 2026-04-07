import { fetchProfile, updateProfileApi } from './mockApi';

export async function loadProfile() {
  try {
    return await fetchProfile();
  } catch (_err) {
    return defaultProfile();
  }
}

export async function saveProfile(_userId, profile) {
  const payload = {
    name: profile.name || '',
    email: profile.email || '',
    phone: profile.phone || '',
    course: profile.course || '',
    photoDataUrl: profile.photoDataUrl || profile.profileImage || '',
  };
  const next = await updateProfileApi(payload);
  return { ...defaultProfile(), ...next };
}

function defaultProfile() {
  return {
    photoDataUrl: '',
    name: '',
    email: '',
    phone: '',
    course: '',
  };
}

