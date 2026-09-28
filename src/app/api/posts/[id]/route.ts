import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Post, PostPlatformResult } from '@/models/Post';
import { deleteImageFromCloudinary } from '@/lib/cloudinary';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();
  const post = await Post.findOne({ _id: params.id, userId: session.user.email }).lean();
  if (!post) return NextResponse.json({ error: 'Post not found.' }, { status: 404 });

  const results = await PostPlatformResult.find({ postId: params.id }).lean();
  return NextResponse.json({ post, results });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();
  const post = await Post.findOne({ _id: params.id, userId: session.user.email });
  if (!post) return NextResponse.json({ error: 'Post not found.' }, { status: 404 });

  await PostPlatformResult.deleteMany({ postId: post._id });
  await Post.deleteOne({ _id: post._id });

  try {
    await deleteImageFromCloudinary(post.cloudinaryPublicId);
  } catch (err) {
    // Non-fatal — the DB record is gone either way; log for manual cleanup.
    console.error('[posts:delete] failed to remove Cloudinary asset', err);
  }

  return NextResponse.json({ ok: true });
}
