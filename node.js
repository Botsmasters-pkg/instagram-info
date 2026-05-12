// index.js

const express = require("express");
const axios = require("axios");

const app = express();

app.get("/", (req, res) => {
  res.json({
    status: true,
    creator: "Toxic Premium",
    message: "Instagram Info API Running"
  });
});

app.get("/ig", async (req, res) => {
  try {
    const username = req.query.p;

    if (!username) {
      return res.status(400).json({
        status: false,
        message: "Username missing"
      });
    }

    const url = `https://www.instagram.com/api/v1/users/web_profile_info/?username=${username}`;

    const response = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        "X-IG-App-ID": "936619743392459"
      }
    });

    const user = response.data.data.user;

    res.json({
      status: true,
      username: user.username,
      full_name: user.full_name,
      biography: user.biography,
      followers: user.edge_followed_by.count,
      following: user.edge_follow.count,
      posts: user.edge_owner_to_timeline_media.count,
      private: user.is_private,
      verified: user.is_verified,
      profile_pic: user.profile_pic_url_hd,
      external_url: user.external_url
    });

  } catch (err) {
    res.status(500).json({
      status: false,
      message: "User not found or Instagram blocked request"
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});