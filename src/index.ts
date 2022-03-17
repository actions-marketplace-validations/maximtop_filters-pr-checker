import * as core from '@actions/core';
import * as github from '@actions/github';

const run = async () => {
    try {
        const repoToken = core.getInput('repo-token', { required: true });
        const octokit = github.getOctokit(repoToken);

        const { data: pullRequest } = await octokit.rest.pulls.get({
            owner: 'maximtop',
            repo: 'AdguardFilters',
            // TODO get current pr number
            pull_number: 1,
            mediaType: {
                format: 'diff',
            },
        });

        // eslint-disable-next-line no-console
        console.log(pullRequest);
    } catch (e) {
        core.setFailed(e.message);
    }
};

const main = async () => {
    await run();
};

(async () => {
    try {
        await main();
    } catch (e) {
        core.setFailed(e.message);
    }
})();
