import "reflect-metadata";
import Koa from 'koa';
import Router from '@koa/router';
import cors from '@koa/cors';
import logger from 'koa-logger';
import koaBody from 'koa-body';
import helmet from 'koa-helmet';
import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';

import dotenv from 'dotenv';
dotenv.config();

const mariadb = require('mariadb');
const connection = mariadb.createPool({
  host: process.env.host,
  user: process.env.user,
  password: process.env.password,
  database: process.env.database
});

import {createConnection} from "typeorm";
createConnection().then(async connection => {}).catch(error => console.log(error));

import api from './api';


const app = new Koa();
const router = new Router();

app.use(helmet())
.use(cors())
.use(logger())
.use(koaBody())
.use(router.routes())
.use(router.allowedMethods());

router.use('/api/v1', api.routes());


let serverCallback = app.callback();
let httpServer = http.createServer(serverCallback);

httpServer.listen(process.env.PORT || 5000, ()=>{console.log(`success ${process.env.PORT || 5000}`)});