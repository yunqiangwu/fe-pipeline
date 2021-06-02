/**
 * @author Timur Kuzhagaliyev <tim.kuzh@gmail.com>
 * @copyright 2020
 * @license MIT
 */

import {
    ChonkyActions,
    ChonkyFileActionData,
    FileArray,
    FileBrowser,
    FileContextMenu,
    FileData,
    FileHelper,
    FileList,
    FileNavbar,
    FileToolbar,
    setChonkyDefaults,
} from 'chonky';
import { useParams, useHistory } from 'react-router';
import { ChonkyIconFA } from 'chonky-icon-fontawesome';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { Modal, Button, notification, Form, TextField, DataSet, Select, Table, DatePicker } from 'choerodon-ui/pro';
import axios from '@/utils/axios.config';
import { useAsync } from 'react-use';
import { windowOpen } from '@/utils/utils';
// import { showActionNotification, useStoryLinks } from '../util';

const ignoredActions = new Set<String>();
ignoredActions.add(ChonkyActions.MouseClickFile.id);
ignoredActions.add(ChonkyActions.KeyboardClickFile.id);
ignoredActions.add(ChonkyActions.StartDragNDrop.id);
ignoredActions.add(ChonkyActions.EndDragNDrop.id);
ignoredActions.add(ChonkyActions.ChangeSelection.id);

export const showActionNotification = (data: ChonkyFileActionData) => {
    if (ignoredActions.has(data.action.id)) return;

    const textParts: string[] = [];
    textParts.push(
        `<div class="noty-action">Action: <code>${data.action.id}</code></div>`
    );

    if (data.id === ChonkyActions.OpenFiles.id) {
        const fileNames = data.payload.files.map((f) => `<code>${f.name}</code>`);
        if (fileNames.length === 1) {
            textParts.push('You opened a single file:');
        } else {
            textParts.push(`You opened ${fileNames.length} files:`);
        }
        textParts.push(...fileNames);
    }

    if (data.id === ChonkyActions.MoveFiles.id) {
        const fileCount = data.payload.files.length;
        const countString = `${fileCount} file${fileCount !== 1 ? 's' : ''}`;
        const source = `<code>${data.payload.source?.name ?? '~'}</code>`;
        const destination = `<code>${data.payload.destination.name}</code>`;
        textParts.push(`You moved ${countString} from ${source} to ${destination}.`);
    }

    if (data.id === ChonkyActions.DeleteFiles.id) {
        const fileCount = data.state.selectedFilesForAction.length;
        const countString = `${fileCount} file${fileCount !== 1 ? 's' : ''}`;
        textParts.push(`You deleted ${countString} files.`);
    }

    const text = textParts[0] + textParts.slice(1).join('<br/>');

    notification.success({
        message: 'success',
        description: <div dangerouslySetInnerHTML={{__html: text}} />,
    });

    // new Noty({
    //     text,
    //     type: 'success',
    //     theme: 'relax',
    //     timeout: 3000,
    // }).show();
};

setChonkyDefaults({ iconComponent: ChonkyIconFA });

export const useFiles = (currentFolderId: string, versionId: string): FileArray => {

    if (currentFolderId === '/') {
        currentFolderId = '';
    }

    const space = useAsync(async () => {
        const spaceData = await axios.get(`space/get-file-ls-by-versionid/${versionId}?prefixPath=${currentFolderId}`, {
            // data: {
            //     prefixPath: currentFolderId,
            // }
        });
        return spaceData.data;
    }, [versionId, currentFolderId]);

    const fileArrays = useMemo(() => {
        const root: FileData = {
            "id": "/",
            "name": "root",
            isDir: true,
        };

        // const otherFiles: FileArray = [];

        if (space.value) {

            const paths = currentFolderId ? currentFolderId.split('/') : [];

            let currentFile = root;

            for (let i = 0; i < paths.length; i++) {
                const currentPaths = paths.slice(0, i + 1);
                const newObj: FileData = {
                    "id": currentPaths.join('/'),
                    "name": paths[i],
                    isDir: true,
                    isHidden: true,
                    size: 0,
                    parentId: currentFile.id,
                };
                // otherFiles.push(newObj);
                currentFile.childrenIds = [newObj.id];
                currentFile = newObj;
            }

            const files = [
                ...space.value.CommonPrefixes.map((item: any) => {
                    const match = /^\d+\/\d+\/(.+)\/$/.exec(item.Prefix);
                    const match2 = /\/([^\/]+)\/$/.exec(item.Prefix);
                    const newObj: FileData = {
                        "id": match ? match[1] : item.Prefix,
                        "name": match2 ? match2[1] : item.Prefix,
                        isDir: true,
                        parentId: currentFile.id,
                    };
                    // otherFiles.push(newObj);
                    return newObj;
                }),
                ...space.value.Contents.map((item: any) => {
                    const match2 = /^\d+\/\d+\/(.+)$/.exec(item.Key);
                    const match = /\/([^\/]+)$/.exec(item.Key);
                    const newObj: FileData = {
                        "id": match2 ? match2[1] : item.Key,
                        "name": match ? match[1] : item.Key,
                        size: item.Size,
                        parentId: currentFile.id,
                        "LastModified": "2020-10-20T03:11:50.570Z",
                    };
                    // otherFiles.push(newObj);
                    return newObj;
                }),
            ];

            currentFile.childrenIds = files.map(item => item.id);
            return files;
        }
        return [];
    }, [space.value]);
    const path = useMemo(() => {
        return space.value ? `${space.value.id}/${versionId}` : `${versionId}`
    },  [space.value]);
    return fileArrays;
};

