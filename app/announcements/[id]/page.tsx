import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import InteractiveSidebar from "@/components/blog/InteractiveSidebar";

export const dynamic = "force-dynamic";

export default async function AnnouncementDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const announcement = await prisma.announcement.findUnique({
    where: { id },
  });

  if (!announcement) {
    notFound();
  }

  // Fetch related announcements (simple logic: same category or latest, excluding current)
  // Logic: Fetch up to 2 announcements with same category, excluding current id.
  // If no category, or not enough, just fetch latest 2 excluding current.
  let relatedAnnouncements: any[] = [];

  if (announcement.category) {
    relatedAnnouncements = await prisma.announcement.findMany({
      where: {
        category: announcement.category,
        id: { not: id },
        publishedAt: { lte: new Date() }
      },
      orderBy: { publishedAt: 'desc' },
      take: 2
    });
  }

  // If not enough related, fill with any recent
  if (relatedAnnouncements.length < 2) {
    const more = await prisma.announcement.findMany({
      where: {
        id: { notIn: [id, ...relatedAnnouncements.map(a => a.id)] },
        publishedAt: { lte: new Date() }
      },
      orderBy: { publishedAt: 'desc' },
      take: 2 - relatedAnnouncements.length
    });
    relatedAnnouncements = [...relatedAnnouncements, ...more];
  }

  // Cast to any to avoid TS errors until VS Code refreshes Prisma types
  const ann = announcement as any;

  return (
    <div className="bg-[#f0f2f5] min-h-screen py-10 font-sans text-[#333]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Main Content Pane */}
          <div className="w-full lg:w-2/3 space-y-6">
            
            {/* Article Box */}
            <article className="bg-white px-8 py-10 border border-gray-200">
              <h1 className="text-[28px] font-bold text-[#1b1c1d] uppercase tracking-wide leading-tight mb-8">
                {ann.title}
              </h1>
              
              {ann.thumbnailUrl && (
                 <div className="mb-8 w-full max-h-[500px] overflow-hidden rounded relative">
                   <img src={ann.thumbnailUrl} alt={ann.title} className="w-full object-cover"/>
                 </div>
              )}

              <div 
                className="prose max-w-none prose-img:rounded-md prose-img:max-w-full prose-headings:font-bold prose-headings:text-[#1b1c1d] prose-h2:text-[22px] prose-h3:text-[18px] prose-p:text-[#4d4d4d] prose-p:leading-relaxed prose-a:text-[#007398]"
                dangerouslySetInnerHTML={{ __html: ann.content }}
              />
            </article>

            {/* Author Box */}
            <div className="bg-white p-6 border-l-4 border-l-[#007398] border-y border-y-gray-200 border-r border-r-gray-200">
              <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Author Details</div>
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                <div className="shrink-0 text-center">
                  <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center text-white text-3xl font-bold mb-2">
                      E
                  </div>
                  <a href="#" className="text-xs text-blue-600 hover:underline">http://c5k.com</a>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900">Editorial Team</h3>
                  <p className="italic text-gray-600 text-sm mb-3">Administrator</p>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    Hello! Welcome to the announcements board. We share the latest updates, policies, and news regarding C5K Platform and journal publishing here.
                  </p>
                </div>
              </div>
            </div>

            {/* Related Posts */}
            <div className="bg-white p-6 border border-gray-200">
              <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-6">Related Announcements</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {relatedAnnouncements.map(post => (
                  <div key={post.id} className="group">
                    <div className="h-32 bg-gray-100 mb-3 overflow-hidden">
                       {post.thumbnailUrl && <img src={post.thumbnailUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform"/>}
                    </div>
                    <h4 className="font-bold text-sm text-gray-900 group-hover:text-[#007398]">
                      <Link href={`/announcements/${post.id}`}>{post.title}</Link>
                    </h4>
                    <p className="text-xs text-gray-600 mt-2 line-clamp-3">
                       {post.excerpt || post.content.replace(/<[^>]*>?/gm, '').substring(0, 80) + '...'}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Leave a Reply */}
            <div className="bg-white p-8 border border-gray-200">
               <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-6">Leave a Reply</div>
               <p className="text-sm text-gray-600 mb-6">Your email address will not be published. Required fields are marked *</p>
               <form className="space-y-4">
                 <textarea placeholder="Your reply..." rows={5} className="w-full bg-[#f8f9fa] border border-gray-200 p-3 text-sm focus:ring-1 focus:ring-[#007398] focus:outline-none"></textarea>
                 
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Name *</label>
                      <input type="text" className="w-full bg-[#f8f9fa] border border-gray-200 p-2 text-sm focus:ring-1 focus:ring-[#007398] focus:outline-none"/>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Email *</label>
                      <input type="email" className="w-full bg-[#f8f9fa] border border-gray-200 p-2 text-sm focus:ring-1 focus:ring-[#007398] focus:outline-none"/>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Website</label>
                      <input type="url" className="w-full bg-[#f8f9fa] border border-gray-200 p-2 text-sm focus:ring-1 focus:ring-[#007398] focus:outline-none"/>
                    </div>
                 </div>

                 <div className="flex items-center gap-2 pt-2">
                   <input type="checkbox" id="saveInfo" className="rounded-sm"/>
                   <label htmlFor="saveInfo" className="text-xs text-gray-700">Save my name, email, and website in this browser for the next time I comment.</label>
                 </div>

                 <button type="button" className="bg-[#007398] hover:bg-[#005a78] text-white text-xs font-bold px-6 py-3 uppercase tracking-wider transition-colors mt-4">
                    Post Comment
                 </button>
               </form>
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
