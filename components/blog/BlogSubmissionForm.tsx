'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { blogSubmissionSchema, BlogSubmissionInput } from '@/lib/validations/blog';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';
import { PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline';

// Dynamically import Quill to avoid SSR issues
const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });

const categories = ['Research Insights', 'Community News', 'Case Studies', 'Opinion', 'Technical Guides'];

export default function BlogSubmissionForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [featuredImage, setFeaturedImage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<BlogSubmissionInput>({
    resolver: zodResolver(blogSubmissionSchema),
    defaultValues: {
      title: '',
      content: '',
      category: '',
      excerpt: '',
    },
  });

  const content = watch('content');

  const onSubmit = async (data: BlogSubmissionInput) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/blogs/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`, // Assuming token is in localStorage
        },
        body: JSON.stringify({
          ...data,
          featuredImageUrl: featuredImage,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success('Blog submitted successfully for review!');
        router.push('/blogs');
      } else {
        toast.error(result.message || 'Failed to submit blog');
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });

      const result = await response.json();
      if (response.ok) {
        setFeaturedImage(result.url);
        toast.success('Image uploaded successfully');
      } else {
        toast.error('Failed to upload image');
      }
    } catch (error) {
      toast.error('Upload error');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
      <div className="space-y-6">
        {/* Title */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Blog Title</label>
          <input
            {...register('title')}
            className={`w-full px-4 py-3 rounded-xl border ${errors.title ? 'border-red-500' : 'border-gray-200'} focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-lg font-medium`}
            placeholder="Enter a compelling title..."
          />
          {errors.title && <p className="mt-1 text-sm text-red-500 font-medium">{errors.title.message}</p>}
        </div>

        {/* Category & Excerpt Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
            <select
              {...register('category')}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none appearance-none bg-white"
            >
              <option value="">Select a category</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            {errors.category && <p className="mt-1 text-sm text-red-500 font-medium">{errors.category.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Featured Image</label>
            {!featuredImage ? (
              <label className="flex items-center justify-center w-full h-[50px] px-4 py-2 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-primary hover:bg-primary/5 transition-all group">
                <div className="flex items-center space-x-2">
                  <PhotoIcon className="w-5 h-5 text-gray-400 group-hover:text-primary" />
                  <span className="text-sm text-gray-500 group-hover:text-primary">Upload Cover Photo</span>
                </div>
                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
              </label>
            ) : (
              <div className="relative group rounded-xl overflow-hidden border border-gray-200 h-[50px]">
                <img src={featuredImage} alt="Featured" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setFeaturedImage(null)}
                  className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <XMarkIcon className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Excerpt */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Summary / Excerpt</label>
          <textarea
            {...register('excerpt')}
            rows={2}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none resize-none"
            placeholder="A brief summary for the blog listing..."
          />
          {errors.excerpt && <p className="mt-1 text-sm text-red-500 font-medium">{errors.excerpt.message}</p>}
        </div>

        {/* Content - Rich Text Editor */}
        <div className="quill-premium">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Blog Content</label>
          <div className="rounded-xl overflow-hidden border border-gray-200">
            <ReactQuill
              theme="snow"
              value={content}
              onChange={(val) => setValue('content', val, { shouldValidate: true })}
              className="h-[400px]"
              modules={{
                toolbar: [
                  [{ header: [1, 2, 3, false] }],
                  ['bold', 'italic', 'underline', 'strike'],
                  [{ list: 'ordered' }, { list: 'bullet' }],
                  ['link', 'image'],
                  ['clean'],
                ],
              }}
            />
          </div>
          {errors.content && <p className="mt-1 text-sm text-red-500 font-medium">{errors.content.message}</p>}
        </div>
      </div>

      <div className="pt-6 border-t border-gray-100 flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-primary hover:bg-primary-dark text-white px-10 py-4 rounded-xl font-bold shadow-lg shadow-primary/20 transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Submitting...</span>
            </>
          ) : (
            <span>Submit for Review</span>
          )}
        </button>
      </div>
    </form>
  );
}
