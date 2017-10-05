
import { Request, Response, Router } from 'express';
import { log } from './Log';
import { Socket } from 'engine.io';
import * as pathToRegexp from 'path-to-regexp';
import * as qs from 'qs';


export class SocketRequest /*implements Request*/ {

  reqId: number;
  session: any; // {}
  body: any; // {}
  method: string;
  params: any; // {}
  query: any; // {}
  path: string;
  originalPath: string;
  headers: { [key: string]: string; };

  startedAt: Date;

  socket: Socket;

  constructor(socket: Socket, id: number) {
    //super(socket.request);
    this.reqId = id;
    this.socket = socket;
    this.session = {};
    this.body = {};
    this.params = {};
    this.query = {};
    this.startedAt = new Date();
  }

  get(name: string): string {
    return this.headers[name];
  }

  header(name: string): string {
    return this.get(name);
  }

  accepts(...type: string[]): string[] | string | boolean {
    return true;
  }

}

export class SocketResponse /*implements Response*/ {

  reqId: number;
  req: SocketRequest;
  socket: Socket;
  code: number;
  headers: any;

  constructor(socket: Socket, id: number, req: SocketRequest) {
    //super();
    this.reqId = id;
    this.req = req;
    this.socket = socket;
    this.code = 200;
    this.headers = {};
  }

  status(code: number): SocketResponse {
    this.code = code;
    return this;
  }

  set(field: string, value?: string) {
    if(value == null) value = '';
    this.headers[field] = value;
  }

  json(body: any) {
    this.set('Content-Type', 'application/json');
    try {
      let data = JSON.stringify(body);
      return this.end(data);
    }
    catch(err) {
      log.error('Error sending Socket response: ', err);
    }
  }

  jsonp(body: any) {
    return this.json(body);
  }

  send(body: any) {
    if(typeof (body) === 'object') return this.json(body);
    this.set('Content-Type', 'text/plain');
    return this.end(body);
  }

  end(data?: any, encoding?: any) {
    let time = (new Date()).getTime() - this.req.startedAt.getTime();
    log.info(`${this.socket.handshake.address} - ${this.req.method} ${this.req.originalPath} WEBSOCKET ${this.code} - ${time} ms`);

    this.socket.emit(`response-${this.reqId}`, {
      status: this.code,
      headers: this.headers,
      body: data
    });
  }

}

export class SocketRoute {

  path: string;
  method: string;
  functions: { (req: SocketRequest, res: SocketResponse, next?: any): any }[];

  regexp: any;
  keys: Array<any>;

  constructor(path: string, method: string, functions: Array<any>, opts?: any) {

    if(opts == null) opts = {};

    this.path = path;
    this.method = method;
    this.functions = functions;

    this.regexp = pathToRegexp(path, this.keys = [], opts);

    // set fast path flags
    this.regexp.fast_star = path === '*';
    this.regexp.fast_slash = path === '/' && opts.end === false;
  }

  handleRequest(req: SocketRequest, res: SocketResponse) {
    let i = 0;
    // TODO Check for memory leaks...
    let callNextFunc = () => {
      if(i >= this.functions.length) return;
      let fnc = this.functions[i];
      fnc(req, res, (err) => {
        if(err) { log.error("err callnext", err); throw err; }
        i++;
        callNextFunc();
      });
    };

    try {
      callNextFunc();
    }
    catch(err) {
      log.error("Error on socket rest router", err);
      res.status(500).send('Server Error');
    }

  }

  match(req: SocketRequest, res: SocketResponse) {
    let path = req.path;
    let match;
    let params: any = {};
    let url: string;
    let query: any = {};

    let temp = path.split('?');
    if(temp.length >= 2) query = qs.parse(temp[1]);
    path = temp[0];

    // Check method
    if(req.method.toLowerCase() !== this.method.toLowerCase()) return false;

    if (path != null) {
      // fast path non-ending match for / (any path matches)
      if (this.regexp.fast_slash) {
        req.params = {};
        req.path = '';
        req.query = query;
        this.handleRequest(req, res);
        return true
      }

      // fast path for * (everything matched in a param)
      if (this.regexp.fast_star) {
        req.params = {'0': this.decode_param(path)};
        req.path = path;
        req.query = query;
        this.handleRequest(req, res);
        return true
      }

      // match the path
      match = this.regexp.exec(path)
    }

    if (!match) {
      params = undefined;
      url = undefined;
      return false;
    }

    // store values
    url = match[0]

    let keys = this.keys;

    for (var i = 1; i < match.length; i++) {
      var key = keys[i - 1];
      var prop = key.name;
      var val = this.decode_param(match[i])

      if (val !== undefined || !(Object.prototype.hasOwnProperty.call(params, prop))) {
        params[prop] = val;
      }
    }

    req.params = params;
    req.path = url;
    req.query = query;
    this.handleRequest(req, res);

    return true;
  }

  decode_param(val: any) {
    if (typeof val !== 'string' || val.length === 0) {
      return val;
    }

    try {
      return decodeURIComponent(val);
    } catch (err) {
      if (err instanceof URIError) {
        err.message = 'Failed to decode param \'' + val + '\'';
        //err.status = err.statusCode = 400;
      }

      log.error("error decode_param", err);
      throw err;
    }
  }

}

export class SocketRouter {

  baseUrl: string;
  routes: Array<SocketRoute>;

  constructor() {
    this.routes = [];
  }

  get(url: string, ...callbacks: any[]) {
    this.attend('GET', url, callbacks);
  }

  post(url: string, ...callbacks: any[]) {
    this.attend('POST', url, callbacks);
  }

  put(url: string, ...callbacks: any[]) {
    this.attend('PUT', url, callbacks);
  }

  delete(url: string, ...callbacks: any[]) {
    this.attend('DELETE', url, callbacks);
  }

  all(url: string, ...callbacks: any[]) {
    this.attend('*', url, callbacks);
  }

  attend(method: string, url: string, ...callbacks: any[]) {
    let route = new SocketRoute(url, method, callbacks[0]);
    this.routes.push(route);
  }

  handleRequest(req: SocketRequest, res: SocketResponse) {
    for(let route of this.routes) {
      if(route.match(req, res)) return;
    }
  }

}

export class SocketRest {

  routers: Array<SocketRouter>;

  constructor() {
    this.routers = [];
  }

  // Avoid false matching on handleRequest (like /api/v2/sceneitem vs /api/v2/scene)
  normalizeUrl(url): string {
    url = url.split('?')[0];
    if(url[url.length-1] !== '/') url += '/';
    return url;
  }

  handleRequest(socket: Socket, data: any) {
    let req = new SocketRequest(socket, data.reqId);
    req.session = socket.request.session;
    if(data.body != null) {
      if(typeof(data.body) === 'string') {
        try{
          req.body = JSON.parse(data.body);
        }
        catch(err) {
          log.error("Error on handleReq json parse", err);
        }
      }
      else req.body = data.body;
    }
    if(req.body == null) req.body = {};
    req.method = data.method;
    req.params = data.params;
    req.query = data.query;
    req.path = data.path;
    req.originalPath = data.path;

    let res = new SocketResponse(socket, data.reqId, req);

    let path:string = data.path;

    for(let router of this.routers) {
      if(this.normalizeUrl(path).indexOf(this.normalizeUrl(router.baseUrl)) == 0) {
        req.path = req.path.replace(router.baseUrl, '');
        //console.log("match base", router.baseUrl, path);
        return router.handleRequest(req, res);
      }
    }

  }

  use(url: string, router: SocketRouter) {
    router.baseUrl = url;
    this.routers.push(router);
  }

}