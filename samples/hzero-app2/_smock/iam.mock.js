const mockjs = require('mockjs');

module.exports = {
  name: 'iam',
  desc: 'iam service',
  apis: [
    {
      name: 'self',
      desc: 'self',
      method: 'GET',
      url: '/iam/hzero/v1/users/self',
      handle: (req, res) => {
        res.setHeader(
          'Access-Control-Allow-Headers',
          'Content-Type, X-Requested-With,Access-Control-Allow-Headers'
        );
        const d = mockjs.mock({
          _token: 'keUs24wdEJx8Lgl9KbyHaW3Pyg8anglhvllGobP5iHXp9gG7BAVD+JyOIJftOPBm',
          id: 1,
          loginName: 'admin',
          email: 'admin@hzero.com',
          organizationId: 0,
          realName: '超级管理员',
          phone: '18666666666',
          internationalTelCode: '+86',
          imageUrl:
            'http://hzerodevoss.saas.hand-china.com/hz-public/avatar/0/56c36f3b30a14b76a9eb42959e6e2b48@12345.jpeg',
          language: 'zh_CN',
          languageName: '简体中文',
          timeZone: 'GMT+8',
          lastPasswordUpdatedAt: '2020-02-03 14:05:56',
          countryId: 1,
          regionId: 0,
          phoneCheckFlag: 1,
          emailCheckFlag: 1,
          passwordResetFlag: 1,
          tenantName: 'HZERO平台',
          tenantNum: 'HZERO',
          dateFormat: 'YYYY-MM-DD',
          timeFormat: 'HH:mm:ss',
          dateTimeFormat: 'YYYY-MM-DD HH:mm:ss',
          changePasswordFlag: 0,
          title: 'mock环境',
          logo: '',
          menuLayout: 'inline',
          menuLayoutTheme: 'default',
          roleMergeFlag: 1,
          tenantId: 0,
          currentRoleId: 1,
          currentRoleCode: 'role/site/default/administrator',
          currentRoleName: '平台级角色',
          currentRoleLevel: 'site',
          favicon: '',
          dataHierarchyFlag: 0,
          recentAccessTenantList: [],
        });
        res.json(d);
      },
    },
    {
      name: 'self-roles',
      desc: '获取当前用户角色列表',
      method: 'GET',
      url: '/iam/hzero/v1/member-roles/self-roles',
      handle: (req, res) => {
        res.json([
          {
            id: 1,
            name: '平台级角色',
            code: 'role/site/default/administrator',
            level: 'site',
            tenantId: 0,
            parentRoleAssignLevel: 'organization',
            parentRoleAssignLevelValue: 0,
            viewCode: 'administrator',
            tenantName: 'HZERO平台',
            assignLevel: 'organization',
            assignLevelValue: 0,
            assignLevelValueMeaning: 'HZERO平台',
            adminFlag: 0,
            assignedFlag: 0,
            haveAdminFlag: 0,
            manageableFlag: 0,
            selectAssignedRoleFlag: false,
            memberRoleId: 2,
            _token: 'keUs24wdEJx8Lgl9KbyHaW3Pyg8anglhvllGobP5iHW0NgH/wDpB0MlFrHHZYraa',
            enabled: false,
            defaultRole: false,
          },
          {
            id: 2,
            name: '租户级角色',
            code: 'role/organization/default/administrator',
            level: 'organization',
            tenantId: 0,
            parentRoleAssignLevel: 'organization',
            parentRoleAssignLevelValue: 0,
            viewCode: 'administrator',
            tenantName: 'HZERO平台',
            assignLevel: 'organization',
            assignLevelValue: 0,
            assignLevelValueMeaning: 'HZERO平台',
            adminFlag: 0,
            assignedFlag: 0,
            haveAdminFlag: 0,
            manageableFlag: 0,
            selectAssignedRoleFlag: false,
            memberRoleId: 1,
            _token: 'keUs24wdEJx8Lgl9KbyHaW3Pyg8anglhvllGobP5iHU5yJA0k7bL6YoBFnKEvYAC',
            enabled: false,
            defaultRole: false,
          },
        ]);
      },
    },
    {
      name: 'menus-tree',
      desc: '获取菜单树数据',
      method: 'GET',
      url: '/iam/hzero/v1/menus/tree',
      handle: (req, res) => {
        res.json(require('./_mock-data/menuData'));
      },
    },
  ],
};
