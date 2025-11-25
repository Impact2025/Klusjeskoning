"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, Clock, Euro, User, MessageSquare, Eye, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAppContext } from '@/components/app/AppProvider';

interface ExternalChoreRequest {
  id: string;
  childId: string;
  childName: string;
  childAvatar: string;
  contactId: string | null;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  contactStatus: string | null;
  title: string;
  description: string | null;
  offeredAmountCents: number;
  currency: string;
  paymentMode: string;
  status: string;
  createdBy: string;
  evidenceUrl: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export function ParentApprovalInterface() {
  const { toast } = useToast();
  const [requests, setRequests] = useState<ExternalChoreRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<ExternalChoreRequest | null>(null);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);

  // Approval form state
  const [approvedAmount, setApprovedAmount] = useState('');
  const [approvalNotes, setApprovalNotes] = useState('');

  // Rejection form state
  const [rejectionNotes, setRejectionNotes] = useState('');

  // Complete form state
  const [evidenceUrl, setEvidenceUrl] = useState('');

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const response = await fetch('/api/external-chore-requests');
      if (response.ok) {
        const data = await response.json();
        setRequests(data.requests || []);
      } else {
        toast({
          variant: 'destructive',
          title: 'Fout',
          description: 'Kon verzoeken niet laden.',
        });
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast({
        variant: 'destructive',
        title: 'Fout',
        description: 'Er ging iets mis bij het laden.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedRequest) return;

    const approvedAmountCents = approvedAmount ? Math.round(parseFloat(approvedAmount) * 100) : selectedRequest.offeredAmountCents;

    try {
      const response = await fetch(`/api/external-chore-requests/${selectedRequest.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          approvedAmountCents,
          notes: approvalNotes,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Goedgekeurd!',
          description: data.message,
        });
        setShowApprovalDialog(false);
        fetchRequests();
      } else {
        toast({
          variant: 'destructive',
          title: 'Fout',
          description: data.error || 'Kon verzoek niet goedkeuren.',
        });
      }
    } catch (error) {
      console.error('Error approving request:', error);
      toast({
        variant: 'destructive',
        title: 'Fout',
        description: 'Er ging iets mis.',
      });
    }
  };

  const handleReject = async () => {
    if (!selectedRequest) return;

    try {
      const response = await fetch(`/api/external-chore-requests/${selectedRequest.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notes: rejectionNotes,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Afgewezen',
          description: data.message,
        });
        setShowRejectDialog(false);
        fetchRequests();
      } else {
        toast({
          variant: 'destructive',
          title: 'Fout',
          description: data.error || 'Kon verzoek niet afwijzen.',
        });
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast({
        variant: 'destructive',
        title: 'Fout',
        description: 'Er ging iets mis.',
      });
    }
  };

  const handleComplete = async () => {
    if (!selectedRequest) return;

    try {
      const response = await fetch(`/api/external-chore-requests/${selectedRequest.id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          evidenceUrl,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Voltooid!',
          description: data.message,
        });
        setShowCompleteDialog(false);
        fetchRequests();
      } else {
        toast({
          variant: 'destructive',
          title: 'Fout',
          description: data.error || 'Kon klusje niet voltooien.',
        });
      }
    } catch (error) {
      console.error('Error completing request:', error);
      toast({
        variant: 'destructive',
        title: 'Fout',
        description: 'Er ging iets mis.',
      });
    }
  };

  const handleConfirmPayment = async (request: ExternalChoreRequest) => {
    try {
      const response = await fetch(`/api/external-chore-requests/${request.id}/payment/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notes: 'Betaling bevestigd via PowerKlusjes',
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Betaling bevestigd!',
          description: data.message,
        });
        fetchRequests();
      } else {
        toast({
          variant: 'destructive',
          title: 'Fout',
          description: data.error || 'Kon betaling niet bevestigen.',
        });
      }
    } catch (error) {
      console.error('Error confirming payment:', error);
      toast({
        variant: 'destructive',
        title: 'Fout',
        description: 'Er ging iets mis.',
      });
    }
  };

  const openApprovalDialog = (request: ExternalChoreRequest) => {
    setSelectedRequest(request);
    setApprovedAmount((request.offeredAmountCents / 100).toFixed(2));
    setApprovalNotes('');
    setShowApprovalDialog(true);
  };

  const openRejectDialog = (request: ExternalChoreRequest) => {
    setSelectedRequest(request);
    setRejectionNotes('');
    setShowRejectDialog(true);
  };

