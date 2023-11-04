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

app.get("/connect/:id", async (req, res) => {
  let id = req.params;

  id = Number(id.id);
  let { data: main, error } = await supabase
    .from("main")
    .select("*")
    .eq("uid", id);

  let todaysDate = new Date();
  let date = new Date(main[0].github_last_accessed);
  date.setHours(0, 0, 0, 0);
  todaysDate.setHours(0, 0, 0, 0);
  let yesterday = addDays(todaysDate, -1);
  yesterday.setHours(0, 0, 0, 0);
  if (String(yesterday) == String(date)) {
    //check if today done by github
    if (1) {
      let ghstreak = main[0].github_streak;
      console.log(ghstreak);
      ghstreak++;
      let { data, error } = await supabase
        .from("main")
        .update({ github_streak: ghstreak, github_last_accessed: todaysDate })
        .eq("uid", id);
    }
  }
  res.json(main);
});

app.listen(4000);
