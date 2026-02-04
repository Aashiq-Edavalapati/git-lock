import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

// --- GITHUB OAUTH ---
export const getGithubToken = async (code) => {
  const url = 'https://github.com/login/oauth/access_token';
  const { data } = await axios.post(url, {
    client_id: process.env.GITHUB_CLIENT_ID,
    client_secret: process.env.GITHUB_CLIENT_SECRET,
    code,
  }, {
    headers: { Accept: 'application/json' }
  });
  return data.access_token;
};

export const getGithubUser = async (token) => {
  const { data } = await axios.get('https://api.github.com/user', {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!data.email) {
      // Fetch private emails
      const emailRes = await axios.get('https://api.github.com/user/emails', {
         headers: { Authorization: `Bearer ${token}` }
      });
      const primaryEmail = emailRes.data.find(e => e.primary && e.verified);
      if (primaryEmail) data.email = primaryEmail.email;
      else data.email = `${data.login}@github.placeholder.com`; // Fallback
  }

  return data; 
};

// --- GOOGLE OAUTH ---
export const getGoogleToken = async (code) => {
  const url = 'https://oauth2.googleapis.com/token';
  const { data } = await axios.post(url, {
    client_id: process.env.GOOGLE_CLIENT_ID,
    client_secret: process.env.GOOGLE_CLIENT_SECRET,
    code,
    grant_type: 'authorization_code',
    redirect_uri: `${process.env.FRONTEND_URL}/auth/google/callback`
  });
  return data; // access_token, id_token
};

export const getGoogleUser = async (access_token) => {
  const { data } = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${access_token}` }
  });
  return data;
};