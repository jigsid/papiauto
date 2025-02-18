"use server";

import { onCurrentUser } from "../user";
import { createIntegration, getIntegration, updateIntegration } from "./queries";
import { generateTokens } from "@/lib/fetch";
import axios from "axios";

export const onOAuthInstagram = async (strategy: "INSTAGRAM" | "CRM") => {
  if (strategy === "INSTAGRAM") {
    const url = process.env.INSTAGRAM_EMBEDDED_OAUTH_URL;
    if (!url) throw new Error("OAuth URL not configured");
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
        return { status: 200, data: create };
      } 
      // If integration exists, update it
      else {
        const existingIntegration = integration.integrations[0];
        const update = await updateIntegration(
          token.access_token,
          new Date(expire_date),
          existingIntegration.id
        );
        return { status: 200, data: update };
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
