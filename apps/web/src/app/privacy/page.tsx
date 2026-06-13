export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background py-20 px-4">
      <div className="max-w-3xl mx-auto prose prose-invert">
        <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
        <p className="text-muted-foreground mb-8">Last updated: June 2026</p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
          <p>
            Welcome to LedgerLens AI ("we," "our," or "us"). We are committed to protecting your personal information and your right to privacy.
            This Privacy Policy explains how we collect, use, and share your information when you use our web application.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-[#FF541B]">2. Artificial Intelligence Data Processing</h2>
          <p>
            LedgerLens AI relies on advanced artificial intelligence to extract and categorize financial data from the bank statements you upload.
            <strong> By uploading your documents, you explicitly consent to this processing.</strong>
          </p>
          <ul className="list-disc pl-6 mt-4 space-y-2">
            <li><strong>Third-Party Processors:</strong> We use Enterprise APIs provided by third parties (specifically Google Gemini) to process the raw text of your documents.</li>
            <li><strong>Zero Training Policy:</strong> We strictly use Enterprise API endpoints. According to our providers' Terms of Service, the data sent through these APIs is <strong>never</strong> used to train their consumer or enterprise AI models.</li>
            <li><strong>Ephemeral Processing:</strong> Data sent to the AI API is processed in memory to generate structured JSON and is then immediately discarded by the provider. It is not permanently stored on their servers.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">3. Information We Collect</h2>
          <p>
            We collect personal information that you voluntarily provide to us when you register on the App, including your name, email address, and uploaded financial documents.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">4. Security</h2>
          <p>
            We implement industry-standard security measures to protect your data. However, please be aware that no method of transmission over the internet or electronic storage is 100% secure.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">5. Contact Us</h2>
          <p>
            If you have questions or comments about this notice, you may email us at privacy@ledgerlens.ai.
          </p>
        </section>
      </div>
    </div>
  );
}
