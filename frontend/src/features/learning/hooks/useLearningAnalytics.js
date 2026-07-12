import { useQuery } from "@tanstack/react-query";
import { learningAnalyticsApi } from "../api/learningAnalytics.api";

export const analyticsKeys = {
  all: ["analytics"],
  mine: () => [...analyticsKeys.all, "mine"],
  facultyOverview: () => [...analyticsKeys.all, "facultyOverview"],
  subject: (subjectId) => [...analyticsKeys.all, "subject", subjectId],
};

export const useMyLearningStats = () =>
  useQuery({
    queryKey: analyticsKeys.mine(),
    queryFn: () => learningAnalyticsApi.getMyStats(),
  });

export const useFacultyOverview = () =>
  useQuery({
    queryKey: analyticsKeys.facultyOverview(),
    queryFn: () => learningAnalyticsApi.getFacultyOverview(),
  });

export const useSubjectAnalytics = (subjectId) =>
  useQuery({
    queryKey: analyticsKeys.subject(subjectId),
    queryFn: () => learningAnalyticsApi.getSubjectAnalytics(subjectId),
    enabled: !!subjectId,
  });
