'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { AdminSidebar } from '@/components/admin/AdminSidebar'; // Wait, I don't need sidebar here
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { FiPlus, FiEdit2, FiTrash2, FiBox, FiSearch, FiFilter, FiMoreHorizontal, FiEye, FiX } from 'react-icons/fi';
import { useDebounce } from '@/hooks/useDebounce';

interface Product {
    _id: string;
    name: string;
    slug: string;
    price: number;
    category: string;
    tags?: string[];
    in_stock: boolean;
    featured: boolean;
    images: string[];
    createdAt?: string;
}

interface ProductDraft {
    resourceId: string;
    data: Partial<Product>;
    updatedAt: string;
}

export default function AdminProductsPage() {
    const { user, profile, isLoading } = useAuth();
    const router = useRouter();

    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const debouncedSearch = useDebounce(search, 500);
    const [drafts, setDrafts] = useState<ProductDraft[]>([]);
    const [view, setView] = useState<'all' | 'published' | 'drafts'>('all');

    // Bulk actions
    const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

    // Quick Edit State
    const [quickEditId, setQuickEditId] = useState<string | null>(null);
    const [quickEditForm, setQuickEditForm] = useState<Partial<Product>>({});

    // Message/Confirm Modal State
    const [modalState, setModalState] = useState<{
        isOpen: boolean;
        type: 'success' | 'error' | 'confirm';
        title: string;
        message: string;
        onConfirm?: () => void;
    }>({
        isOpen: false,
        type: 'success',
        title: '',
        message: '',
    });

    const showMessage = (title: string, message: string, type: 'success' | 'error' = 'success') => {
        setModalState({ isOpen: true, type, title, message });
    };

    const showConfirm = (title: string, message: string, onConfirm: () => void) => {
        setModalState({ isOpen: true, type: 'confirm', title, message, onConfirm });
    };

    const closeModal = () => {
        setModalState(prev => ({ ...prev, isOpen: false, onConfirm: undefined }));
    };

    useEffect(() => {
        if (!isLoading) {
            if (!user || profile?.role !== 'admin') {
                router.push('/');
            } else {
                fetchData();
            }
        }
    }, [user, profile, isLoading, router, debouncedSearch]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const queryParams = new URLSearchParams({
                limit: '50', // Increase limit
                ...(debouncedSearch && { search: debouncedSearch })
            });

            const [prodRes, draftRes] = await Promise.all([
                fetch(`/api/products?${queryParams}`),
                fetch(`/api/admin/drafts?type=product`)
            ]);

            if (!prodRes.ok) throw new Error('Failed to fetch products');

            const prodData = await prodRes.json();
            setProducts(prodData.products || []);

            if (draftRes.ok) {
                const draftData = await draftRes.json();
                setDrafts(draftData.drafts || []);
            }
        } catch (err: unknown) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteClick = (id: string) => {
        showConfirm('Delete Product', 'Are you sure you want to delete this product? This action cannot be undone.', async () => {
            try {
                const res = await fetch(`/api/products?id=${id}`, { method: 'DELETE' });
                if (!res.ok) throw new Error('Failed to delete product');

                showMessage('Success', 'Product deleted successfully', 'success');
                fetchData();
            } catch (err: unknown) {
                showMessage('Error', err instanceof Error ? err.message : 'Failed to delete', 'error');
            }
            closeModal();
        });
    };

    const handleDeleteDraft = (resourceId: string) => {
        showConfirm('Discard Draft', 'Are you sure you want to discard this draft? Unsaved changes will be lost.', async () => {
            try {
                await fetch(`/api/admin/drafts?type=product&id=${resourceId}`, { method: 'DELETE' });
                fetchData();
                showMessage('Success', 'Draft discarded', 'success');
            } catch (err: unknown) {
                console.error(err);
            }
            closeModal();
        });
    };

    const handleQuickEditClick = (product: Product) => {
        setQuickEditId(product._id);
        setQuickEditForm({
            name: product.name,
            slug: product.slug,
            price: product.price,
            in_stock: product.in_stock,
            category: product.category
        });
    };

    const handleQuickEditCancel = () => {
        setQuickEditId(null);
        setQuickEditForm({});
    };

    const handleQuickSave = async () => {
        if (!quickEditId) return;

        try {
            const res = await fetch(`/api/products`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...quickEditForm, _id: quickEditId })
            });

            if (!res.ok) throw new Error('Failed to update product');

            setQuickEditId(null);
            fetchData();
            showMessage('Success', 'Product updated successfully', 'success');
        } catch (err: unknown) {
            showMessage('Error', err instanceof Error ? err.message : 'Update failed', 'error');
        }
    };

    const toggleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedProducts(products.map(p => p._id));
        } else {
            setSelectedProducts([]);
        }
    };

    const toggleSelect = (id: string) => {
        if (selectedProducts.includes(id)) {
            setSelectedProducts(selectedProducts.filter(pId => pId !== id));
        } else {
            setSelectedProducts([...selectedProducts, id]);
        }
    };

    // Filter Logic
    const draftIds = new Set(drafts.map(d => d.resourceId));
    const newDraft = drafts.find(d => d.resourceId === 'new');

    let displayedProducts = products;
    if (view === 'published') {
        displayedProducts = products.filter(p => p.in_stock);
    } else if (view === 'drafts') {
        // Show products that have drafts + the 'new' draft
        displayedProducts = products.filter(p => draftIds.has(p._id));
    }

    if (isLoading) return null;

    return (
        <div className="bg-gray-50 min-h-screen">
            <main className="p-6 lg:p-10">
                <div className="mx-auto space-y-6">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <div>
                            <h1 className="font-heading text-3xl font-bold text-gray-900 flex items-center gap-3">
                                Products
                                <span className="text-sm font-normal text-gray-600 bg-white px-3 py-1 rounded-full border border-gray-200 shadow-sm">
                                    {products.length} items
                                </span>
                            </h1>
                        </div>
                        <Link href="/admin/products/create">
                            <Button variant="primary" className="flex items-center gap-2 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all">
                                <FiPlus /> Add New
                            </Button>
                        </Link>
                    </div>

                    {/* Filters & Search - Toolbar */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex flex-col md:flex-row gap-4 justify-between items-center">
                        <div className="flex gap-2 w-full md:w-auto">
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                <button onClick={() => setView('all')} className={`font-medium ${view === 'all' ? 'text-rare-primary' : 'text-gray-500 hover:text-gray-700'}`}>
                                    All ({products.length})
                                </button>
                                <span className="text-gray-300">|</span>
                                <button onClick={() => setView('published')} className={`font-medium ${view === 'published' ? 'text-rare-primary' : 'text-gray-500 hover:text-gray-700'}`}>
                                    Published ({products.filter(p => p.in_stock).length})
                                </button>
                                <span className="text-gray-300">|</span>
                                <button onClick={() => setView('drafts')} className={`font-medium ${view === 'drafts' ? 'text-rare-primary' : 'text-gray-500 hover:text-gray-700'}`}>
                                    Drafts ({drafts.length})
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <div className="relative group w-full md:w-64">
                                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-rare-primary transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Search products..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:bg-white focus:ring-2 focus:ring-rare-primary/20 focus:border-rare-primary focus:outline-none transition-all"
                                />
                            </div>
                            <Button variant="outline" className="hidden md:flex items-center gap-2 px-3 py-2">
                                <FiFilter /> Filter
                            </Button>
                        </div>
                    </div>

                    {/* Product Table */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                        {loading ? (
                            <div className="flex justify-center py-20">
                                <div className="animate-spin h-8 w-8 border-2 border-rare-primary border-t-transparent rounded-full" />
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-600 font-bold tracking-wider">
                                        <tr>
                                            <th className="p-4 w-10 text-center">
                                                <input
                                                    type="checkbox"
                                                    className="rounded border-gray-300 bg-white text-rare-primary focus:ring-rare-primary/30"
                                                    checked={selectedProducts.length === products.length && products.length > 0}
                                                    onChange={toggleSelectAll}
                                                />
                                            </th>
                                            <th className="p-4 w-20">Image</th>
                                            <th className="p-4">Name</th>
                                            <th className="p-4 w-32">Status</th>
                                            <th className="p-4 w-32">Price</th>
                                            <th className="p-4 w-40">Categories</th>
                                            <th className="p-4 w-40">Tags</th>
                                            <th className="p-4 w-32">Date</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {/* Show 'New Product' Draft if exists and view is appropriate */}
                                        {(view === 'all' || view === 'drafts') && newDraft && (
                                            <tr className="bg-yellow-50 border-l-4 border-l-yellow-500 hover:bg-yellow-100 transition-colors">
                                                <td className="p-4 text-center"></td>
                                                <td className="p-4">
                                                    <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400">
                                                        <FiEdit2 />
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="font-bold text-gray-700 italic">
                                                        {newDraft.data.name || 'Untitled New Product'}
                                                        <span className="ml-2 text-[10px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded border border-yellow-300 uppercase tracking-wide">Draft</span>
                                                    </div>
                                                    <div className="flex items-center gap-3 mt-1 text-xs">
                                                        <Link href="/admin/products/create" className="text-rare-primary hover:underline font-medium">Continue Editing</Link>
                                                        <span className="text-gray-300">|</span>
                                                        <button onClick={() => handleDeleteDraft('new')} className="text-red-500 hover:underline">Discard</button>
                                                    </div>
                                                </td>
                                                <td colSpan={5} className="p-4 text-sm text-gray-500 italic">
                                                    Unsaved new product draft • Last edited {new Date(newDraft.updatedAt).toLocaleDateString()}
                                                </td>
                                            </tr>
                                        )}

                                        {displayedProducts.map(product => {
                                            const hasDraft = draftIds.has(product._id);
                                            return (
                                                <React.Fragment key={product._id}>
                                                    {quickEditId === product._id ? (
                                                        <tr className="bg-rare-primary/5 border-l-4 border-l-rare-primary">
                                                            <td colSpan={8} className="p-4">
                                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                                                                    <div className="space-y-1 col-span-1 lg:col-span-2">
                                                                        <label className="text-xs font-bold text-gray-500 uppercase">Name</label>
                                                                        <Input
                                                                            value={quickEditForm.name || ''}
                                                                            onChange={(e) => setQuickEditForm(prev => ({ ...prev, name: e.target.value }))}
                                                                            fullWidth
                                                                            className="bg-gray-50 border-gray-200 text-gray-900"
                                                                        />
                                                                        <div className="flex items-center gap-1 text-xs text-gray-400">
                                                                            <span>Slug:</span>
                                                                            <input
                                                                                className="bg-transparent border-b border-gray-200 focus:border-rare-primary outline-none w-full text-gray-600"
                                                                                value={quickEditForm.slug || ''}
                                                                                onChange={(e) => setQuickEditForm(prev => ({ ...prev, slug: e.target.value }))}
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                    <div className="space-y-1">
                                                                        <label className="text-xs font-bold text-gray-500 uppercase">Price (₦)</label>
                                                                        <Input
                                                                            type="number"
                                                                            value={quickEditForm.price || 0}
                                                                            onChange={(e) => setQuickEditForm(prev => ({ ...prev, price: parseFloat(e.target.value) }))}
                                                                            fullWidth
                                                                            className="bg-gray-50 border-gray-200 text-gray-900"
                                                                        />
                                                                    </div>
                                                                    <div className="space-y-1">
                                                                        <label className="text-xs font-bold text-gray-500 uppercase">Status</label>
                                                                        <select
                                                                            className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-rare-primary/50 focus:border-rare-primary"
                                                                            value={quickEditForm.in_stock ? 'true' : 'false'}
                                                                            onChange={(e) => setQuickEditForm(prev => ({ ...prev, in_stock: e.target.value === 'true' }))}
                                                                        >
                                                                            <option value="true">In Stock</option>
                                                                            <option value="false">Out of Stock</option>
                                                                        </select>
                                                                    </div>
                                                                    <div className="flex gap-2">
                                                                        <Button onClick={handleQuickSave} size="sm" className="w-full bg-rare-primary text-white hover:bg-rare-primary/90">Save</Button>
                                                                        <Button onClick={handleQuickEditCancel} variant="outline" size="sm" className="w-full border-gray-300 text-gray-600 hover:bg-gray-100">Cancel</Button>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ) : (
                                                        <tr className={`group hover:bg-gray-50 transition-colors ${hasDraft ? 'bg-amber-50' : ''}`}>
                                                            <td className="p-4 text-center">
                                                                <input
                                                                    type="checkbox"
                                                                    className="rounded border-gray-300 bg-white text-rare-primary focus:ring-rare-primary/30"
                                                                    checked={selectedProducts.includes(product._id)}
                                                                    onChange={() => toggleSelect(product._id)}
                                                                />
                                                            </td>
                                                            <td className="p-4">
                                                                <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden border border-gray-200">
                                                                    {product.images && product.images[0] ? (
                                                                        <img src={product.images[0]} alt="" className="w-full h-full object-cover" />
                                                                    ) : (
                                                                        <div className="w-full h-full flex items-center justify-center text-gray-400"><FiBox /></div>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className="p-4">
                                                                <div className="font-bold text-gray-900 flex items-center gap-2">
                                                                    {product.name}
                                                                    {hasDraft && (
                                                                        <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded border border-amber-200 uppercase tracking-wide" title="Has unsaved changes">Unsaved Changes</span>
                                                                    )}
                                                                </div>
                                                                {/* Quick Actions - Always Visible */}
                                                                <div className="flex items-center gap-3 mt-1 text-xs">
                                                                    <Link href={`/admin/products/create?id=${product._id}`} className="text-rare-primary hover:underline font-medium">Edit</Link>
                                                                    <span className="text-gray-300">|</span>
                                                                    <button onClick={() => handleQuickEditClick(product)} className="text-rare-primary hover:underline">Quick Edit</button>
                                                                    <span className="text-gray-300">|</span>
                                                                    <button onClick={() => handleDeleteClick(product._id)} className="text-red-500 hover:text-red-600 hover:underline">Trash</button>
                                                                    {hasDraft && (
                                                                        <>
                                                                            <span className="text-gray-300">|</span>
                                                                            <button onClick={() => handleDeleteDraft(product._id)} className="text-orange-600 hover:text-orange-700 hover:underline">Discard Edits</button>
                                                                        </>
                                                                    )}
                                                                    <span className="text-gray-300">|</span>
                                                                    <Link href={`/products/${product.slug}`} target="_blank" className="text-gray-500 hover:text-gray-700 hover:underline">View</Link>
                                                                </div>
                                                            </td>
                                                            <td className="p-4">
                                                                {product.in_stock ? (
                                                                    <span className="text-[10px] bg-green-50 text-green-600 border border-green-200 px-2 py-1 rounded-sm uppercase tracking-wide font-bold">
                                                                        In Stock
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-[10px] bg-red-50 text-red-600 border border-red-200 px-2 py-1 rounded-sm uppercase tracking-wide font-bold">
                                                                        Out of Stock
                                                                    </span>
                                                                )}
                                                            </td>
                                                            <td className="p-4 font-bold text-sm text-rare-primary">
                                                                ₦{product.price ? product.price.toFixed(2) : '0.00'}
                                                            </td>
                                                            <td className="p-4 text-sm text-gray-500">
                                                                {product.category || 'Uncategorized'}
                                                            </td>
                                                            <td className="p-4 text-sm">
                                                                <div className="flex flex-wrap gap-1">
                                                                    {product.tags && product.tags.map(tag => (
                                                                        <span key={tag} className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded border border-gray-200">
                                                                            {tag}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            </td>
                                                            <td className="p-4 text-sm text-gray-400">
                                                                {product.createdAt ?
                                                                    new Date(product.createdAt).toLocaleDateString() :
                                                                    'Published'}
                                                            </td>
                                                        </tr>
                                                    )}
                                                </React.Fragment>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                        {!loading && products.length === 0 && (view === 'all' || view === 'published') && !newDraft && (
                            <div className="text-center py-12 text-gray-500">
                                No products found. <Link href="/admin/products/create" className="text-rare-primary font-bold hover:underline">Create one?</Link>
                            </div>
                        )}
                        {!loading && drafts.length === 0 && view === 'drafts' && (
                            <div className="text-center py-12 text-gray-500">
                                No drafts found.
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Modal for Messages and Confirmations */}
            {modalState.isOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-2xl max-w-sm w-full space-y-4 animate-in zoom-in-95 duration-200">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto ${modalState.type === 'success' ? 'bg-green-50 text-green-600' : modalState.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                            {modalState.type === 'success' && <FiBox size={24} />}
                            {modalState.type === 'error' && <FiX size={24} />}
                            {modalState.type === 'confirm' && <FiTrash2 size={24} />}
                        </div>

                        <div className="text-center space-y-2">
                            <h3 className="text-lg font-heading font-bold text-gray-900">{modalState.title}</h3>
                            <p className="text-sm text-gray-600">{modalState.message}</p>
                        </div>

                        <div className="flex justify-center gap-3 pt-2">
                            {modalState.type === 'confirm' ? (
                                <>
                                    <Button onClick={closeModal} variant="outline" className="flex-1 border-gray-300 text-gray-600 hover:bg-gray-100">Cancel</Button>
                                    <Button onClick={modalState.onConfirm} variant="primary" className="flex-1 bg-red-600 hover:bg-red-700 text-white border-none">Confirm</Button>
                                </>
                            ) : (
                                <Button onClick={closeModal} className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900">Okay</Button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
