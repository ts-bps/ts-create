import { getLogger } from "ts-logger";
import * as inquirer from "inquirer";
import * as spawn from "cross-spawn";
import * as fs from "fs";
//@ts-ignore
// import * as getNpmClient from "get-npm-client";
//@ts-ignore
import * as ghDownload from "github-download";

const ORG = "ts-bps";
const REPOS = {
  "ts-library": "ts-library",
  "ts-react-app": "ts-react-app",
  "ts-react-component": "ts-react-component"
};

const pickBoilerPlateQuestions = [
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
    default: "ts-bp"
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
        log.error(
          `Error downloading from github : ${JSON.stringify(err, null, 2)}`
        );
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
  packageManager = "yarn"
}: {
  pathToProject: string;
  name: string;
  packageManager: "yarn" | "npm"
}) => {
  log.info(`Setting up project  ${name} at ${pathToProject}`);
  const pathToPackageJson = `${pathToProject}/package.json`;
  const packageJson = require(pathToPackageJson);
  const updatedPackageJson = {
    ...packageJson,
    name
  };
  fs.writeFileSync(
    pathToPackageJson,
    JSON.stringify(updatedPackageJson, null, 2)
  );
  const npmClientName = packageManager
  log.success(`Installing dependencies with ${npmClientName}`);
  spawn.sync(npmClientName, ["install"], {
    cwd: pathToProject,
    stdio: "inherit"
  });
  log.success("Done");
  log.info("Removing old history and creating new one");
  spawn.sync("rm", ["-rf", ".git/"], { cwd: pathToProject, stdio: "inherit" });
  spawn.sync("git", ["init"], { cwd: pathToProject, stdio: "inherit" });
  log.success(`cd ${name}/ && ${npmClientName} start`);
};

export const main = async () => {
  const { boilerplate, boilerplateName, packageManager } = await inquirer.prompt(
    pickBoilerPlateQuestions
  );
  log.info(
    `Creating repository ${ORG}/${boilerplate} and putting it in ./${boilerplateName}`
  );
  log.info("Downloading from github");
  await downloadFromGithub({
    user: ORG,
    repo: boilerplate,
    ref: "master",
    destinationName: boilerplateName
  });
  log.success("Downloaded from github.");
  const pathToProject = `${process.cwd()}/${boilerplateName}`;
  await setupTSBP({ pathToProject, name: boilerplateName, packageManager });
  return 0;
};
