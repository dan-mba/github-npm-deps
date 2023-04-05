import {GraphQLClient, gql} from 'graphql-request';

export type Repo = {
  name: string,
  defaultBranch: string,
  languages: string[]
};

type Response = {
  user: {
    repositories: {
      nodes: {
        name: string,
        defaultBranchRef: {
          name: string
        },
        languages: {
          nodes: {
            name: string
          }[]
        }
      }[],
      pageInfo: {
        endCursor: string,
        hasNextPage: boolean
      }
    }
  }
}

const npmLangs = ['JavaScript', 'TypeScript'];
const repoName = 'github-npm-deps';

export async function getRepos(userid: string, authToken: string): Promise<Repo[]> {
  const endpoint = 'https://api.github.com/graphql';

  const graphqlClient = new GraphQLClient(endpoint, {
    headers: {
      Authorization: `bearer ${authToken}` 
    }
  });

  const query = gql`
    query getRepoData($login: String!, $after: String) {
      user(login: $login) {
        repositories(first: 100, isFork: false, after: $after) {
          nodes {
            name
            defaultBranchRef {
              name
            }
            languages(orderBy: {field: SIZE, direction: DESC}, first: 10) {
              nodes {
                name
              }
            }
          }
          pageInfo {
            endCursor
            hasNextPage
          }
        }
      }
    }
  `;

  try {
    let data: Response = await graphqlClient.request(query, {"login": userid});
    let repos = [...data.user.repositories.nodes];

    while (data.user.repositories.pageInfo.hasNextPage) {
      data = await graphqlClient.request(query, {
        "login": userid,
        "after": data.user.repositories.pageInfo.endCursor, 
      });
      repos = [...repos, ...data.user.repositories.nodes];
    }
    
    let retRepos = repos.map(repo => {
      const langs = repo.languages.nodes.map((lang: {name: string}) => lang.name);

      return {
        name: repo.name,
        defaultBranch: repo.defaultBranchRef.name,
        languages: langs
      }
    });

    // filter out this repo & repos not including one of specified languages
    retRepos = retRepos.filter(repo => (repo.name != repoName && repo.languages.some((l: string) => npmLangs.includes(l))));

    return retRepos;
  } catch(e) {
    console.log('Call to GitHub GraphQL API failed');
    throw e;
  }
}
