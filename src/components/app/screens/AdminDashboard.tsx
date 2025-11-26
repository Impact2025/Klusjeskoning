'use client';
import { useEffect, useState } from 'react';
import { useApp } from '../AppProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LogOut, Users, Baby, Star, Heart, Plus, Gift, Pencil, BookOpen, MessageSquare, Trash2, Sparkles } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import AddGoodCauseModal from '../models/AddGoodCauseModal';
import EditGoodCauseModal from '../models/EditGoodCauseModal';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { Timestamp } from '@/lib/timestamp';
import type { GoodCause } from '@/lib/types';
import type { BlogPost, Review } from '@/lib/types';
import BlogPostModal from '../models/BlogPostModal';
import ReviewModal from '../models/ReviewModal';
import BlogGeneratorModal from '../models/BlogGeneratorModal';

const StatCard = ({ title, value, icon }: { title: string; value: number; icon: React.ReactNode }) => (
    <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            {icon}
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value.toLocaleString('nl-NL')}</div>
        </CardContent>
    </Card>
);

export default function AdminDashboard() {
  const {
    logout,
    getAdminStats,
    adminStats,
    getGoodCauses,
    goodCauses,
    blogPosts,
    getBlogPosts,
    deleteBlogPost,
    reviews,
    getReviews,
    deleteReview,
  } = useApp();
  const [isAddGoodCauseModalOpen, setAddGoodCauseModalOpen] = useState(false);
  const [isEditGoodCauseModalOpen, setEditGoodCauseModalOpen] = useState(false);
  const [editingCause, setEditingCause] = useState<GoodCause | null>(null);
  const [isBlogModalOpen, setBlogModalOpen] = useState(false);
  const [editingBlogPost, setEditingBlogPost] = useState<BlogPost | null>(null);
  const [isReviewModalOpen, setReviewModalOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [isBlogGeneratorOpen, setBlogGeneratorOpen] = useState(false);

  useEffect(() => {
    getAdminStats();
    getGoodCauses();
    getBlogPosts();
    getReviews();
  }, [getAdminStats, getGoodCauses, getBlogPosts, getReviews]);

  const openEditModal = (cause: GoodCause) => {
    setEditingCause(cause);
    setEditGoodCauseModalOpen(true);
  };

  const openBlogModal = (post: BlogPost | null = null) => {
    setEditingBlogPost(post);
    setBlogModalOpen(true);
  };

  const openReviewModal = (review: Review | null = null) => {
    setEditingReview(review);
    setReviewModalOpen(true);
  };

  const handleBlogModalToggle = (open: boolean) => {
    setBlogModalOpen(open);
    if (!open) {
      setEditingBlogPost(null);
    }
  };

  const handleReviewModalToggle = (open: boolean) => {
    setReviewModalOpen(open);
    if (!open) {
      setEditingReview(null);
    }
  };

  const handleDeleteBlogPost = (post: BlogPost) => {
    if (window.confirm(`Weet je zeker dat je "${post.title}" wilt verwijderen?`)) {
      void deleteBlogPost(post.id);
    }
  };

  const handleDeleteReview = (review: Review) => {
    if (window.confirm(`Weet je zeker dat je de review "${review.title}" wilt verwijderen?`)) {
      void deleteReview(review.id);
    }
  };

  const now = Timestamp.now();
  const activeCause = goodCauses?.find(c => c.startDate <= now && c.endDate >= now);
  const upcomingCauses = goodCauses?.filter(c => c.startDate > now);

  const CauseItem = ({ cause, colorClass, onEdit }: { cause: GoodCause; colorClass: string; onEdit: (cause: GoodCause) => void }) => (
    <div className={`p-3 bg-${colorClass}-50 border-l-4 border-${colorClass}-500 rounded flex justify-between items-start`}>
        <div>
            <p className="font-bold">{cause.name}</p>
            <p className="text-sm">{cause.description}</p>
            <p className="text-xs text-muted-foreground mt-1">
                {format(cause.startDate.toDate(), 'dd MMM', { locale: nl })} - {format(cause.endDate.toDate(), 'dd MMM yyyy', { locale: nl })}
            </p>
        </div>
        <Button variant="ghost" size="icon" onClick={() => onEdit(cause)}>
            <Pencil className={`h-4 w-4 text-${colorClass}-700`} />
        </Button>
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-slate-200">
      <header className="bg-gray-800 text-white p-4 flex justify-between items-center shadow-md">
        <h2 className="font-brand text-2xl">Admin Dashboard</h2>
        <Button variant="ghost" size="icon" onClick={logout}>
          <LogOut />
        </Button>
      </header>
      <ScrollArea className="flex-grow">
        <main className="p-4 space-y-6">
            {adminStats ? (
                <div className="grid gap-4 md:grid-cols-2">
                    <StatCard title="Totaal Families" value={adminStats.totalFamilies} icon={<Users className="h-4 w-4 text-muted-foreground" />} />
                    <StatCard title="Totaal Kinderen" value={adminStats.totalChildren} icon={<Baby className="h-4 w-4 text-muted-foreground" />} />
                    <StatCard title="Totaal Punten Ooit" value={adminStats.totalPointsEver} icon={<Star className="h-4 w-4 text-muted-foreground" />} />
                    <StatCard title="Punten Gedoneerd" value={adminStats.totalDonationPoints} icon={<Heart className="h-4 w-4 text-muted-foreground" />} />
                </div>
            ) : (
                <p>Statistieken worden geladen...</p>
            )}

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center"><Gift className="mr-2" /> Goede Doelen Beheren</CardTitle>
                        <CardDescription>
                            Activeer een goed doel voor een bepaalde periode. Het is een leuke, niet-verplichte manier om veel impact te maken.
                        </CardDescription>
                    </div>
                    <Button size="icon" onClick={() => setAddGoodCauseModalOpen(true)}>
                        <Plus />
                    </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                   <div>
                        <h4 className="font-bold text-lg text-green-600">Actief Goed Doel</h4>
                        {activeCause ? (
                             <CauseItem cause={activeCause} colorClass="green" onEdit={openEditModal} />
                        ) : (
                            <p className="text-muted-foreground italic">Er is momenteel geen actief goed doel.</p>
                        )}
                   </div>
                   <div>
                        <h4 className="font-bold text-lg text-blue-600">Geplande Goede Doelen</h4>
                        {upcomingCauses && upcomingCauses.length > 0 ? (
                            <div className="space-y-2">
                                {upcomingCauses.map(cause => (
                                     <CauseItem key={cause.id} cause={cause} colorClass="blue" onEdit={openEditModal} />
                                ))}
                            </div>
                        ) : (
                            <p className="text-muted-foreground italic">Geen geplande goede doelen.</p>
                        )}
                   </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center"><BookOpen className="mr-2" /> Blog & Artikelen</CardTitle>
                        <CardDescription>Creëer inspirerende verhalen en tips voor gezinnen.</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" onClick={() => setBlogGeneratorOpen(true)}>
                            <Sparkles className="h-4 w-4" />
                        </Button>
                        <Button size="icon" onClick={() => openBlogModal()}>
                            <Plus />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-3">
                    {blogPosts && blogPosts.length > 0 ? (
                        blogPosts.map((post) => {
                            const displayDate = (post.publishedAt ?? post.createdAt).toDate();
                            return (
                                <div key={post.id} className="rounded-lg border bg-white/60 p-4 shadow-sm">
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                        <div>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="text-sm font-semibold text-slate-600">{format(displayDate, 'dd MMM yyyy', { locale: nl })}</span>
                                                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${post.status === 'published' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                                                    {post.status === 'published' ? 'Gepubliceerd' : 'Concept'}
                                                </span>
                                            </div>
                                            <h3 className="text-lg font-semibold text-slate-900">{post.title}</h3>
                                            <p className="text-sm text-muted-foreground">{post.excerpt}</p>
                                            <div className="mt-2 flex flex-wrap gap-2 text-xs text-primary">
                                                {post.tags.map((tag) => (
                                                    <span key={tag} className="rounded-full bg-primary/10 px-2 py-0.5">#{tag}</span>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 self-start">
                                            <Button variant="ghost" size="icon" onClick={() => openBlogModal(post)}>
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDeleteBlogPost(post)}>
                                                <Trash2 className="h-4 w-4 text-red-500" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <p className="text-sm text-muted-foreground">Nog geen blogposts aangemaakt.</p>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center"><MessageSquare className="mr-2" /> Reviews & Ervaringen</CardTitle>
                        <CardDescription>Leg verhalen van gezinnen vast om nieuwe gebruikers te inspireren.</CardDescription>
                    </div>
                    <Button size="icon" onClick={() => openReviewModal()}>
                        <Plus />
                    </Button>
                </CardHeader>
                <CardContent className="space-y-3">
                    {reviews && reviews.length > 0 ? (
                        reviews.map((review) => {
                            const displayDate = (review.publishedAt ?? review.createdAt).toDate();
                            return (
                                <div key={review.id} className="rounded-lg border bg-white/60 p-4 shadow-sm">
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                        <div>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="text-sm font-semibold text-slate-600">{format(displayDate, 'dd MMM yyyy', { locale: nl })}</span>
                                                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${review.status === 'published' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                                                    {review.status === 'published' ? 'Gepubliceerd' : 'Concept'}
                                                </span>
                                            </div>
                                            <h3 className="text-lg font-semibold text-slate-900">{review.title}</h3>
                                            <p className="text-sm text-muted-foreground">{review.excerpt}</p>
                                            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-amber-600">
                                                <span className="font-semibold">★ {review.rating.toFixed(1)}</span>
                                                <span className="text-slate-500">Door {review.author}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 self-start">
                                            <Button variant="ghost" size="icon" onClick={() => openReviewModal(review)}>
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDeleteReview(review)}>
                                                <Trash2 className="h-4 w-4 text-red-500" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <p className="text-sm text-muted-foreground">Nog geen reviews beschikbaar.</p>
                    )}
                </CardContent>
            </Card>
        </main>
      </ScrollArea>
      <AddGoodCauseModal isOpen={isAddGoodCauseModalOpen} setIsOpen={setAddGoodCauseModalOpen} />
      {editingCause && <EditGoodCauseModal isOpen={isEditGoodCauseModalOpen} setIsOpen={setEditGoodCauseModalOpen} cause={editingCause} />}
      <BlogPostModal isOpen={isBlogModalOpen} setIsOpen={handleBlogModalToggle} initial={editingBlogPost} />
      <ReviewModal isOpen={isReviewModalOpen} setIsOpen={handleReviewModalToggle} initial={editingReview} />
      <BlogGeneratorModal isOpen={isBlogGeneratorOpen} setIsOpen={setBlogGeneratorOpen} />
    </div>
  );
}
