import axios from "axios";

export const refreshToken = async (token: string) => {
  const refresh_token = await axios.get(
    `${process.env.INSTAGRAM_BASE_URL}/refresh_access_token?grant_type=ig_refresh_token&access_token=${token}`
  );

  return refresh_token.data;
};

export const sendDM = async (
  userId: string,
  recieverId: string,
  prompt: string,
  token: string
) => {
  console.log("sending message");
  return await axios.post(
    `${process.env.INSTAGRAM_BASE_URL}/v21.0/${userId}/messages`,
    {
      recipient: {
        id: recieverId,
      },
      message: {
        text: prompt,
      },
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );
};

export const sendPrivateMessage = async (
  userId: string,
  commentId: string,
  prompt: string,
  token: string
) => {
  console.log("sending comment reply");
  return await axios.post(
    `${process.env.INSTAGRAM_BASE_URL}/v21.0/${commentId}/replies`,
    {
      message: prompt,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );
};

export const generateTokens = async (code: string) => {
  try {
    // Use URLSearchParams instead of FormData for server-side compatibility
    const params = new URLSearchParams();
    params.append("client_id", process.env.INSTAGRAM_CLIENT_ID as string);
    params.append(
      "client_secret",
      process.env.INSTAGRAM_CLIENT_SECRET as string
    );
    params.append("grant_type", "authorization_code");
    // Remove trailing slash to match exactly with Facebook app settings
    const redirectUri = `${process.env.NEXT_PUBLIC_HOST_URL}callback/instagram`.replace(/\/+$/, '');
    params.append("redirect_uri", redirectUri);
    params.append("code", code);

    console.log("Sending token request with params:", {
      client_id: process.env.INSTAGRAM_CLIENT_ID,
      redirect_uri: redirectUri,
      code: code
    });

    const shortTokenRes = await fetch(process.env.INSTAGRAM_TOKEN_URL as string, {
      method: "POST",
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    });

    const token = await shortTokenRes.json();
    
    // Log the token response for debugging
    console.log("Short token response:", token);
    
    // Check if we got an access token
    if (!token.access_token) {
      console.error("Failed to get access token:", token);
      return null;
    }

    // Exchange short-lived token for long-lived token
    const long_token = await axios.get(
      `${process.env.INSTAGRAM_BASE_URL}/access_token?grant_type=ig_exchange_token&client_secret=${process.env.INSTAGRAM_CLIENT_SECRET}&access_token=${token.access_token}`
    );

    if (!long_token.data.access_token) {
      console.error("Failed to get long-lived token:", long_token.data);
      return null;
    }

    return long_token.data;
  } catch (error) {
    console.error("Error generating tokens:", error);
    return null;
  }
};
