const express = require("express");
const axios = require("axios");

const app = express();

const CREDIT = "@TOXICCLAIMS";
const CHANNEL = "https://t.me/Toxicadminn";

const cache = new Map();
const CACHE_TIME = 10 * 60 * 1000; // 10 minutes

function baseResponse(extra = {}) {
  return {
    credit: CREDIT,
    channel: CHANNEL,
    ...extra
  };
}

app.get("/", (req, res) => {
  return res.json(
    baseResponse({
      success: true,
      message: "Instagram Info API Running",
      endpoint: "/ig?p=username",
      example: "/ig?p=instagram"
    })
  );
});

app.get("/ig", async (req, res) => {
  const input = req.query.p;

  if (!input) {
    return res.status(400).json(
      baseResponse({
        success: false,
        message: "Username missing. Use /ig?p=username"
      })
    );
  }

  const username = String(input).replace("@", "").trim().toLowerCase();

  if (!/^[a-zA-Z0-9._]{1,30}$/.test(username)) {
    return res.status(400).json(
      baseResponse({
        success: false,
        message: "Invalid Instagram username"
      })
    );
  }

  const cached = cache.get(username);

  if (cached && Date.now() - cached.time < CACHE_TIME) {
    return res.json({
      ...cached.data,
      cached: true
    });
  }

  try {
    const apiUrl = `https://www.instagram.com/api/v1/users/web_profile_info/?username=${username}`;

    const response = await axios.get(apiUrl, {
      timeout: 15000,
      validateStatus: () => true,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "application/json,text/html,*/*",
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": `https://www.instagram.com/${username}/`,
        "X-IG-App-ID": "936619743392459",
        "X-Requested-With": "XMLHttpRequest",
        "Connection": "keep-alive"
      }
    });

    if (response.status === 429) {
      return res.status(429).json(
        baseResponse({
          success: false,
          message: "Instagram rate limit. Please try again later.",
          instagram_status: 429
        })
      );
    }

    if (response.status === 401 || response.status === 403) {
      return res.status(response.status).json(
        baseResponse({
          success: false,
          message: "Instagram blocked request from this server.",
          instagram_status: response.status
        })
      );
    }

    if (response.status === 404) {
      return res.status(404).json(
        baseResponse({
          success: false,
          message: "Instagram user not found.",
          instagram_status: 404
        })
      );
    }

    if (response.status !== 200) {
      return res.status(response.status).json(
        baseResponse({
          success: false,
          message: "Instagram returned an error.",
          instagram_status: response.status,
          instagram_response:
            typeof response.data === "string"
              ? response.data.slice(0, 300)
              : response.data
        })
      );
    }

    const user = response.data?.data?.user;

    if (!user) {
      return res.status(404).json(
        baseResponse({
          success: false,
          message: "User data not found in Instagram response",
          instagram_status: response.status,
          raw_response: response.data
        })
      );
    }

    const finalData = baseResponse({
      success: true,
      username: user.username || "",
      full_name: user.full_name || "",
      biography: user.biography || "",
      followers: user.edge_followed_by?.count || 0,
      following: user.edge_follow?.count || 0,
      posts: user.edge_owner_to_timeline_media?.count || 0,
      private: Boolean(user.is_private),
      verified: Boolean(user.is_verified),
      profile_pic: user.profile_pic_url_hd || user.profile_pic_url || "",
      external_url: user.external_url || "",
      profile_url: `https://www.instagram.com/${user.username}/`,
      cached: false
    });

    cache.set(username, {
      time: Date.now(),
      data: finalData
    });

    return res.json(finalData);
  } catch (error) {
    return res.status(500).json(
      baseResponse({
        success: false,
        message: "Server error while fetching Instagram",
        error: error.message
      })
    );
  }
});

module.exports = app;
