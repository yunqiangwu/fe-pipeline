/**
 * Copyright (c) 2020 Gitpod GmbH. All rights reserved.
 * Licensed under the GNU Affero General Public License (AGPL).
 * See License-AGPL.txt in the project root for license information.
 */

import { Injectable } from "@nestjs/common";
import { URLSearchParams, URL } from "url";

@Injectable()
export class ContextParser {

    public async parseURL(contextUrl: string): Promise<URLParts> {
        const url = new URL(contextUrl);
        const pathname = url.pathname.replace(/^\//, "").replace(/\/$/, ""); // pathname without leading and trailing slash
        const segments = pathname.split('/');

        const host = url.host; // as per contract, cf. `canHandle(user, contextURL)`

        const lenghtOfRelativePath = host.split("/").length - 1; // e.g. "123.123.123.123/gitlab" => length of 1
        if (lenghtOfRelativePath > 0) {
            // remove segments from the path to be consider further, which belong to the relative location of the host
            // cf. https://github.com/gitpod-io/gitpod/issues/2637
            segments.splice(0, lenghtOfRelativePath);
        }

        var owner: string = segments[0];
        var repoName: string = segments[1];
        var moreSegmentsStart: number = 2;
        const endsWithRepoName = segments.length === moreSegmentsStart;
        const searchParams = url.searchParams;
        return {
            protocol: url.protocol,
            host,
            owner,
            repoName: this.parseRepoName(repoName, endsWithRepoName),
            moreSegments: endsWithRepoName ? [] : segments.slice(moreSegmentsStart),
            searchParams
        }
    }

    protected parseRepoName(urlSegment: string, lastSegment: boolean): string {
        return lastSegment && urlSegment.endsWith('.git') ? urlSegment.substring(0, urlSegment.length - '.git'.length) : urlSegment;
    }

}

export interface URLParts {
    host: string;
    owner: string;
    repoName: string;
    moreSegments: string[];
    searchParams: URLSearchParams;
    protocol: string;
}
