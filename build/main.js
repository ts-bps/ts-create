"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
}
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
}
Object.defineProperty(exports, "__esModule", { value: true });
const ts_logger_1 = require("ts-logger");
const inquirer = __importStar(require("inquirer"));
const spawn = __importStar(require("cross-spawn"));
const fs = __importStar(require("fs"));
const github_download_1 = __importDefault(require("github-download"));
const clipboardy_1 = __importDefault(require("clipboardy"));
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
        default: "thing-name"
    },
    {
        type: "input",
        message: "Url to the repo :",
        name: "repoUrl",
        default: "https://github.com/"
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
];
const log = ts_logger_1.getLogger();
const downloadFromGithub = ({ user, repo, ref, destinationName }) => {
    return new Promise((resolve, reject) => {
        github_download_1.default({ user, repo, ref }, `${process.cwd()}/${destinationName}`)
            .on("error", (err) => {
            reject(err);
        })
            .on("end", () => {
            resolve();
        });
    });
};
const setupTSBP = ({ pathToProject, name, description = "A thing.", packageManager = "yarn", repoUrl = "" }) => __awaiter(this, void 0, void 0, function* () {
    log.info(`Setting up project  ${name} at ${pathToProject}`);
    var userName = require("git-user-name");
    log.error(userName);
    return;
    const pathToPackageJson = `${pathToProject}/package.json`;
    const packageJson = require(pathToPackageJson);
    const updatedPackageJson = Object.assign({ name,
        description, repository: {
            type: "git",
            url: repoUrl
        } }, packageJson);
    fs.writeFileSync(pathToPackageJson, JSON.stringify(updatedPackageJson, null, 2));
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
    clipboardy_1.default.writeSync(START_COMMAND);
    log.success(`${START_COMMAND} [ In Clipboard ]`);
});
exports.main = () => __awaiter(this, void 0, void 0, function* () {
    const { boilerplate, boilerplateName, packageManager, description, repoUrl } = yield inquirer.prompt(pickBoilerPlateQuestions);
    log.info("Downloading from github");
    try {
        yield downloadFromGithub({
            user: ORG,
            repo: boilerplate,
            ref: "master",
            destinationName: boilerplateName
        });
    }
    catch (err) {
        log.error(`${err.code} ${err.message}`);
        return;
    }
    log.success("Downloaded from github.");
    const pathToProject = `${process.cwd()}/${boilerplateName}`;
    yield setupTSBP({
        pathToProject,
        name: boilerplateName,
        packageManager,
        description,
        repoUrl
    });
    return 0;
});
