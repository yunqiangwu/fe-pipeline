import React, { useEffect, useState, useCallback } from 'react';
import { useAsyncFn } from 'react-use';
import { IWorkspaces } from './types';
import { Spin, Alert, Row, Col, Card, Icon } from 'choerodon-ui';
import { Modal, Button, notification, Form, TextField, DataSet } from 'choerodon-ui/pro';
import axios from '@/utils/axios.config';
import styles from './index.less';
import { LabelLayoutType } from 'choerodon-ui/pro/lib/form/Form';
import { FieldType } from 'choerodon-ui/pro/lib/data-set/enum';
import { query } from 'express';


const gridStyle = {
  width: '33.33%',
  textAlign: 'left' as any,
};

const cardBodyStyle = {
  minHeight: '72vh',
};

const wrapCardStyle = { width: '100%'};

const ModalContent = ({ modal }: any) => {

  const formDS = React.useMemo(() => {
    const type: FieldType = 'string' as FieldType;
    const ds = new DataSet({
      autoCreate: true,
      fields: [
        {
          name: 'name',
          type,
          label: '工作空间名称',
          required: true,
        },
        {
          name: 'gitUrl',
          type,
          label: 'Git仓库地址',
          required: true,
        },
        {
          name: 'environment',
          type,
          defaultValue: 'k8s',
          label: '工作空间类型',
          required: false,
        },
      ]
    });
    return ds;
  }, []);

  modal.handleOk(async () => {
    if (await formDS.validate()) {
      try{
        const data = formDS.toData()[0]
        const res = await axios.post('/workspace', [data]);
        notification.success({
          message: '创建成功',
          description: JSON.stringify(res.data,null,2),
        });
        return true;
      }catch(e) {
        console.error(e);
        notification.error({
          message: '创建失败',
          description: e.message,
        });
        return false;
      }
    }
    return false;
  });
  modal.handleCancel(() => {
    console.log('do Cancel');
    modal.close();
  });

  return (
    <div>
      <Form dataSet={formDS}>
        <TextField name="name" />
        <TextField name="gitUrl" />
      </Form>
    </div>
  );
};

const WSCardGrid = ({ ws, onDeleted }: {ws: IWorkspaces, onDeleted: Function  }) => {

  const [delWsRes, delWs] = useAsyncFn(async (ws: IWorkspaces) => {
    await (new Promise(resolve=> setTimeout(resolve, 1000)));
    try{
      const res = await axios.delete(`/workspace/${ws.id}`);
      notification.success({
        message: '删除成功',
        // description: JSON.stringify(res.data,null,2),
      });
      if(onDeleted) {
        await onDeleted();
      }
      return true;
    }catch(e) {
      console.error(e);
      notification.error({
        message: '删除失败',
        description: e.message,
      });
      return false;
    }
  }, []);

  return (
    <Card.Grid className={styles['ws-card']} style={gridStyle}>
      <Spin spinning={delWsRes.loading} >
        <div>
        工作空间: {ws.name}
        </div>
        <div>
        Git: {ws.gitUrl}
        </div>
        <div className={styles['ws-card-remove-btn-wrap']}>
          <Button onClick={() => {delWs(ws)}} className={styles['ws-card-remove-btn']} color={'red' as any}>删除</Button>
        </div>
      </Spin>
    </Card.Grid>
  );
}

const WorkSpaces: React.FC<any> = () => {
  const [state, fetch] = useAsyncFn(async ():Promise<IWorkspaces[]> => {
    const response = await axios.get('/workspace');
    return response.data as IWorkspaces[];
  }, []);

  const newWs = useCallback(() => {
    Modal.open({
      title: '创建工作空间',
      children: <ModalContent />,
      okText: '确定',
      onClose: () => {
        fetch();
      }
      // okProps: { disabled: true },
    });
  }, []);

  useEffect(() => {
    fetch();
  }, []);

  return (
      <Card
        bordered={false}
        loading={state.loading}
        title={<h1 className={styles.title}>工作空间</h1>}
        extra={<Button onClick={fetch} >刷新</Button>}
        style={wrapCardStyle}
        actions={state.error && [<Alert type="error" message={JSON.stringify(state.error.message, null, 2)} />]}
        bodyStyle={cardBodyStyle}
      >
        {state.value && state.value.map(ws => {
          return (<WSCardGrid key={`k_${ws.id}`} onDeleted={fetch} ws ={ws} />);
        })}
        <Card.Grid key="add-new-ws-card" className={`${styles['add-new-ws-card']} ${styles['ws-card']}`} style={gridStyle}>
          <div onClick={newWs}>
            <Icon type="add_box-o" title="abc" /> 
            <span className={styles['inner-text']}>创建工作空间</span>
          </div>
        </Card.Grid>
        {/* <pre>{JSON.stringify(state.value, null, 2)}</pre> */}
      </Card>
  );
}

export default WorkSpaces;
