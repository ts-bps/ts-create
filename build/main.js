"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ts_logger_1 = require("ts-logger");
const inquirer = require("inquirer");
const spawn = require("cross-spawn");
const fs = require("fs");
//@ts-ignore
const getNpmClient = require("get-npm-client");
//@ts-ignore
const ghDownload = require("github-download");
const ORG = "ts-bps";
const REPOS = {
    "ts-library": "ts-library",
    "ts-react-app": "ts-react-app",
    "ts-react-native-component": "ts-react-native-component",
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
                name: "react-native-component",
                value: "ts-react-native-component"
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
    }
];
const log = ts_logger_1.getLogger();
const downloadFromGithub = ({ user, repo, ref, destinationName }) => {
    return new Promise((resolve, reject) => {
        ghDownload({ user, repo, ref }, `${process.cwd()}/${destinationName}`)
            .on("error", (err) => {
            log.error(`Error downloading from github : ${JSON.stringify(err, null, 2)}`);
            reject(err);
        })
            .on("end", () => {
            resolve();
        });
    });
};
const getNpmClientName = async () => {
    const npmClient = await getNpmClient();
    return npmClient === "yarn" ? npmClient : "npm";
};
const setupTSBP = async ({ pathToProject, name }) => {
    log.info(`Setting up project  ${name} at ${pathToProject}`);
    const pathToPackageJson = `${pathToProject}/package.json`;
    const packageJson = require(pathToPackageJson);
    const updatedPackageJson = Object.assign({}, packageJson, { name });
    fs.writeFileSync(pathToPackageJson, JSON.stringify(updatedPackageJson, null, 2));
    const npmClientName = await getNpmClientName();
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
exports.main = async () => {
    const { boilerplate, boilerplateName } = await inquirer.prompt(pickBoilerPlateQuestions);
    log.info(`Creating repository ${ORG}/${boilerplate} and putting it in ./${boilerplateName}`);
    log.info("Downloading from github");
    await downloadFromGithub({
        user: ORG,
        repo: boilerplate,
        ref: "master",
        destinationName: boilerplateName
    });
    log.success("Downloaded from github.");
    const pathToProject = `${process.cwd()}/${boilerplateName}`;
    await setupTSBP({ pathToProject, name: boilerplateName });
    return 0;
};
