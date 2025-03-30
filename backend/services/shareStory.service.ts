export class ShareStoryService {
    static async uploadImageToStory(image: any) {
      try {
        return { status: 'success', message: 'อัพโหลดรูปสำเร็จ!' };
      } catch (error) {
        return { status: 'error', message: 'เกิดข้อผิดพลาดในการอัพโหลด' };
      }
    }
  }
  