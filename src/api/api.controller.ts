import { errorCode } from '../lib/errorcode';
import { jwtsign, jwtverify } from '../lib/token';
import { checkAdmin } from '../lib/checkUser';
import { getConnection } from "typeorm";
import { Post } from '../entity/Post';
import { Crawl } from '../entity/Crawl';
import { Admin } from '../entity/Admin';
import { Media } from '../entity/Media';
import fs from 'fs';
import crypto from 'crypto';
import send from 'koa-send';
import short from 'short-uuid';
const mariadb = require('mariadb');

const connection = mariadb.createPool({
  host: process.env.host,
  user: process.env.user,
  password: process.env.password,
  database: process.env.database
});

const cryptoPassword = (async(password) => { return await crypto.createHmac('sha512', process.env.CRYPTO).update(password).digest('hex'); });
const translator = short(short.constants.flickrBase58, { consistentLength: false });


export const loadPostWithUid = (async (ctx) => {
  let { uid } = ctx.params;
  let body : object, status : number, post : object;

  post = await getConnection()
  .createQueryBuilder()
  .select("post")
  .from(Post, "post")
  .where("post.uid = :uid", { uid: uid })
  .getOne();

  if (post !== undefined) {    
    post['media'] = post['media'].split(',');
    status = 200;
    body = post;
  }else{
    status = 403;
    body = await errorCode(108);
  }

  ctx.status = status;
  ctx.body = body;
});

export const loadPostWithOutUid = (async (ctx) => {
  let body : object, status : number, post : object;

  post = await getConnection()
  .createQueryBuilder()
  .select(["post.uid", "post.title", "post.date"])
  .from(Post, "post")
  .orderBy('post.date', 'DESC')
  .getMany();


  if (post !== undefined) {    
    status = 200;
    body = post;
  }else{
    status = 403;
    body = await errorCode(303);
  }

  ctx.status = status;
  ctx.body = body;
});

export const thumbnail = (async (ctx) => {
  let body : object, status : number, post;
  let { sort } = ctx.params;

  if (sort == 'new') {
    post = await getConnection()
    .createQueryBuilder()
    .select(["post.uid", "post.title", "post.date", "post.media"])
    .from(Post, "post")
    .orderBy('post.date', 'DESC')
    .limit(3)
    .getMany();


    for (let i = 0; i < post.length; i++) {
      if (post[i]['media'] != undefined) {    
        post[i]['media'] = await post[i]['media'].split(',');
      }      
    }

  }else if(sort == 'list'){
    post = await getConnection()
    .createQueryBuilder()
    .select(["post.media"])
    .from(Post, "post")
    .orderBy('post.date', 'DESC')
    .limit(3)
    .getMany();

    for (let i = 0; i < post.length; i++) {
      if (post[i]['media'] != undefined) {    
        post[i]['media'] = await post[i]['media'].split(',')[0];
      }      
    }
  }

  if (post !== undefined) {    
    status = 200;
    body = post;
  }else{
    status = 403;
    body = await errorCode(303);
  }

  ctx.status = status;
  ctx.body = body;
});

export const loadLink = (async (ctx) => {
  let { pid } = ctx.params;
  let body : object, status : number, link : object;

  if (pid !== undefined) {
    link = await getConnection()
    .createQueryBuilder()
    .select("crawl")
    .from(Crawl, "crawl")
    .where("crawl.page = :page", { page: pid })
    .getMany();

    if (link === undefined) {
      status = 403;
      body = await errorCode(303);
    }

    status = 200;
    body = link;
  }else{
    status = 412;
    body = await errorCode(402);
  }
  ctx.status = status;
  ctx.body = body;
});

export const uploadImage = (async (ctx) => {
  console.log(ctx.header.authentication);

  const authentication = await jwtverify(ctx.header.authentication);
  const fileName = ctx.request.file != undefined ? ctx.request.file.filename : undefined;
  let body : object, status : number;
  console.log(ctx.request.file);
  console.log(ctx);
  
  if (fileName !== undefined) {
    if (authentication !== 'error') {
      const user = await checkAdmin(authentication[0]);


      if (user !== undefined) {
        const uid = await translator.new();
        await getConnection()
        .createQueryBuilder()
        .insert()
        .into(Media)
        .values({ 
          uid : uid,
          path: `http://${process.env.DOMAIN || 'localhost'}:5011/movie/` + fileName })
        .execute();

        status = 201;
        body = {"uid" : `http://${process.env.DOMAIN || 'localhost'}:5011/movie/` + fileName};
      }else{
        status = 403;
        body = await errorCode(303);
      }
    }else{
      status = 412;
      body = await errorCode(302);
    }
  }else{
    status = 403;
    body = await errorCode(401, '파일 또는 파일 확장자 오류');
  }

  ctx.status = status;
  ctx.body = body;
});

export const loadImage = (async (ctx) => { 
  const { media } = ctx.params;
  let body : object, status : number;
  console.log(media);
  
  const path = await getConnection()
  .createQueryBuilder()
  .select("media")
  .from(Media, "media")
  .where("media.uid = :uid", { uid: media })
  .orWhere("media.path = :path", { path: encodeURIComponent(media) })
  .getOne();

  try { await send(ctx, encodeURIComponent(path.path), { root: './files/' }); }
  catch(err){
    console.log(err);
    
    ctx.status = 404;
    ctx.body = await errorCode(501);
  }
});

