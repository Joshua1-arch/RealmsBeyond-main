'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
// import { Input } from '@/components/ui/Input'; // Not used in dark mode admin
import { AiOutlineLoading3Quarters, AiOutlineCloudUpload } from 'react-icons/ai';
import { FiSave, FiArrowLeft, FiImage, FiX } from 'react-icons/fi';
import slugify from 'slugify';

interface BlogFormProps {
    initialData?: any;
    isEditing?: boolean;
}

export default function BlogForm({ initialData, isEditing = false }: BlogFormProps) {
    const router = useRouter();
    const [submitting, setSubmitting] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        title: "",
        slug: "",
        category: "",
        excerpt: "",
        content: "",
        author: "",
        featured_image: "",
        tags: "",
        status: "draft",
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                title: initialData.title || "",
                slug: initialData.slug || "",
                category: initialData.category || "",
                excerpt: initialData.excerpt || "",
                content: initialData.content || "",
                author: initialData.author || "",
                featured_image: initialData.featured_image || initialData.image || "",
                tags: initialData.tags ? initialData.tags.join(', ') : "",
                status: initialData.published ? "published" : "draft",
            });
        } else {
            // Set default author if creating new (could get from auth context if needed)
            setFormData(prev => ({ ...prev, author: 'Admin' }));
        }
    }, [initialData]);

    const [slugEdited, setSlugEdited] = useState(false);

    const generateSlug = (text: string) => {
        return slugify(text, {
            lower: true,
            strict: true,
            trim: true
        });
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

        setFormData(prev => {
            const newData = { ...prev, [name]: value };

            // Auto-generate slug from title if slug hasn't been manually edited
            if (name === 'title' && !slugEdited && !isEditing) {
                newData.slug = generateSlug(value);
            }

            return newData;
        });

        if (name === 'slug') {
            setSlugEdited(true);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setUploading(true);
            const formData = new FormData();
            formData.append('file', file);

            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Upload failed');
            }

            const data = await res.json();
            setFormData(prev => ({ ...prev, featured_image: data.url }));
        } catch (err: any) {
            console.error('Upload Error:', err);
            setError(err.message || 'Failed to upload image');
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        try {
            const payload = {
                ...formData,
                tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
                published: formData.status === 'published',
                published_at: formData.status === 'published' ? (initialData?.published_at || new Date().toISOString()) : null,
            };

            const url = isEditing ? `/api/blog/${initialData._id}` : '/api/blog';
            const method = isEditing ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to save blog post');
            }

            router.push('/admin/blog');
            router.refresh();
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred');
            setSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8 max-w-5xl mx-auto pb-10">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-200 pb-6">
                <div>
                    <h1 className="text-3xl font-heading font-bold text-gray-900">
                        {isEditing ? 'Edit Blog Post' : 'Create New Blog Post'}
                    </h1>
                    <p className="text-gray-500 mt-1">
                        {isEditing ? 'Update your existing article.' : 'Share a new insight with the world.'}
                    </p>
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                    <Button
                        variant="outline"
                        type="button"
                        onClick={() => router.back()}
                        className="flex-1 sm:flex-none justify-center border-gray-300 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        type="submit"
                        disabled={submitting || uploading}
                        className="flex-1 sm:flex-none justify-center min-w-[120px] shadow-lg shadow-rare-primary/20"
                    >
                        {submitting ? (
                            <>
                                <AiOutlineLoading3Quarters className="w-4 h-4 animate-spin mr-2" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <FiSave className="w-4 h-4 mr-2" />
                                {isEditing ? 'Update Post' : 'Publish Post'}
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {error && (
                <div className="p-4 bg-red-50 text-red-600 border border-red-200 rounded-lg flex items-center gap-2">
                    <FiX className="w-5 h-5" />
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content Column */}
                <div className="lg:col-span-2 space-y-6">
                    {/* General Info Card */}
                    <div className="p-6 bg-white border border-gray-200 rounded-xl shadow-sm space-y-6">
                        <h2 className="text-lg font-bold text-gray-900 border-b border-gray-200 pb-3">General Information</h2>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Post Title</label>
                            <input
                                name="title"
                                type="text"
                                value={formData.title}
                                onChange={handleChange}
                                placeholder="e.g. The Future of Logistics in 2026"
                                required
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-rare-primary focus:border-transparent transition-all"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Slug (Optional)</label>
                            <input
                                name="slug"
                                type="text"
                                value={formData.slug}
                                onChange={handleChange}
                                placeholder="the-future-of-logistics-2026"
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-rare-primary focus:border-transparent transition-all"
                            />
                            <p className="text-xs text-gray-500">Leave blank to auto-generate from title.</p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Excerpt / Short Description</label>
                            <textarea
                                name="excerpt"
                                value={formData.excerpt}
                                onChange={handleChange}
                                className="w-full min-h-[100px] p-3 rounded-lg bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-rare-primary focus:border-transparent outline-none transition-all"
                                placeholder="A brief summary of what this article is about..."
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Content</label>
                            <textarea
                                name="content"
                                value={formData.content}
                                onChange={handleChange}
                                className="w-full min-h-[400px] p-3 rounded-lg bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-rare-primary focus:border-transparent outline-none transition-all font-mono text-sm"
                                placeholder="Write your article content here (Markdown or HTML supported)..."
                                required
                            />
                        </div>
                    </div>
                </div>

                {/* Sidebar Column */}
                <div className="space-y-6">
                    {/* Organization Card */}
                    <div className="p-6 bg-white border border-gray-200 rounded-xl shadow-sm space-y-6">
                        <h2 className="text-lg font-bold text-gray-900 border-b border-gray-200 pb-3">Organization</h2>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Status</label>
                            <select
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-rare-primary focus:border-transparent text-gray-900"
                            >
                                <option value="draft">Draft</option>
                                <option value="published">Published</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Category</label>
                            <input
                                name="category"
                                type="text"
                                value={formData.category}
                                onChange={handleChange}
                                placeholder="e.g. Technology"
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-rare-primary focus:border-transparent transition-all"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Tags (comma separated)</label>
                            <input
                                name="tags"
                                type="text"
                                value={formData.tags}
                                onChange={handleChange}
                                placeholder="news, update, featured"
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-rare-primary focus:border-transparent transition-all"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Author</label>
                            <input
                                name="author"
                                type="text"
                                value={formData.author}
                                onChange={handleChange}
                                placeholder="Author Name"
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-rare-primary focus:border-transparent transition-all"
                            />
                        </div>
                    </div>

                    {/* Featured Image Card */}
                    <div className="p-6 bg-white border border-gray-200 rounded-xl shadow-sm space-y-6">
                        <h2 className="text-lg font-bold text-gray-900 border-b border-gray-200 pb-3">Featured Image</h2>

                        <div className="space-y-4">
                            {formData.featured_image ? (
                                <div className="relative aspect-video rounded-lg overflow-hidden border border-gray-200 group">
                                    <img
                                        src={formData.featured_image}
                                        alt="Featured"
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <button
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, featured_image: '' }))}
                                            className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition"
                                        >
                                            <FiTrash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="aspect-video rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 bg-gray-50">
                                    <FiImage className="w-8 h-8 mb-2" />
                                    <span className="text-sm">No image selected</span>
                                </div>
                            )}

                            <div className="relative">
                                <input
                                    type="file"
                                    id="featured-image"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    className="hidden"
                                    disabled={uploading}
                                />
                                <label
                                    htmlFor="featured-image"
                                    className={`w-full flex items-center justify-center gap-2 py-2.5 border rounded-lg cursor-pointer transition-all ${uploading
                                        ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                                        : 'bg-gray-50 text-gray-600 border-gray-300 hover:bg-gray-100 hover:text-gray-900'
                                        }`}
                                >
                                    {uploading ? (
                                        <>
                                            <AiOutlineLoading3Quarters className="w-4 h-4 animate-spin" />
                                            Uploading...
                                        </>
                                    ) : (
                                        <>
                                            <AiOutlineCloudUpload className="w-5 h-5" />
                                            Upload Image
                                        </>
                                    )}
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </form>
    );
}

// Helper icon
import { FiTrash2 } from 'react-icons/fi';
