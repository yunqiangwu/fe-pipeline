
import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsResponse,
} from '@nestjs/websockets';
import { from, Observable, interval, timer } from 'rxjs';
import { map, takeUntil, filter } from 'rxjs/operators';
import { Server } from 'ws';
import { globalSubject } from './events.utils';

@WebSocketGateway()
export class EventsGateway {
  @WebSocketServer()
  server: Server;

  @SubscribeMessage('events')
  onEvent(client: any, data: any): Observable<WsResponse<number>> {

    // 每1秒发出值
    const source = interval(1000);
    // 5秒后发出值
    const timer$ = timer(5000);
    // 当5秒后 timer 发出值时， source 则完成
    const example = source.pipe(takeUntil(timer$));

    return example.pipe(map(item => ({ event: 'events', data: item })));
  }

  wsStatusMap: Map<number, any> = new Map();

  @SubscribeMessage('open-ws-status')
  onWsOpenEvent(client: any, data: number): Observable<WsResponse<number>> {
    console.log(`open:  ${data} `);

    let example = this.wsStatusMap.get(data);

    if(!example)  {
      // 5秒后发出值
      const timer$ = timer(50000);
      // 当5秒后 timer 发出值时， source 则完成
      example = globalSubject.pipe(filter(r => r.wsId === data)).pipe(takeUntil(timer$));

      example.toPromise().then(() => {
        console.log(`closed:  ${data} `);
        this.wsStatusMap.delete(data);
      });
      this.wsStatusMap.set(data, example);
    }

    return example.pipe( map((item: any) => ({ event: 'open-ws-status', data: item.data })));
  }

}
