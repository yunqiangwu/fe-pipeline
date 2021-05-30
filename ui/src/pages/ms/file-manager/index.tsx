import axios from '@/utils/axios.config';
import { Button, Form, Output } from 'choerodon-ui/pro/lib';
import React, { useCallback, useMemo, useState } from 'react';
import { useParams, useHistory } from 'react-router';
import { useAsync, useSearchParam } from 'react-use';
import { ReadOnlyVFSBrowser } from './VFSReadOnly';

const storyName = '文件管理 【VFS@Verion】';

const Page = () => {

    const { versionId } = useParams<any>();
    const path = useSearchParam('path') || '';

    const space = useAsync(async () => {
        const spaceData = await axios.get(`space/get-space-by-versionid/${versionId}`);
        return spaceData.data;
    }, [versionId]);

    if (!versionId) {
        return <div>error not versionId</div>;
    }
    if (space.loading) {
        return <div>loading...</div>
    }
    if (space.error) {
        return <div>{space.error.message}</div>
    }

    return (
        <div className="story-wrapper">
            <div className="story-description">
                <h1 className="story-title">
                    {storyName.replace('VFS', space?.value?.name).replace('Verion', space?.value?.spaceVersions[0]?.name)} {path}
                </h1>
                <p>
                    <Button>下载当前文件夹</Button>
                    <Button>上传压缩包解压到当前文件夹</Button>
                </p>
                <Form columns={3}>
                    <Output label="项目名称" value={space?.value?.name} />
                    <Output label="版本号" value={space?.value?.spaceVersions[0]?.name} />
                    <Output label="发布时间" value={space?.value?.spaceVersions[0]?.createdAt} />
                    <Output label="版本别名" value={space?.value?.spaceVersions[0]?.spaceVersionAlias?.map((item: any) => item.name).join(', ')} />
                </Form>
            </div>
            <ReadOnlyVFSBrowser basePath={`bucket/${space.value.id}/${versionId}`} instanceId={storyName} path={path} versionId={versionId} />
        </div>
    );
};


export default Page