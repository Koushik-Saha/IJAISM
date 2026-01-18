import Link from "next/link";

export default function PaperFormatPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary to-blue-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Paper Format Guidelines</h1>
          <p className="text-xl md:text-2xl text-gray-100 max-w-3xl">
            Detailed formatting requirements for manuscript submission
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Download Template */}
        <div className="bg-accent text-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="mb-4 md:mb-0">
              <h3 className="text-2xl font-bold mb-2">Download Paper Template</h3>
              <p className="text-gray-100">
                Use our official template to ensure proper formatting
              </p>
            </div>
            <div className="flex gap-3">
              <button className="bg-white text-accent hover:bg-gray-100 px-6 py-3 rounded-lg font-bold transition-colors whitespace-nowrap">
                Word Template
              </button>
              <button className="bg-white text-accent hover:bg-gray-100 px-6 py-3 rounded-lg font-bold transition-colors whitespace-nowrap">
                LaTeX Template
              </button>
            </div>
          </div>
        </div>

        {/* Page Setup */}
        <div className="bg-white rounded-lg shadow-md p-8 md:p-10 mb-8">
          <h2 className="text-3xl font-bold text-primary mb-6">Page Setup</h2>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="border-l-4 border-accent pl-4">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Paper Size</h3>
              <p className="text-gray-700">US Letter (8.5" × 11") or A4 (210mm × 297mm)</p>
            </div>
            <div className="border-l-4 border-accent pl-4">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Margins</h3>
              <p className="text-gray-700">1 inch (2.54 cm) on all sides</p>
            </div>
            <div className="border-l-4 border-accent pl-4">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Orientation</h3>
              <p className="text-gray-700">Portrait (vertical)</p>
            </div>
            <div className="border-l-4 border-accent pl-4">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Columns</h3>
              <p className="text-gray-700">Single column for submission</p>
            </div>
          </div>
        </div>

        {/* Typography */}
        <div className="bg-white rounded-lg shadow-md p-8 md:p-10 mb-8">
          <h2 className="text-3xl font-bold text-primary mb-6">Typography</h2>

          <h3 className="text-xl font-bold text-gray-900 mb-4">Font Specifications</h3>
          <div className="overflow-x-auto mb-6">
            <table className="min-w-full border-collapse border border-gray-300">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border border-gray-300 px-4 py-2 text-left">Element</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Font</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Size</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Style</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-300 px-4 py-2">Title</td>
                  <td className="border border-gray-300 px-4 py-2">Times New Roman</td>
                  <td className="border border-gray-300 px-4 py-2">18pt</td>
                  <td className="border border-gray-300 px-4 py-2">Bold, Centered</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="border border-gray-300 px-4 py-2">Authors</td>
                  <td className="border border-gray-300 px-4 py-2">Times New Roman</td>
                  <td className="border border-gray-300 px-4 py-2">12pt</td>
                  <td className="border border-gray-300 px-4 py-2">Regular, Centered</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2">Affiliations</td>
                  <td className="border border-gray-300 px-4 py-2">Times New Roman</td>
                  <td className="border border-gray-300 px-4 py-2">10pt</td>
                  <td className="border border-gray-300 px-4 py-2">Italic, Centered</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="border border-gray-300 px-4 py-2">Headings (Level 1)</td>
                  <td className="border border-gray-300 px-4 py-2">Times New Roman</td>
                  <td className="border border-gray-300 px-4 py-2">14pt</td>
                  <td className="border border-gray-300 px-4 py-2">Bold</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2">Headings (Level 2)</td>
                  <td className="border border-gray-300 px-4 py-2">Times New Roman</td>
                  <td className="border border-gray-300 px-4 py-2">12pt</td>
                  <td className="border border-gray-300 px-4 py-2">Bold</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="border border-gray-300 px-4 py-2">Body Text</td>
                  <td className="border border-gray-300 px-4 py-2">Times New Roman</td>
                  <td className="border border-gray-300 px-4 py-2">12pt</td>
                  <td className="border border-gray-300 px-4 py-2">Regular</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2">Abstract</td>
                  <td className="border border-gray-300 px-4 py-2">Times New Roman</td>
                  <td className="border border-gray-300 px-4 py-2">11pt</td>
                  <td className="border border-gray-300 px-4 py-2">Regular, Justified</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="border border-gray-300 px-4 py-2">Keywords</td>
                  <td className="border border-gray-300 px-4 py-2">Times New Roman</td>
                  <td className="border border-gray-300 px-4 py-2">11pt</td>
                  <td className="border border-gray-300 px-4 py-2">Italic</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2">References</td>
                  <td className="border border-gray-300 px-4 py-2">Times New Roman</td>
                  <td className="border border-gray-300 px-4 py-2">10pt</td>
                  <td className="border border-gray-300 px-4 py-2">Regular</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3 className="text-xl font-bold text-gray-900 mb-3">Line Spacing</h3>
          <ul className="list-disc ml-6 mb-6 space-y-2 text-gray-700">
            <li>Body text: Double-spaced (2.0)</li>
            <li>Abstract: Single-spaced (1.0)</li>
            <li>References: Single-spaced with spacing between entries</li>
            <li>Figure captions: Single-spaced</li>
          </ul>

          <h3 className="text-xl font-bold text-gray-900 mb-3">Alignment</h3>
          <ul className="list-disc ml-6 space-y-2 text-gray-700">
            <li>Title, authors, affiliations: Centered</li>
            <li>Abstract: Justified</li>
            <li>Body text: Left-aligned or justified</li>
          </ul>
        </div>

        {/* Document Structure */}
        <div className="bg-white rounded-lg shadow-md p-8 md:p-10 mb-8">
          <h2 className="text-3xl font-bold text-primary mb-6">Document Structure</h2>

          <div className="space-y-6">
            <div className="border-l-4 border-accent pl-4">
              <h3 className="text-lg font-bold text-gray-900 mb-2">1. Title Page</h3>
              <ul className="list-disc ml-6 space-y-1 text-gray-700">
                <li>Paper title (max 150 characters)</li>
                <li>Author names with superscript numbers for affiliations</li>
                <li>Author affiliations (institution, department, city, country)</li>
                <li>Corresponding author email</li>
                <li>ORCID IDs for all authors (recommended)</li>
              </ul>
            </div>

            <div className="border-l-4 border-accent pl-4">
              <h3 className="text-lg font-bold text-gray-900 mb-2">2. Abstract</h3>
              <ul className="list-disc ml-6 space-y-1 text-gray-700">
                <li>150-250 words</li>
                <li>Self-contained summary of the work</li>
                <li>Include: background, objectives, methods, results, conclusions</li>
                <li>No citations or abbreviations</li>
              </ul>
            </div>

            <div className="border-l-4 border-accent pl-4">
              <h3 className="text-lg font-bold text-gray-900 mb-2">3. Keywords</h3>
              <ul className="list-disc ml-6 space-y-1 text-gray-700">
                <li>4-6 keywords</li>
                <li>Separated by commas or semicolons</li>
                <li>Use standard terminology</li>
              </ul>
            </div>

            <div className="border-l-4 border-accent pl-4">
              <h3 className="text-lg font-bold text-gray-900 mb-2">4. Main Text</h3>
              <ul className="list-disc ml-6 space-y-1 text-gray-700">
                <li>Introduction</li>
                <li>Literature Review (if applicable)</li>
                <li>Methodology</li>
                <li>Results</li>
                <li>Discussion</li>
                <li>Conclusion</li>
              </ul>
            </div>

            <div className="border-l-4 border-accent pl-4">
              <h3 className="text-lg font-bold text-gray-900 mb-2">5. Acknowledgments (Optional)</h3>
              <p className="text-gray-700">
                Recognize funding sources and contributors who don't meet authorship criteria
              </p>
            </div>

            <div className="border-l-4 border-accent pl-4">
              <h3 className="text-lg font-bold text-gray-900 mb-2">6. References</h3>
              <ul className="list-disc ml-6 space-y-1 text-gray-700">
                <li>Numbered consecutively in order of appearance</li>
                <li>Use APA, IEEE, or Chicago style (choose one)</li>
                <li>Include DOI when available</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Figures and Tables */}
        <div className="bg-white rounded-lg shadow-md p-8 md:p-10 mb-8">
          <h2 className="text-3xl font-bold text-primary mb-6">Figures and Tables</h2>

          <h3 className="text-xl font-bold text-gray-900 mb-3">Figure Requirements</h3>
          <ul className="list-disc ml-6 mb-6 space-y-2 text-gray-700">
            <li><strong>Resolution:</strong> Minimum 300 dpi for photos, 600 dpi for line art</li>
            <li><strong>Format:</strong> TIFF, PNG, or high-quality JPEG</li>
            <li><strong>Size:</strong> Fit within page margins when printed</li>
            <li><strong>Color:</strong> RGB for online, CMYK for print</li>
            <li><strong>Labels:</strong> Legible at publication size (minimum 8pt font)</li>
          </ul>

          <h3 className="text-xl font-bold text-gray-900 mb-3">Table Formatting</h3>
          <ul className="list-disc ml-6 mb-6 space-y-2 text-gray-700">
            <li>Simple structure without vertical lines</li>
            <li>Horizontal lines only (top, bottom, below header)</li>
            <li>10-11pt font</li>
            <li>Caption above the table</li>
            <li>Footnotes below the table if needed</li>
          </ul>

          <h3 className="text-xl font-bold text-gray-900 mb-3">Captions</h3>
          <ul className="list-disc ml-6 space-y-2 text-gray-700">
            <li><strong>Figure captions:</strong> Below the figure</li>
            <li><strong>Table captions:</strong> Above the table</li>
            <li><strong>Format:</strong> "Figure 1:" or "Table 1:" followed by descriptive text</li>
            <li><strong>Length:</strong> Concise but complete description</li>
          </ul>
        </div>

        {/* Mathematical Equations */}
        <div className="bg-white rounded-lg shadow-md p-8 md:p-10 mb-8">
          <h2 className="text-3xl font-bold text-primary mb-6">Mathematical Equations</h2>

          <ul className="list-disc ml-6 mb-6 space-y-2 text-gray-700">
            <li>Use equation editor (Microsoft Equation or MathType)</li>
            <li>Number equations consecutively (1), (2), (3)...</li>
            <li>Place equation numbers on the right margin</li>
            <li>Define all symbols and variables</li>
            <li>Use standard mathematical notation</li>
            <li>Center-align equations</li>
          </ul>

          <div className="bg-gray-100 p-4 rounded font-mono text-sm">
            Example:
            <br />
            <br />
            &nbsp;&nbsp;&nbsp;&nbsp;E = mc²&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;(1)
            <br />
            <br />
            where E is energy, m is mass, and c is the speed of light.
          </div>
        </div>

        {/* Citations and References */}
        <div className="bg-white rounded-lg shadow-md p-8 md:p-10 mb-8">
          <h2 className="text-3xl font-bold text-primary mb-6">Citations and References</h2>

          <h3 className="text-xl font-bold text-gray-900 mb-3">In-Text Citations</h3>
          <p className="text-gray-700 mb-4">Choose one style and use consistently:</p>

          <div className="space-y-4 mb-6">
            <div className="border-l-4 border-accent pl-4">
              <h4 className="font-bold text-gray-900 mb-2">APA Style</h4>
              <p className="text-gray-700 font-mono text-sm">
                (Smith, 2023) or Smith (2023) found that...
              </p>
            </div>
            <div className="border-l-4 border-accent pl-4">
              <h4 className="font-bold text-gray-900 mb-2">IEEE Style</h4>
              <p className="text-gray-700 font-mono text-sm">
                [1] or as shown in [1, 2, 5]
              </p>
            </div>
            <div className="border-l-4 border-accent pl-4">
              <h4 className="font-bold text-gray-900 mb-2">Chicago Style</h4>
              <p className="text-gray-700 font-mono text-sm">
                (Smith 2023) or Smith (2023, 45) for specific page
              </p>
            </div>
          </div>

          <h3 className="text-xl font-bold text-gray-900 mb-3">Reference List Format</h3>
          <div className="bg-gray-100 p-4 rounded text-sm space-y-4">
            <div>
              <p className="font-bold mb-2">Journal Article (APA):</p>
              <p className="text-gray-700">
                Smith, J., & Jones, M. (2023). Advances in machine learning. <em>Journal of AI Research</em>, 15(3), 234-256. https://doi.org/10.1234/jair.2023.001
              </p>
            </div>
            <div>
              <p className="font-bold mb-2">Book (APA):</p>
              <p className="text-gray-700">
                Johnson, R. (2022). <em>Digital transformation strategies</em>. Academic Press.
              </p>
            </div>
            <div>
              <p className="font-bold mb-2">Conference Paper (IEEE):</p>
              <p className="text-gray-700">
                [1] A. Kumar, "Deep learning applications," in <em>Proc. Int. Conf. AI</em>, 2023, pp. 45-52.
              </p>
            </div>
          </div>
        </div>

        {/* Submission Checklist */}
        <div className="bg-white rounded-lg shadow-md p-8 md:p-10 mb-8">
          <h2 className="text-3xl font-bold text-primary mb-6">Pre-Submission Checklist</h2>

          <div className="space-y-3">
            <label className="flex items-start">
              <input type="checkbox" className="mt-1 mr-3 h-5 w-5 text-accent" />
              <span className="text-gray-700">Manuscript is 6-12 pages (or appropriate length for article type)</span>
            </label>
            <label className="flex items-start">
              <input type="checkbox" className="mt-1 mr-3 h-5 w-5 text-accent" />
              <span className="text-gray-700">All pages numbered consecutively</span>
            </label>
            <label className="flex items-start">
              <input type="checkbox" className="mt-1 mr-3 h-5 w-5 text-accent" />
              <span className="text-gray-700">Title is concise and descriptive</span>
            </label>
            <label className="flex items-start">
              <input type="checkbox" className="mt-1 mr-3 h-5 w-5 text-accent" />
              <span className="text-gray-700">Abstract is 150-250 words</span>
            </label>
            <label className="flex items-start">
              <input type="checkbox" className="mt-1 mr-3 h-5 w-5 text-accent" />
              <span className="text-gray-700">4-6 keywords provided</span>
            </label>
            <label className="flex items-start">
              <input type="checkbox" className="mt-1 mr-3 h-5 w-5 text-accent" />
              <span className="text-gray-700">All figures and tables numbered and cited in text</span>
            </label>
            <label className="flex items-start">
              <input type="checkbox" className="mt-1 mr-3 h-5 w-5 text-accent" />
              <span className="text-gray-700">All references cited in text and listed</span>
            </label>
            <label className="flex items-start">
              <input type="checkbox" className="mt-1 mr-3 h-5 w-5 text-accent" />
              <span className="text-gray-700">Spelling and grammar checked</span>
            </label>
            <label className="flex items-start">
              <input type="checkbox" className="mt-1 mr-3 h-5 w-5 text-accent" />
              <span className="text-gray-700">Author information complete with ORCID IDs</span>
            </label>
            <label className="flex items-start">
              <input type="checkbox" className="mt-1 mr-3 h-5 w-5 text-accent" />
              <span className="text-gray-700">Cover letter prepared</span>
            </label>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-r from-primary to-blue-800 text-white rounded-lg shadow-md p-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Submit?</h2>
          <p className="text-lg text-gray-100 mb-6">
            Use our template and follow these guidelines for a smooth submission process
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/submit"
              className="bg-accent hover:bg-accent-dark text-white px-8 py-3 rounded-lg font-bold transition-colors"
            >
              Submit Your Paper
            </Link>
            <Link
              href="/author-guidelines"
              className="bg-white hover:bg-gray-100 text-primary px-8 py-3 rounded-lg font-bold transition-colors"
            >
              View Author Guidelines
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
