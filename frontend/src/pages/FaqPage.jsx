import FAQsSection from "../components/about/FAQsSection"; 
import useDocumentMeta from "../hooks/useDocumentMeta";


const FAQPage = () => {
  useDocumentMeta({
    title: 'Member FAQ',
    description:
      'Find answers about Align Alternative Therapy, sound healing audios, listening frequency, headphones, safety, and personalized plans.',
    path: '/dashboard/faqs',
    robots: 'noindex,nofollow',
  });


  return (
    <main className="min-h-screen">
        <FAQsSection />
    </main>
  );
};

export default FAQPage;
