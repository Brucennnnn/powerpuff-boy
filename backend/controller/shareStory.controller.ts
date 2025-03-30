import { ShareStoryService } from '../services/shareStory.service';
import { Context } from 'elysia';

export class ShareStoryController {
  static async shareStoryHandler(ctx: Context) {
    const data = await ctx.request.formData();
    const image = data.get('image');

    if (!image) {
      return ctx.set.status = 400, { message: 'ต้องอัพโหลดรูปภาพ' };
    }

    const result = await ShareStoryService.uploadImageToStory(image);
    return result;
  }
}