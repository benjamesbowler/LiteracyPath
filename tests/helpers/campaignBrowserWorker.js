import { Worker as NodeWorker } from 'node:worker_threads';
export class BrowserWorker {
  constructor(url){this.worker=new NodeWorker(`const {parentPort}=require('node:worker_threads');global.self={postMessage:value=>parentPort.postMessage(value)};const ready=import(${JSON.stringify(url.href)});parentPort.on('message',async data=>{await ready;self.onmessage({data});});`,{eval:true});this.worker.on('message',data=>this.onmessage?.({data}));this.worker.on('error',error=>this.onerror?.(error));}
  postMessage(value){this.worker.postMessage(value);}
  terminate(){void this.worker.terminate();}
}
