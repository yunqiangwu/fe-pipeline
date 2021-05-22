import {startServer} from './index';
import { Config } from './config/config';

process.env.DATABASE_URL=`file:${Config.singleInstance().get('db.database')}`;

startServer(+`${Config.singleInstance().get('backend-port') ||  `3000`}`);
