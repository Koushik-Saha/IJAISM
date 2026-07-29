import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import CommentForm from "@/components/blog/CommentForm";
import InteractiveSidebar from "@/components/blog/InteractiveSidebar";

export const revalidate = 300;

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

  // Handle preview for admins or restrict to published for public
  if (blog.status !== 'published') {
      // In a real app we might check if the user is an admin/author for preview
      // For now, if it's not published, we return 404 to non-admins
      // return notFound(); 
  }

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
              
              <div className="mb-8 w-full overflow-hidden rounded relative">
                {blog.featuredImageUrl ? (
                  <>
                    <img 
                      src={blog.featuredImageUrl} 
                      alt={blog.title} 
                      className="w-full object-cover max-h-[500px]" 
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                        if (fallback) {
                          fallback.style.display = 'block';
                        }
                      }}
                    />
                    <div style={{ display: 'none' }}>
                      <BlogFallbackImageLarge title={blog.title} />
                    </div>
                  </>
                ) : (
                  <BlogFallbackImageLarge title={blog.title} />
                )}
              </div>

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
                        {(['C5K Executive Administrator', 'The Mother Admin'].includes(blog.author.name) ? 'C' : blog.author.name.charAt(0))}
                  </div>
                  <a href="#" className="text-xs text-blue-600 hover:underline">View Profile</a>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900">{['C5K Executive Administrator', 'The Mother Admin'].includes(blog.author.name) ? 'C5K Editorial Team' : blog.author.name}</h3>
                  <p className="italic text-gray-600 text-sm mb-3">{blog.author.affiliation || 'C5K Researcher'}</p>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {blog.author.bio || 'Our expert contributors share insights and findings derived from meticulous academic research and technological exploration.'}
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
                    <div className="h-32 w-full relative overflow-hidden mb-3 bg-gray-100">
                      {post.featuredImageUrl ? (
                        <>
                          <img 
                            src={post.featuredImageUrl} 
                            alt={post.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                              if (fallback) {
                                fallback.style.display = 'block';
                              }
                            }}
                          />
                          <div className="absolute inset-0" style={{ display: 'none' }}>
                            <BlogFallbackImageMini title={post.title} />
                          </div>
                        </>
                      ) : (
                        <BlogFallbackImageMini title={post.title} />
                      )}
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

function BlogFallbackImageLarge({ title }: { title: string }) {
  return (
    <div className="w-full min-h-[250px] bg-gradient-to-br from-[#1E3A8A] to-[#3B82F6] flex flex-col justify-between p-10 text-white relative overflow-hidden rounded">
      <div className="absolute -right-16 -bottom-16 w-64 h-64 bg-white/10 rounded-full blur-2xl" />
      <div className="absolute -left-16 -top-16 w-48 h-48 bg-white/5 rounded-full blur-xl" />
      
      <div className="flex items-center justify-between z-10">
        <span className="text-xs font-bold tracking-widest bg-white/20 px-3 py-1 rounded uppercase">C5K INSIGHTS ARTICLE</span>
        <svg className="w-8 h-8 opacity-40" fill="currentColor" viewBox="0 0 24 24">
          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
        </svg>
      </div>
      <div className="z-10 mt-8">
        <h2 className="font-bold text-xl leading-snug text-white/95">
          {title}
        </h2>
      </div>
    </div>
  );
}

function BlogFallbackImageMini({ title }: { title: string }) {
  return (
    <div className="w-full h-full bg-gradient-to-br from-[#1E3A8A] to-[#3B82F6] flex flex-col justify-between p-3 text-white relative overflow-hidden">
      <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-white/10 rounded-full blur-lg" />
      <div className="flex items-center justify-between z-10">
        <span className="text-[8px] font-bold tracking-widest bg-white/20 px-1 rounded uppercase">C5K MINI</span>
        <svg className="w-3 h-3 opacity-30" fill="currentColor" viewBox="0 0 24 24">
          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
        </svg>
      </div>
      <div className="z-10 mt-1">
        <h5 className="font-bold text-[10px] leading-tight line-clamp-2 text-white/90">
          {title}
        </h5>
      </div>
    </div>
  );
}
