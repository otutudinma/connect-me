import cloudinary from 'cloudinary';
import shortid from 'shortid';
import config from '../config';
import upload from './validateImage';
import responses from '../utils/responses';

const uploadImage = upload.single('image');

// cloudinary config
cloudinary.config({
  cloud_name: config.CLOUDINARY_NAME,
  api_key: config.CLOUDINARY_API_KEY,
  api_secret: config.CLOUDINARY_API_SECRET
});

/**
 * @desc middleware for user image upload
 * @param {Object} req request object
 * @param {Object} res response object
 * @param {Object} next next object
 * @return {object} error or image url
 */
function uploadUserImage(req, res, next) {
  uploadImage(req, res, (err) => {
    if (err) {
      if (err.message === 'File too large') {
        return res.status(400).json(
          responses.error(400, 'Image is too large, please reduce image size')
        );
      }
      return res.status(400).json(
        responses.error(400, 'Image should be in jpg, jpeg or png')
      );
    }
    const imageId = shortid.generate();
    if (req.file) {
      cloudinary.v2.uploader.upload(req.file.path, {
        transformation: [{
          width: 400, height: 400, gravity: 'body', crop: 'fill'
        }, { width: 200, crop: 'scale' }],
        public_id: `HalaApp/${imageId}`
      }, (error, result) => {
        if (error || !result) {
          return next();
        }
        const image = {};
        image.url = result.url;
        return res.status(200).json(
          responses.success(200, 'Successfully uploaded image', image)
        );
      });
    } else {
      return res.status(400).json(
        responses.error(400, 'Kindly send an image')
      );
    }
  });
}

export default uploadUserImage;
