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
import { ChonkyIconFA } from 'chonky-icon-fontawesome';
import React, { useCallback, useMemo, useState } from 'react';

import { Modal, Button, notification, Form, TextField, DataSet, Select, Table, DatePicker } from 'choerodon-ui/pro';
// import { showActionNotification, useStoryLinks } from '../util';
const DemoFsMap = require('./demo.fs_map.json');

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
        description: text,
    });

    // new Noty({
    //     text,
    //     type: 'success',
    //     theme: 'relax',
    //     timeout: 3000,
    // }).show();
};

setChonkyDefaults({ iconComponent: ChonkyIconFA });

const rootFolderId = DemoFsMap.rootFolderId;
const fileMap = (DemoFsMap.fileMap as unknown) as {
    [fileId: string]: FileData & { childrenIds: string[] };
};

export const useFiles = (currentFolderId: string): FileArray => {
    return useMemo(() => {
        const currentFolder = fileMap[currentFolderId];
        const files = currentFolder.childrenIds
            ? currentFolder.childrenIds.map((fileId: string) => fileMap[fileId] ?? null)
            : [];
        return files;
    }, [currentFolderId]);
};

export const useFolderChain = (currentFolderId: string): FileArray => {
    return useMemo(() => {
        const currentFolder = fileMap[currentFolderId];

        const folderChain = [currentFolder];

        let parentId = currentFolder.parentId;
        while (parentId) {
            const parentFile = fileMap[parentId];
            if (parentFile) {
                folderChain.unshift(parentFile);
                parentId = parentFile.parentId;
            } else {
                parentId = null;
            }
        }

        return folderChain;
    }, [currentFolderId]);
};

export const useFileActionHandler = (
    setCurrentFolderId: (folderId: string) => void
) => {
    return useCallback(
        (data: ChonkyFileActionData) => {
            if (data.id === ChonkyActions.OpenFiles.id) {
                const { targetFile, files } = data.payload;
                const fileToOpen = targetFile ?? files[0];
                if (fileToOpen && FileHelper.isDirectory(fileToOpen)) {
                    setCurrentFolderId(fileToOpen.id);
                    return;
                }
            }

            showActionNotification(data);
        },
        [setCurrentFolderId]
    );
};

export const ReadOnlyVFSBrowser: React.FC<{ instanceId: string }> = (props) => {
    const [currentFolderId, setCurrentFolderId] = useState(rootFolderId);
    const files = useFiles(currentFolderId);
    const folderChain = useFolderChain(currentFolderId);
    const handleFileAction = useFileActionHandler(setCurrentFolderId);
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

const storyName = 'Simple read-only VFS';
export const ReadOnlyVirtualFileSystem: React.FC = () => {
    return (
        <div className="story-wrapper">
            <div className="story-description">
                <h1 className="story-title">
                    {storyName.replace('VFS', 'Virtual File System')}
                </h1>
                <p>
                    This example uses the same file map as <em>Advanced mutable VFS</em>
                    , except it is running in read-only mode. This means nothing will
                    happen when you try to move or delete files.
                </p>
                <p>
                    Read-only mode greatly simplifies the code, so it should be easier
                    to follow, especially if you're new to Chonky. You can view it using
                    the buttons below.
                </p>
                {/* <div className="story-links">
                    {useStoryLinks([
                        { gitPath: '2.x_storybook/src/demos/VFSReadOnly.tsx' },
                        {
                            name: 'File map JSON',
                            gitPath: '2.x_storybook/src/demos/demo.fs_map.json',
                        },
                    ])}
                </div> */}
            </div>
            <ReadOnlyVFSBrowser instanceId={storyName} />
        </div>
    );
};
(ReadOnlyVirtualFileSystem as any).storyName = storyName;


const Page = () => {

    return (
        <div>
            <ReadOnlyVirtualFileSystem />
        </div>
    );
};


export default Page