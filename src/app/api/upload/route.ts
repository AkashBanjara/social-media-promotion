import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { uploadImageToCloudinary, validateImageFile } from '@/lib/cloudinary';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
    }

    const validationError = validateImageFile({ type: file.type, size: file.size });
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await uploadImageToCloudinary(buffer);

    if (result.width < 320 || result.height < 320) {
      // Not a hard rejection — some platforms tolerate it — but the user should know.
      return NextResponse.json({
        ...result,
        warning: 'Image resolution is quite small; some platforms may reject or downscale it.',
      });
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error('[upload]', err);
    return NextResponse.json({ error: 'Image upload failed. Please try again.' }, { status: 500 });
  }
}
