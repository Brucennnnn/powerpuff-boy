import { Elysia } from 'elysia';
import { ShareStoryController } from './controllers/shareStory.controller';

export const shareStoryRoutes = new Elysia()
  .post('/api/share-story', ShareStoryController.shareStoryHandler);