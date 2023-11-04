const express = require("express");
const { createClient } = require("@supabase/supabase-js");
const app = express();
require("dotenv").config();

const supabaseurl = process.env.PUBLIC_SUPABASE_URL;
const supabasekey = process.env.PUBLIC_SUPABASE_KEY;
const supabase = createClient(supabaseurl, supabasekey);
app.get("/connect/:id", async (req, res) => {
  const id = req.params;
  let { data: main, error } = await supabase.from("main").select("*");
  console.log(main);
  res.json(main);
});
app.listen(4000);
