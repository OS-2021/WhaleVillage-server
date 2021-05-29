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
const upload = multer({ storage: storage, fileFilter: fileFilter });


import { loadPost, loadLink, loadImage, adminLogin, primaryLink, writePost, updatePost, deletePost, uploadImage } from './api.controller';

api.get('/api/v1/post/:uid', loadPost); //
api.get('/api/v1/link/:pid', loadLink); //

api.post('/api/v1/media', upload.single('media'), uploadImage); //
api.get('/api/v1/media/:media', loadImage); //

api.post('/api/v1/admin/login', adminLogin); //

api.post('/api/v1/primarylink', primaryLink); //
api.post('/api/v1/post', writePost); //
api.put('/api/v1/post/:uid', updatePost);
api.delete('/api/v1/post/:uid', deletePost);



export default api