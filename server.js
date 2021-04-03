require("dotenv").config();
const express = require("express");
const SpotifyWebApi = require("spotify-web-api-node");
const cors = require("cors");
const lyricsFinder = require("lyrics-finder");

conf = {
  cors: {
    origin: function (origin, cb) {
      // setup a white list
      let wl = ["https://friendly-heisenberg-3cbe1c.netlify.app"];

      if (wl.indexOf(origin) != -1) {
        cb(null, true);
      } else {
        cb(new Error("invalid origin: " + origin), false);
      }
    },

    optionsSuccessStatus: 200,
  },
};

const app = express();
app.use(cors(conf.cors));
app.use(express.json());

app.post("/refresh", (req, res) => {
  const refreshToken = req.body.refreshToken;
  const spotifyApi = new SpotifyWebApi({
    redirectUri: process.env.REDIRECT_URI,
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    refreshToken,
  });

  spotifyApi
    .refreshAccessToken()
    .then((data) => {
      res.json({
        accessToken: data.body.access_token,
        expiresIn: data.body.expires_in,
      });
    })
    .catch(() => {
      res.status(400);
    });
});

app.get("/getID", (req, res) => {
  res.json({ clientId: process.env.CLIENT_ID });
});

app.get("/lyrics", async (req, res) => {
  const lyrics =
    (await lyricsFinder(req.query.artist, req.query.track)) ||
    "Sorry, no lyrics found for this track.";
  res.json({ lyrics });
});

app.post("/login", (req, res) => {
  const code = req.body.code;
  const spotifyApi = new SpotifyWebApi({
    redirectUri: process.env.REDIRECT_URI,
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
  });

  spotifyApi
    .authorizationCodeGrant(code)
    .then((data) => {
      res.json({
        accessToken: data.body.access_token,
        refreshToken: data.body.refresh_token,
        expiresIn: data.body.expires_in,
      });
    })
    .catch(() => {
      res.status(400);
    });
});

app.listen(process.env.PORT || 3001);
