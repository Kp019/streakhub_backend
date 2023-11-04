const express = require("express");
const { createClient } = require("@supabase/supabase-js");
const app = express();
app.use(express.json());
const cors = require("cors");

// const allowedOrigins = ["http://example.com", "http://localhost:3000"];
// const corsOptions = {
//   origin: (origin, callback) => {
//     if (allowedOrigins.includes(origin) || !origin) {
//       callback(null, true);
//     } else {
//       callback(new Error("Not allowed by CORS"));
//     }
//   },
//   methods: "GET,PUT,POST,DELETE",
//   allowedHeaders: "Content-Type,Authorization",
// };
app.use(cors());

const bcrypt = require("bcrypt");
const saltRounds = process.env.SALT_ROUNDS;

require("dotenv").config();

const supabaseurl = process.env.PUBLIC_SUPABASE_URL;
const supabasekey = process.env.PUBLIC_SUPABASE_KEY;
const supabase = createClient(supabaseurl, supabasekey);

const { WakaTimeClient } = require("wakatime-client");
const { RANGE } = require("wakatime-client");

function addDays(date, days) {
  date.setDate(date.getDate() + days);
  return date;
}

function secondsToHms(d) {
  d = Number(d);
  var h = Math.floor(d / 3600);
  var m = Math.floor((d % 3600) / 60);
  var s = Math.floor((d % 3600) % 60);
  var hDisplay = h > 0 ? h + (h == 1 ? " hour, " : " hours, ") : "";
  var mDisplay = m > 0 ? m + (m == 1 ? " minute, " : " minutes, ") : "";
  var sDisplay = s > 0 ? s + (s == 1 ? " second" : " seconds") : "";
  return hDisplay + mDisplay + sDisplay;
}

async function getContributions(token, username) {
  const headers = {
    Authorization: `bearer ${token}`,
  };
  const body = {
    query: `query {
          user(login: "${username}") {
            name
            contributionsCollection {
              contributionCalendar {
                colors
                totalContributions
                weeks {
                  contributionDays {
                    color
                    contributionCount
                    date
                    weekday
                  }
                  firstDay
                }
              }
            }
          }
        }`,
  };
  const response = await fetch("https://api.github.com/graphql", {
    method: "POST",
    body: JSON.stringify(body),
    headers: headers,
  });
  const data = await response.json();
  return data;
}
async function countContributionStreak(username) {
  const response = await getContributions(process.env.GITHUB_TOKEN, username);
  const weeks =
    response.data.user.contributionsCollection.contributionCalendar.weeks;
  let streakCount = 0;
  for (let i = weeks.length - 1; i >= 0; i--) {
    const week = weeks[i];
    const days = week.contributionDays;
    // console.log(days);
    for (let j = days.length - 1; j >= 0; j--) {
      const day = days[j];
      if (day.contributionCount > 0) {
        streakCount++;
      } else {
        return streakCount;
      }
    }
  }
}

app.get("/fetchtodo/:id", async (req, res) => {
  let id = req.params;
  id = Number(id.id);
  let { data: main, error } = await supabase
    .from("todo")
    .select("*")
    .eq("uid", id);
  console.log(main);
  res.json(main);
});

app.get("/maketodo/:id/:maker/:streak", async (req, res) => {
  let maker = req.params.maker;
  let streak = Number(req.params.streak);
  let uid = Number(req.params.id);
  let date = new Date();
  date = addDays(date, -1);
  date = date.toISOString();
  const { data, error } = await supabase
    .from("todo")
    .insert([{ uid: uid, name: maker, streak: streak, modified: date }])
    .select();
  res.json("hey");
});

app.get("/markthetodo/:id", async (req, res) => {
  let id = Number(req.params.id);
  let date = new Date();
  date = date.toISOString();
  const { data, error } = await supabase
    .from("todo")
    .update({ modified: date })
    .eq("id", id);
  res.json("hey");
});

// app.post("/fillthemall", (req, res) => {
//   const {} = req.body;
// });

app.post("/register", async (req, res) => {
  console.log(req);
  const { name, username, password } = req.body;
  const { data, error } = await supabase
    .from("main")
    .select("*")
    .eq("username", username);
  if (data.length > 0) {
    res.json({ message: "username already exists" });
  } else {
    bcrypt.hash(password, saltRounds, async function (err, hash) {
      const { data, error } = await supabase
        .from("main")
        .insert([{ name: name, username: username, password: hash }])
        .select();
      const { data: main, error: erroa } = await supabase
        .from("main")
        .select("*")
        .eq("username", username);
      res.json(data);
    });
  }
});

app.get("/connect/:id", async (req, res) => {
  let id = req.params;
  id = Number(id.id);
  let { data: main, error } = await supabase
    .from("main")
    .select("*")
    .eq("uid", id);

  const wakaclient = new WakaTimeClient(main[0].wakatime_api);
  // const stats = await wakaclient.getMyStats({ range: RANGE.LAST_7_DAYS });

  // let wakatime = stats.data;
  let currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, "0");
  const day = String(currentDate.getDate()).padStart(2, "0");

  currentDate = `${year}-${month}-${day}`;
  let wakatime = await wakaclient.getDurations({
    userId: main[0].wakatime_username,
    date: currentDate,
  });
  wakatime = wakatime.data;
  let duration = 0;
  for (let i = 0; i < wakatime.length; i++) {
    duration += wakatime[i].duration;
  }
  let durationstring = secondsToHms(duration);
  console.log(durationstring);
  let hrs = durationstring.split(" ")[0];

  const hrstoreach = main[0].wakatime_goal;
  let wakatime_lmi = new Date(main[0].wakatime_lm);
  wakatime_lmi.setHours(0, 0, 0, 0);

  let wakacurrdateswork = new Date();
  wakacurrdateswork = addDays(wakacurrdateswork, -2);
  wakacurrdateswork.setHours(0, 0, 0, 0);
  let newakka = new Date();

  if (wakacurrdateswork >= wakatime_lmi) {
    console.log("goal acheived-oombi");
    const { data, error } = await supabase
      .from("main")
      .update({
        wakatime_lm: newakka,
        wakatime_streak: 0,
        wakatime_goal_achieved: 0,
      })
      .eq("uid", id);

    wakatime_lmi = wakacurrdateswork;
  } else if (durationstring.includes("hour")) {
    if (Number(hrs) > hrstoreach && !Boolean(main[0].wakatime_goal_achieved)) {
      console.log("goal acheived hours more than goal");
      const { data, error } = await supabase
        .from("main")
        .update({
          wakatime_goal_achieved: 1,
          wakatime_streak: main[0].wakatime_streak + 1,
          wakatime_lm: newakka,
        })
        .eq("uid", id);
    } else if (Boolean(main[0].wakatime_goal_achieved)) {
      console.log("hey");
    }
  } else {
    const { data, error } = await supabase
      .from("main")
      .update({ wakatime_goal_achieved: 0 })
      .eq("uid", id);
  }

  countContributionStreak(main[0].github_username).then((data) => {
    console.log(data);
    let ghstreak = data;
    supabase
      .from("main")
      .update({
        github_streak: ghstreak,
      })
      .eq("uid", id)
      .then((data) => {
        console.log("streak updated");
      });
  });
  const { data: theres, error: todoerror } = await supabase
    .from("main")
    .select("*")
    .eq("uid", id);
  res.json(theres);
});
app.listen(4000);
