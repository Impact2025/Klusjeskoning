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
import ReviewModal from '@/components/app/models/ReviewModal';
import type { Review } from '@/lib/types';

const ADMIN_EMAIL = 'admin@klusjeskoning.nl';

export const dynamic = 'force-dynamic';

export default function ReviewsManagement() {
  const router = useRouter();
  const { family, reviews, getReviews, deleteReview, isLoading } = useApp();
  const [isModalOpen, setModalOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);

  useEffect(() => {
    if (!family || family.email !== ADMIN_EMAIL) {
      router.push('/admin');
      return;
    }
    void getReviews();
  }, [family, getReviews, router]);

  const items = useMemo(() => reviews ?? [], [reviews]);

  const handleAdd = () => {
    setSelectedReview(null);
    setModalOpen(true);
  };

  const handleEdit = (review: Review) => {
    setSelectedReview(review);
    setModalOpen(true);
  };

  const handleDelete = async (reviewId: string) => {
    if (!confirm('Weet je zeker dat je deze review wilt verwijderen?')) return;
    await deleteReview(reviewId);
  };

  if (!family || family.email !== ADMIN_EMAIL) {
    return <AdminLoading />;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Reviewbeheer</h1>
          <div className="space-x-3">
            <Button variant="outline" onClick={() => router.push('/admin/dashboard')}>
              Terug naar Dashboard
            </Button>
            <Button onClick={handleAdd}>
              <Plus className="mr-2 h-4 w-4" />
              Nieuwe review
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
                  <TableHead>Score</TableHead>
                  <TableHead className="text-right">Acties</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((review) => (
                  <TableRow key={review.id}>
                    <TableCell>
                      <div className="font-semibold">{review.title}</div>
                      <div className="text-xs text-muted-foreground">{review.author}</div>
                    </TableCell>
                    <TableCell>{review.slug}</TableCell>
                    <TableCell>
                      <Badge variant={review.status === 'published' ? 'default' : 'secondary'}>
                        {review.status === 'published' ? 'Gepubliceerd' : 'Concept'}
                      </Badge>
                    </TableCell>
                    <TableCell>{review.rating}/5</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(review)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(review.id)} disabled={isLoading}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {items.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                      Nog geen reviews aangemaakt.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>

      <ReviewModal isOpen={isModalOpen} setIsOpen={setModalOpen} initial={selectedReview} />
    </div>
  );
}
