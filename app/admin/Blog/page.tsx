'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FiPlus, FiEdit2, FiTrash2, FiSearch } from 'react-icons/fi';
import { MdErrorOutline, MdCheckCircle } from 'react-icons/md';

interface BlogPost {
  _id: string;
  title: string;
  author: string;
  category?: string;
  featured_image?: string;
  image?: string;
  published: boolean;
  created_at: string;
}

export default function BlogListPage() {
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      setError(null);
      // Use admin=true to authenticate/authorize properly if the API checks it
      // The API currently checks auth in GET depending on logic, but let's just GET /api/blog
      // We might need to handle pagination, but for now fetch all (or limit to say 50)
      const response = await fetch('/api/blog?admin=true&limit=100');
      if (!response.ok) throw new Error('Failed to fetch blogs');

      const data = await response.json();
      setBlogs(data.posts || data || []); // Handle { posts: [], pagination: ... } or just []
    } catch (err: unknown) {
      console.error('Error fetching blogs:', err);
      setError(err instanceof Error ? err.message : 'Failed to load blogs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  const handleDeleteBlog = async (id: string) => {
    if (!confirm('Are you sure you want to delete this blog post?')) return;

    try {
      const response = await fetch(`/api/blog/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete blog post');
      }

      await fetchBlogs();
      setSuccess('Blog post deleted successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error: unknown) {
      console.error('Error deleting blog:', error);
      setError('Failed to delete blog post: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const filteredBlogs = blogs.filter(blog =>
    blog.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    blog.author.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-gray-50 min-h-screen">
      <main className="p-6 lg:p-10">
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-heading font-bold text-gray-900">Blog Posts</h1>
              <p className="text-gray-500 mt-1">Manage your insightful articles.</p>
            </div>
            <Link
              href="/admin/blog/create"
              className="flex items-center gap-2 px-6 py-2.5 bg-rare-primary hover:bg-rare-primary/90 text-grey rounded-xl transition-all shadow-lg hover:scale-105 active:scale-95 font-bold"
            >
              <FiPlus className="w-5 h-5" />
              Create New
            </Link>
          </div>

          {/* Messages */}
          {error && (
            <div className="flex items-center gap-2 p-4 bg-red-50 text-red-700 rounded-xl border border-red-200">
              <MdErrorOutline className="h-5 w-5" />
              <p>{error}</p>
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 p-4 bg-green-50 text-green-700 rounded-xl border border-green-200">
              <MdCheckCircle className="h-5 w-5" />
              <p>{success}</p>
            </div>
          )}

          {/* Filters */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Search by title or author..."
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-rare-primary/20 focus:border-rare-primary outline-none transition-all text-gray-900 placeholder-gray-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Table */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-gray-500">Loading blog posts...</div>
            ) : filteredBlogs.length === 0 ? (
              <div className="p-12 text-center text-gray-500">No blog posts found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="p-5 font-heading font-medium text-gray-600 text-sm tracking-wider uppercase">Image</th>
                      <th className="p-5 font-heading font-medium text-gray-600 text-sm tracking-wider uppercase">Title</th>
                      <th className="p-5 font-heading font-medium text-gray-600 text-sm tracking-wider uppercase">Category</th>
                      <th className="p-5 font-heading font-medium text-gray-600 text-sm tracking-wider uppercase">Author</th>
                      <th className="p-5 font-heading font-medium text-gray-600 text-sm tracking-wider uppercase">Status</th>
                      <th className="p-5 font-heading font-medium text-gray-600 text-sm tracking-wider uppercase text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredBlogs.map((blog) => (
                      <tr key={blog._id} className="hover:bg-gray-50 transition-colors">
                        <td className="p-5">
                          <div className="w-16 h-10 rounded-lg overflow-hidden bg-gray-100 relative border border-gray-200">
                            {(blog.featured_image || blog.image) ? (
                              <img
                                src={blog.featured_image || blog.image}
                                alt={blog.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">No Img</div>
                            )}
                          </div>
                        </td>
                        <td className="p-5 font-bold text-gray-900 max-w-xs truncate">{blog.title}</td>
                        <td className="p-5">
                          <span className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-md text-xs font-medium border border-gray-200">
                            {blog.category || 'Uncategorized'}
                          </span>
                        </td>
                        <td className="p-5 text-gray-500 text-sm">{blog.author}</td>
                        <td className="p-5">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${blog.published
                            ? 'bg-green-50 text-green-600 border-green-200'
                            : 'bg-amber-50 text-amber-600 border-amber-200'
                            }`}>
                            {blog.published ? 'Published' : 'Draft'}
                          </span>
                        </td>
                        <td className="p-5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/admin/blog/${blog._id}`}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <FiEdit2 className="w-4 h-4" />
                            </Link>
                            <button
                              onClick={() => handleDeleteBlog(blog._id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <FiTrash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
