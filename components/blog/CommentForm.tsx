'use client';

import { useState } from 'react';

export default function CommentForm({ blogId }: { blogId: string }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    website: '',
    content: '',
    rating: 5,
    saveInfo: false
  });
  
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleRatingClick = (rating: number) => {
    setFormData(prev => ({ ...prev, rating }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMessage('');

    try {
      const res = await fetch('/api/public/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, blogId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to post comment');
      }

      setStatus('success');
      setFormData({
        name: '',
        email: '',
        website: '',
        content: '',
        rating: 5,
        saveInfo: false
      });
    } catch (err: any) {
      console.error(err);
      setStatus('error');
      setErrorMessage(err.message || 'An error occurred.');
    }
  };

  return (
    <div className="bg-white p-8 border border-gray-200">
       <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-6">Leave a Reply</div>
       <p className="text-sm text-gray-600 mb-6">Your email address will not be published. Required fields are marked *</p>
       
       {status === 'success' ? (
         <div className="bg-[#007398]/10 border border-[#007398] text-[#007398] p-4 rounded-md mb-6">
           <p className="font-bold">Thank you!</p>
           <p className="text-sm">Your comment has been submitted and is awaiting moderation by the Editorial Team.</p>
           <button onClick={() => setStatus('idle')} className="text-xs font-bold underline mt-2">Submit another reply</button>
         </div>
       ) : (
         <form className="space-y-4" onSubmit={handleSubmit}>
           <textarea 
             name="content"
             value={formData.content}
             onChange={handleChange}
             required
             placeholder="Your reply..." 
             rows={5} 
             className="w-full bg-[#f8f9fa] border border-gray-200 p-3 text-sm focus:ring-1 focus:ring-[#007398] focus:outline-none"
           ></textarea>
           
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Name *</label>
                <input 
                  type="text" 
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full bg-[#f8f9fa] border border-gray-200 p-2 text-sm focus:ring-1 focus:ring-[#007398] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Email *</label>
                <input 
                  type="email" 
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full bg-[#f8f9fa] border border-gray-200 p-2 text-sm focus:ring-1 focus:ring-[#007398] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Website</label>
                <input 
                  type="url" 
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  className="w-full bg-[#f8f9fa] border border-gray-200 p-2 text-sm focus:ring-1 focus:ring-[#007398] focus:outline-none"
                />
              </div>
           </div>

           <div className="flex items-center gap-2 pt-2">
             <input 
               type="checkbox" 
               id="saveInfo" 
               name="saveInfo"
               checked={formData.saveInfo}
               onChange={handleChange}
               className="rounded-sm"
             />
             <label htmlFor="saveInfo" className="text-xs text-gray-700">Save my name, email, and website in this browser for the next time I comment.</label>
           </div>

           <div className="pt-2 flex items-center">
              <span className="text-xs font-semibold text-gray-700 mr-2">Your Rating:</span>
              <div className="flex gap-1 text-yellow-400 text-lg cursor-pointer">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span 
                    key={star} 
                    onClick={() => handleRatingClick(star)}
                    className={star <= formData.rating ? "text-yellow-400" : "text-gray-300"}
                  >
                    ★
                  </span>
                ))}
              </div>
           </div>

           {status === 'error' && (
             <div className="text-red-500 text-xs font-bold">{errorMessage}</div>
           )}

           <button 
             type="submit" 
             disabled={status === 'loading'}
             className="bg-[#007398] hover:bg-[#005a78] disabled:bg-gray-400 disabled:cursor-not-allowed text-white text-xs font-bold px-6 py-3 uppercase tracking-wider transition-colors mt-4"
           >
              {status === 'loading' ? 'Posting...' : 'Post Comment'}
           </button>
         </form>
       )}
    </div>
  );
}
