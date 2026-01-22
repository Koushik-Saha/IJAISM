
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const announcements = [
  {
    title: "New Special Issue: AI Ethics and Governance",
    content: `
      <p>We are pleased to announce a special issue on AI Ethics and Governance in the Journal of Advanced Machine Learning and Artificial Intelligence (JAMLAI).</p>
      <p>In recent years, the ethical implications of artificial intelligence have become a central topic of discussion in both academia and industry. This special issue aims to bring together cutting-edge research on the ethical frameworks, governance structures, and policy mechanisms required to ensure responsible AI development.</p>
      <h3>Topics of Interest</h3>
      <ul>
        <li>Algorithmic Bias and Fairness</li>
        <li>Transparency and Explainability</li>
        <li>AI Policy and Regulation</li>
        <li>Ethical AI Design</li>
        <li>Social Impact of AI Systems</li>
      </ul>
      <p><strong>Submission Deadline:</strong> March 31, 2024</p>
      <p>We invite researchers to submit their original work for consideration. All submissions will undergo a rigorous double-blind peer review process.</p>
    `,
    category: "Journal",
    priority: 2, // High
    excerpt: "We are pleased to announce a special issue on AI Ethics and Governance in the Journal of Advanced Machine Learning and Artificial Intelligence (JAMLAI). Submission deadline: March 31, 2024.",
    publishedAt: new Date("2024-01-15"),
    author: "Editorial Team",
    isFeatured: true,
    thumbnailUrl: "https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?auto=format&fit=crop&q=80&w=800"
  },
  {
    title: "ICAIML 2024 Conference Registration Now Open",
    content: `
      <p>Early bird registration is now available for the International Conference on Artificial Intelligence and Machine Learning (ICAIML 2024) taking place June 15-17 in San Francisco.</p>
      <p>Don't miss this opportunity to connect with leading researchers and practitioners in the field. The conference will feature keynote speeches from industry pioneers, interactive workshops, and networking sessions.</p>
      <h3>Registration Benefits</h3>
      <ul>
        <li>Access to all sessions</li>
        <li>Conference proceedings</li>
        <li>Networking events</li>
        <li>Gala dinner</li>
      </ul>
      <p><strong>Early Bird Deadline:</strong> March 31, 2024</p>
      <p>Register now to secure your spot and take advantage of discounted rates.</p>
    `,
    category: "Conference",
    priority: 2, // High
    excerpt: "Early bird registration is now available for the International Conference on Artificial Intelligence and Machine Learning (ICAIML 2024) taking place June 15-17 in San Francisco.",
    publishedAt: new Date("2024-01-10"),
    author: "Conference Committee",
    isFeatured: true,
    thumbnailUrl: "https://images.unsplash.com/photo-1544531586-fde5298cdd40?auto=format&fit=crop&q=80&w=800"
  },
  {
    title: "IJAISM Research Scholarship Program Announced",
    content: `
      <p>IJAISM is proud to launch a new scholarship program supporting doctoral researchers in information technology and business management.</p>
      <p>This initiative underscores our commitment to fostering the next generation of scholars. The scholarship provides financial support and mentorship opportunities to outstanding PhD candidates.</p>
      <h3>Eligibility Criteria</h3>
      <ul>
        <li>Currently enrolled in a PhD program</li>
        <li>Demonstrated research potential</li>
        <li>Strong academic record</li>
      </ul>
      <p>Applications open on February 1, 2024. Visit our scholarship page for more details and to apply.</p>
    `,
    category: "Scholarship",
    priority: 2, // High
    excerpt: "IJAISM is proud to launch a new scholarship program supporting doctoral researchers in information technology and business management. Applications open February 1, 2024.",
    publishedAt: new Date("2024-01-05"),
    author: "IJAISM Grants Commitee",
    isFeatured: false,
    thumbnailUrl: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&q=80&w=800"
  },
  {
    title: "Updated Author Guidelines for 2024",
    content: `
      <p>We have updated our author guidelines to include new formatting requirements and best practices. All authors should review the updated guidelines before submission.</p>
      <p>The key updates focus on citation styles, data availability statements, and conflict of interest disclosures. These changes are intended to improve the clarity and integrity of published research.</p>
      <p>Please refer to the "For Authors" section on our website for the complete updated guidelines.</p>
    `,
    category: "Guidelines",
    priority: 1, // Medium
    excerpt: "We have updated our author guidelines to include new formatting requirements and best practices. All authors should review the updated guidelines before submission.",
    publishedAt: new Date("2024-01-03"),
    author: "IJAISM Admin",
    isFeatured: false,
    thumbnailUrl: "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&q=80&w=800"
  },
  {
    title: "New Editorial Board Members Appointed",
    content: `
      <p>IJAISM welcomes five distinguished researchers to our editorial boards across multiple journals, strengthening our commitment to academic excellence.</p>
      <p>These new members bring a wealth of experience and expertise in their respective fields. We look forward to their contributions in maintaining the high standards of our publications.</p>
      <p>Join us in welcoming them to the IJAISM family!</p>
    `,
    category: "Editorial",
    priority: 1, // Medium
    excerpt: "IJAISM welcomes five distinguished researchers to our editorial boards across multiple journals, strengthening our commitment to academic excellence.",
    publishedAt: new Date("2023-12-28"),
    author: "Editor-in-Chief",
    isFeatured: false,
    thumbnailUrl: "https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?auto=format&fit=crop&q=80&w=800"
  },
  {
    title: "Call for Papers: Business Analytics Special Issue",
    content: `
      <p>The Journal of Business Value and Data Analytics is seeking submissions for a special issue on advanced business analytics applications.</p>
      <p>We are interested in papers that explore novel applications of analytics in various business domains, including marketing, supply chain, and finance.</p>
      <p><strong>Deadline for Submission:</strong> April 15, 2024</p>
      <p>Submit your manuscript through our online portal.</p>
    `,
    category: "Journal",
    priority: 2, // High
    excerpt: "The Journal of Business Value and Data Analytics is seeking submissions for a special issue on advanced business analytics applications. Deadline: April 15, 2024.",
    publishedAt: new Date("2023-12-20"),
    author: "Editorial Team",
    isFeatured: true,
    thumbnailUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=800"
  },
  {
    title: "IJAISM Platform Update: Enhanced Features",
    content: `
      <p>Our platform has been updated with new features including improved manuscript tracking, enhanced reviewer dashboard, and mobile responsiveness.</p>
      <p>We are constantly working to improve the user experience for our authors, reviewers, and readers. These updates are part of our ongoing efforts to provide a state-of-the-art publishing platform.</p>
      <p>If you encounter any issues, please contact our support team.</p>
    `,
    category: "Platform",
    priority: 0, // Low
    excerpt: "Our platform has been updated with new features including improved manuscript tracking, enhanced reviewer dashboard, and mobile responsiveness.",
    publishedAt: new Date("2023-12-15"),
    author: "Tech Support",
    isFeatured: false,
    thumbnailUrl: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=800"
  },
  {
    title: "Partnership with Leading Universities",
    content: `
      <p>IJAISM announces strategic partnerships with Stanford, MIT, and Oxford to promote open access research and collaborative publishing initiatives.</p>
      <p>These partnerships will facilitate knowledge exchange and joint research projects. We are excited about the opportunities this collaboration brings to the global research community.</p>
    `,
    category: "Partnership",
    priority: 1, // Medium
    excerpt: "IJAISM announces strategic partnerships with Stanford, MIT, and Oxford to promote open access research and collaborative publishing initiatives.",
    publishedAt: new Date("2023-12-10"),
    author: "IJAISM Board",
    isFeatured: true,
    thumbnailUrl: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&q=80&w=800"
  }
];

async function main() {
  console.log('Start seeding announcements...');

  for (const ann of announcements) {
    const announcement = await prisma.announcement.create({
      data: ann
    });
    console.log(`Created announcement with id: ${announcement.id}`);
  }

  console.log(`Seeding finished. Created ${announcements.length} announcements.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
