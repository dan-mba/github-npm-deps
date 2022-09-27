import {GraphQLClient, gql} from 'graphql-request';

export type Repo = {
  name: string,
  defaultBranch: string,
  languages: string[]
}

const npmLangs = ['JavaScript', 'TypeScript']

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
    let data = await graphqlClient.request(query, {"login": userid});
    let repos = [...data.user.repositories.nodes];

    while (data.user.repositories.pageInfo.hasNextPage) {
      data = await graphqlClient.request(query, {
        "login": userid,
        "after": data.user.repositories.pageInfo.endCursor, 
      });
      repos = [...repos, ...data.user.repositories.nodes];
    }
    
    repos = repos.map(repo => {
      const langs = repo.languages.nodes.map((lang: {name: string}) => lang.name);

      return {
        name: repo.name,
        defaultBranch: repo.defaultBranchRef.name,
        languages: langs
      }
    });

    // filter out repos not including one of specified languages
    repos = repos.filter(repo => (repo.languages.some((l: string) => npmLangs.includes(l))));

    return repos as [Repo];
  } catch(e) {
    console.log('Call to GitHub GraphQL API failed');
    throw e;
  }
}
