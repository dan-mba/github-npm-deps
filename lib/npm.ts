import {fetch} from 'undici';
import {Repo} from './github.js';

type Package = {
  dependencies: {} | undefined,
  devDependencies: {} | undefined,
}

type PackageObject = Record<string, number>;
type SortedObj = Record<number, string[]>
type SortedArr = {
  count: number,
  list: string[]
}

export async function getPackages(userid: string, repos: Repo[]) {
  const pkgs = await Promise.all(repos.map(async (repo: Repo) => {
    let returnPkgs: string[] = []
    const endpoint = `https://raw.githubusercontent.com/${userid}/${repo.name}/${repo.defaultBranch}/package.json`;
    const res = await fetch(endpoint)
    if (res.ok) {
      const pkg = await res.json() as Package;
      if (pkg.dependencies) {
        returnPkgs = [...Object.keys(pkg.dependencies)];
      }
      if (pkg.devDependencies) {
        returnPkgs = [...returnPkgs ,...Object.keys(pkg.devDependencies)];
      }
    }

    return returnPkgs;
  }));

  const packageList = pkgs.flat();
  let packages: PackageObject = {};

  // Count Packages
  for (const dep of packageList) {
    if (dep in packages) {
      packages[dep]++;
    } else {
      packages[dep] = 1;

    }
  }

  // Creates lists of all the packages with same count
  let packageCount: SortedObj = {};
  for (const dep in packages) {
    const count = packages[dep];
    if (count in packageCount) {
      packageCount[count].push(dep);
    } else {
      packageCount[count] = [dep];
    }
  }

  // Sort array by descending count & packages alphabetically
  let sortedPkgs: SortedArr[] = [];
  for (const count in packageCount) {
    sortedPkgs.push({
      count: Number(count),
      list: packageCount[count]
    })
  }
  sortedPkgs.forEach((lst) => {
    lst.list.sort((a,b) => a.localeCompare(b))
  })
  sortedPkgs.sort((a, b) =>  b.count-a.count);

  return sortedPkgs
}
