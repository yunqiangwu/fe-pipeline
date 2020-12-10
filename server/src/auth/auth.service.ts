import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { UsersService } from '../users/users.service';
import { User } from '../users/users.entity';
import { JwtService } from '@nestjs/jwt';
import { isArray } from 'util';

@Injectable()
export class AuthService {

  constructor(
      private readonly usersService: UsersService,
      private readonly jwtService: JwtService
    ) {}

  async otherAccountBind({loginType, access_token, github_state}: { loginType: string; access_token: string; github_state?: string }) {

    let userInfo: any;
    if(loginType === 'open-hand') {

      const response = await axios.get("https://gateway.open.hand-china.com/iam/hzero/v1/users/self", {
        "headers": {
          "accept": "application/json, text/plain, */*",
          "accept-language": "zh-CN,zh;q=0.9,en;q=0.8",
          "authorization": `bearer ${access_token}`,
          "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "same-site"
        }
      });

      userInfo = response.data;

      // userInfo = {
      //   id: 3008,
      //   loginName: '13485',
      //   email: 'yunqiang.wu@hand-china.com',
      //   organizationId: 3,
      //   realName: '吴云强',
      //   phone: '18711180761',
      //   language: 'zh_CN',
      //   languageName: '简体中文',
      //   timeZone: 'GMT+8',
      //   lastPasswordUpdatedAt: '2020-03-28 21:31:05',
      //   phoneCheckFlag: 1,
      //   emailCheckFlag: 1,
      //   passwordResetFlag: 1,
      //   tenantName: '汉得',
      //   tenantNum: 'HAND',
      //   dateFormat: 'YYYY-MM-DD',
      //   timeFormat: 'HH:mm:ss',
      //   dateTimeFormat: 'YYYY-MM-DD HH:mm:ss',
      //   changePasswordFlag: 0,
      //   title: '开发者平台',
      //   logo: 'https://file.open.hand-china.com/hsop-public/hpfm05/3/242ee70039c44fdb88c8c90136d05bc2/HZERO1000.png',
      //   menuLayout: 'inline',
      //   menuLayoutTheme: 'default',
      //   roleMergeFlag: 0,
      //   tenantId: 3,
      //   currentRoleId: 15,
      //   currentRoleCode: 'hsop-component-publish',
      //   currentRoleName: '开放平台组件发布角色',
      //   currentRoleLevel: 'organization',
      //   favicon: 'https://file.open.hand-china.com/hsop-public/hpfm05/3/2d343e850054445d8d877142499cb1d6/HZERO1000.png',
      //   dataHierarchyFlag: 0,
      //   recentAccessTenantList: []
      // };

      userInfo.username = userInfo.loginName;
      userInfo.avatar = userInfo.imageUrl || userInfo.favicon;
    } 
    if(loginType === 'choerodon') {

      const response = await axios.get("https://api.choerodon.com.cn/iam/choerodon/v1/users/self", {
        "headers": {
          "accept": "application/json, text/plain, */*",
          "accept-language": "zh-CN,zh;q=0.9,en;q=0.8",
          "authorization": `bearer ${access_token}`,
          "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "same-site"
        }
      });

      userInfo = response.data;

      // userInfo = {
      //   objectVersionNumber: 493,
      //   id: '4946',
      //   loginName: '13485',
      //   email: 'yunqiang.wu@hand-china.com',
      //   organizationId: 2,
      //   realName: '吴云强',
      //   phone: '18711180761',
      //   imageUrl: 'https://minio.choerodon.com.cn/iam-service/file_11844e3f67724aacb8b7b9e931bfed76_E81431B4C30EFB79587C726A1E2D28C0.jpg',
      //   language: 'zh_CN',
      //   languageName: '简体中文',
      //   timeZone: 'CTT',
      //   lastPasswordUpdatedAt: '2018-05-20 13:56:50',
      //   ldap: true,
      //   admin: false,
      //   phoneCheckFlag: 1,
      //   emailCheckFlag: 1,
      //   passwordResetFlag: 1,
      //   tenantName: '汉得信息',
      //   tenantNum: 'hand',
      //   dateFormat: 'YYYY-MM-DD',
      //   timeFormat: 'HH:mm:ss',
      //   dateTimeFormat: 'YYYY-MM-DD HH:mm:ss',
      //   changePasswordFlag: 0,
      //   title: 'HZERO平台验证环境',
      //   logo: 'http://hzerodevoss.saas.hand-china.com/hz-public/hpfm05/0/4778c71af8224379b8a7c047f4ed98a5@HZERO1000.png',
      //   menuLayout: 'side-all',
      //   menuLayoutTheme: 'color',
      //   roleMergeFlag: 1,
      //   tenantId: 2,
      //   currentRoleId: '15',
      //   currentRoleCode: 'member',
      //   currentRoleName: '租户级角色',
      //   currentRoleLevel: 'organization',
      //   currentRoleLabels: [ 'TENANT_ROLE', 'TENANT_MEMBER' ],
      //   favicon: 'http://hzerodevoss.saas.hand-china.com/hz-public/hpfm05/0/3cd4fa0a2bdd4ba49c2b174b0348340e@HZERO1000.png',
      //   dataHierarchyFlag: 0,
      //   recentAccessTenantList: [
      //     { tenantId: 7, tenantName: 'HZERO平台', tenantNum: 'hzero' },
      //     { tenantId: 8, tenantName: '移动中心', tenantNum: 'mobile-center' },
      //     { tenantId: 2, tenantName: '汉得信息', tenantNum: 'hand' },
      //     {
      //       tenantId: 513,
      //       tenantName: '经营事业中心.公用事业行业事业部',
      //       tenantNum: 'pubservice'
      //     }
      //   ]
      // };

      userInfo.username = userInfo.loginName;
      userInfo.avatar = userInfo.imageUrl || userInfo.favicon;
    } 
    if(loginType === 'github') {
      const gitResponse = await axios.post("https://github.com/login/oauth/access_token", {
        client_id: 'a18b1ae435db47650112',
        client_secret: '1876ba4ec1f92abc2fb3285cefa2c75d9eb3f5c9',
        code: access_token,
        scope: 'user:email',
        state: github_state,
      }, {
        headers: {
          'Accept': 'application/json'
        }
      });

      if(!gitResponse.data.access_token) {
        throw new Error(JSON.stringify(gitResponse.data));
      }
      access_token = gitResponse.data.access_token;
      const response = await axios.get("https://api.github.com/user", {
        "headers": {
          "accept": "application/json, text/plain, */*",
          "accept-language": "zh-CN,zh;q=0.9,en;q=0.8",
          "authorization": `bearer ${access_token}`,
          "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "same-site"
        }
      });
      userInfo = response.data;

      console.log(userInfo);

      // userInfo = {
      //   login: 'wuyun1',
      //   id: 12711404,
      //   node_id: 'MDQ6VXNlcjEyNzExNDA0',
      //   avatar_url: 'https://avatars1.githubusercontent.com/u/12711404?v=4',
      //   gravatar_id: '',
      //   url: 'https://api.github.com/users/wuyun1',
      //   html_url: 'https://github.com/wuyun1',
      //   followers_url: 'https://api.github.com/users/wuyun1/followers',
      //   following_url: 'https://api.github.com/users/wuyun1/following{/other_user}',
      //   gists_url: 'https://api.github.com/users/wuyun1/gists{/gist_id}',
      //   starred_url: 'https://api.github.com/users/wuyun1/starred{/owner}{/repo}',
      //   subscriptions_url: 'https://api.github.com/users/wuyun1/subscriptions',
      //   organizations_url: 'https://api.github.com/users/wuyun1/orgs',
      //   repos_url: 'https://api.github.com/users/wuyun1/repos',
      //   events_url: 'https://api.github.com/users/wuyun1/events{/privacy}',
      //   received_events_url: 'https://api.github.com/users/wuyun1/received_events',
      //   type: 'User',
      //   site_admin: false,
      //   name: null,
      //   company: null,
      //   blog: '',
      //   location: null,
      //   email: '842269153@qq.com',
      //   hireable: true,
      //   bio: null,
      //   twitter_username: null,
      //   public_repos: 134,
      //   public_gists: 2,
      //   followers: 2,
      //   following: 2,
      //   created_at: '2015-06-02T09:14:49Z',
      //   updated_at: '2020-12-10T14:57:57Z'
      // };

      userInfo.username = userInfo.login;
      userInfo.avatar = userInfo.avatar_url;

      if(!userInfo.email) {
        const response = await axios.get("https://api.github.com/user/emails", {
          "headers": {
            "accept": "application/json, text/plain, */*",
            "accept-language": "zh-CN,zh;q=0.9,en;q=0.8",
            "authorization": `bearer ${access_token}`,
          }
        });
        if(isArray(response.data) && response.data.length >= 1){
          userInfo.email = response.data[0].email;
        } else {
          console.log(response.data);
          throw new Error('no email');
        }
      }

    }

    if(!userInfo) {
      throw new Error(`${loginType} otherAccountBind Method not implemented.`);
    }
    // userInfo.token = userInfo.loginName;

    const userExample: Partial<User> = {};

    if(userInfo.email) {
      userExample.email = userInfo.email;
    } else if(userInfo.username) {
      userExample.username = userInfo.username;
    }

    let user = await this.usersService.findOneByExample({ email: userInfo.email });

    if(!user) {
      user = await this.usersService.createUser(userInfo as User);
    }

    return this.login(user);

  }

  async validateUser(username: string, pass: string): Promise<any> {
    let user = await this.usersService.findOne(username);
    if(!user) {
      user = await this.usersService.findOneByExample({ email: username });
    }
    if (user && user.password === pass) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = { username: user.username, sub: user.userId };
    return {
      access_token: this.jwtService.sign(payload),
      ...payload,
    };
  }
}