import axios from '@/utils/axios.config';
import { getToken } from '@/utils/token';
import { windowOpen } from '@/utils/utils';
import { Card, Upload, Tree, Progress } from 'choerodon-ui';
import Icon from 'choerodon-ui/lib/icon/Icon';
import { Button, DataSet, Form, message, Modal, notification, Output, Switch } from 'choerodon-ui/pro/lib';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useHistory } from 'react-router';
import { useAsync, useSearchParam } from 'react-use';
import { createSpacesVersion, uploadZipToVersion } from '../services/repos';
import { ReadOnlyVFSBrowser } from './VFSReadOnly';

const Dragger = Upload.Dragger;
const TreeNode = Tree.TreeNode;
const storyName = '文件管理 【VFS@Verion】';


const Page = () => {

    const { versionId } = useParams<any>();
    const path = useSearchParam('path') || '';

    const space = useAsync(async () => {
        const spaceData = await axios.get(`space/get-space-by-versionid/${versionId}`);
        return spaceData.data;
    }, [versionId]);

    const downloadZip = useCallback(async () => {

      const p = (path || '').replace(/^\//, "");
      const zipDownloadUrl = `${axios.defaults.baseURL}space/get-zip-by-path?prefixPath=/${space.value.id}/${versionId}/${p}&access_token=${getToken()}`;

      await windowOpen(zipDownloadUrl);

    }, [path, space.value]);

    const createSpacesVersionUI = useCallback( async () => {
        const CreateSpaceVersion: React.FC<any> = ({ modal }) => {
    
          const [filelist, setFilelist] = useState<any[]>(() => []);
          const [progressInfo, setProgressInfo] = useState<any>(null);

          const ds = React.useMemo(() => {
            return new DataSet({
              primaryKey: 'id',
              autoCreate: true,
              paging: false,
              // selection: false,
              fields: [
                {
                  name: 'isResetFiles',
                  label: '是否覆盖当前文件夹',
                  trueValue: 1,
                  falseValue: 0,
                  defaultValue: 1,
                  required: true,
                },
                // {
                //   name: 'versionAliasName',
                //   label: '版本别名',
                //   defaultValue: 'latest',
                //   type: 'string' as any,
                //   required: true,
                //   textField: 'name',
                //   valueField: 'name',
                //   options: spaceDs.children.spaceVersionAlias,
                // },
    
                // {
                //   name: 'versionId',
                //   label: '别名指向版本',
                //   type: 'string' as any,
                //   required: true,
                //   textField: 'name',
                //   valueField: 'id',
                //   options: spaceDs.children.spaceVersions,
                // },
              ],
            });
          }, []);
    
          useEffect(() => {
            modal.handleOk(async () => {
    
              if(filelist.length === 0) {
                notification.warning({
                  message: '',
                  description: '请上传文件',
                })
                return false;
              }
    
              try {
                const data = ds.records[0].toJSONData();
                const res = await uploadZipToVersion({
                  onprogress: (info: any) => {
                    setProgressInfo(info);
                  },
                  filelist,
                  body: {
                    versionId: versionId,
                    prefixPath: path,
                    spaceId: space.value.id,
                    isResetFiles: data.isResetFiles,
                  },
                });
                notification.success({
                  message: `上传成功`,
                  description: '',
                });
                setTimeout(() => {
                    window.location.reload();
                }, 500);
                return res;
              } catch (e) {
                notification.error({
                  message: e.message,
                  description: '',
                })
                return false;
              }
            });
          }, [filelist]);
    
    
          const fileThreeDataEle = useMemo(() => {
            if(filelist.length === 0) {
              return null;
            }
    
            const renderTreeNodes = (data: any) => {
              return data.map((item: any) => {
                if (item.children) {
                  return (
                    <TreeNode icon={<Icon type="custom_Directory" />} title={item.title} key={item.key}>
                      {renderTreeNodes(item.children)}
                    </TreeNode>
                  );
                }
                return <TreeNode key={item.key} {...item} title={<span>{item.title}  <Icon style={{fontSize: '12px'}} onClick={() => {
                  const file = filelist.find(f => f.uid === item.key);
                  if(file) {
                    setFilelist((oldList) => {
                      return [...oldList.filter(item => item.uid !== file.uid)];
                    });
                  }
                }} type="delete" /></span>} icon={<Icon type="insert_drive_file" />} />;
              });
            };
    
            const data: any[] = [];
    
            filelist.forEach(file => {
              if(file.webkitRelativePath) {
                const paths: string[] = file.webkitRelativePath.split('/').slice(1);
                let lastItem: any = null;
                paths.forEach((path, index) => {
                  const parentArray = ( lastItem?.children || data);
                  if(index === paths.length -1) {
                    parentArray.push({
                      key: file.uid,
                      title: path,
                    });
                    return;
                  }
                  let currrentItem = parentArray.find((item: any) => item.title === path);
                  if(!currrentItem){
                    currrentItem = {
                      key: lastItem ? `${lastItem.key}-${path}`: `${path}`,
                      // key: `${path}`,
                      title: path,
                      isDir: true,
                      children: [],
                    };
                    parentArray.push(currrentItem);
                  }
                  lastItem = currrentItem;
                });
              } else {
                data.push({
                  title: file.name,
                  key: file.uid,
                });
              }
            });
    
            return renderTreeNodes(data);
          }, [filelist]);
    
          const uploadProps = {
            name: 'files',
            // multiple: true,
            accept: ".zip",
            // action: '//jsonplaceholder.typicode.com/posts/',
            beforeUpload: (file: any) => {
              console.log(file);
              setFilelist((oldList) => {
                return [...oldList.filter(item => item.uid !== file.uid), file];
              });
              return false;
            },
            onRemove: (file: any) => {
              setFilelist((oldList) => {
                  return [file];
                return [...oldList.filter(item => item.uid !== file.uid)];
              });
            },
            showUploadList: false,
            fileList: filelist,
            onChange(info: any) {
              const status = info.file.status;
              if (status !== 'uploading') {
                console.log(info.file, info.fileList);
              }
              if (status === 'done') {
                message.success(`${info.file.name} file uploaded successfully.`);
              } else if (status === 'error') {
                message.error(`${info.file.name} file upload failed.`);
              }
            },
          };
    
        //   const dirFileInputRef = useRef<any>(null);
    
        //   const filesForDirProps = {
        //     name: "filesForDir", type: "file", webkitdirectory: true, multiple: true, ref: dirFileInputRef,
        //     onChange: (event: any) => {
        //       let files = event.target.files;
        //       setFilelist((oldList) => {
        //         let newFileList: any[] = [];
        //         for (let i=0; i<files.length; i++) {
        //           // const webkitRelativePath = files[i].webkitRelativePath;
        //           // console.log(webkitRelativePath);
        //           const file = files[i];
        //           file.uid = `${file.webkitRelativePath || file.name}`;
        //           newFileList = newFileList.filter(item => item.uid !== file.uid);
        //           newFileList.push(file);
        //         };
        //         console.log(newFileList);
        //         return newFileList;
        //       });
        //     }
        //   };
    
          return (
            <div>
              <Card title="版本基本信息" extra={<span>当前上传解压路径：{path}</span>}>
                {/* <Form columns={2} dataSet={ds}>
                  <Switch name="isResetFiles" />
                </Form> */}
              </Card>
              <Card title="上传版本文件" 
            //   extra={<Button
            //     onClick={
            //       () => {
            //         if(dirFileInputRef.current) {
            //           dirFileInputRef.current.webkitdirectory = true;
            //           dirFileInputRef.current.click();
            //         }
            //       }
            //     }
            //   >上传文件夹</Button>}
              >
                {/* <div style={{ display: 'none' }}>
                  {React.createElement('input', filesForDirProps)}
                </div> */}
                <Dragger {...uploadProps}> 
                  <p className="c7n-upload-drag-icon">
                    <Icon type="inbox" />
                  </p>
                  <p className="c7n-upload-text">Click or drag file to this area to upload</p>
                </Dragger>
                <div style={{overflowY: 'scroll', height: '150px'}}>
                  {fileThreeDataEle && <Tree
                          showIcon
                          // showLine
                    // checkable
                    // onExpand={this.onExpand}
                    // expandedKeys={this.state.expandedKeys}
                    // autoExpandParent={this.state.autoExpandParent}
                    // onCheck={this.onCheck}
                    // checkedKeys={this.state.checkedKeys}
                    // onSelect={this.onSelect}
                    // selectedKeys={this.state.selectedKeys}
                  >
                    {fileThreeDataEle}
                  </Tree>}
                </div>
                {progressInfo && <div>
                  <Progress percent={progressInfo.value} status={ 'active' as any} />
                </div>}
              </Card>
            </div>
          )
        };
    
        Modal.open({
          title: '上传压缩包',
          style: { width: '600px', top: '20px' },
          children: <CreateSpaceVersion />,
          okText: '确定',
          // okProps: { disabled: true },
        });
    
      }, [versionId, path, space?.value]);

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
                    <Button onClick={downloadZip}>下载当前文件夹</Button>
                    <Button onClick={createSpacesVersionUI}>上传压缩包解压到当前文件夹</Button>
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
