"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { MarketplaceListing, MarketplaceListingEnriched, SpecialistProfile, CaseMatch, Bid, BidCreate } from "@/lib/types";

export function useMarketplaceListings() {
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchListings = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.get<MarketplaceListing[]>("/marketplace/listings");
      setListings(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch listings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  return { listings, loading, error, fetchListings };
}

export function useMyListings() {
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchListings = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.get<MarketplaceListing[]>("/marketplace/my-listings");
      setListings(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch listings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  const publishCase = async (caseId: number) => {
    const listing = await api.post<MarketplaceListing>(
      `/marketplace/cases/${caseId}/publish`,
      {}
    );
    setListings((prev) => [listing, ...prev]);
    return listing;
  };

  const closeListing = async (listingId: number) => {
    await api.delete(`/marketplace/listings/${listingId}`);
    setListings((prev) => prev.filter((l) => l.id !== listingId));
  };

  return { listings, loading, error, fetchListings, publishCase, closeListing };
}

export function useMyMatches() {
  const [matches, setMatches] = useState<CaseMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMatches = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.get<CaseMatch[]>("/marketplace/my-matches");
      setMatches(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch matches");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  return { matches, loading, error, fetchMatches };
}

export function useMyBids() {
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBids = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.get<Bid[]>("/marketplace/my-bids");
      setBids(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch bids");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBids();
  }, [fetchBids]);

  return { bids, loading, error, fetchBids };
}

export function useMyListingsEnriched() {
  const [listings, setListings] = useState<MarketplaceListingEnriched[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchListings = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.get<MarketplaceListingEnriched[]>("/marketplace/my-listings-enriched");
      setListings(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch listings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  return { listings, loading, error, fetchListings };
}

export function useLawyerProfiles() {
  const [profiles, setProfiles] = useState<SpecialistProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfiles = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.get<SpecialistProfile[]>("/specialists/");
      setProfiles(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch profiles");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  return { profiles, loading, error, fetchProfiles };
}

export function useListingDetail(listingId: number) {
  const [listing, setListing] = useState<MarketplaceListing | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchListing = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.get<MarketplaceListing>(
        `/marketplace/listings/${listingId}`
      );
      setListing(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch listing");
    } finally {
      setLoading(false);
    }
  }, [listingId]);

  const fetchBids = useCallback(async () => {
    try {
      const data = await api.get<Bid[]>(
        `/marketplace/listings/${listingId}/bids`
      );
      setBids(data);
    } catch {
      // Specialist may not have access to bids
    }
  }, [listingId]);

  useEffect(() => {
    fetchListing();
    fetchBids();
  }, [fetchListing, fetchBids]);

  const submitBid = async (data: BidCreate) => {
    const bid = await api.post<Bid>(
      `/marketplace/listings/${listingId}/bids`,
      data
    );
    setBids((prev) => [bid, ...prev]);
    return bid;
  };

  const acceptBid = async (bidId: number) => {
    const bid = await api.put<Bid>(`/marketplace/bids/${bidId}/accept`, {});
    setBids((prev) => prev.map((b) => (b.id === bid.id ? bid : { ...b, status: b.status === "pending" ? "rejected" : b.status })));
    if (listing) {
      setListing({ ...listing, status: "accepted" });
    }
    return bid;
  };

  const withdrawBid = async (bidId: number) => {
    const bid = await api.put<Bid>(`/marketplace/bids/${bidId}/withdraw`, {});
    setBids((prev) => prev.map((b) => (b.id === bid.id ? bid : b)));
    return bid;
  };

  return { listing, bids, loading, error, fetchListing, fetchBids, submitBid, acceptBid, withdrawBid };
}
