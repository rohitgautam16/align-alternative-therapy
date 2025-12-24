// src/pages/FAQPage.jsx  (or app/faq/page.jsx in Next.js)
import { useState } from "react";
import FAQsSection from "../components/about/FAQsSection"; 


const FAQPage = () => {


  return (
    <main className="min-h-screen">
        <FAQsSection />
    </main>
  );
};

export default FAQPage;
