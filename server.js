// Import required modules
const express = require('express');
const axios = require('axios');
const dotenv = require('dotenv');
const cors = require('cors');

// Initialize the Express app
const app = express();

app.use(cors());


// Load environment variables from .env file
dotenv.config();


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
        if (date.getFullYear() === 2025 && day.contributionCount > maxContributions) {
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
        if (date.getFullYear() === 2025) {
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

  
  const getReposIn2025 = (repositories) => {
    return repositories.filter(repo => new Date(repo.createdAt).getFullYear() === 2025);
  };

  
  const getMergesDone = (pullRequests) => {
    return pullRequests.filter(pr => pr.state === 'MERGED').length;
  };

  
  const getPRsAndIssuesIn2025 = (prIssues) => {
    const prsIn2025 = prIssues.pullRequests.filter(pr => new Date(pr.createdAt).getFullYear() === 2025);
    const issuesIn2025 = prIssues.issues.filter(issue => new Date(issue.createdAt).getFullYear() === 2025);
  
    return { prsIn2025, issuesIn2025 };
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
    const reposIn2025 = getReposIn2025(repositories);
    const mergesDone = getMergesDone(prIssues.pullRequests);
    const prsAndIssuesIn2025 = getPRsAndIssuesIn2025(prIssues);

    return {
      profileData,
      mostActiveDay,
      mostContributedRepo,
      longestStreak,
      mostUsedLanguages,
      mostStarredRepo,
      reposIn2025,
      mergesDone,
      prsAndIssuesIn2025,
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

//Start the server locally
// app.listen(PORT, () => {
//   console.log(`Server is running on http://localhost:${PORT}`);
// });

// Export the handler for Vercel
module.exports = app;