import Link from "next/link";
import { prisma } from "@/lib/prisma";
import SubmitBlogCTA from "@/components/blog/SubmitBlogCTA";

export const revalidate = 300;

export default async function BlogsPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const resolvedParams = await searchParams;
  const q = typeof resolvedParams?.q === 'string' ? resolvedParams.q : undefined;

  const whereCondition: any = {
    status: "published",
    deletedAt: null
  };

  if (q) {
    whereCondition.OR = [
      { title: { contains: q, mode: 'insensitive' } },
      { content: { contains: q, mode: 'insensitive' } },
    ];
  }

  const blogs = await prisma.blog.findMany({
    where: whereCondition,
    orderBy: { publishedAt: 'desc' },
    include: { author: true }
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary to-blue-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex-1">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">C5K Blog</h1>
            <p className="text-xl md:text-2xl text-gray-100 max-w-3xl">
              {q ? `Search Results for "${q}"` : 'Explore insights, research, and thought leadership from our community'}
            </p>
          </div>
          <div className="flex-shrink-0">
            <SubmitBlogCTA />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {blogs.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl shadow-sm">
            <h3 className="text-xl text-gray-600">
               {q ? `We couldn't find any blogs matching "${q}". Try another search term!` : 'No blogs published yet.'}
            </h3>
            {q && (
              <div className="mt-4">
                <Link href="/blogs" className="text-primary hover:underline font-semibold">Clear Search Options</Link>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogs.map(blog => (
              <div key={blog.id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col h-full border border-gray-100">
                <div className="h-56 w-full relative overflow-hidden">
                  {blog.featuredImageUrl ? (
                    <>
                      <img 
                        src={blog.featuredImageUrl} 
                        alt={blog.title} 
                        className="absolute inset-0 w-full h-full object-cover" 
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                          if (fallback) {
                            fallback.style.display = 'block';
                          }
                        }}
                      />
                      <div className="absolute inset-0" style={{ display: 'none' }}>
                        <BlogFallbackImage title={blog.title} />
                      </div>
                    </>
                  ) : (
                    <BlogFallbackImage title={blog.title} />
                  )}
                </div>
                <div className="p-6 flex flex-col flex-grow">
                  <div className="mb-3">
                    <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full uppercase tracking-wide">
                      {new Date(blog.publishedAt || blog.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3 leading-tight hover:text-primary transition-colors">
                    <Link href={`/blogs/${blog.slug}`}>
                      {blog.title}
                    </Link>
                  </h3>
                  <p className="text-gray-600 mb-6 text-sm line-clamp-3">
                    {blog.excerpt || blog.content.replace(/<[^>]*>?/gm, '').substring(0, 150) + '...'}
                  </p>
                  <div className="mt-auto border-t border-gray-100 pt-4 flex justify-between items-center">
                    <span className="text-sm text-gray-500 font-medium">By {['C5K Executive Administrator', 'The Mother Admin', 'Super Admin'].includes(blog.author?.name || '') ? 'C5K Editorial Team' : (blog.author?.name || 'C5K Editorial Team')}</span>
                    <Link href={`/blogs/${blog.slug}`} className="text-primary font-semibold text-sm hover:text-primary-dark transition-colors">
                      Read More →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Newsletter Subscription */}
        <div className="bg-gradient-to-r from-primary to-blue-800 text-white rounded-xl shadow-md p-8 mt-16">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">Subscribe to Our Newsletter</h2>
            <p className="text-lg text-gray-100 mb-6">
              Get the latest insights and updates delivered directly to your inbox
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <input
                type="email"
                placeholder="Enter your email address"
                className="px-4 py-3 rounded-lg text-gray-800 flex-1 max-w-md focus:outline-none focus:ring-2 focus:ring-accent"
              />
              <button className="bg-accent hover:bg-accent-dark text-white px-8 py-3 rounded-lg font-bold transition-colors whitespace-nowrap shadow-lg">
                Subscribe
              </button>
            </div>
            <p className="text-sm text-gray-200 mt-4">
              We respect your privacy. Unsubscribe at any time.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function BlogFallbackImage({ title }: { title: string }) {
  return (
    <div className="w-full h-full bg-gradient-to-br from-[#1E3A8A] to-[#3B82F6] flex flex-col justify-between p-6 text-white relative overflow-hidden">
      {/* Decorative background shape */}
      <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full blur-xl" />
      <div className="absolute -left-8 -top-8 w-24 h-24 bg-white/5 rounded-full blur-lg" />
      
      <div className="flex items-center justify-between z-10">
        <span className="text-[10px] font-bold tracking-widest bg-white/20 px-2 py-0.5 rounded uppercase">C5K INSIGHTS</span>
        <svg className="w-5 h-5 opacity-40" fill="currentColor" viewBox="0 0 24 24">
          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
        </svg>
      </div>
      <div className="z-10">
        <h4 className="font-bold text-sm leading-snug line-clamp-3 text-white/90">
          {title}
        </h4>
      </div>
    </div>
  );
}
