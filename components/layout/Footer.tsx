import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About C5K */}
          <div>
            <h3 className="text-white text-lg font-bold mb-4">ABOUT C5K</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/about" className="hover:text-white transition-colors">
                  Mission & Vision
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-white transition-colors">
                  Privacy & Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-white transition-colors">
                  Terms & Condition
                </Link>
              </li>
            </ul>
          </div>

          {/* Location */}
          <div>
            <h3 className="text-white text-lg font-bold mb-4">LOCATION</h3>
            <address className="not-italic">
              761 State Highway 100<br />
              Port Isabel, TX 78578<br />
              USA
            </address>
          </div>

          {/* Get Involved */}
          <div>
            <h3 className="text-white text-lg font-bold mb-4">GET INVOLVED</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/conferences" className="hover:text-white transition-colors">
                  Conference
                </Link>
              </li>
              <li>
                <Link href="/societies" className="hover:text-white transition-colors">
                  Societies
                </Link>
              </li>
              <li>
                <Link href="/careers" className="hover:text-white transition-colors">
                  Technical Career
                </Link>
              </li>
              <li>
                <Link href="/scholarship" className="hover:text-white transition-colors">
                  Scholarship
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-white text-lg font-bold mb-4">RESOURCES</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/author-guidelines" className="hover:text-white transition-colors">
                  Author Guideline
                </Link>
              </li>
              <li>
                <Link href="/paper-format" className="hover:text-white transition-colors">
                  Paper Format Download
                </Link>
              </li>
              <li>
                <Link href="/submit" className="hover:text-white transition-colors">
                  Submit Article
                </Link>
              </li>
              <li>
                <Link href="/book-publishing" className="hover:text-white transition-colors">
                  Book Publishing
                </Link>
              </li>
              <li>
                <Link href="/dissertations" className="hover:text-white transition-colors">
                  Thesis/Dissertation
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-700 mt-8 pt-8 text-center">
          <p>&copy; {new Date().getFullYear()} C5K - International Journal of Advanced Information Systems and Management. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
