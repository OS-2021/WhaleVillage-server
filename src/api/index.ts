import Router from '@koa/router';
import multer from '@koa/multer';

const api = new Router();
const storage = multer.diskStorage({
  destination: async (req, file, cb) => { cb(null, './files') },
  filename: async (req, file, cb) => { cb(null,`${Date.now()}-${file.originalname}`) }
});
const fileFilter = async (req, file, cb) => {
  let typeArray = file.mimetype.split('/');
  let fileType = typeArray[1];
  if (fileType == 'jpg' || fileType == 'png' || fileType == 'jpeg' || fileType == 'gif' || fileType == 'mp4' || fileType == 'avi' || fileType == 'wmv') {
    cb(null, true);
  }else{
    cb(null, false)
  }
}
const upload = multer({ storage: storage, fileFilter: fileFilter, limits: { fieldSize: 25 * 1024 * 1024 } });


import { loadPostWithUid, loadPostWithOutUid, loadLink, loadImage, adminLogin, primaryLink, writePost, updatePost, deletePost, uploadImage, thumbnail } from './api.controller';

api.get('/post', loadPostWithOutUid); //
api.get('/post/:uid', loadPostWithUid); //
api.get('/link/:pid', loadLink); //
api.get('/thumbnail ', thumbnail); //

api.post('/media', upload.single('media'), uploadImage); //
api.get('/media/:media', loadImage); //

api.post('/admin/login', adminLogin); //

api.post('/primarylink', primaryLink); //
api.post('/post', writePost); //
api.put('/post/:uid', updatePost);
api.delete('/post/:uid', deletePost);



export default api