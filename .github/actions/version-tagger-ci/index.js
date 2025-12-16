// 5. In the index.js, based on release type
//   5.1 Get last tag from the default branch
//   5.2 Get all commits since the last tag to current HEAD
//   5.3 auto: computes new tag based on commit messages
//     - If any commit has "BREAKING CHANGE" in its message, consider it a major change. Increment major version by 1 and reset minor and patch to 0
//     - Else if any commit starts with "feat:", consider it a minor change. Increment minor version by 1 and reset patch to 0
//     - Else consider it a patch change. Increment patch version by 1
//   5.4 patch: increments patch version
//   5.5 minor: increments minor version
//   5.6 major: increments major version

const core = require('@actions/core');
const github = require('@actions/github');
const semver = require('semver');
const exec = require('child_process').execSync;

async function run() {
    try {
        const releaseType = core.getInput('release-type', { required: true });
        const token = core.getInput('github-token', { required: true });
        const defaultBranch = core.getInput('default-branch', { required: true });
        const octokit = github.getOctokit(token);
        const { owner, repo } = github.context.repo;

        core.setSecret(token);

        // Get the latest tag
        const { data: tags } = await octokit.rest.repos.listTags({
            owner,
            repo,
            per_page: 1
        });

        let latestTag = tags.length ? tags[0].name : '0.0.0';
        console.log(`latest_tag: ${latestTag}`);
        
        // Get commits since the latest tag
        let commits;
        if (latestTag === '0.0.0') {
            // Get all commits if no tags exist
            const { data: commitsArray } = await octokit.rest.repos.listCommits({
                owner,
                repo,
                sha: defaultBranch
            });
            commits = { commits: commitsArray };
        } else {
            const { data } = await octokit.rest.repos.compareCommits({
                owner,
                repo,
                base: latestTag,
                head: defaultBranch
            });
            commits = data;
        }

        let newVersion;

        if (releaseType === 'auto') {
            let incrementType = 'patch';
            for (const commit of commits.commits) {
                const message = commit.commit.message;
                if (message.includes('BREAKING CHANGE')) {
                    incrementType = 'major';
                    break;
                } else if (message.startsWith('feat:')) {
                    incrementType = 'minor';
                }
            }
            newVersion = semver.inc(latestTag, incrementType);
        } else if (['patch', 'minor', 'major'].includes(releaseType)) {
            newVersion = semver.inc(latestTag, releaseType);
        } else {
            throw new Error(`Invalid release type: ${releaseType}`);
        }

        // Create new tag
        exec(`git tag ${newVersion}`);
        exec(`git push origin ${newVersion}`);
        core.setOutput('new-version', newVersion);
        console.log(`New version tagged: ${newVersion}`);
    } catch (error) {
        core.setFailed(error.message);
    }
}

run();