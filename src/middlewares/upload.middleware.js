import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../configs/cloundinary.config.js';

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'orderingfood',
    allowedFormats: ['jpg', 'png', 'jpeg'],
  },
});
const videoStorage = multer.memoryStorage();

export const uploadVideo = multer({ storage: videoStorage }).single('video');


const upload = multer({ storage });

export const uploadFields = upload.fields([
  { name: 'mainImage', maxCount: 1 },
  { name: 'galleryImages', maxCount: 10 },
]);

export const uploadMenuItemImage = upload.single('image');

