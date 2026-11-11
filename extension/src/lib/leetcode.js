// LeetCode GraphQL client. Runs only in the background service worker,
// which has host permission for leetcode.com and a DNR rule that sets
// Origin/Referer so LeetCode accepts the requests.

const ENDPOINT = "https://leetcode.com/graphql";

async function gql(query, variables = {}) {
  const headers = { "Content-Type": "application/json" };
  const csrf = await chrome.cookies.get({ url: "https://leetcode.com", name: "csrftoken" });
  if (csrf?.value) headers["x-csrftoken"] = csrf.value;

  const res = await fetch(ENDPOINT, {
    method: "POST",
    credentials: "include",
    headers,
    body: JSON.stringify({ query, variables }),
  });
  if (res.status === 429) throw new Error("LeetCode is rate limiting requests. Try again in a minute.");
  if (!res.ok) throw new Error(`LeetCode responded with ${res.status}.`);
  const json = await res.json();
  if (!json.data && json.errors?.length) throw new Error(json.errors[0].message);
  return json.data;
}

export async function fetchSignedInUser() {
  const data = await gql(`query { userStatus { isSignedIn username } }`);
  const s = data?.userStatus;
  return s?.isSignedIn ? s.username : null;
}

const PROFILE_QUERY = `
query profile($username: String!) {
  allQuestionsCount { difficulty count }
  matchedUser(username: $username) {
    username
    profile { realName userAvatar ranking countryName }
    submitStatsGlobal { acSubmissionNum { difficulty count } }
    userCalendar { streak totalActiveDays }
  }
  userContestRanking(username: $username) {
    rating globalRanking attendedContestsCount topPercentage
  }
  recentAcSubmissionList(username: $username, limit: 10) { title titleSlug timestamp }
}`;

const byDifficulty = (list = []) =>
  Object.fromEntries(list.map((x) => [x.difficulty.toLowerCase(), x.count]));

export async function fetchProfile(username) {
  const data = await gql(PROFILE_QUERY, { username });
  const u = data?.matchedUser;
  if (!u) throw new Error(`No LeetCode user named "${username}".`);

  const solved = byDifficulty(u.submitStatsGlobal?.acSubmissionNum);
  const totals = byDifficulty(data.allQuestionsCount);
  const c = data.userContestRanking;

  return {
    username: u.username,
    realName: u.profile?.realName || "",
    avatar: u.profile?.userAvatar || "",
    ranking: u.profile?.ranking || null,
    country: u.profile?.countryName || "",
    solved: { all: solved.all || 0, easy: solved.easy || 0, medium: solved.medium || 0, hard: solved.hard || 0 },
    totals: { all: totals.all || 0, easy: totals.easy || 0, medium: totals.medium || 0, hard: totals.hard || 0 },
    contest: c && c.attendedContestsCount
      ? {
          rating: Math.round(c.rating),
          globalRanking: c.globalRanking,
          attended: c.attendedContestsCount,
          topPercentage: c.topPercentage,
        }
      : null,
    streak: u.userCalendar?.streak || 0,
    activeDays: u.userCalendar?.totalActiveDays || 0,
    recent: (data.recentAcSubmissionList || []).map((s) => ({
      title: s.title,
      slug: s.titleSlug,
      timestamp: Number(s.timestamp) * 1000,
    })),
  };
}

const QUESTION_QUERY = `
query question($titleSlug: String!) {
  question(titleSlug: $titleSlug) {
    questionFrontendId title titleSlug difficulty isPaidOnly content
    topicTags { name }
    hints
    codeSnippets { code }
  }
}`;

export async function fetchQuestion(slug) {
  const data = await gql(QUESTION_QUERY, { titleSlug: slug });
  const q = data?.question;
  if (!q) throw new Error("Couldn't load this problem from LeetCode.");
  return {
    id: q.questionFrontendId,
    title: q.title,
    slug: q.titleSlug,
    difficulty: q.difficulty,
    paidOnly: q.isPaidOnly,
    html: q.content || "",
    tags: (q.topicTags || []).map((t) => t.name),
    hints: q.hints || [],
    starters: (q.codeSnippets || []).map((s) => s.code),
  };
}