  const openCompleteDialog = (request: ExternalChoreRequest) => {
    setSelectedRequest(request);
    setEvidenceUrl('');
    setShowCompleteDialog(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'awaiting_parent':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Wacht op goedkeuring</Badge>;
      case 'approved':
        return <Badge variant="default"><CheckCircle className="h-3 w-3 mr-1" />Goedgekeurd</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Afgewezen</Badge>;
      case 'completed':
        return <Badge variant="outline"><CheckCircle className="h-3 w-3 mr-1" />Voltooid</Badge>;
      case 'paid':
        return <Badge variant="default" className="bg-green-600"><Euro className="h-3 w-3 mr-1" />Betaald</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const pendingRequests = requests.filter(r => r.status === 'awaiting_parent');
  const activeRequests = requests.filter(r => ['approved', 'completed'].includes(r.status));

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">PowerKlusjes verzoeken laden...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            PowerKlusjes - Ouder Goedkeuring
          </CardTitle>
          <CardDescription>
            Beheer verzoeken van externe contacten voor klusjes van je kinderen.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Wachtende verzoeken ({pendingRequests.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingRequests.map((request) => (
                <div key={request.id} className="border rounded-lg p-4 bg-yellow-50 border-yellow-200">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-lg">{request.childAvatar || '👶'}</span>
                      </div>
                      <div>
                        <h4 className="font-medium">{request.title}</h4>
                        <p className="text-sm text-gray-600">
                          Voor {request.childName} • €{(request.offeredAmountCents / 100).toFixed(2)}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(request.status)}
                  </div>

                  {request.description && (
                    <p className="text-sm text-gray-700 mb-3">{request.description}</p>
                  )}

                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                    {request.contactName && (
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {request.contactName}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Euro className="h-3 w-3" />
                      €{(request.offeredAmountCents / 100).toFixed(2)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(request.createdAt).toLocaleDateString('nl-NL')}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => openApprovalDialog(request)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Goedkeuren
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openRejectDialog(request)}
                      className="border-red-300 text-red-600 hover:bg-red-50"
                    >
                      <XCircle className="h-3 w-3 mr-1" />
                      Afwijzen
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Requests */}
      {activeRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Actieve klusjes ({activeRequests.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activeRequests.map((request) => (
                <div key={request.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-lg">{request.childAvatar || '👶'}</span>
                      </div>
                      <div>
                        <h4 className="font-medium">{request.title}</h4>
                        <p className="text-sm text-gray-600">
                          Voor {request.childName} • €{(request.offeredAmountCents / 100).toFixed(2)}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(request.status)}
                  </div>

                  {request.evidenceUrl && (
                    <div className="mb-3">
                      <img
                        src={request.evidenceUrl}
                        alt="Bewijs foto"
                        className="w-32 h-32 object-cover rounded-lg border"
                      />
                    </div>
                  )}

                  <div className="flex gap-2">
                    {request.status === 'approved' && (
                      <Button
                        size="sm"
                        onClick={() => openCompleteDialog(request)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Markeren als klaar
                      </Button>
                    )}
                    {request.status === 'completed' && (
                      <Button
                        size="sm"
                        onClick={() => handleConfirmPayment(request)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Euro className="h-3 w-3 mr-1" />
                        Betaling bevestigen
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Approval Dialog */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Klusje goedkeuren</DialogTitle>
            <DialogDescription>
              Controleer de details en keur het klusje goed voor {selectedRequest?.childName}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="approvedAmount">Goedgekeurd bedrag (€)</Label>
              <Input
                id="approvedAmount"
                type="number"
                step="0.01"
                value={approvedAmount}
                onChange={(e) => setApprovedAmount(e.target.value)}
                placeholder={(selectedRequest?.offeredAmountCents ? (selectedRequest.offeredAmountCents / 100).toFixed(2) : '')}
              />
              <p className="text-xs text-gray-500">
                Origineel aangeboden: €{(selectedRequest?.offeredAmountCents ? (selectedRequest.offeredAmountCents / 100).toFixed(2) : '0.00')}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="approvalNotes">Notities (optioneel)</Label>
              <Textarea
                id="approvalNotes"
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                placeholder="Bijv. 'Goed idee, maar let op de veiligheid...'"
                rows={3}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={handleApprove} className="flex-1">
                <CheckCircle className="h-4 w-4 mr-2" />
                Goedkeuren
              </Button>
              <Button variant="outline" onClick={() => setShowApprovalDialog(false)} className="flex-1">
                Annuleren
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Klusje afwijzen</DialogTitle>
            <DialogDescription>
              Geef een reden waarom je dit klusje niet wilt goedkeuren.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rejectionNotes">Reden voor afwijzing</Label>
              <Textarea
                id="rejectionNotes"
                value={rejectionNotes}
                onChange={(e) => setRejectionNotes(e.target.value)}
                placeholder="Bijv. 'Dit klusje is te gevaarlijk voor de leeftijd van je kind...'"
                rows={3}
                required
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={handleReject} variant="destructive" className="flex-1">
                <XCircle className="h-4 w-4 mr-2" />
                Afwijzen
              </Button>
              <Button variant="outline" onClick={() => setShowRejectDialog(false)} className="flex-1">
                Annuleren
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Complete Dialog */}
      <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Klusje als voltooid markeren</DialogTitle>
            <DialogDescription>
              Upload een foto of video als bewijs dat het klusje is gedaan.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="evidenceUrl">Bewijs URL (foto/video)</Label>
              <Input
                id="evidenceUrl"
                type="url"
                value={evidenceUrl}
                onChange={(e) => setEvidenceUrl(e.target.value)}
                placeholder="https://example.com/foto.jpg"
                required
              />
              <p className="text-xs text-gray-500">
                Upload eerst de foto/video naar een cloud service en plak hier de link.
              </p>
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={handleComplete} className="flex-1">
                <CheckCircle className="h-4 w-4 mr-2" />
                Als voltooid markeren
              </Button>
              <Button variant="outline" onClick={() => setShowCompleteDialog(false)} className="flex-1">
                Annuleren
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}