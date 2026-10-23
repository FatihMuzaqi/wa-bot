import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { aiChatbotService } from '../services/aiChatbot.service';

export const useKnowledgeSources = () => useQuery({
  queryKey: ['ai', 'knowledge-sources'],
  queryFn: aiChatbotService.knowledgeSources,
});

export const usePrompts = () => useQuery({
  queryKey: ['ai', 'prompts'],
  queryFn: aiChatbotService.prompts,
});

export const useGenerateAnswer = () => useMutation({
  mutationFn: aiChatbotService.generate,
});

export const useAddFaq = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: aiChatbotService.addFaq,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ai', 'knowledge-sources'] }),
  });
};

export const useCreateKnowledgeSource = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: aiChatbotService.createKnowledgeSource,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ai', 'knowledge-sources'] }),
  });
};

export const useDeleteKnowledgeSource = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: aiChatbotService.deleteKnowledgeSource,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ai', 'knowledge-sources'] }),
  });
};
