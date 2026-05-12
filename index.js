const express = require("express");
const axios = require("axios");

const app = express();

const CREDIT = "@TOXICCLAIMS";
const CHANNEL = "https://t.me/Toxicadminn";

app.get("/", (req, res) => {
  res.json({
    success: true,
    credit: CREDIT,
    channel: CHANNEL,
    message: "Instagram Info API Running",
    endpoint: "/ig?p=username",
    example: "/ig?p=instagram"
  });
});

app.get("/ig", async (req, res) => {
  const username = req.query.p;

  if (!username) {
    return res.status(400).json({
      success: false,
      credit: CREDIT,
      channel: CHANNEL,
      message: "Username missing. Use /ig?p=username"
    });
  }

  const cleanUsername = username.replace("@", "").trim();

  try {
    const apiUrl = `https://www.instagram.com/api/v1/users/web_profile_info/?username=${cleanUsername}`;

    const response = await axios.get(apiUrl, {
      timeout: 15000,
      validateStatus: () => true,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        "Accept": "application/json,text/html,*/*",
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": `https://www.instagram.com/${cleanUsername}/`,
        "X-IG-App-ID": "936619743392459",
        "X-Requested-With": "XMLHttpRequest"
      }
    });

    if (response.status !== 200) {
      return res.status(response.status).json({
        success: false,
        credit: CREDIT,
        channel: CHANNEL,
        message: "Instagram blocked request or returned error",
        instagram_status: response.status,
        instagram_response:
          typeof response.data === "string"
            ? response.data.slice(0, 300)
            : response.data
      });
    }

    const user = response.data?.data?.user;

    if (!user) {
      return res.status(404).json({
        success: false,
        credit: CREDIT,
        channel: CHANNEL,
        message: "User data not found",
        raw_response: response.data
      });
    }

    return res.json({
      success: true,
      credit: CREDIT,
      channel: CHANNEL,

      username: user.username,
      full_name: user.full_name,
      biography: user.biography,
      followers: user.edge_followed_by?.count || 0,
      following: user.edge_follow?.count || 0,
      posts: user.edge_owner_to_timeline_media?.count || 0,
      private: user.is_private,
      verified: user.is_verified,
      profile_pic: user.profile_pic_url_hd || user.profile_pic_url,
      external_url: user.external_url,
      profile_url: `https://www.instagram.com/${user.username}/`
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      credit: CREDIT,
      channel: CHANNEL,
      message: "Server error while fetching Instagram",
      error: error.message
    });
  }
});

module.exports = app;
