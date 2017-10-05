/*
  MqttRequest
    Simulates request-response petition over MQTT
*/

import { EventEmitter } from 'events';
import * as mqtt from 'mqtt';
import * as upath from 'upath';

const REQ_TIMEOUT = 10000;

export class MqttRequester extends EventEmitter {

  constructor(private client: mqtt.Client, private reqEnd: string = 'req', private resEnd: string = 'res') {
    super();

    if(this.client.connected) this.subscribeAll();

    this.client.on('connect', () => {
      this.subscribeAll();
    });

    this.client.on('message', (topic, message) => {
      this.emit(topic, message);
    });
  }

  private subscribeAll() {
    let topic = upath.join('+/+/', this.resEnd);
    this.client.subscribe(topic);
  }

  do(url: string, data?: string, timeout: number = REQ_TIMEOUT): Promise<string> {
    if(data == null) data = '';

    let resTopic: string = upath.join(url, this.resEnd);
    let reqTopic: string = upath.join(url, this.reqEnd);

    return new Promise((resolve, reject) => {
      let tout = null;
      let confirmCb = (data) => {
        if(tout) {
          clearTimeout(tout);
          this.removeListener(resTopic, confirmCb);
          return resolve(data);
        }
      };
      tout = setTimeout(() => {
        tout = null;
        this.removeListener(resTopic, confirmCb);
        return reject(new Error('MQTT request timeout'));
      }, timeout);
      this.once(resTopic, confirmCb);
      this.client.publish(reqTopic, data, { qos: 1 });
    });
  }

}