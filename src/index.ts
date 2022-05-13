import 'dotenv/config';

import * as core from '@actions/core';
import { github, imgur } from './api';
import { getUrlFromDescription } from './helpers';
import { screenshot } from './screenshot';
import { extension } from './extension';

/**
 * - get filter before pr
 * - make screenshot before.jpg
 * - get filter after pr
 * - make screenshot after.jpg
 * - append screenshots in comments
 */
const run = async () => {
    const owner = 'maximtop';
    const repo = 'AdguardFilters';
    // FIXME get current pr
    const pullNumber = 1;

    const prInfo = await github.getPullRequest({
        owner,
        repo,
        pullNumber,
    });

    if (!prInfo.body) {
        throw new Error('Pull request description is required');
    }

    const pullRequestFiles = await github.getPullRequestFiles({
        owner,
        repo,
        pullNumber,
    });

    const baseFileContent = await github.getContent({
        owner: prInfo.base.owner,
        repo: prInfo.base.repo,
        path: pullRequestFiles[0],
        ref: prInfo.base.sha,
    });

    const headFileContent = await github.getContent({
        owner: prInfo.head.owner,
        repo: prInfo.head.repo,
        path: pullRequestFiles[0],
        ref: prInfo.head.sha,
    });

    const url = getUrlFromDescription(prInfo.body);

    if (!url) {
        throw new Error('URL in the pull request is required');
    }

    const context = await extension.start();

    await extension.config(context, baseFileContent.toString());
    const baseScreenshot = await screenshot(context, { url, path: 'base_image.jpeg' });

    await extension.config(context, headFileContent.toString());
    const headScreenshot = await screenshot(context, { url, path: 'head_image.jpeg' });

    // TODO unite in one module
    await context.browserContext.close();

    const [baseLink, headLink] = await Promise.all([
        imgur.upload(baseScreenshot),
        imgur.upload(headScreenshot),
    ]);

    const body = `before: ![baseScreenshot](${baseLink}) \r\nafter:![headScreenshot](${headLink})`;

    console.log(body);

    // await github.createComment({
    //     repo,
    //     owner,
    //     issueNumber: pullNumber,
    //     body,
    // });
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
