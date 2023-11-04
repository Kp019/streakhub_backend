const express = require("express");
const { createClient } = require("@supabase/supabase-js");
const app = express();
require("dotenv").config();

const supabaseurl = process.env.PUBLIC_SUPABASE_URL;
const supabasekey = process.env.PUBLIC_SUPABASE_KEY;
const supabase = createClient(supabaseurl, supabasekey);

function addDays(date, days) {
  date.setDate(date.getDate() + days);
  return date;
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

app.get("/connect/:id", async (req, res) => {
  let id = req.params;
  id = Number(id.id);
  let { data: main, error } = await supabase
    .from("main")
    .select("*")
    .eq("uid", id);

  //   let todaysDate = new Date();
  //   let date = new Date(main[0].github_last_accessed);
  //   date.setHours(0, 0, 0, 0);
  //   let yesterday = addDays(todaysDate, -1);
  //   yesterday.setHours(0, 0, 0, 0);
  //   if (String(yesterday) == String(date)) {
  //     todaysDate.setHours(0, 0, 30, 0);
  //     //check if today done by github
  //     if (1) {
  //       let ghstreak = main[0].github_streak;
  //       ghstreak++;
  //       let { data, error } = await supabase
  //         .from("main")
  //         .update({
  //           github_streak: ghstreak,
  //           github_last_accessed: todaysDate.,
  //         })
  //         .eq("uid", id);
  //     }
  //   }
  //   res.json(main);
  // });

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

  res.json(main);
});
app.listen(4000);
