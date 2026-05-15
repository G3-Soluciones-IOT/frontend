import { useEffect, useMemo, useState } from "react";
import type { ListConsultationRequestsInput } from "../../application/dto/ListConsultationRequestsInput";
import { getConsultationRequestsUseCase } from "../../application/use-cases/getConsultationRequestsUseCase";
import { updateConsultationRequestStatusUseCase } from "../../application/use-cases/updateConsultationRequestStatusUseCase";
import type { ConsultationRequest, ConsultationRequestStatus } from "../../domain/models/ConsultationRequest";
import { mockConsultationRequests } from "../../infrastructure/mock/consultationRequests.mock";
import { HttpConsultationRequestRepository } from "../../infrastructure/repositories/HttpConsultationRequestRepository";

const repository = new HttpConsultationRequestRepository();
const getConsultationRequests = getConsultationRequestsUseCase(repository);
const updateConsultationRequestStatus = updateConsultationRequestStatusUseCase(repository);

function filterMockRequests(input?: ListConsultationRequestsInput) {
  if (!input?.status) return mockConsultationRequests;
  return mockConsultationRequests.filter((request) => request.status === input.status);
}

export function useConsultationRequests(input?: ListConsultationRequestsInput) {
  const [requests, setRequests] = useState<ConsultationRequest[]>(() => filterMockRequests(input));
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const status = input?.status;

  useEffect(() => {
    let mounted = true;

    const loadRequests = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getConsultationRequests(input);
        if (mounted) setRequests(data);
      } catch {
        if (mounted) {
          setRequests(filterMockRequests(input));
          setError("Failed to load consultation requests. Using mock data.");
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    loadRequests();

    return () => {
      mounted = false;
    };
  }, [status]);

  const totals = useMemo(() => {
    return {
      all: mockConsultationRequests.length,
      pending: mockConsultationRequests.filter((request) => request.status === "PENDING").length,
      confirmed: mockConsultationRequests.filter((request) => request.status === "CONFIRMED").length,
    };
  }, []);

  const approve = async (id: string) => {
    const nextStatus: ConsultationRequestStatus = "CONFIRMED";
    setRequests((current) => {
      const nextRequests = current.map((request) => (request.id === id ? { ...request, status: nextStatus } : request));
      return status === "PENDING" ? nextRequests.filter((request) => request.id !== id) : nextRequests;
    });

    try {
      await updateConsultationRequestStatus(id, nextStatus);
    } catch {
      setError("Failed to update consultation request. Showing local change.");
    }
  };

  return { requests, isLoading, error, totals, approve };
}
