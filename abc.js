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

// const username = "technodumb"
const token = "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";
// const data = getContributions(token, username).then(
//     data => {
//         // console.log(data.user.contributionsCollection)
//         // console.log(data.data.user.contributionsCollection.contributionCalendar.weeks[0].contributionDays)
//         // console.log(data.data.user.contributionsCollection.contributionCalendar.weeks[0].contributionDays[0].contributionCount)
//     }
// )

countContributionStreak("technodumb").then((data) => {
  console.log(data);
});
// console.log(data)

async function countContributionStreak(username) {
  const response = await getContributions(token, username);
  const weeks =
    response.data.user.contributionsCollection.contributionCalendar.weeks;
  let streakCount = 0;
  for (let i = weeks.length - 1; i >= 0; i--) {
    const week = weeks[i];
    const days = week.contributionDays;
    console.log(days);
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

async function countContributionStreak(username) {
  const response = await getContributions(token, username);
  const weeks =
    response.data.user.contributionsCollection.contributionCalendar.weeks;
  let streakCount = 0;
  for (let i = weeks.length - 1; i >= 0; i--) {
    const week = weeks[i];
    const days = week.contributionDays;
    console.log(days);
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
