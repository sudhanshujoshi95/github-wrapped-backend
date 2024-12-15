// const express = require("express");
// const axios = require("axios");
// const cors = require("cors");
// require("dotenv").config();

// const app = express();
// const PORT = process.env.PORT || 5001;

// // Middleware
// app.use(cors());
// app.use(express.json());

// // GitHub API URLs
// const GITHUB_API_URL = "https://api.github.com/users";
// const GITHUB_GRAPHQL_API_URL = "https://api.github.com/graphql";

// // Route to fetch GitHub user data
// app.get("/api/github/:username", async (req, res) => {
//   const { username } = req.params;

//   try {
//     // Fetch user profile data
//     const userResponse = await axios.get(`${GITHUB_API_URL}/${username}`, {
//       headers: {
//         Authorization: `token ${process.env.GITHUB_ACCESS_TOKEN}`,
//       },
//     });

//     const userData = userResponse.data;

//     // Fetch repositories data
//     const reposResponse = await axios.get(`${GITHUB_API_URL}/${username}/repos`, {
//       headers: {
//         Authorization: `token ${process.env.GITHUB_ACCESS_TOKEN}`,
//       },
//     });

//     const reposData = reposResponse.data;

//     // Fetch GraphQL data for contributions and commit stats
//     const graphQLData = await getGraphQLData(username);

//     // Extract data for the "Wrapped" experience
//     const data = {
//       username: userData.login,
//       fullName: userData.name,
//       avatarUrl: userData.avatar_url,
//       bio: userData.bio,
//       company: userData.company,
//       location: userData.location,
//       githubMemberSince: userData.created_at,
//       totalPublicRepos: userData.public_repos,
//       totalFollowers: userData.followers,
//       totalFollowing: userData.following,

//       // Contribution highlights
//       mostActiveDay: graphQLData.mostActiveDay,
//       mostActiveWeek: graphQLData.mostActiveWeek,
//       mostContributions: graphQLData.mostContributions,
//       firstContributionDate: graphQLData.firstContributionDate,

//       // Repository insights
//       mostStarredRepo: reposData.sort((a, b) => b.stargazers_count - a.stargazers_count)[0]?.name,
//       mostForkedRepo: reposData.sort((a, b) => b.forks_count - a.forks_count)[0]?.name,
//       mostContributedRepo: graphQLData.mostContributedRepo,
//       newestRepo: reposData.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]?.name,
//       oldestRepo: reposData.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))[0]?.name,
//       //languagesUsed: await getLanguagesUsed(username, reposData),
//     };

//     res.status(200).json(data);
//   } catch (error) {
//     console.error(error);
//     res.status(404).json({ error: "User not found or API rate limit exceeded." });
//   }
// });

// // Helper function to get GraphQL data for contributions
// async function getGraphQLData(username) {
//     const query = `
//       query {
//         user(login: "${username}") {
//           contributionsCollection {
//             contributionCalendar {
//               weeks {
//                 contributionDays {
//                   date
//                   contributionCount
//                 }
//               }
//             }
//             commitContributionsByRepository {
//               repository {
//                 name
//                 owner {
//                   login
//                 }
//               }
//               contributions {
//                 totalCount
//               }
//             }
//           }
//         }
//       }
//     `;
  
//     try {
//       const response = await axios.post(
//         GITHUB_GRAPHQL_API_URL,
//         { query },
//         {
//           headers: {
//             Authorization: `token ${process.env.GITHUB_ACCESS_TOKEN}`,
//           },
//         }
//       );
  
//       const contributionDays = response.data.data.user.contributionsCollection.contributionCalendar.weeks
//         .flatMap(week => week.contributionDays);
  
//       let mostActiveDay = "";
//       let mostActiveWeek = "";
//       let maxCommitsDay = 0;
//       let maxCommitsWeek = 0;
//       let mostContributedRepo = "";
//       let mostContributedRepoCommits = 0;
  
//       // Find the most active day
//       contributionDays.forEach(day => {
//         if (day.contributionCount > maxCommitsDay) {
//           mostActiveDay = day.date;
//           maxCommitsDay = day.contributionCount;
//         }
//       });
  
//       // Find the most active week
//       response.data.data.user.contributionsCollection.contributionCalendar.weeks.forEach(week => {
//         const weekCommitCount = week.contributionDays.reduce((total, day) => total + day.contributionCount, 0);
//         if (weekCommitCount > maxCommitsWeek) {
//           mostActiveWeek = week.contributionDays[0].date; // Assuming the first day in the week represents the week
//           maxCommitsWeek = weekCommitCount;
//         }
//       });
  
