'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2 } from 'lucide-react';
import AdminLoading from '@/components/admin/AdminLoading';
import { useApp } from '@/components/app/AppProvider';
import BlogPostModal from '@/components/app/models/BlogPostModal';
import type { BlogPost } from '@/lib/types';

const ADMIN_EMAIL = 'admin@klusjeskoning.nl';

export const dynamic = 'force-dynamic';

export default function BlogManagement() {
  const router = useRouter();
  const { family, blogPosts, getBlogPosts, deleteBlogPost, isLoading } = useApp();
  const [isModalOpen, setModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);

  useEffect(() => {
    if (!family || family.email !== ADMIN_EMAIL) {
      router.push('/admin');
      return;
    }
    void getBlogPosts();
  }, [family, getBlogPosts, router]);

  const posts = useMemo(() => blogPosts ?? [], [blogPosts]);

  const handleAdd = () => {
    setSelectedPost(null);
    setModalOpen(true);
  };

  const handleEdit = (post: BlogPost) => {
    setSelectedPost(post);
    setModalOpen(true);
  };

  const handleDelete = async (postId: string) => {
    if (!confirm('Weet je zeker dat je deze blogpost wilt verwijderen?')) return;
    await deleteBlogPost(postId);
  };

  if (!family || family.email !== ADMIN_EMAIL) {
    return <AdminLoading />;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Blogbeheer</h1>
          <div className="space-x-3">
            <Button variant="outline" onClick={() => router.push('/admin/dashboard')}>
              Terug naar Dashboard
            </Button>
            <Button onClick={handleAdd}>
              <Plus className="mr-2 h-4 w-4" />
              Nieuwe blogpost
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <Card>
          <CardHeader>
            <CardTitle>Overzicht</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Titel</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead className="text-right">Acties</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {posts.map((post) => (
                  <TableRow key={post.id}>
                    <TableCell>
                      <div className="font-semibold">{post.title}</div>
                      <div className="text-xs text-muted-foreground">{post.excerpt}</div>
                    </TableCell>
                    <TableCell>{post.slug}</TableCell>
                    <TableCell>
                      <Badge variant={post.status === 'published' ? 'default' : 'secondary'}>
                        {post.status === 'published' ? 'Gepubliceerd' : 'Concept'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {post.tags.map((tag) => (
                          <Badge key={tag} variant="outline">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(post)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(post.id)} disabled={isLoading}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {posts.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                      Nog geen blogposts aangemaakt.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>

      <BlogPostModal isOpen={isModalOpen} setIsOpen={setModalOpen} initial={selectedPost} />
    </div>
  );
}
