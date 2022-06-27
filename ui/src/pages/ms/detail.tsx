import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useAsync, useAsyncFn, useSearchParam } from 'react-use';
import { PageHeaderWrapper } from '@ant-design/pro-layout';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { from, Observable, Subject, timer } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import { Spin, Alert, Icon, Card, Tag, Upload, message, Tree } from 'choerodon-ui';
import { Modal, Button, notification, Form, TextField, DataSet, Select, Table, DatePicker, Progress, Switch } from 'choerodon-ui/pro';
import axios from '@/utils/axios.config';
import styles from './index.less';
import { getToken, hash } from '@/utils/token';
import { createSpaces, refreshSpacesCache, createSpacesVersionAlias, createSpacesVersion } from './services/repos';
import { AxiosRequestConfig } from 'axios';
import { ColumnProps } from 'choerodon-ui/pro/lib/table/Column';
import { ColumnLock } from 'choerodon-ui/pro/lib/table/enum';
import { Link, useParams } from 'react-router-dom';
import { FieldType } from 'choerodon-ui/pro/lib/data-set/enum';
import { divide } from 'lodash';

const Dragger = Upload.Dragger;
const TreeNode = Tree.TreeNode;

const deleteSpacesVersionAlias = async ({ id }: any) => {
  console.log(id);
};

const deleteSpacesVersion = async ({ id }: any) => {
  console.log(id);
};

