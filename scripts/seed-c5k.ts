#!/usr/bin/env ts-node
/**
 * C5K Data Seeding Script (TypeScript/Prisma)
 * ============================================
 * This script imports scraped C5K data into the database using Prisma.
 *
 * Usage:
 *   npx ts-node scripts/seed-c5k.ts --file /path/to/c5k_items.jsonl
 *   npx ts-node scripts/seed-c5k.ts --file /path/to/c5k_items.json --dry-run
 *   npx ts-node scripts/seed-c5k.ts --clear-first  # DESTRUCTIVE!
 *
 * Requirements:
 *   npm install ts-node @types/node --save-dev
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as readline from 'readline';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Journal mapping
const JOURNAL_MAPPING: Record<string, string> = {
  'Journal of Information Technology Management and Business Horizons': 'JITMB',
  'Demographic Research and Social Development Reviews': 'DRSDR',
  'International Law Policy Review Organizational Management': 'ILPROM',
  'Transactions on Banking, Finance, and Leadership Informatics': 'TBFLI',
  'Progress on Multidisciplinary Scientific Research': 'PMSRI',
  'Journal of Sustainable Agricultural Economics': 'JSAE',
  'Advanced Machine Learning and Intelligence Development': 'AMLID',
  'Open Journal of Business Entrepreneurship and Marketing': 'OJBEM',
  'Periodic Reviews on Artificial Intelligence in Health Informatics': 'PRAIHI',
  'Journal of Business Venturing, AI and Data Analytics': 'JBVADA',
  'Journal of Advances in Medical Sciences and Artificial Intelligence': 'JAMSAI',
  'Advanced Engineering and Sustainability Innovations': 'AESI',
};

interface C5KItem {
  source_section: string;
  url: string;
  title: string;
  item_type: string;
  summary: string | null;
  keywords: string[] | null;
  authors: string[] | null;
  affiliations: string | null;
  doi: string | null;
  pdf_url: string | null;
  html_url: string | null;
  submitted: string | null;
  revised: string | null;
  accepted: string | null;
  online_first: string | null;
  journal_name: string | null;
  issue_info: string | null;
}

interface Stats {
  journalsCreated: number;
  usersCreated: number;
  articlesCreated: number;
  dissertationsCreated: number;
  blogsCreated: number;
  skipped: number;
  errors: number;
}

class C5KSeeder {
  private dryRun: boolean;
  private stats: Stats;
  private journalIds: Map<string, string>;
  private userIds: Map<string, string>;

  constructor(dryRun: boolean = false) {
    this.dryRun = dryRun;
    this.stats = {
      journalsCreated: 0,
      usersCreated: 0,
      articlesCreated: 0,
      dissertationsCreated: 0,
      blogsCreated: 0,
      skipped: 0,
      errors: 0,
    };
    this.journalIds = new Map();
    this.userIds = new Map();
  }

  /**
   * Load data from JSON or JSONL file
   */
  async loadData(filePath: string): Promise<C5KItem[]> {
    console.log(`\n📂 Loading data from: ${filePath}`);

    const items: C5KItem[] = [];

    if (filePath.endsWith('.jsonl')) {
      // Read JSONL line by line
      const fileStream = fs.createReadStream(filePath);
      const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity,
      });

      for await (const line of rl) {
        if (line.trim()) {
          try {
            items.push(JSON.parse(line));
          } catch (e) {
            console.error(`  ✗ Error parsing line: ${line.substring(0, 50)}`);
          }
        }
      }
    } else {
      // Read JSON file
      const content = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(content);
      items.push(...(Array.isArray(data) ? data : [data]));
    }

    console.log(`✓ Loaded ${items.length} items`);
    return items;
  }

  /**
   * Clear all data from database
   */
  async clearData() {
    if (this.dryRun) {
      console.log('[DRY RUN] Would clear existing data');
      return;
    }

    console.log('\n⚠️  WARNING: Clearing existing data...');

    try {
      // Delete in order due to foreign keys
      await prisma.review.deleteMany({});
      await prisma.article.deleteMany({});
      await prisma.dissertation.deleteMany({});
      await prisma.blog.deleteMany({});
      await prisma.notification.deleteMany({});
      await prisma.conferenceRegistration.deleteMany({});
      await prisma.conference.deleteMany({});
      await prisma.membership.deleteMany({});
      await prisma.journal.deleteMany({});
      await prisma.user.deleteMany({});

      console.log('✓ Data cleared successfully\n');
    } catch (error) {
      console.error('✗ Error clearing data:', error);
      throw error;
    }
  }

  /**
   * Create demo users
   */
  async createDemoUsers() {
    console.log('\n📝 Creating demo users...');

    const passwordHash = await bcrypt.hash('password123', 10);

    const demoUsers = [
      {
        email: 'demo.author@c5k.com',
        name: 'C5K Author',
        university: 'C5K University',
        role: 'author',
        affiliation: 'Department of Research',
      },
      {
        email: 'reviewer1@c5k.com',
        name: 'Dr. Jane Smith',
        university: 'Stanford University',
        role: 'reviewer',
        affiliation: 'Department of Computer Science',
      },
      {
        email: 'reviewer2@c5k.com',
        name: 'Dr. John Doe',
        university: 'MIT',
        role: 'reviewer',
        affiliation: 'Department of Engineering',
      },
      {
        email: 'reviewer3@c5k.com',
        name: 'Dr. Sarah Johnson',
        university: 'Harvard University',
        role: 'reviewer',
        affiliation: 'Department of Medicine',
      },
      {
        email: 'reviewer4@c5k.com',
        name: 'Dr. Michael Chen',
        university: 'UC Berkeley',
        role: 'reviewer',
        affiliation: 'Department of Data Science',
      },
      {
        email: 'admin@c5k.com',
        name: 'C5K Administrator',
        university: 'C5K Platform',
        role: 'admin',
        affiliation: 'Platform Administration',
      },
    ];

    for (const userData of demoUsers) {
      if (this.dryRun) {
        console.log(`[DRY RUN] Would create user: ${userData.email}`);
        this.userIds.set(userData.email, 'dummy-uuid');
        this.stats.usersCreated++;
        continue;
      }

      try {
        const user = await prisma.user.upsert({
          where: { email: userData.email },
          update: {
            name: userData.name,
            university: userData.university,
            role: userData.role,
          },
          create: {
            email: userData.email,
            passwordHash,
            name: userData.name,
            university: userData.university,
            role: userData.role,
            affiliation: userData.affiliation,
            isEmailVerified: true,
            isActive: true,
          },
        });

        this.userIds.set(userData.email, user.id);
        this.stats.usersCreated++;
        console.log(`  ✓ Created user: ${userData.email}`);
      } catch (error) {
        console.error(`  ✗ Error creating user ${userData.email}:`, error);
        this.stats.errors++;
      }
    }
  }

  /**
   * Seed journals
   */
  async seedJournals(items: C5KItem[]) {
    console.log('\n📚 Seeding journals...');

    // Extract unique journals
    const journalSet = new Set<string>();
    items.forEach((item) => {
      const journalName = item.journal_name;
      if (journalName && journalName !== 'About the journal' && journalName.trim() !== '') {
        if (JOURNAL_MAPPING[journalName]) {
          journalSet.add(journalName);
        }
      }
    });

    console.log(`  Found ${journalSet.size} unique journals`);

    let displayOrder = 0;
    for (const fullName of Array.from(journalSet)) {
      const code = JOURNAL_MAPPING[fullName];

      if (this.dryRun) {
        console.log(`[DRY RUN] Would create journal: ${code} - ${fullName}`);
        this.journalIds.set(code, 'dummy-uuid');
        this.stats.journalsCreated++;
        continue;
      }

      try {
        const journal = await prisma.journal.upsert({
          where: { code },
          update: {
            fullName,
            description: `${fullName} - A peer-reviewed academic journal`,
          },
          create: {
            code,
            fullName,
            shortName: code,
            description: `${fullName} - A peer-reviewed academic journal`,
            aimsAndScope: `Publishes high-quality research in ${fullName.toLowerCase()}`,
            publisher: 'C5K Publishing',
            frequency: 'Quarterly',
            articleProcessingCharge: 0.0,
            isActive: true,
            displayOrder: displayOrder++,
          },
        });

        this.journalIds.set(code, journal.id);
        this.stats.journalsCreated++;
        console.log(`  ✓ Created journal: ${code}`);
      } catch (error) {
        console.error(`  ✗ Error creating journal ${code}:`, error);
        this.stats.errors++;
      }
    }

    // Create fallback journal for articles without specific journal mappings
    const fallbackCode = 'MISC';
    if (this.dryRun) {
      console.log(`[DRY RUN] Would create fallback journal: ${fallbackCode}`);
      this.journalIds.set(fallbackCode, 'dummy-uuid');
      this.stats.journalsCreated++;
    } else {
      try {
        const fallbackJournal = await prisma.journal.upsert({
          where: { code: fallbackCode },
          update: {
            fullName: 'Miscellaneous Academic Publications',
            description: 'A collection of academic publications across various disciplines',
          },
          create: {
            code: fallbackCode,
            fullName: 'Miscellaneous Academic Publications',
            shortName: 'MISC',
            description: 'A collection of academic publications across various disciplines',
            aimsAndScope: 'Publishes research papers across multiple academic disciplines that do not fall under specific journal categories',
            publisher: 'C5K Publishing',
            frequency: 'Continuous',
            articleProcessingCharge: 0.0,
            isActive: true,
            displayOrder: 999, // Last in the list
          },
        });

        this.journalIds.set(fallbackCode, fallbackJournal.id);
        this.stats.journalsCreated++;
        console.log(`  ✓ Created fallback journal: ${fallbackCode}`);
      } catch (error) {
        console.error(`  ✗ Error creating fallback journal:`, error);
        this.stats.errors++;
      }
    }
  }

  /**
   * Parse date string
   */
  private parseDate(dateStr: string | null): Date | null {
    if (!dateStr || dateStr === 'null') return null;

    try {
      // Try parsing various formats
      const formats = [
        /(\d{1,2})\s+(\w+),?\s+(\d{4})/, // 03 July, 2024
        /(\w+)\s+(\d{1,2}),?\s+(\d{4})/, // July 03, 2024
      ];

      const months: Record<string, number> = {
        January: 0, February: 1, March: 2, April: 3, May: 4, June: 5,
        July: 6, August: 7, September: 8, October: 9, November: 10, December: 11,
      };

      for (const format of formats) {
        const match = dateStr.match(format);
        if (match) {
          const month = months[match[2]] ?? months[match[1]];
          const day = parseInt(match[1]) || parseInt(match[2]);
          const year = parseInt(match[3]);
          return new Date(year, month, day);
        }
      }

      // Try ISO format
      const parsed = new Date(dateStr);
      if (!isNaN(parsed.getTime())) {
        return parsed;
      }

      return null;
    } catch {
      return null;
    }
  }

  /**
   * Get journal code from item
   */
  private getJournalCode(item: C5KItem): string | null {
    const journalName = item.journal_name;

    // Check for specific journal mapping
    if (journalName && journalName !== 'About the journal') {
      const code = JOURNAL_MAPPING[journalName];
      if (code) return code;
    }

    // Use fallback journal for items without specific journal
    return 'MISC';
  }

  /**
   * Seed articles
   */
  async seedArticles(items: C5KItem[]) {
    console.log('\n📄 Seeding articles...');

    const articles = items.filter(
      (item) => item.item_type === 'article' && item.summary
    );
    console.log(`  Found ${articles.length} articles with summaries`);

    const defaultAuthorId = this.userIds.get('demo.author@c5k.com');
    if (!defaultAuthorId) {
      console.error('  ✗ Demo author not found');
      return;
    }

    for (let idx = 0; idx < articles.length; idx++) {
      const item = articles[idx];
      const journalCode = this.getJournalCode(item);

      if (!journalCode) {
        console.log(`  ⚠ Skipping article (no journal): ${item.title.substring(0, 50)}`);
        this.stats.skipped++;
        continue;
      }

      const journalId = this.journalIds.get(journalCode);
      if (!journalId) {
        console.log(`  ⚠ Skipping article (journal ID not found for ${journalCode}): ${item.title.substring(0, 50)}`);
        this.stats.skipped++;
        continue;
      }

      // Log when using fallback journal
      if (journalCode === 'MISC' && (idx < 5 || (idx + 1) % 50 === 0)) {
        console.log(`  ℹ Using fallback journal for: ${item.title.substring(0, 50)}`);
      }

      // Extract title
      let title = item.title;
      if (title === 'Citation' && item.summary) {
        title = item.summary.substring(0, 100) + '...';
      }

      // Parse keywords
      const keywords = Array.isArray(item.keywords)
        ? item.keywords.filter((k) => k && k.trim())
        : [];

      // Extract DOI and check for duplicates
      let doi: string | null = null;
      if (item.doi && item.doi.includes('doi.org')) {
        const extractedDoi = item.doi.split('doi.org/')[1];

        if (!this.dryRun) {
          // Check if DOI already exists in database
          const existingArticle = await prisma.article.findUnique({
            where: { doi: extractedDoi }
          });

          if (existingArticle) {
            // DOI already exists, set to null and log warning
            doi = null;
            if ((idx + 1) % 50 === 0 || idx < 10) {
              console.log(`  ⚠ Duplicate DOI found, setting to null: ${extractedDoi.substring(0, 30)}`);
            }
          } else {
            // DOI is unique, use it
            doi = extractedDoi;
          }
        } else {
          doi = extractedDoi;
        }
      }

      // Parse dates
      const submittedDate = this.parseDate(item.submitted);
      const acceptedDate = this.parseDate(item.accepted);
      const onlineFirstDate = this.parseDate(item.online_first);

      const pubDate =
        onlineFirstDate ||
        acceptedDate ||
        submittedDate ||
        new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000);

      if (this.dryRun) {
        console.log(`[DRY RUN] Would create article ${idx + 1}/${articles.length}: ${title.substring(0, 50)}`);
        this.stats.articlesCreated++;
        continue;
      }

      try {
        await prisma.article.create({
          data: {
            journalId,
            title: title.substring(0, 500),
            abstract: item.summary?.substring(0, 5000) || '',
            keywords,
            articleType: 'research',
            doi,
            pdfUrl: item.pdf_url,
            status: 'published',
            publicationDate: pubDate,
            submissionDate: submittedDate || new Date(pubDate.getTime() - 90 * 24 * 60 * 60 * 1000),
            acceptanceDate: acceptedDate || new Date(pubDate.getTime() - 30 * 24 * 60 * 60 * 1000),
            authorId: defaultAuthorId,
            isOpenAccess: true,
            language: 'en',
          },
        });

        this.stats.articlesCreated++;

        if ((idx + 1) % 50 === 0) {
          console.log(`  ✓ Created ${idx + 1}/${articles.length} articles...`);
        }
      } catch (error) {
        console.error(`  ✗ Error creating article:`, error);
        console.error(`     Title: ${title.substring(0, 50)}`);
        this.stats.errors++;
      }
    }

    console.log(`  ✓ Created ${this.stats.articlesCreated} articles`);
  }

  /**
   * Seed announcements
   */
  async seedAnnouncements() {
    console.log('\n📢 Seeding announcements...');

    const announcements = [
      {
        title: 'Welcome to IJAISM Publishing Platform',
        content: 'We are excited to announce the launch of our new academic publishing platform. IJAISM is dedicated to publishing high-quality research in information technology, business management, and related disciplines. Our platform features a fast 4-reviewer approval system to minimize delays in sharing new ideas and discoveries with the world.',
        excerpt: 'IJAISM academic publishing platform is now live! Submit your research today.',
        category: 'news',
        priority: 10,
        isFeatured: true,
      },
      {
        title: 'Call for Papers - All Journals',
        content: 'We invite researchers, scholars, and practitioners to submit original research papers across all our journals. Topics include Information Technology, Business Management, Machine Learning, AI, Healthcare Informatics, Engineering, Agricultural Economics, and more. Fast-track review process available for quality submissions.',
        excerpt: 'Submit your research papers across 12+ academic journals. Fast-track review available.',
        category: 'event',
        priority: 9,
        isFeatured: true,
      },
      {
        title: 'New Journal Launch: AESI',
        content: 'We are pleased to announce the launch of Advanced Engineering and Sustainability Innovations (AESI). This journal focuses on cutting-edge research in engineering and sustainable development. Submit your papers today!',
        excerpt: 'Advanced Engineering and Sustainability Innovations (AESI) now accepting submissions.',
        category: 'update',
        priority: 8,
        isFeatured: false,
      },
      {
        title: 'Special Issue: AI in Healthcare',
        content: 'The Journal of Advances in Medical Sciences and Artificial Intelligence (JAMSAI) is calling for papers for a special issue on AI applications in healthcare. Submission deadline: March 31, 2026. Topics include medical imaging, predictive analytics, clinical decision support, and more.',
        excerpt: 'JAMSAI special issue on AI in Healthcare - Submit by March 31, 2026.',
        category: 'event',
        priority: 7,
        isFeatured: true,
      },
      {
        title: 'Fast-Track Review Now Available',
        content: 'Authors can now request fast-track review for urgent research findings. Our 4-reviewer system can complete reviews within 2-3 weeks for qualifying submissions. Contact editorial@ijaism.com for more information.',
        excerpt: 'Get your research published faster with our new fast-track review process.',
        category: 'update',
        priority: 6,
        isFeatured: false,
      },
      {
        title: 'Open Access Publishing Benefits',
        content: 'All articles published in IJAISM journals are open access, ensuring maximum visibility and citation potential for your research. Learn about our transparent pricing and author benefits.',
        excerpt: 'Discover the benefits of open access publishing with IJAISM.',
        category: 'news',
        priority: 5,
        isFeatured: false,
      },
    ];

    for (const announcementData of announcements) {
      if (this.dryRun) {
        console.log(`[DRY RUN] Would create announcement: ${announcementData.title}`);
        continue;
      }

      try {
        await prisma.announcement.create({
          data: {
            ...announcementData,
            publishedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random date within last 30 days
            expiresAt: null, // No expiration
          },
        });
        console.log(`  ✓ Created announcement: ${announcementData.title}`);
      } catch (error) {
        console.error(`  ✗ Error creating announcement:`, error);
        this.stats.errors++;
      }
    }
  }

  /**
   * Seed dissertations
   */
  async seedDissertations(items: C5KItem[]) {
    console.log('\n🎓 Seeding dissertations...');

    const dissertations = items.filter((item) => item.item_type === 'dissertation_thesis');
    console.log(`  Found ${dissertations.length} dissertations`);

    const defaultAuthorId = this.userIds.get('demo.author@c5k.com');
    if (!defaultAuthorId) {
      console.error('  ✗ Demo author not found');
      return;
    }

    for (const item of dissertations) {
      const title = item.title.replace(/-/g, ' ').trim();
      const degreeType = title.toLowerCase().includes('master') || title.toLowerCase().includes('msc')
        ? 'masters'
        : 'phd';

      if (this.dryRun) {
        console.log(`[DRY RUN] Would create dissertation: ${title.substring(0, 50)}`);
        this.stats.dissertationsCreated++;
        continue;
      }

      try {
        await prisma.dissertation.create({
          data: {
            title: title.substring(0, 500),
            abstract: item.summary?.substring(0, 5000) || `A dissertation on ${title}`,
            authorId: defaultAuthorId,
            university: 'C5K University',
            degreeType,
            keywords: Array.isArray(item.keywords) ? item.keywords.filter((k) => k) : [],
            pdfUrl: item.pdf_url,
            status: 'published',
            submissionDate: new Date(Date.now() - Math.random() * 730 * 24 * 60 * 60 * 1000),
          },
        });

        this.stats.dissertationsCreated++;
        console.log(`  ✓ Created dissertation: ${title.substring(0, 50)}`);
      } catch (error) {
        console.error(`  ✗ Error creating dissertation:`, error);
        console.error(`     Title: ${title.substring(0, 50)}`);
        this.stats.errors++;
      }
    }
  }

  /**
   * Print summary
   */
  printSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 SEEDING SUMMARY');
    console.log('='.repeat(60));
    console.log(`Journals created:      ${this.stats.journalsCreated}`);
    console.log(`Users created:         ${this.stats.usersCreated}`);
    console.log(`Articles created:      ${this.stats.articlesCreated}`);
    console.log(`Dissertations created: ${this.stats.dissertationsCreated}`);
    console.log(`Blogs created:         ${this.stats.blogsCreated}`);
    console.log(`Skipped:               ${this.stats.skipped}`);
    console.log(`Errors:                ${this.stats.errors}`);
    console.log('='.repeat(60));

    if (this.dryRun) {
      console.log('\n⚠️  DRY RUN MODE - No changes were made to the database');
    } else {
      console.log('\n✓ Data seeding completed successfully!');
    }
  }

  /**
   * Run the seeding process
   */
  async run(filePath: string, clearFirst: boolean = false) {
    console.log('='.repeat(60));
    console.log('C5K DATA SEEDING SCRIPT (TypeScript/Prisma)');
    console.log('='.repeat(60));
    console.log(`Data file: ${filePath}`);
    console.log(`Dry run: ${this.dryRun}`);
    console.log(`Clear first: ${clearFirst}`);
    console.log('='.repeat(60));

    try {
      // Load data
      const items = await this.loadData(filePath);

      // Connect to database
      await prisma.$connect();
      console.log('✓ Connected to database');

      // Clear data if requested
      if (clearFirst && !this.dryRun) {
        await this.clearData();
      }

      // Seed data
      await this.createDemoUsers();
      await this.seedJournals(items);
      await this.seedAnnouncements();
      await this.seedArticles(items);
      await this.seedDissertations(items);

      this.printSummary();
    } catch (error) {
      console.error('\n✗ Error during seeding:', error);
      throw error;
    } finally {
      await prisma.$disconnect();
      console.log('✓ Database connection closed');
    }
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);

  let filePath = '';
  let dryRun = false;
  let clearFirst = false;

  // Parse arguments
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--file' && args[i + 1]) {
      filePath = args[i + 1];
      i++;
    } else if (args[i] === '--dry-run') {
      dryRun = true;
    } else if (args[i] === '--clear-first') {
      clearFirst = true;
    }
  }

  if (!filePath) {
    console.error('✗ Error: --file argument is required');
    console.log('\nUsage:');
    console.log('  npx ts-node scripts/seed-c5k.ts --file /path/to/c5k_items.jsonl');
    console.log('  npx ts-node scripts/seed-c5k.ts --file /path/to/c5k_items.json --dry-run');
    console.log('  npx ts-node scripts/seed-c5k.ts --clear-first');
    process.exit(1);
  }

  if (!fs.existsSync(filePath)) {
    console.error(`✗ Error: File not found: ${filePath}`);
    process.exit(1);
  }

  const seeder = new C5KSeeder(dryRun);
  await seeder.run(filePath, clearFirst);
}

main()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
