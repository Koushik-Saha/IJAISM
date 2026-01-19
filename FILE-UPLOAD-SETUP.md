# 📁 File Upload System - Setup Guide

**Status:** ✅ **API Implemented** | ⚠️ **Storage Needs Configuration**

---

## 🎯 Current Implementation

The file upload API is fully functional with validation, but you need to configure actual file storage for production use.

### What's Working:
- ✅ File upload API endpoint (`/api/upload`)
- ✅ File validation (size, type)
- ✅ Authentication required
- ✅ Integration with article submission form
- ✅ Error handling

### What Needs Setup:
- ⚠️ Actual file storage (Vercel Blob, AWS S3, or Cloudinary)

---

## 🔧 Storage Options

### Option 1: Vercel Blob (Recommended for Vercel)

**Pros:**
- Integrated with Vercel
- Simple API
- Good pricing
- No additional setup needed

**Setup:**
```bash
npm install @vercel/blob
```

**Update `/app/api/upload/route.ts`:**
```typescript
import { put } from '@vercel/blob';

// Replace the placeholder code with:
const blob = await put(fileName, buffer, {
  contentType: file.type,
  access: 'public',
});

return NextResponse.json({
  success: true,
  url: blob.url,
  fileName: file.name,
  size: file.size,
  type: file.type,
});
```

**Environment Variable:**
```env
BLOB_READ_WRITE_TOKEN=your_vercel_blob_token
```

---

### Option 2: AWS S3

**Pros:**
- Industry standard
- Highly scalable
- Good for large files
- CDN support with CloudFront

**Setup:**
```bash
npm install @aws-sdk/client-s3
```

**Create `/lib/s3.ts`:**
```typescript
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function uploadToS3(fileName: string, buffer: Buffer, contentType: string) {
  const command = new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET_NAME!,
    Key: `uploads/${fileName}`,
    Body: buffer,
    ContentType: contentType,
    ACL: 'public-read',
  });

  await s3Client.send(command);
  return `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/uploads/${fileName}`;
}
```

**Update `/app/api/upload/route.ts` to use S3**

**Environment Variables:**
```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_S3_BUCKET_NAME=your-bucket-name
```

---

### Option 3: Cloudinary

**Pros:**
- Image optimization built-in
- Video support
- Free tier available
- Easy setup

**Setup:**
```bash
npm install cloudinary
```

**Update `/app/api/upload/route.ts`:**
```typescript
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// In upload handler:
const result = await cloudinary.uploader.upload(buffer.toString('base64'), {
  resource_type: 'raw',
  folder: 'manuscripts',
  public_id: fileName,
});

return NextResponse.json({
  success: true,
  url: result.secure_url,
  // ...
});
```

**Environment Variables:**
```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

---

## 📝 Current File Upload Flow

1. User selects file in submission form
2. File is validated (size, type)
3. File is uploaded to `/api/upload`
4. API returns file URL
5. URL is included in article submission
6. Article is created with file URLs

---

## ✅ Testing

1. **Test File Validation:**
   - Try uploading file > 20MB → Should fail
   - Try uploading invalid type → Should fail
   - Upload valid PDF → Should succeed

2. **Test Integration:**
   - Submit article with manuscript
   - Submit article with cover letter
   - Submit article with both
   - Verify URLs are saved in database

---

## 🚀 Quick Start (Vercel Blob)

1. Install package:
   ```bash
   npm install @vercel/blob
   ```

2. Get token from Vercel dashboard:
   - Go to Vercel project settings
   - Navigate to Storage → Blob
   - Copy read/write token

3. Add to `.env`:
   ```env
   BLOB_READ_WRITE_TOKEN=vercel_blob_xxxxx
   ```

4. Update `/app/api/upload/route.ts` with Vercel Blob code (see above)

5. Test upload!

---

**Status:** Ready for storage configuration  
**Next Step:** Choose storage provider and update upload endpoint