export const adminLogin = (async (ctx) => { 
  const { id, password } = ctx.request.body;
  let body,status,accessToken;

  console.log(ctx);
  console.log(ctx.request.body);

  const admin = await getConnection()
  .createQueryBuilder()
  .select("admin")
  .from(Admin, "admin")
  .where("admin.id = :id", { id: id })
  .andWhere("admin.password = :password", { password: password })
  .getOne();

  if (admin !== undefined) {
    accessToken = await jwtsign(admin.id, '1y');

    status = 201;
    body = {  "accessToken" : accessToken };
  }else{
    status = 403;
    body = await errorCode(101);
  }

  ctx.status = status;
  ctx.body = body;
});

export const primaryLink = (async (ctx) => {
  const authentication = await jwtverify(ctx.header.authentication);
  const { uid } = ctx.request.body;
  const { pid } = ctx.params;
  let body : object, status : number;

  if (authentication !== 'error') {
    const user = await checkAdmin(authentication[0]);

    if (user !== undefined) {
      console.log(user);
      console.log(uid);
      console.log(pid);
      
      await getConnection()
      .createQueryBuilder()
      .update(Crawl)
      .set({isPrimary: false})
      .where("crawl.page = :page", { page: pid })
      .execute();

      await getConnection()
      .createQueryBuilder()
      .update(Crawl)
      .set({isPrimary: true})
      .where("crawl.uid = :uid", { uid: uid })
      .andWhere("crawl.page = :page", { page: pid })
      .execute();

      status = 201;
      body = {};
    }else{
      status = 403;
      body = await errorCode(108);
    }
  }else{
    status = 412;
    body = await errorCode(302);
  }

  ctx.status = status;
  ctx.body = body;
});

export const writePost = (async (ctx) => {
  const authentication = await jwtverify(ctx.header.authentication);
  let { title, content, medias } = ctx.request.body;
  let body : object, status : number;

  if (authentication !== 'error') {
    const user = await checkAdmin(authentication[0]);

    if (user !== undefined) {
      let temp = [];
      for (let i = 0; i < medias.length; i++) {
        let fileType = medias[i].split('.')[1];
        if (fileType == 'mkv' || fileType == 'avi' || fileType == 'mp4' || fileType == 'mpg' || fileType == 'flv' || fileType == 'wmv' || fileType == 'asf' || fileType == 'asx' || fileType == 'ogm' || fileType == 'ogv' || fileType == 'mov') {
          temp.push(medias[i]);
        }else{ temp.unshift(medias[i]); }
      }

      await getConnection()
      .createQueryBuilder()
      .insert()
      .into(Post)
      .values({ title: title, contents: content, media: temp.join(',') })
      .execute();

      status = 201;
      body = {};
    }else{
      status = 403;
      body = await errorCode(108);
    }
  }else{
    status = 412;
    body = await errorCode(302);
  }
  ctx.status = status;
  ctx.body = body;
});

export const updatePost = (async (ctx) => {
  const authentication = await jwtverify(ctx.header.authentication);
  const { uid } = ctx.params;
  let { title, content, medias } = ctx.request.body;
  let body : object, status : number;

  if (authentication !== 'error') {
    const user = await checkAdmin(authentication[0]);

    if (user !== undefined) {
      let temp = [];
      for (let i = 0; i < medias.length; i++) {
        let fileType = medias[i].split('.')[1];
        if (fileType == 'mkv' || fileType == 'avi' || fileType == 'mp4' || fileType == 'mpg' || fileType == 'flv' || fileType == 'wmv' || fileType == 'asf' || fileType == 'asx' || fileType == 'ogm' || fileType == 'ogv' || fileType == 'mov') {
          temp.push(medias[i]);
        }else{ temp.unshift(medias[i]); }
      }

      await getConnection()
      .createQueryBuilder()
      .update(Post)
      .set({ title: title, contents: content, media: temp.join(',') })
      .where("post.uid = :uid", { uid: uid })
      .execute();

      status = 201;
      body = {};
    }else{
      status = 403;
      body = await errorCode(108);
    }
  }else{
    status = 412;
    body = await errorCode(302);
  }

  ctx.status = status;
  ctx.body = body;
});

export const deletePost = (async (ctx) => {
  const authentication = await jwtverify(ctx.header.authentication);
  const { uid } = ctx.params;
  let body : object, status : number;

  if (authentication !== 'error') {
    const user = await checkAdmin(authentication[0]);

    if (user !== undefined) {

      await getConnection()
      .createQueryBuilder()
      .delete()
      .from(Post)
      .where("post.uid = :uid", { uid: uid })
      .execute();

      status = 201;
      body = {};
    }else{
      status = 403;
      body = await errorCode(108);
    }
  }else{
    status = 412;
    body = await errorCode(302);
  }

  ctx.status = status;
  ctx.body = body;
});