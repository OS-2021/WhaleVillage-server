import Router from '@koa/router';
import multer from '@koa/multer';

const api = new Router();
const storage = multer.diskStorage({
  destination: async (req, file, cb) => { await cb(null, './files') },
  filename: async (req, file, cb) => { await cb(null,`${Date.now()}-${encodeURIComponent(file.originalname)}`) }
});


const upload = multer({ storage: storage, limits: { fieldSize: 1024 * 1024 * 1024 } });


import { loadPostWithUid, loadPostWithOutUid, loadLink, loadImage, adminLogin, primaryLink, writePost, updatePost, deletePost, uploadImage, thumbnail } from './api.controller';

api.get('/post', loadPostWithOutUid); //
api.get('/post/:uid', loadPostWithUid); //
api.get('/link/:pid', loadLink); //
api.get('/thumbnail/:sort', thumbnail); //

api.post('/media', upload.single('media'), uploadImage); //
api.get('/media/:media', loadImage); //

api.post('/admin/login', adminLogin); //

api.post('/primarylink', primaryLink); //
api.post('/post', writePost); //
api.put('/post/:uid', updatePost);
api.delete('/post/:uid', deletePost);



export default api