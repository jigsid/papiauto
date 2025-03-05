"use server";

import { onCurrentUser } from "../user";
import { createIntegration, getIntegration, updateIntegration } from "./queries";
import { generateTokens, getInstagramRedirectUri } from "@/lib/fetch";
import axios from "axios";

export const onOAuthInstagram = async (strategy: "INSTAGRAM" | "CRM") => {
  if (strategy === "INSTAGRAM") {
    const clientId = process.env.INSTAGRAM_CLIENT_ID;
    const redirectUri = getInstagramRedirectUri();
    const scope = 'instagram_business_basic,instagram_business_manage_messages,instagram_business_manage_comments,instagram_business_content_publish,instagram_business_manage_insights';
    
    const url = `https://www.instagram.com/oauth/authorize?enable_fb_login=0&force_authentication=1&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scope}`;
    return url;
  }
  return null;
};

export const onIntegrate = async (code: string) => {
  const user = await onCurrentUser();

  try {
    const integration = await getIntegration(user.id);
    
    // Generate Instagram tokens
    const token = await generateTokens(code);
    if (!token || !token.access_token) {
      console.error("🔴 401 - Failed to generate valid token");
      return { status: 401, error: "Failed to generate Instagram access token" };
    }

    try {
      // Get Instagram user ID
      const insta_id = await axios.get(
        `${process.env.INSTAGRAM_BASE_URL}/me?fields=user_id&access_token=${token.access_token}`
      );

      if (!insta_id.data || !insta_id.data.user_id) {
        console.error("🔴 401 - Failed to get Instagram user ID");
        return { status: 401, error: "Failed to get Instagram user ID" };
      }

      const today = new Date();
      const expire_date = today.setDate(today.getDate() + 60);

      // If no integrations exist, create new one
      if (!integration || !integration.integrations || integration.integrations.length === 0) {
        const create = await createIntegration(
          user.id,
          token.access_token,
          new Date(expire_date),
          insta_id.data.user_id
        );
        // Return user data with the integration
        return { 
          status: 200, 
          data: {
            firstname: user.firstName,
            lastname: user.lastName
          }
        };
      } 
      // If integration exists, update it
      else {
        const existingIntegration = integration.integrations[0];
        await updateIntegration(
          token.access_token,
          new Date(expire_date),
          existingIntegration.id
        );
        // Return user data with the integration
        return { 
          status: 200, 
          data: {
            firstname: user.firstName,
            lastname: user.lastName
          }
        };
      }
    } catch (apiError) {
      console.error("🔴 500 - Instagram API Error:", apiError);
      return { status: 500, error: "Failed to communicate with Instagram API" };
    }
  } catch (error) {
    console.error("🔴 500 - Integration Error:", error);
    return { status: 500, error: "Internal server error" };
  }
};
