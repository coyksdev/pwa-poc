import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { supabase } from './lib/supabase.ts';
import { Survey, surveyKeys } from './lib/types.ts';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { v4 as uuidv4 } from 'uuid';

const persister = createAsyncStoragePersister({
  storage: window.localStorage,
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      networkMode: 'offlineFirst',
      gcTime: Infinity,
    },
  },
});

queryClient.setMutationDefaults(surveyKeys.add(), {
  mutationFn: async (formData: FormData) => {
    return await supabase.functions
      .invoke('create-survey', {
        body: formData,
      })
      .then((res) => res.data);
  },
  onMutate: async (formData: FormData) => {
    await queryClient.cancelQueries({ queryKey: surveyKeys.all() });

    const id = uuidv4();

    formData.append('id', id);

    queryClient.setQueryData<Survey[]>(surveyKeys.all(), (old) => {
      const newSurvey: Survey = {
        id: id,
        name: formData.get('name') as string,
        answer: formData.get('answer') as string,
        image: URL.createObjectURL(formData.get('image') as File),
      };
      return old ? [...old, newSurvey] : [newSurvey];
    });

    return { survey: formData };
  },
  onSuccess: (result, _, context) => {
    const survey = context?.survey as FormData;
    const id = survey.get('id') as string;
    queryClient.setQueryData<Survey[] | undefined>(
      surveyKeys.all(),
      (old) =>
        old?.map((survey) => (survey.id === id ? result : survey)) as
          | Survey[]
          | undefined
    );
  },
  onError: (_, ___, context) => {
    const survey = context?.survey as FormData;
    const id = survey.get('id') as string;
    queryClient.setQueryData<Survey[] | undefined>(surveyKeys.all(), (old) =>
      old?.filter((survey) => survey.id !== id)
    );
  },
  retry: 3,
});

const _Root = () => {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister }}
    >
      <App />
      <ReactQueryDevtools />
    </PersistQueryClientProvider>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <_Root />
  </React.StrictMode>
);
