import dotenv from 'dotenv';
import {getRepos} from './lib/github.js';
import {getPackages} from './lib/npm.js'

dotenv.config();

const repos = await getRepos(process.env.GITHUB_USERID as string, process.env.GITHUB_TOKEN as string)
const pkgs = await getPackages(process.env.GITHUB_USERID as string, repos)
console.log(JSON.stringify(pkgs, null, 2));
