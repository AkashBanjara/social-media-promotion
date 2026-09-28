import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Post, PostPlatformResult } from '@/models/Post';
import { createPostSchema, parseHashtags } from '@/lib/validations';
import { publishPost } from '@/lib/social/publisher';
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limit';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();
  const userId = session.user.email;
  const { searchParams } = new URL(req.url);

  const search = searchParams.get('search')?.trim();
  const platform = searchParams.get('platform');
  const status = searchParams.get('status');
  const dateFrom = searchParams.get('dateFrom');
  const dateTo = searchParams.get('dateTo');
  const page = Number(searchParams.get('page') || 1);
  const limit = Number(searchParams.get('limit') || 20);

  const filter: Record<string, unknown> = { userId };
  if (search) filter.caption = { $regex: search, $options: 'i' };
  if (platform) filter.platforms = platform;
  if (status) filter.status = status;
  if (dateFrom || dateTo) {
    filter.createdAt = {
      ...(dateFrom && { $gte: new Date(dateFrom) }),
      ...(dateTo && { $lte: new Date(dateTo) }),
    };
  }

  const [posts, total] = await Promise.all([
    Post.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Post.countDocuments(filter),
  ]);

  return NextResponse.json({ posts, total, page, limit });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const limitCheck = rateLimit(`publish:${session.user.email}`, RATE_LIMITS.publish.limit, RATE_LIMITS.publish.windowMs);
  if (!limitCheck.allowed) {
    return NextResponse.json({ error: 'Too many publish attempts. Try again in a minute.' }, { status: 429 });
  }

  await connectDB();
  const userId = session.user.email;

  const body = await req.json();
  const parsed = createPostSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input.' }, { status: 400 });
  }

  const data = parsed.data;
  const hashtags = parseHashtags(data.hashtags ?? '');

  const post = await Post.create({
    userId,
    imageUrl: data.imageUrl,
    cloudinaryPublicId: data.cloudinaryPublicId,
    caption: data.caption,
    websiteUrl: data.websiteUrl || undefined,
    hashtags,
    platforms: data.platforms,
    status: 'draft',
  });

  // Pre-create pending platform result rows so the UI has something to show immediately.
  await PostPlatformResult.insertMany(
    data.platforms.map((platform) => ({ postId: post._id, platform, status: 'pending' }))
  );

  if (data.saveAsDraft) {
    return NextResponse.json({ post, results: [] });
  }

  try {
    const results = await publishPost(post.id, userId);
    const updated = await Post.findById(post._id).lean();
    return NextResponse.json({ post: updated, results });
  } catch (err) {
    console.error('[posts:publish]', err);
    return NextResponse.json(
      { error: 'Post was saved but publishing failed unexpectedly. You can retry from Post History.' },
      { status: 500 }
    );
  }
}
