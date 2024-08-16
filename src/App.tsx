import React from 'react';
import { InstallPWAButton } from './install-button';
import { useMutation } from '@tanstack/react-query';
import { Survey, surveyKeys } from './lib/types';
import { useSurveys } from './lib/api/hooks/useSurveys';
import { supabase } from './lib/supabase';

const Image = ({ image }: { image: string }) => {
  const src = !image.startsWith('blob')
    ? supabase.storage.from('files').getPublicUrl(image).data.publicUrl
    : image;

  return (
    <div className="w-[500px] p-4 aspect-square object-contain">
      <img src={src} alt="Survey" />
    </div>
  );
};

function App() {
  const { data: surveys } = useSurveys();

  const { mutate: createSurvey, isPaused } = useMutation<
    Survey,
    Error,
    FormData
  >({
    mutationKey: surveyKeys.add(),
  });

  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [loc, setLoc] = React.useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    try {
      setIsLoading(true);
      createSurvey(formData);
    } catch (e) {
      console.error(e);
      // @ts-expect-error meh
      setError(e?.message);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLoc(`${position.coords.latitude}, ${position.coords.longitude}`);
      },
      (positionError) => {
        setLoc(positionError.message);
      }
    );
  }, []);

  return (
    <div className="flex items-center flex-col gap-2">
      <h1 className="text-xl">Retail Tasker Client</h1>
      {error && <p className="text-red-500">{error}</p>}
      <InstallPWAButton />
      {isPaused && (
        <p className="text-red-500">
          You are offline! Data will be sent when online
        </p>
      )}
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-2 border border-stone-300 rounded-md p-3"
      >
        <label className="flex flex-col">
          <span>Name</span>
          <input name="name" type="text" className="ring ring-blue-100" />
        </label>
        <label className="flex flex-col">
          <span>Answer</span>
          <input name="answer" type="text" className="ring ring-blue-100" />
        </label>
        <label className="flex flex-col">
          Image
          <input name="image" type="file" />
        </label>
        <button
          disabled={isLoading}
          className="border border-stone-700 w-full rounded text-xl bg-blue-600 text-stone-100 py-4"
          type="submit"
        >
          {isLoading ? 'Loading...' : 'Submit'}
        </button>
      </form>
      <div>
        <h2 className="text-2xl underline">Location</h2>
        <p>{loc}</p>
      </div>
      <div>
        <h2 className="text-2xl underline">Answers</h2>
        <ul>
          {surveys?.length === 0 && <p>No answers yet</p>}
          {surveys?.map((survey) => (
            <li key={survey.id}>
              {/* <p>{survey.image.size}</p>
              <p>{survey.image.type}</p>
              <pre className="w-60 overflow-scroll">
                {JSON.stringify({ ...survey }, null, 2)}
              </pre> */}
              <p>{survey.name}</p>
              <p>{survey.answer}</p>

              {survey.image && <Image image={survey.image} />}
              {/* <div className="w-full p-4 aspect-square object-contain">
                <img src={survey.imageUrl} alt="Survey" />
              </div>
              <div className="w-full p-4 aspect-square object-contain">
                <img src={URL.createObjectURL(survey.image)} alt="Survey" />
              </div> */}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default App;
