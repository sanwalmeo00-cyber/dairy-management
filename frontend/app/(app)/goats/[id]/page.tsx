'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { goatsService } from '@/services/goats';
import { kidsService } from '@/services/kids';
import { useAuth } from '@/context/AuthContext';
import {
  PageHeader,
  Card,
  Badge,
  statusTone,
  Button,
  ViewOnlyBanner,
  OwnerBadge,
  LoadingState,
  Skeleton,
} from '@/components/ui';
import { formatCurrency, formatDate, formatAgeMonths } from '@/lib/format';
import type { Goat, Kid } from '@/types/farm';
import { normalizeGoatStatus } from '@/lib/goatStatus';

export default function GoatDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { canModifyRecord, isOwnerOf } = useAuth();
  const [goat, setGoat] = useState<Goat | null>(null);
  const [goats, setGoats] = useState<Goat[]>([]);
  const [offspring, setOffspring] = useState<Kid[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setNotFound(false);

    void (async () => {
      try {
        const [g, herd, kids] = await Promise.all([
          goatsService.getById(id),
          goatsService.getAll(),
          kidsService.getAll(),
        ]);
        if (cancelled) return;
        if (!g) {
          setGoat(null);
          setNotFound(true);
          return;
        }
        setGoat(g);
        setGoats(herd);
        setOffspring(kids.filter((k) => k.motherId === id || k.fatherId === id));
      } catch {
        if (!cancelled) {
          setGoat(null);
          setNotFound(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div>
        <div className="mb-6 space-y-2">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-56" />
        </div>
        <LoadingState label="Loading animal details…" />
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (notFound || !goat) {
    return (
      <div>
        <PageHeader title="Animal" description="Record not found.">
          <Link href="/goats">
            <Button variant="outline">Back to list</Button>
          </Link>
        </PageHeader>
        <p className="text-sm text-muted-fg">This animal could not be loaded.</p>
      </div>
    );
  }

  const canEdit = canModifyRecord(goat.ownerId);
  const parentTag = (parentId?: string) => {
    if (!parentId) return '—';
    return goats.find((g) => g.id === parentId)?.tagNumber ?? parentId;
  };

  return (
    <div>
      <PageHeader title={goat.tagNumber} description={goat.breed}>
        {canEdit && normalizeGoatStatus(goat.status) === 'Pregnant' && goat.gender === 'Female' && (
          <Link href={`/kids/new?motherId=${goat.id}`}>
            <Button>Record Birth</Button>
          </Link>
        )}
        {canEdit && (
          <Link href={`/goats/${goat.id}/edit`}>
            <Button variant={normalizeGoatStatus(goat.status) === 'Pregnant' ? 'outline' : 'primary'}>
              Edit
            </Button>
          </Link>
        )}
        <Link href="/goats">
          <Button variant="outline">Back to list</Button>
        </Link>
      </PageHeader>

      {!canEdit && <ViewOnlyBanner ownerName={goat.ownerName} />}

      <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
        <span className="text-muted-fg">Added by</span>
        <OwnerBadge name={goat.ownerName} isOwn={isOwnerOf(goat.ownerId)} />
      </div>

      {goat.imageUrl && (
        <Card className="mb-4 overflow-hidden p-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={goat.imageUrl}
            alt={goat.tagNumber}
            className="max-h-80 w-full object-cover"
          />
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="mb-3 font-semibold">Identity</h2>
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-fg">Gender</dt>
              <dd>{goat.gender}</dd>
            </div>
            <div>
              <dt className="text-muted-fg">Color</dt>
              <dd>{goat.color}</dd>
            </div>
            <div>
              <dt className="text-muted-fg">Age</dt>
              <dd>{formatAgeMonths(goat.dateOfBirth)}</dd>
            </div>
            <div>
              <dt className="text-muted-fg">Weight</dt>
              <dd>{goat.weight} kg</dd>
            </div>
            <div>
              <dt className="text-muted-fg">Father</dt>
              <dd>{parentTag(goat.fatherId)}</dd>
            </div>
            <div>
              <dt className="text-muted-fg">Mother</dt>
              <dd>{parentTag(goat.motherId)}</dd>
            </div>
          </dl>
        </Card>
        <Card>
          <h2 className="mb-3 font-semibold">Health & Status</h2>
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-fg">Animal Status</dt>
              <dd>
                <Badge tone={statusTone(goat.status === 'Active' ? 'Healthy' : goat.status)}>
                  {goat.status === 'Active' ? 'Healthy' : goat.status}
                </Badge>
              </dd>
            </div>
            <div>
              <dt className="text-muted-fg">Vaccination</dt>
              <dd>
                <Badge tone={statusTone(goat.vaccinationStatus)}>{goat.vaccinationStatus}</Badge>
              </dd>
            </div>
          </dl>
        </Card>
        <Card>
          <h2 className="mb-3 font-semibold">Financial</h2>
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-fg">Purchase Date</dt>
              <dd>{goat.purchaseDate ? formatDate(goat.purchaseDate) : '—'}</dd>
            </div>
            <div>
              <dt className="text-muted-fg">Purchase Price</dt>
              <dd>{goat.purchasePrice != null ? formatCurrency(goat.purchasePrice) : '—'}</dd>
            </div>
            <div>
              <dt className="text-muted-fg">Current Value</dt>
              <dd className="font-medium">{formatCurrency(goat.currentValue)}</dd>
            </div>
          </dl>
        </Card>
        {goat.notes && (
          <Card>
            <h2 className="mb-3 font-semibold">Notes</h2>
            <p className="text-sm text-muted-fg">{goat.notes}</p>
          </Card>
        )}
        <Card className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="font-semibold">Offspring</h2>
            {canEdit && goat.gender === 'Female' && (
              <Link href={`/kids/new?motherId=${goat.id}`}>
                <Button size="sm" variant="outline">
                  Record Birth
                </Button>
              </Link>
            )}
          </div>
          {offspring.length === 0 ? (
            <p className="text-sm text-muted-fg">No kids recorded for this animal yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {offspring.map((k) => (
                <li
                  key={k.id}
                  className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{k.tagNumber}</span>
                    <Badge tone="neutral">{k.gender}</Badge>
                    <span className="text-muted-fg">{formatDate(k.dateOfBirth)}</span>
                    <Badge tone={statusTone(k.status === 'Active' ? 'Healthy' : k.status)}>
                      {k.status === 'Active' ? 'Healthy' : k.status}
                    </Badge>
                  </div>
                  <div className="flex gap-1">
                    <Link href={`/kids/${k.id}`}>
                      <Button size="sm" variant="ghost">
                        Kid
                      </Button>
                    </Link>
                    {k.goatId && (
                      <Link href={`/goats/${k.goatId}`}>
                        <Button size="sm" variant="outline">
                          Animal
                        </Button>
                      </Link>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
