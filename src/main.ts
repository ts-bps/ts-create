import { getLogger } from "ts-logger";
import * as inquirer from "inquirer";
import * as spawn from "cross-spawn";
import * as fs from "fs";
//@ts-ignore
import ghDownload from "github-download";
//@ts-ignore
import copy from "clipboardy";

import parse from "parse-git-config";

const ORG = "ts-bps";
const REPOS = {
  "ts-library": "ts-library",
  "ts-react-app": "ts-react-app",
  "ts-react-component": "ts-react-component"
};

const pickBoilerPlateQuestions = () =>
  [
    {
      type: "rawlist",
      message: "Which TypeScript boilerplate ?",
      name: "boilerplate",
      choices: [
        {
          name: "library",
          value: "ts-library"
        },
        {
          name: "react-component",
          value: "ts-react-component"
        },
        {
          name: "react-app",
          value: "ts-react-app"
        }
      ]
    },
    {
      type: "input",
      message: "Name ?",
      name: "boilerplateName",
      default: "thing-name"
    },
    {
      type: "input",
      message: "Description",
      name: "description",
      default: "A thing that does some things."
    },
    {
      type: "rawlist",
      message: "Which package manager ?",
      name: "packageManager",
      choices: [
        {
          name: "yarn",
          value: "yarn"
        },
        {
          name: "npm",
          value: "npm"
        }
      ]
    }
  ] as inquirer.Questions;

const log = getLogger();

const downloadFromGithub = ({
  user,
  repo,
  ref,
  destinationName
}: {
  user: string;
  repo: string;
  ref: string;
  destinationName: string;
}) => {
  return new Promise((resolve, reject) => {
    ghDownload({ user, repo, ref }, `${process.cwd()}/${destinationName}`)
      .on("error", (err: any) => {
        reject(err);
      })
      .on("end", () => {
        resolve();
      });
  });
};

const setupTSBP = async ({
  pathToProject,
  name,
  description = "A thing.",
  packageManager = "yarn",
  repoUrl = ""
}: {
  description: string;
  pathToProject: string;
  name: string;
  packageManager: "yarn" | "npm";
  repoUrl: string;
}) => {
  log.info(`Setting up project  ${name} at ${pathToProject}`);
  const pathToPackageJson = `${pathToProject}/package.json`;
  const packageJson = require(pathToPackageJson);
  const updatedPackageJson = {
    ...packageJson.name,
    description,
    repository: {
      type: "git",
      url: repoUrl
    }
  };
  fs.writeFileSync(
    pathToPackageJson,
    JSON.stringify(updatedPackageJson, null, 2)
  );
  const npmClientName = packageManager;
  log.success(`Installing dependencies with ${npmClientName}`);
  spawn.sync(npmClientName, ["install"], {
    cwd: pathToProject,
    stdio: "inherit"
  });
  log.success("Done");
  log.info("Removing old history and creating new one");
  spawn.sync("rm", ["-rf", ".git/"], { cwd: pathToProject, stdio: "inherit" });
  spawn.sync("git", ["init"], { cwd: pathToProject, stdio: "inherit" });

  const START_COMMAND = `cd ${name}/ && ${npmClientName} start`;
  copy.writeSync(START_COMMAND);
  log.success(`${START_COMMAND} [ In Clipboard ]`);
};
//@ts-ignore
import getUserName from "git-user-name";
export const main = async () => {
  const {
    boilerplate,
    boilerplateName,
    packageManager,
    description
  } = await inquirer.prompt(pickBoilerPlateQuestions());
  log.info("Downloading from github");
  try {
    await downloadFromGithub({
      user: ORG,
      repo: boilerplate,
      ref: "master",
      destinationName: boilerplateName
    });
  } catch (err) {
    log.error(`${err.code} ${err.message}`);
    return;
  }

  log.success("Downloaded from github.");
  const pathToProject = `${process.cwd()}/${boilerplateName}`;
  const repoUrl = `https://github.com/${getUserName()}/${boilerplateName}`;
  await setupTSBP({
    pathToProject,
    name: boilerplateName,
    packageManager,
    description,
    repoUrl
  });
  return 0;
};