//       // Calculate the most contributed repo
//       response.data.data.user.contributionsCollection.commitContributionsByRepository.forEach(repo => {
//         const repoCommitCount = repo.contributions.totalCount;
//         if (repoCommitCount > mostContributedRepoCommits) {
//           mostContributedRepo = repo.repository.name;
//           mostContributedRepoCommits = repoCommitCount;
//         }
//       });
  
//       return {
//         mostActiveDay,
//         mostActiveWeek,
//         mostContributions: maxCommitsDay, // Using most active day for lines committed
//         firstContributionDate: contributionDays.length > 0 ? contributionDays[contributionDays.length - 1].date : null,
//         mostContributedRepo,
//       };
//     } catch (error) {
//       console.error("Error fetching GraphQL data", error);
//       return {};
//     }
//   }
  
  

// // Start the server
// app.listen(PORT, () => {
//   console.log(`Server is running on http://localhost:${PORT}`);
// });


// Import required modules
const express = require('express');
const axios = require('axios');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

// Initialize the Express app
const app = express();
const PORT = process.env.PORT || 3000;

// GitHub GraphQL API URL
const GITHUB_API_URL = 'https://api.github.com/graphql';

// GitHub Access Token from .env
const GITHUB_ACCESS_TOKEN = process.env.GITHUB_ACCESS_TOKEN;

