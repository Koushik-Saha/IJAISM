import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import CommentForm from "@/components/blog/CommentForm";
import InteractiveSidebar from "@/components/blog/InteractiveSidebar";

export const dynamic = "force-dynamic";

export default async function BlogDetailsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const blog = await prisma.blog.findUnique({
    where: { slug, deletedAt: null },
    include: { 
      author: true,
      comments: {
        where: { status: 'approved' },
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  if (!blog) return notFound();

  // Increment view count
  await prisma.blog.update({
    where: { id: blog.id },
    data: { viewCount: { increment: 1 } }
  }).catch(console.error);

  const relatedPosts = await prisma.blog.findMany({
    where: { status: "published", deletedAt: null, id: { not: blog.id } },
    take: 2,
    orderBy: { publishedAt: 'desc' },
  });

  return (
    <div className="bg-[#f0f2f5] min-h-screen py-10 font-sans text-[#333]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Main Content Pane */}
          <div className="w-full lg:w-2/3 space-y-6">
            
            {/* Article Box */}
            <article className="bg-white px-8 py-10 border border-gray-200">
              <h1 className="text-[28px] font-bold text-[#1b1c1d] uppercase tracking-wide leading-tight mb-8">
                {blog.title}
              </h1>
              
              {blog.featuredImageUrl && (
                 <div className="mb-8 w-full max-h-[500px] overflow-hidden rounded relative">
                   <img src={blog.featuredImageUrl} alt={blog.title} className="w-full object-cover"/>
                 </div>
              )}

              <div 
                className="prose max-w-none prose-img:rounded-md prose-img:max-w-full prose-headings:font-bold prose-headings:text-[#1b1c1d] prose-h2:text-[22px] prose-h3:text-[18px] prose-p:text-[#4d4d4d] prose-p:leading-relaxed prose-a:text-[#007398]"
                dangerouslySetInnerHTML={{ __html: blog.content }}
              />
            </article>

            {/* Author Box */}
            <div className="bg-white p-6 border-l-4 border-l-[#007398] border-y border-y-gray-200 border-r border-r-gray-200">
              <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Author Details</div>
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                <div className="shrink-0 text-center">
                  <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center text-white text-3xl font-bold mb-2">
                        {'E'}
                  </div>
                  <a href="#" className="text-xs text-blue-600 hover:underline">http://c5k.com</a>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900">Editorial Team</h3>
                  <p className="italic text-gray-600 text-sm mb-3">Staff Writers</p>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    Hello! We are the Editorial Team. We want to share our insights and important points that are needed when starting any research or tech exploration.
                  </p>
                </div>
              </div>
            </div>

            {/* Related Posts */}
            <div className="bg-white p-6 border border-gray-200">
              <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-6">Related Posts</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {relatedPosts.map(post => (
                  <div key={post.id} className="group">
                    <div className="h-32 bg-gray-100 mb-3 overflow-hidden">
                       {post.featuredImageUrl && <img src={post.featuredImageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform"/>}
                    </div>
                    <h4 className="font-bold text-sm text-gray-900 group-hover:text-[#007398]">
                      <Link href={`/blogs/${post.slug}`}>{post.title}</Link>
                    </h4>
                    <p className="text-xs text-gray-600 mt-2 line-clamp-3">
                       {post.excerpt || post.content.replace(/<[^>]*>?/gm, '').substring(0, 80) + '...'}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Comments Display & Leave a Reply */}
            <div className="space-y-6">
               {blog.comments.length > 0 && (
                 <div className="bg-white p-8 border border-gray-200">
                    <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-6 border-b pb-2">Comments ({blog.comments.length})</div>
                    <div className="space-y-6">
                      {blog.comments.map(comment => (
                        <div key={comment.id} className="border-b border-gray-100 last:border-0 pb-4 last:pb-0">
                          <div className="flex justify-between items-start mb-2">
                            <div className="font-bold text-[#1b1c1d]">{comment.name}</div>
                            <div className="text-xs text-gray-500">{new Date(comment.createdAt).toLocaleDateString()}</div>
                          </div>
                          <p className="text-sm text-gray-700">{comment.content}</p>
                        </div>
                      ))}
                    </div>
                 </div>
               )}
               <CommentForm blogId={blog.id} />
            </div>
            
          </div>
          
          {/* Right Sidebar */}
          <div className="w-full lg:w-1/3 space-y-6">
            <InteractiveSidebar />
          </div>
        </div>
      </div>
    </div>
  );
}
