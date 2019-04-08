import dotenv from 'dotenv';

dotenv.config();

const config = {
  PORT: process.env.PORT || 4500,
  DB_URL_TEST: process.env.DB_URL_TEST,
  DB_URL_PROD: process.env.DB_URL_PROD,
  MONGODB_DATABASE: process.env.DB_URL_DEV,
  CLOUDINARY_NAME: process.env.CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUD_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUD_API_SECRET,
  JWT_SECRET: process.env.SECRET_KEY,
  TOKEN_EXPIRES_IN: process.env.TOKEN_EXPIRES_IN,
  SLING_API_KEY: process.env.SLING_API_KEY,
  SLING_URL: process.env.SLING_URL,
  NODE_ENV: process.env.NODE_ENV,
  SENDGRID_USER: process.env.SENDGRID_USER,
  SENDGRID_PASSWORD: process.env.SENDGRID_PASSWORD,
  ELASTIC_SEARCH: {
    PORT: process.env.ELASTIC_SEARCH_PORT || 9200,
    HOST: process.env.ELASTIC_SEARCH_HOST || 'localhost'
  },
  RABBITMQ_PORT: process.env.RABBITMQ_PORT || '5672',
  RABBITMQ_HOST: process.env.RABBITMQ_HOST || 'localhost',
  RABBITMQ_USERNAME: process.env.RABBITMQ_USERNAME || 'guest',
  RABBITMQ_PASSWORD: process.env.RABBITMQ_PASSWORD || 'guest',
  REDIS_PORT: process.env.REDIS_PORT || '6379',
  REDIS_HOST: process.env.REDIS_HOST || 'localhost',
  REDIS_AUTH: process.env.REDIS_AUTH,
  FLUTTER_PUBLIC_KEY: process.env.FLUTTER_PUBLIC_KEY,
  FLUTTER_SECRET_KEY: process.env.FLUTTER_SECRET_KEY,
  MY_HASH: process.env.MY_HASH,
  SUPPORT_LINE: process.env.SUPPORT_LINE,
  FIRBASE_TYPE: process.env.FIRBASE_TYPE,
  PROJECT_ID: process.env.PROJECT_ID,
  PRIVATE_KEY_ID: process.env.PRIVATE_KEY_ID,
  PRIVATE_KEY: process.env.PRIVATE_KEY,
  CLIENT_EMAIL: process.env.CLIENT_EMAIL,
  CLIENT_ID: process.env.CLIENT_ID,
  AUTH_URI: process.env.AUTH_URI,
  TOKEN_URI: process.env.TOKEN_URI,
  AUTH_CERT_PROVIDER: process.env.AUTH_CERT_PROVIDER,
  CLIENT_CERT_URL: process.env.CLIENT_CERT_URL,
  FIREBASE_DATABASE_URL: process.env.FIREBASE_DATABASE_URL
};

export default config;
