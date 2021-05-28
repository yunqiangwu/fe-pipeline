import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useAsync, useAsyncFn } from 'react-use';
import { PageHeaderWrapper } from '@ant-design/pro-layout';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { from, Observable, Subject, timer } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import { Spin, Alert, Icon, Card, Tag, Upload, message, Tree } from 'choerodon-ui';
import { Modal, Button, notification, Form, TextField, DataSet, Select, Table, DatePicker, Progress } from 'choerodon-ui/pro';
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

const threeData = [{
  title: '0-0',
  key: '0-0',
  children: [
    {
      title: '0-0-0',
      key: '0-0-0',
      children: [
        { title: '0-0-0-0', key: '0-0-0-0' },
        { title: '0-0-0-1', key: '0-0-0-1' },
        { title: '0-0-0-2', key: '0-0-0-2' },
      ],
    },
    {
      title: '0-0-1',
      key: '0-0-1',
      children: [
        { title: '0-0-1-0', key: '0-0-1-0' },
        { title: '0-0-1-1', key: '0-0-1-1' },
        { title: '0-0-1-2', key: '0-0-1-2' },
      ],
    },
    {
      title: '0-0-2',
      key: '0-0-2',
    },
  ],
},
{
  title: '0-1',
  key: '0-1',
  children: [
    { title: '0-1-0-0', key: '0-1-0-0' },
    { title: '0-1-0-1', key: '0-1-0-1' },
    { title: '0-1-0-2', key: '0-1-0-2' },
  ],
},
{
  title: '0-2',
  key: '0-2',
}];


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
            <a target="_blank" href={`${location.protocol}//${record.get('spaceId')}--${record.get('name')}.${process.env.NODE_ENV === 'development' ? 'minio.fe-pipeline.localhost' : location.host}`} >访问</a>,
            <span> / </span>,
            <Link target="_blank" to={`/file-manager/${record.get('id')}`} >管理版本文件</Link>,
          ]
        },
        width: 480,
        lock: 'right' as ColumnLock,
      },
      // {
      //   header: '操作',
      //   command: ({record}) => {
      //     return [
      //       <Button>管理版本空间</Button>,
      //     ]
      //   },
      //   width: 200,
      //   lock: 'right' as ColumnLock,
      // }
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
            <a target="_blank" href={`${location.protocol}//${record.get('spaceId')}--${record.get('name')}.${process.env.NODE_ENV === 'development' ? 'minio.fe-pipeline.localhost' : location.host}`} >访问</a>,
          ]
        },
        width: 80,
        lock: 'right' as ColumnLock,
      },
      {
        header: '操作',
        command: ({ record }) => {
          return [
            <Button>修改指向版本</Button>,
          ]
        },
        width: 200,
        lock: 'right' as ColumnLock,
      }
    ];
  }, []);

  const handleRefreshRedisCache = useCallback(() => {
    return (async () => {
      const data = await refreshSpacesCache(id);
      notification.success({
        message: '操作成功',
        description: `成功刷新 ${data.data.data} 个 alias 缓存`
      })
    })();
  }, [id]);

  const createSpacesVersionUI = async ({
    id,
  }: any = {}) => {

    const CreateSpaceVersionAlias: React.FC<any> = ({ modal }) => {

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
              label: '版本名称',
              required: true,
            },
            {
              name: 'versionAliasName',
              label: '别名指向版本',
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

          try {
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
      }, [filelist]);


      const fileThreeDataEle = useMemo(() => {
        if(filelist.length === 0) {
          return null;
        }

        const renderTreeNodes = (data: any) => {
          return data.map((item: any) => {
            if (item.children) {
              return (
                <TreeNode title={item.title} key={item.key}>
                  {renderTreeNodes(item.children)}
                </TreeNode>
              );
            }
            return <TreeNode key={item.key} {...item} />;
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
          <Card title="版本基本信息">
            <Form columns={2} dataSet={createSpaceDs}>
              <TextField name="name" />
              <Select name="versionAliasName" combo />
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
              <Progress value={progressInfo.value} status={ 'active' as any} />
                当前正在上传{progressInfo.file.name} 文件
            </div>}
          </Card>
        </div>
      )
    };

    Modal.open({
      title: '发布新的空间版本',
      style: { width: 600 },
      children: <CreateSpaceVersionAlias />,
      okText: '确定',
      // okProps: { disabled: true },
    });

  };

  const createSpacesVersionAliasUI = async ({
    id,
  }: any = {}) => {

    const CreateSpaceVersionAlias: React.FC<any> = ({ modal }) => {
      const createSpaceDs = React.useMemo(() => {
        return new DataSet({
          primaryKey: 'id',
          autoCreate: true,
          paging: false,
          // selection: false,
          fields: [
            {
              name: 'name',
              label: '别名名称',
              required: true,
            },
            {
              name: 'name',
              label: '版本别名',
              required: true,
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
      }, []);

      return (
        <Form columns={2} dataSet={createSpaceDs}>
          <TextField name="name" />
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

  };

  return (
    <PageHeaderWrapper title="空间详情">
      <Card title="空间信息" extra={[
        <Button onClick={refresh}>刷新数据</Button>,
        <Button target="_blank" onClick={handleRefreshRedisCache} >刷新别名缓存</Button>
      ]}>
        <Form columns={2} dataSet={spaceDs}>
          <TextField pristine name="name" />
          <DatePicker pristine name="createdAt" />
        </Form>
      </Card>
      <Card title="版本别名管理列表">
        <Table buttons={[
          <Button icon="add" onClick={() => createSpacesVersionAliasUI({ id })} >添加别名</Button>,
          <Button icon="remove" onClick={() => deleteSpacesVersionAlias({ id })} >删除别名</Button>
        ]} columns={aliasColumns} dataSet={spaceDs.children.spaceVersionAlias} />
      </Card>
      <Card title="版本列表">
        <Table buttons={[<Button icon="add" onClick={() => createSpacesVersionUI({ id })} >发布新版本</Button>,
        <Button icon="remove" onClick={() => deleteSpacesVersion({ id })} >删除版本</Button>
        ]} columns={columns} dataSet={spaceDs.children.spaceVersions} />
      </Card>
    </PageHeaderWrapper>
  );
};


export default SpaceDetail;
