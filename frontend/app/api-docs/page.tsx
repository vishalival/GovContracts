"use client";

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Sidebar from "../../components/Sidebar";
import TopNav from "../../components/TopNav";
import { fetchApiDocsMarkdown } from "../../lib/api";

export default function ApiDocsPage() {
  const [docs, setDocs] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDocs() {
      setLoading(true);
      setError(null);
      try {
        const markdown = await fetchApiDocsMarkdown();
        setDocs(markdown);
      } catch {
        setError("Failed to load API docs.");
      } finally {
        setLoading(false);
      }
    }
    void loadDocs();
  }, []);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopNav />
        <main className="p-6">
          <section className="rounded-lg border border-gray-200 bg-white p-5">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">API Documentation</h2>

            {loading ? <div className="h-48 animate-pulse rounded bg-gray-100" /> : null}
            {error ? <div className="rounded-md bg-red-100 p-3 text-sm text-red-800">{error}</div> : null}

            {!loading && !error ? (
              <article className="prose prose-sm max-w-none text-gray-800">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    table: (props) => (
                      <div className="overflow-x-auto">
                        <table className="min-w-full border-collapse border border-gray-300" {...props} />
                      </div>
                    ),
                    th: (props) => <th className="border border-gray-300 bg-gray-50 px-3 py-2 text-left" {...props} />,
                    td: (props) => <td className="border border-gray-300 px-3 py-2 align-top" {...props} />,
                    code: (props) => (
                      <code className="rounded bg-gray-100 px-1.5 py-0.5 text-[12px] text-gray-900" {...props} />
                    ),
                    pre: (props) => (
                      <pre className="overflow-x-auto rounded-md bg-gray-900 p-3 text-xs text-gray-100" {...props} />
                    ),
                    h1: (props) => <h1 className="mb-3 text-2xl font-semibold text-gray-900" {...props} />,
                    h2: (props) => <h2 className="mb-2 mt-6 text-xl font-semibold text-gray-900" {...props} />,
                    h3: (props) => <h3 className="mb-2 mt-4 text-lg font-semibold text-gray-900" {...props} />
                  }}
                >
                  {docs}
                </ReactMarkdown>
              </article>
            ) : null}
          </section>
        </main>
      </div>
    </div>
  );
}
