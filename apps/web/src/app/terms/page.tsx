export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-background py-20 px-4">
      <div className="max-w-3xl mx-auto prose prose-invert">
        <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
        <p className="text-muted-foreground mb-8">Last updated: June 2026</p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">1. Agreement to Terms</h2>
          <p>
            By viewing or using LedgerLens AI, you agree to be bound by these Terms of Service. If you do not agree with any of these terms, you are prohibited from using or accessing this site.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">2. Use License</h2>
          <p>
            Permission is granted to temporarily download one copy of the materials (information or software) on LedgerLens AI for personal, non-commercial transitory viewing only.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">3. Data Accuracy Disclaimer</h2>
          <p>
            LedgerLens AI relies on artificial intelligence to extract data from PDFs. While we strive for accuracy, we do not warrant that the extracted financial data is 100% accurate, complete, or current. <strong>For 100% guaranteed accuracy, users should utilize the direct CSV or Excel upload functionality.</strong> You are solely responsible for verifying the accuracy of all extracted transactions before using them for accounting, tax, or legal purposes.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">4. Limitations</h2>
          <p>
            In no event shall LedgerLens AI or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on the website.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">5. Governing Law</h2>
          <p>
            These terms and conditions are governed by and construed in accordance with standard international law, and you irrevocably submit to the exclusive jurisdiction of the courts in that State or location.
          </p>
        </section>
      </div>
    </div>
  );
}