export const useFolderChain = (currentFolderId: string): FileArray => {
    if (currentFolderId === '/') {
        currentFolderId = '';
    }
    return useMemo(() => {

        const root: FileData = {
            "id": "/",
            "name": "root",
            isDir: true,
        };

        const paths = currentFolderId ? currentFolderId.split('/') : [];

        let currentFile = root;

        const files: FileArray = [root];

        for (let i = 0; i < paths.length; i++) {
            const currentPaths = paths.slice(0, i + 1);
            const newObj: FileData = {
                "id": currentPaths.join('/'),
                "name": paths[i],
                isDir: true,
                isHidden: true,
                size: 0,
                parentId: currentFile.id,
            };
            files.push(newObj);
            currentFile.childrenIds = [newObj.id];
            currentFile = newObj;
        }
        return files;
    }, [currentFolderId]);
};


export const useFileActionHandler = (
    setCurrentFolderId: (folderId: string) => void,
    basePath: string,
) => {
    return useCallback(
        (data: ChonkyFileActionData) => {
            if (data.id === ChonkyActions.OpenFiles.id) {
                const { targetFile, files } = data.payload;
                const fileToOpen: any = targetFile ?? files[0];
                if (fileToOpen && FileHelper.isDirectory(fileToOpen)) {
                    setCurrentFolderId(fileToOpen.id);
                    return;
                } else {
                    if(targetFile || files.length === 1)  {
                        const fileUrl = `${location.protocol}//${process.env.NODE_ENV === 'development' ? 'minio.fe-pipeline.localhost' :  `minio.${location.host}`}/${basePath}/${fileToOpen?.id || ''}`;
                        // console.log(fileUrl);
                        // windowOpen(fileUrl);
                        return windowOpen(fileUrl);
                    }
                }
            }

            showActionNotification(data);
        },
        [setCurrentFolderId, basePath]
    );
};


export const ReadOnlyVFSBrowser: React.FC<{ instanceId: string, path: string, versionId: string, onChangePath?: Function, basePath?: string }> = (props) => {
    const { path, versionId, basePath } = props;
    const [currentFolderId, setCurrentFolderId] = useState(path);
    useEffect(() => {
      setCurrentFolderId(path);
    }, [path])
    const files = useFiles(currentFolderId, versionId);
    const folderChain = useFolderChain(currentFolderId);
    const history = useHistory();
    const handleChangePath = useCallback((newPath) => {
        setCurrentFolderId(newPath);
        history.replace(`${history.location.pathname}?path=${newPath}`);
    }, []);
    const handleFileAction = useFileActionHandler(handleChangePath, basePath || '') ;

    return (
        <div style={{ height: 400 }}>
            <FileBrowser
                instanceId={props.instanceId}
                files={files}
                folderChain={folderChain}
                onFileAction={handleFileAction}
                thumbnailGenerator={(file: FileData) =>
                    file.thumbnailUrl ? `https://chonky.io${file.thumbnailUrl}` : null
                }
            >
                <FileNavbar />
                <FileToolbar />
                <FileList />
                <FileContextMenu />
            </FileBrowser>
        </div>
    );
};


