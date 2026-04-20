import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Script from "next/script";
import React from "react";
import fs from "fs";
import path from "path";
import Link from "next/link";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const article = await prisma.article.findUnique({
    where: { id },
    select: { title: true },
  });
  return {
    title: `${article?.title || "Article Preview"} | C5K Full View`,
  };
}

export default async function FullArticleHtmlPage({ params }: Props) {
  const { id } = await params;

  // 1. Fetch metadata from Prisma
  const article = await prisma.article.findUnique({
    where: { id },
    include: {
      journal: true,
      author: true,
      coAuthors: { orderBy: { order: "asc" } },
    },
  });

  if (!article) return notFound();

  // 2. Locate and read the pre-converted HTML content
  const contentPath = path.join(process.cwd(), "data", "article-content", `${id}.html`);
  let articleHtml = "";
  
  if (fs.existsSync(contentPath)) {
    articleHtml = fs.readFileSync(contentPath, "utf-8");
  } else {
    // Fallback: If no HTML file exists, show abstract at least
    articleHtml = `<div class="bg-amber-50 p-6 border border-amber-200 rounded text-amber-800">
      <p>Full-text HTML view is being prepared for this article. Please check back later or view the PDF version.</p>
    </div>
    <div class="mt-8">
      <h3>Abstract</h3>
      <p>${article.abstract || "No abstract available."}</p>
    </div>`;
  }

  // REFINEMENT: Remove leading Logo/Cover images from the body content
  // Mammoth often converts the header images found at the top of the Word doc.
  // We remove the first 2 images if they are in the first 2k characters.
  for (let i = 0; i < 2; i++) {
    const imgMatch = articleHtml.match(/<img [^>]+>/);
    if (imgMatch && imgMatch.index !== undefined && imgMatch.index < 2000) {
      articleHtml = articleHtml.slice(0, imgMatch.index) + articleHtml.slice(imgMatch.index + imgMatch[0].length);
    }
  }

  // Aggregate authors
  const allAuthors = [
    {
      id: article.author.id,
      name: article.author.name || "Unknown",
      affiliation: article.author.affiliation || article.author.university || null,
      email: article.author.email,
      isMain: true,
    },
    ...article.coAuthors.map((ca) => ({
      id: ca.userId || null,
      name: ca.name,
      affiliation: ca.university || null,
      email: ca.email || null,
      isMain: ca.isMain,
    })),
  ];

  const pubDate = article.publicationDate
    ? new Date(article.publicationDate).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })
    : null;
    
  const subDate = article.submissionDate
    ? new Date(article.submissionDate).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })
    : null;
    
  const accDate = article.acceptanceDate
    ? new Date(article.acceptanceDate).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })
    : null;

  const doiFull = article.doi || null;
  
  // Journal images from public or fallback
  const logoUrl = "/logo.png"; // Fallback to main platform logo
  const journalName = article.journal.fullName;
  const journalCover = article.journal.coverImageUrl ? 
    (article.journal.coverImageUrl.startsWith('http') ? article.journal.coverImageUrl : `https://c5k.com/public/backend/journal/${article.journal.coverImageUrl}`) 
    : "/placeholder-cover.jpg";

  // CSS for the IEEE template (synchronized with sample page)
  const css = `
@import url('https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;0,700;1,400&family=Merriweather:ital,wght@0,300;0,400;0,700;1,300;1,400&display=swap');

/* GLOBAL */
.academic-page { font-family: 'EB Garamond','Times New Roman',serif; font-size: 11pt; line-height: 1.5; color: #111; background: #e8e8e8; }
.page-wrapper { max-width: 900px; margin: 28px auto; background: #fff; box-shadow: 0 4px 32px rgba(0,0,0,0.18); min-height: 100vh; }

/* ===== DARK HEADER BAR (exactly like the doc) ===== */
.doc-header-bar {
  background-color: #1a1a1a;
  display: flex;
  align-items: stretch;
  gap: 0;
  padding: 16px 14px;
  min-height: 100px;
}
.doc-header-logo {
  display: flex;
  align-items: center;
  flex: 0 0 auto;
  padding-right: 12px;
}
.doc-header-logo img {
  height: 68px;
  width: auto;
  object-fit: contain;
  filter: brightness(1);
}
.doc-header-center {
  flex: 1 1 auto;
  background-color: #f5f0dc;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 10px 20px;
  text-align: center;
  border: 1px solid #dcd9c6;
  margin: 0 4px;
}
.doc-header-center .jname {
  font-family: 'EB Garamond','Times New Roman',serif;
  font-size: 14.5pt;
  font-weight: 700;
  color: #1155cc;
  line-height: 1.25;
  margin-bottom: 3px;
}
.doc-header-center .jvol {
  font-size: 9pt;
  font-style: italic;
  color: #444;
  margin-bottom: 2px;
}
.doc-header-center .jsite {
  font-size: 9pt;
  color: #444;
}
.doc-header-center .jsite a { color: #444; text-decoration: none; }
.doc-header-cover {
  display: flex;
  align-items: center;
  flex: 0 0 auto;
  padding-left: 12px;
}
.doc-header-cover img {
  height: 72px;
  width: auto;
  object-fit: contain;
}

/* ===== WHITE SECTION BELOW BANNER ===== */
.doc-article-info {
  background: #fff;
  padding: 16px 36px 12px 36px;
  border-top: 3px solid #1a1a1a;
}
.doc-article-type {
  font-style: italic;
  font-size: 10.5pt;
  color: #1155cc;
  font-weight: 600;
  margin-bottom: 4px;
  font-family: 'EB Garamond','Times New Roman',serif;
}
.doc-article-title {
  font-size: 15pt;
  font-weight: 700;
  color: #1a3a6b;
  text-align: center;
  line-height: 1.3;
  margin: 6px 0 10px 0;
  font-family: 'EB Garamond','Times New Roman',serif;
}
.doc-article-authors {
  font-size: 10pt;
  text-align: center;
  color: #111;
  margin-bottom: 6px;
  font-family: 'EB Garamond','Times New Roman',serif;
}
.doc-article-affiliations {
  font-size: 9pt;
  font-style: italic;
  text-align: center;
  color: #333;
  line-height: 1.8;
  margin-bottom: 4px;
  font-family: 'EB Garamond','Times New Roman',serif;
}
.doc-article-corresponding {
  font-size: 9pt;
  text-align: center;
  color: #333;
  margin-bottom: 10px;
  font-family: 'EB Garamond','Times New Roman',serif;
}
.doc-article-corresponding a { color: #1155cc; }

/* ===== ABSTRACT + INFO TABLE ===== */
.abstract-table-wrapper { padding: 0 36px 16px 36px; }
.abstract-info-table {
  border: 1.5px solid #888;
  width: 100%;
  border-collapse: collapse;
  font-size: 10pt;
  font-family: 'EB Garamond','Times New Roman',serif;
}
.abstract-info-table td { vertical-align: top; padding: 10px 14px; border: 1.5px solid #888; }
.info-col { width: 180px; }
.info-col-heading, .abstract-col-heading {
  font-size: 9pt;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #1a3a6b;
  margin: 0 0 8px 0;
  border-bottom: 1.5px solid #999;
  padding-bottom: 3px;
}
.history-item { font-size: 9pt; margin-bottom: 3px; font-style: italic; }
.keywords-label { font-style: italic; font-weight: 700; font-size: 9pt; margin-top: 10px; color: #1a3a6b; }
.keywords-list { font-style: italic; font-size: 9pt; line-height: 1.8; }
.abstract-col p { text-align: justify; line-height: 1.65; margin: 0 0 8px 0; font-size: 10pt; }
.doi-line { font-size: 9pt; margin-top: 8px; color: #333; }
.doi-line a { color: #1155cc; }

/* ===== BODY DIVIDER ===== */
.body-divider { border: none; border-top: 1.5px solid #555; margin: 0 0 0 0; }

/* ===== TWO-COLUMN BODY ===== */
.two-col-body-wrap { padding: 14px 36px 30px 36px; }
.two-col-body {
  column-count: 2;
  column-gap: 22px;
  column-rule: 1px solid #ccc;
  text-align: justify;
  font-size: 10pt;
  line-height: 1.65;
  font-family: 'EB Garamond','Times New Roman',serif;
}
.two-col-body h1,.two-col-body h2,.two-col-body h3 {
  font-size: 10.5pt;
  font-weight: 700;
  color: #1a3a6b;
  margin: 14px 0 5px 0;
  padding-bottom: 2px;
  letter-spacing: 0.02em;
}
.two-col-body h4 { font-size: 10pt; font-weight: 700; font-style: italic; margin: 10px 0 4px 0; color: #222; }
.two-col-body p { margin: 0 0 8px 0; text-align: justify; }
.two-col-body img { display: block; margin: 10px auto; max-width: 100%; height: auto; }
.two-col-body strong { color: #1a3a6b; }
.two-col-body table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 8.5pt; break-inside: avoid; }
.two-col-body table th,.two-col-body table td { border: 1px solid #bbb; padding: 4px 7px; text-align: left; }
.two-col-body table th { background: #eef2f8; font-weight: 700; color: #1a3a6b; }
.two-col-body a { color: #1155cc; }

/* Equation */
.equation-block {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  margin: 14px auto;
  padding: 10px 40px 10px 10px;
  background: #f8f9fc;
  border: 1px solid #ccd;
  break-inside: avoid;
  column-span: none;
  font-style: italic;
}
.equation-block .eq-number { position: absolute; right: 10px; font-style: normal; color: #888; font-size: 9pt; }

@media (max-width: 650px) {
  .two-col-body { column-count: 1; }
  .doc-header-bar { flex-direction: column; gap: 8px; }
  .page-wrapper { margin: 0; }
  .doc-article-info, .abstract-table-wrapper, .two-col-body-wrap { padding-left: 12px; padding-right: 12px; }
}
  `;

  return (
    <>
      <Script
        id="mathjax-config"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{
          __html: `window.MathJax = { tex: { inlineMath: [['\\\\(','\\\\)']], displayMath: [['\\\\[','\\\\]']] }, options: { skipHtmlTags: ['script','noscript','style','textarea','pre'] } };`,
        }}
      />
      <Script src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-chtml.js" strategy="afterInteractive" id="mathjax-script" />
      <style dangerouslySetInnerHTML={{ __html: css }} />

      <div className="academic-page min-h-screen">
        <div className="page-wrapper">

          {/* HEADER BAR */}
          <div className="doc-header-bar">
            <div className="doc-header-logo">
              <img src={logoUrl} alt="C5K Logo" />
            </div>
            <div className="doc-header-center">
              <div className="jname">{journalName}</div>
              <div className="jvol">&quot;Volume {article.volume || "1"}, Issue {article.issue || "2"}, Year {article.publicationDate ? new Date(article.publicationDate).getFullYear() : "2025"}&quot;</div>
              <div className="jsite">website: <a href="https://www.c5k.com">https://www.c5k.com</a></div>
            </div>
            <div className="doc-header-cover">
              <img src={journalCover} alt="Journal Cover" />
            </div>
          </div>

          {/* ARTICLE TITLE & AUTHORS */}
          <div className="doc-article-info">
            <div className="doc-article-type">{article.articleType || "Research Article"}</div>
            <div className="doc-article-title">{article.title}</div>
            <div className="doc-article-authors">
              {allAuthors.map((a, i) => (
                <span key={i}>
                  {a.name}<sup>{i + 1}</sup>{i < allAuthors.length - 1 ? ", " : ""}
                </span>
              ))}
            </div>
            <div className="doc-article-affiliations">
              {allAuthors.map((a, i) => (
                a.affiliation ? <div key={i}><sup>{i + 1}</sup>{a.affiliation}</div> : null
              ))}
            </div>
          </div>

          {/* ABSTRACT TABLE */}
          <div className="abstract-table-wrapper">
            <table className="abstract-info-table">
              <tbody>
                <tr>
                  <td className="info-col">
                    <div className="info-col-heading">A R T I C L E &nbsp; I N F O</div>
                    <div style={{ fontSize: '9pt', fontStyle: 'italic', fontWeight: '700', marginBottom: '3px', color: '#333' }}>Article history:</div>
                    {subDate && <div className="history-item">{subDate} (Received)</div>}
                    {accDate && <div className="history-item">{accDate} (Accepted)</div>}
                    {pubDate && <div className="history-item">{pubDate} (Published Online)</div>}
                    
                    <div className="keywords-label">Keywords:</div>
                    <div className="keywords-list">
                      {article.keywords ? article.keywords.join(", ") : "Digital marketing, Machine learning, AI."}
                    </div>
                  </td>
                  <td className="abstract-col">
                    <div className="abstract-col-heading">A B S T R A C T</div>
                    <p>{article.abstract}</p>
                    {doiFull && (
                      <div className="doi-line">
                        DOI:&nbsp;<a href={doiFull} target="_blank" rel="noopener noreferrer">{doiFull}</a>&nbsp;@ 2025 {journalName}, C5K Research Publication
                      </div>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <hr className="body-divider" />

          {/* TWO-COLUMN BODY */}
          <div className="two-col-body-wrap">
            <div
              className="two-col-body"
              dangerouslySetInnerHTML={{ __html: articleHtml }}
            />
          </div>

        </div>
      </div>
    </>
  );
}