export const SpaceDetail: React.FC<any> = () => {

  const { id } = useParams<any>();

  const spaceDs = React.useMemo(() => {

    const spaceVersionDs = new DataSet({
      autoQuery: false,
      paging: false,
      fields: [
        {
          name: 'id',
          label: 'ID',
        },
        {
          name: 'name',
          label: '版本号',
        },
        {
          name: 'createdAt',
          label: '创建时间',
          type: 'dateTime' as FieldType,
        },
      ],
    });

    const spaceVersionAliasDs = new DataSet({
      autoQuery: false,
      paging: false,
      fields: [
        {
          name: 'id',
          label: 'ID',
        },
        {
          name: 'name',
          label: '别名名称',
        },
      ],
    });

    return new DataSet({
      children: {
        spaceVersions: spaceVersionDs,
        spaceVersionAlias: spaceVersionAliasDs,
      },
      primaryKey: 'id',
      autoQuery: false,
      selection: false,
      fields: [
        {
          name: 'id',
          label: 'ID',
        },
        {
          name: 'name',
          label: '项目名称',
        },
        {
          name: 'createdAt',
          label: '创建时间',
          type: 'dateTime' as FieldType,
          format: "YYYY-MM-DD HH:mm:ss",
        },
        // {
        //   name: 'http_url_to_repo',
        //   label: 'git',
        // },
      ],
      // queryFields: [
      //   {
      //     name: 'searchString',
      //     label: '搜索',
      //   },
      // ],
      dataKey: '_rows',
      // totalKey: 'x-total',
      transport: {
        read: ({ params, data }) => {
          const config: AxiosRequestConfig = {
            method: 'GET',
            url: `/space/get-space/${id}`,
            params: {
              // orderBy: 'asc',
              //search:hzero
              // owned: true,
              // take: params.pagesize || 10,
              // skip: ((params.page || 1) - 1) * (params.pagesize || 10),
              // membership: true,
              // //starred:true
              // simple: true,
              // ...data,
            },
            transformResponse: ((data, headers) => {
              return {
                _rows: [typeof data === 'string' ? JSON.parse(data) : data],
                // 'x-page': headers['x-page'] || 0,
                // 'x-per-page': headers['x-per-page'] || 10,
                // 'x-total': headers['x-total'] || 0,
              };
            }),
          };
          return config;
        },
      },
    });
  }, [id]);

  const refresh = useCallback(() => {
    return (async () => {
      await spaceDs.query()
    })();
  }, [id]);

  useEffect(() => {
    refresh();
  }, [id])

  const columns = useMemo<ColumnProps[]>(() => {
    return [
      // { name: 'id', width: 100, },
      { name: 'id', width: 40, },
      { name: 'createdAt', width: 200, },
      // {name: 'name', width: 200, },
      {
        name: 'name',
        // renderer: ({ record, value }) => {
        //   return <Link to={`/app/ms/detail/${record?.get('id')}`} >{value}</Link>;
        // }
      },
      {
        header: '版本别名',
        renderer: ({ record, value }) => {
          const spaceVersionAlias = record?.get('spaceVersionAlias');
          if (!spaceVersionAlias) {
            return null;
          }
          return spaceVersionAlias.map((item: any) => (<Tag>{item.name}</Tag>));
        }
      },
      {
        header: '访问',
        command: ({ record }) => {
          return [
            <a target="_blank" href={`${location.protocol}//${record.get('spaceId')}--${record.get('id')}.${process.env.NODE_ENV === 'development' ? 'minio.fe-pipeline.localhost' : `minio.${location.host}`}`} >访问</a>,
            <span> / </span>,
            <Link target="_blank" to={`/file-manager/${record.get('id')}`} >管理版本文件</Link>,
          ]
        },
        width: 180,
        lock: 'right' as ColumnLock,
      },
      {
        header: '操作',
        command: ({record}) => {
          return [
            <Button onClick={
              async () => {
                try {
                  const res = await axios.delete(`/space/delete-space-version/${record.get('id')}`);
                  notification.success({
                    message: '删除成功',
                    description: '',
                  });
                  spaceDs.query();
                  return res;
                } catch (e) {
                  notification.error({
                    message: e.message,
                    description: '',
                  })
                  return false;
                }
              }
            }>删除</Button>
          ]
        },
        width: 200,
        lock: 'right' as ColumnLock,
      }
    ];
  }, []);


  const aliasColumns = useMemo<ColumnProps[]>(() => {
    return [
      // { name: 'id', width: 100, },
      { name: 'id', width: 40, },
      // {name: 'name', width: 200, },
      {
        name: 'name',
        // width: 200
        // renderer: ({ record, value }) => {
        //   return <Link to={`/app/ms/detail/${record?.get('id')}`} >{value}</Link>;
        // }
      },
      {
        header: '指向版本',
        width: 200,
        renderer: ({ record }) => {
          return record?.get('version')?.name;
        }
      },
      {
        header: '访问',
        command: ({ record }) => {
          return [
            <a target="_blank" href={`${location.protocol}//${record.get('spaceId')}--${record.get('name')}.${process.env.NODE_ENV === 'development' ? 'minio.fe-pipeline.localhost' :  `minio.${location.host}`}`} >访问</a>,
          ]
        },
        width: 80,
        lock: 'right' as ColumnLock,
      },
      {
        header: '操作',
        command: ({ record }) => {
          return [
            <Button onClick={() => handleRefreshRedisCache(record.get('name'))} >刷新缓存</Button>,
            <Button onClick={
              () => {
                createSpacesVersionAliasUI({ id: id as string, aliasName: record.get('name'), versionId: record?.get('version')?.id });
              }
            }>修改指向版本</Button>,
            <Button onClick={
              async () => {
                try {
                  // const res = await deleteSpaces({
                  //   id,
                  // });
                  const res = await axios.delete(`/space/delete-space-version-alias/${record.get('id')}`);
                  notification.success({
                    message: '删除成功',
                    description: '',
                  });
                  spaceDs.query();
                  return res;
                } catch (e) {
                  notification.error({
                    message: e.message,
                    description: '',
                  })
                  return false;
                }
              }
            }>删除</Button>
          ]
        },
        width: 400,
        lock: 'right' as ColumnLock,
      }
    ];
  }, []);

  const handleRefreshRedisCache = useCallback((aliasName: string) => {
    return (async () => {
      const data = await refreshSpacesCache(id, aliasName);
      notification.success({
        message: '操作成功',
        description: `成功刷新 ${data.data.data} 个 alias 缓存`
      })
    })();
  }, [id]);

  const createSpacesVersionUI = useCallback( async ({
    id,
  }: { id: string }) => {
    const latestVersion = spaceDs?.children?.spaceVersions?.records[0]?.get('name');
    const nextVersion = (version: string) => {
      return version && version.replace(/(\d+$|$)/, (match) => {
        return match ? `${(1 + (+match))}` : `.1`;
      });
    };
    const CreateSpaceVersion: React.FC<any> = ({ modal }) => {

      const [filelist, setFilelist] = useState<any[]>(() => []);
      const [progressInfo, setProgressInfo] = useState<any>(null);

      const createSpaceDs = React.useMemo(() => {
        return new DataSet({
          primaryKey: 'id',
          autoCreate: true,
          paging: false,
          // selection: false,
          fields: [
            {
              name: 'name',
              label: '新发布版本号',
              defaultValue: latestVersion ? nextVersion(latestVersion) : '0.0.0',
              required: true,
            },
            {
              name: 'isZip',
              label: '上传 zip 解压',
              type: 'boolean' as FieldType,
              trueValue: 1,
              falseValue: 0,
              defaultValue: 0,
              // required: true,
            },
            {
              name: 'versionAliasName',
              label: '版本别名',
              defaultValue: 'latest',
              type: 'string' as any,
              required: true,
              textField: 'name',
              valueField: 'name',
              options: spaceDs.children.spaceVersionAlias,
            },

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

          if ((await createSpaceDs.validate()) === false) {
            return false;
          }

          if(filelist.length === 0) {
            notification.warning({
              message: '',
              description: '当前版本为上传任务文件， 请在版本创建之后，进入文件管理， 上传文件',
            })
            // return false;
          }

          try {
            const data = createSpaceDs.records[0].toJSONData();
            const res = await createSpacesVersion({
              onprogress: (info: any) => {
                setProgressInfo(info);
              },
              filelist,
              body: {
                ...createSpaceDs.records[0].toJSONData(),
                spaceId: id,
              },
            });
            notification.success({
              message: `版本 ${data.name} 发布成功`,
              description: '',
            });
            spaceDs.query();
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
        multiple: true,
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

      const dirFileInputRef = useRef<any>(null);

      const filesForDirProps = {
        name: "filesForDir", type: "file", webkitdirectory: true, multiple: true, ref: dirFileInputRef,
        onChange: (event: any) => {
          let files = event.target.files;
          setFilelist((oldList) => {
            let newFileList: any[] = [];
            for (let i=0; i<files.length; i++) {
              // const webkitRelativePath = files[i].webkitRelativePath;
              // console.log(webkitRelativePath);
              const file = files[i];
              file.uid = `${file.webkitRelativePath || file.name}`;
              newFileList = newFileList.filter(item => item.uid !== file.uid);
              newFileList.push(file);
            };
            console.log(newFileList);
            return newFileList;
          });
        }
      };

      return (
        <div>
          <Card title="版本基本信息" extra={<span>当前最新版本： {latestVersion || '未发布版本'}</span>}>
            <Form columns={2} dataSet={createSpaceDs}>
              <TextField name="name" />
              <Select name="versionAliasName" combo />
              <Switch name="isZip" />
            </Form>
          </Card>
          <Card title="上传版本文件" extra={<Button
            onClick={
              () => {
                if(dirFileInputRef.current) {
                  dirFileInputRef.current.webkitdirectory = true;
                  dirFileInputRef.current.click();
                }
              }
            }
          >上传文件夹</Button>}>
            <div style={{ display: 'none' }}>
              {React.createElement('input', filesForDirProps)}
            </div>
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
      title: '发布新的空间版本',
      style: { width: '600px', top: '20px' },
      children: <CreateSpaceVersion />,
      okText: '确定',
      // okProps: { disabled: true },
    });

  }, [id]);

  const createSpacesVersionAliasUI = useCallback(async ({
    id,
    aliasName,
    versionId,
  }: { id: string, aliasName?: string, versionId?: number }) => {

    const CreateSpaceVersionAlias: React.FC<any> = ({ modal }) => {
      const createSpaceDs = React.useMemo(() => {
        return new DataSet({
          primaryKey: 'id',
          autoCreate: true,
          paging: false,
          // selection: false,
          fields: [
            {
              name: 'aliasName',
              label: '别名名称',
              defaultValue: aliasName,
              required: true,
            },
            {
              name: 'versionId',
              label: '指向版本',
              required: true,
              defaultValue: versionId,
              type: 'string' as any,
              textField: 'name',
              valueField: 'id',
              options: spaceDs.children.spaceVersions,
            },
          ],
        });
      }, []);

      useEffect(() => {
        modal.handleOk(async () => {

          if ((await createSpaceDs.validate()) === false) {
            return false;
          }

          try {
            const res = await createSpacesVersionAlias({
              body: {
                ...createSpaceDs.records[0].toJSONData(),
                spaceId: id,
              },
            });
            notification.success({
              message: '创建成功',
              description: '',
            });
            spaceDs.query();
            return res;
          } catch (e) {
            notification.error({
              message: e.message,
              description: '',
            })
            return false;
          }

        });
      });

      return (
        <Form columns={2} dataSet={createSpaceDs}>
          <TextField name="aliasName" />
          <Select name="versionId" />
        </Form>
      )
    };

    Modal.open({
      title: '创建空间版本别名',
      children: <CreateSpaceVersionAlias />,
      okText: '确定',
      // okProps: { disabled: true },
    });

  }, [id]);

  return (
    <PageHeaderWrapper title="空间详情">
      <Card title="空间信息" extra={[
        <Button onClick={refresh}>刷新数据</Button>,
      ]}>
        <Form columns={2} dataSet={spaceDs}>
          <TextField pristine name="name" />
          <DatePicker pristine name="createdAt" />
        </Form>
      </Card>
      <Card title="版本别名管理列表">
        <Table buttons={[
          <Button icon="add" onClick={() => createSpacesVersionAliasUI({ id: id as string })} >添加别名</Button>,
        ]} columns={aliasColumns} dataSet={spaceDs.children.spaceVersionAlias} />
      </Card>
      <Card title="版本列表">
        <Table buttons={[<Button icon="add" onClick={() => createSpacesVersionUI({ id })} >发布新版本</Button>,
        ]} columns={columns} dataSet={spaceDs.children.spaceVersions} />
      </Card>
    </PageHeaderWrapper>
  );
};

export default SpaceDetail;
