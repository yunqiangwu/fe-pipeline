import {startServer} from './index';
import { Config } from './config/config';

startServer(+`${Config.singleInstance().get('backend-port') ||  `3000`}`);