// Function to fetch user profile data
const fetchUserProfile = async (username) => {
    const query = `
      query {
        user(login: "${username}") {
          login
          name
          avatarUrl
          bio
          company
          location
          createdAt
          publicRepos: repositories(privacy: PUBLIC, first: 1) {
            totalCount
          }
          followers {
            totalCount
          }
          following {
            totalCount
          }
        }
      }
    `;
  
    try {
      const response = await axios.post(GITHUB_API_URL, { query }, {
        headers: {
          'Authorization': `Bearer ${GITHUB_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
      });
  
      // Log the full response to check the structure (remove in production)
      console.log(response.data);
  
      if (response.data.errors) {
        console.error('GitHub API Errors:', response.data.errors);
        throw new Error('Failed to fetch data from GitHub');
      }
  
      // Return the user data if no errors
      return response.data.data.user;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw new Error('Failed to fetch GitHub user profile');
    }
  };

// Function to fetch contribution data
const fetchContributions = async (username) => {
  const query = `
    query {
      user(login: "${username}") {
        contributionsCollection {
          commitContributionsByRepository(maxRepositories: 10) {
            repository {
              name
            }
            contributions {
              totalCount
            }
          }
        }
      }
    }
  `;

  const response = await axios.post(GITHUB_API_URL, { query }, {
    headers: {
      'Authorization': `Bearer ${GITHUB_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
  });

  console.log(response.data);

  return response.data.data.user.contributionsCollection;
};

// Function to fetch repositories data
const fetchRepositories = async (username) => {
  const query = `
    query {
      user(login: "${username}") {
        repositories(first: 100) {
          nodes {
            name
            stargazerCount
            forkCount
            createdAt
            languages(first: 5) {
              nodes {
                name
              }
            }
          }
        }
      }
    }
  `;

  const response = await axios.post(GITHUB_API_URL, { query }, {
    headers: {
      'Authorization': `Bearer ${GITHUB_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
  });

  console.log(response.data);

  return response.data.data.user.repositories.nodes;
};

// Function to fetch contribution statistics
const fetchContributionStatistics = async (username) => {
  const query = `
    query {
      user(login: "${username}") {
        contributionsCollection {
          contributionCalendar {
            weeks {
          contributionDays {
            date
            contributionCount
          }
        }
          }
        }
      }
    }
  `;

  const response = await axios.post(GITHUB_API_URL, { query }, {
    headers: {
      'Authorization': `Bearer ${GITHUB_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
  });

  console.log(response.data);

  return response.data.data.user.contributionsCollection.contributionCalendar;
};

// Function to fetch pull requests and issues data
const fetchPullRequestsAndIssues = async (username) => {
  const query = `
    query {
      user(login: "${username}") {
        pullRequests(first: 100) {
          nodes {
            title
            createdAt
            repository {
              name
            }
          }
        }
        issues(first: 100) {
          nodes {
            title
            createdAt
            repository {
              name
            }
          }
        }
      }
    }
  `;

  const response = await axios.post(GITHUB_API_URL, { query }, {
    headers: {
      'Authorization': `Bearer ${GITHUB_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
  });

  console.log(response.data);

  return {
    pullRequests: response.data.data.user.pullRequests.nodes,
    issues: response.data.data.user.issues.nodes,
  };
};

// Function to fetch starred repositories
const fetchStarredRepositories = async (username) => {
  const query = `
    query {
      user(login: "${username}") {
        starredRepositories(first: 100) {
          nodes {
            name
            stargazerCount
          }
        }
      }
    }
  `;

  const response = await axios.post(GITHUB_API_URL, { query }, {
    headers: {
      'Authorization': `Bearer ${GITHUB_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
  });

  console.log(response.data);

  return response.data.data.user.starredRepositories.nodes;
};

const getMostActiveDay = (contributionCalendar) => {
    let mostActiveDay = null;
    let maxContributions = 0;
  
    contributionCalendar.weeks.forEach(week => {
      week.contributionDays.forEach(day => {
        const date = new Date(day.date);
        if (date.getFullYear() === 2024 && day.contributionCount > maxContributions) {
          maxContributions = day.contributionCount;
          mostActiveDay = day.date;
        }
      });
    });
  
    return { mostActiveDay, maxContributions };
  };

  const getMostContributedRepo = (contributions) => {
    let mostContributedRepo = null;
    let maxCommits = 0;
  
    contributions.commitContributionsByRepository.forEach(repo => {
      if (repo.contributions.totalCount > maxCommits) {
        maxCommits = repo.contributions.totalCount;
        mostContributedRepo = repo.repository.name;
      }
    });
  
    return { mostContributedRepo, maxCommits };
  };

  const getLongestStreak = (contributionCalendar) => {
    let longestStreak = 0;
    let currentStreak = 0;
  
    contributionCalendar.weeks.forEach(week => {
      week.contributionDays.forEach(day => {
        const date = new Date(day.date);
        if (date.getFullYear() === 2024) {
          if (day.contributionCount > 0) {
            currentStreak++;
            longestStreak = Math.max(longestStreak, currentStreak);
          } else {
            currentStreak = 0;
          }
        }
      });
    });
  
    return longestStreak;
  };

  
  // Function to calculate the most used languages
const calculateMostUsedLanguages = (repositories) => {
    const languageUsage = {};
  
    repositories.forEach((repo) => {
      if (repo.languages && repo.languages.nodes) {
        repo.languages.nodes.forEach((language) => {
          const langName = language.name;
          languageUsage[langName] = (languageUsage[langName] || 0) + 1;
        });
      }
    });
  
    // Convert the object to an array of [language, count], sorted by count in descending order
    const sortedLanguages = Object.entries(languageUsage)
      .sort((a, b) => b[1] - a[1])
      .map(([language, count]) => ({ language, count }));
  
    return sortedLanguages;
  };
  

  
  const getMostStarredRepo = (starredRepos) => {
    return starredRepos.reduce((mostStarred, repo) => {
      return repo.stargazerCount > (mostStarred?.stargazerCount || 0) ? repo : mostStarred;
    }, null);
  };

  
  const getReposIn2024 = (repositories) => {
    return repositories.filter(repo => new Date(repo.createdAt).getFullYear() === 2024);
  };

  
  const getMergesDone = (pullRequests) => {
    return pullRequests.filter(pr => pr.state === 'MERGED').length;
  };

  
  const getPRsAndIssuesIn2024 = (prIssues) => {
    const prsIn2024 = prIssues.pullRequests.filter(pr => new Date(pr.createdAt).getFullYear() === 2024);
    const issuesIn2024 = prIssues.issues.filter(issue => new Date(issue.createdAt).getFullYear() === 2024);
  
    return { prsIn2024, issuesIn2024 };
  };

  


// Main function to fetch all GitHub Wrapped data
const generateGitHubWrapped = async (username) => {
  try {
    const profileData = await fetchUserProfile(username);
    const contributions = await fetchContributions(username);
    const repositories = await fetchRepositories(username);
    const contributionStats = await fetchContributionStatistics(username);
    const prIssues = await fetchPullRequestsAndIssues(username);
    const starredRepos = await fetchStarredRepositories(username);

    const mostActiveDay = getMostActiveDay(contributionStats);
    const mostContributedRepo = getMostContributedRepo(contributions);
    const longestStreak = getLongestStreak(contributionStats);
    const mostUsedLanguages = calculateMostUsedLanguages(repositories);
    const mostStarredRepo = getMostStarredRepo(starredRepos);
    const reposIn2024 = getReposIn2024(repositories);
    const mergesDone = getMergesDone(prIssues.pullRequests);
    const prsAndIssuesIn2024 = getPRsAndIssuesIn2024(prIssues);

    return {
      profileData,
      mostActiveDay,
      mostContributedRepo,
      longestStreak,
      mostUsedLanguages,
      mostStarredRepo,
      reposIn2024,
      mergesDone,
      prsAndIssuesIn2024,
    };
  } catch (error) {
    console.error('Error fetching data from GitHub:', error);
    throw error;
  }
};


// Route to generate GitHub Wrapped
app.get('/github-wrapped/:username', async (req, res) => {
  const { username } = req.params;

  try {
    const wrappedData = await generateGitHubWrapped(username);
    res.json(wrappedData);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch GitHub data' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
