import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArticleService } from '../services/articleService';
import { ArticleInsert } from '../types';

export const useArticlesQuery = (page = 1, limit = 20) => {
  return useQuery({
    queryKey: ['articles', page, limit],
    queryFn: () => ArticleService.getArticles({ page, limit, sortBy: 'created_at', order: 'desc' }),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useArticleQuery = (id: string) => {
  return useQuery({
    queryKey: ['article', id],
    queryFn: () => ArticleService.getArticleById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreateArticleMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ articleData, collectionId }: { articleData: ArticleInsert; collectionId?: string }) => 
      ArticleService.createArticle(articleData, collectionId),
    onSuccess: () => {
      // Invalidate articles list to refetch
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      queryClient.invalidateQueries({ queryKey: ['collections'] });
    },
  });
};

export const useUpdateArticleMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) => 
      ArticleService.updateArticle(id, updates),
    onSuccess: (data, variables) => {
      // Update the specific article in cache
      queryClient.setQueryData(['article', variables.id], data);
      // Invalidate articles list
      queryClient.invalidateQueries({ queryKey: ['articles'] });
    },
  });
};

export const useDeleteArticleMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => ArticleService.deleteArticle(id),
    onSuccess: (_, id) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: ['article', id] });
      // Invalidate articles list
      queryClient.invalidateQueries({ queryKey: ['articles'] });
    },
  });
};