#!/usr/bin/env ts-node
/**
 * Demo Data Seeding Script
 * ========================
 * Seeds realistic demo data for:
 * - Blog posts
 * - Conferences
 * - Conference Registrations
 * - Membership
 * - Notifications
 * - Reviews
 *
 * Usage:
 *   npx ts-node scripts/seed-demo-data.ts
 *   npx ts-node scripts/seed-demo-data.ts --clear-first
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const USER_EMAIL = 'koushik.saha.517@my.csun.edu';

interface Stats {
  blogsCreated: number;
  conferencesCreated: number;
  registrationsCreated: number;
  membershipCreated: number;
  notificationsCreated: number;
  reviewsCreated: number;
}

class DemoDataSeeder {
  private stats: Stats = {
    blogsCreated: 0,
    conferencesCreated: 0,
    registrationsCreated: 0,
    membershipCreated: 0,
    notificationsCreated: 0,
    reviewsCreated: 0,
  };
  private userId: string = '';
  private articleIds: string[] = [];
  private conferenceIds: string[] = [];

  /**
   * Clear existing demo data
   */
  async clearData() {
    console.log('\n⚠️  Clearing existing demo data...');

    const user = await prisma.user.findUnique({
      where: { email: USER_EMAIL },
    });

    if (user) {
      await prisma.review.deleteMany({ where: { reviewerId: user.id } });
      await prisma.notification.deleteMany({ where: { userId: user.id } });
      await prisma.conferenceRegistration.deleteMany({ where: { userId: user.id } });
      await prisma.membership.deleteMany({ where: { userId: user.id } });
      await prisma.blog.deleteMany({});
      await prisma.conference.deleteMany({});
      console.log('✓ Demo data cleared\n');
    }
  }

  /**
   * Ensure user exists
   */
  async ensureUser() {
    console.log('👤 Ensuring user account exists...');

    const passwordHash = await bcrypt.hash('password123', 10);

    const user = await prisma.user.upsert({
      where: { email: USER_EMAIL },
      update: {},
      create: {
        email: USER_EMAIL,
        passwordHash,
        name: 'Koushik Saha',
        university: 'California State University, Northridge',
        role: 'author',
        affiliation: 'Department of Computer Science',
        bio: 'PhD candidate researching AI and Machine Learning applications in academic publishing systems.',
        isEmailVerified: true,
        isActive: true,
      },
    });

    this.userId = user.id;
    console.log(`✓ User account ready: ${user.email}\n`);
  }

  /**
   * Seed blog posts
   */
  async seedBlogs() {
    console.log('📝 Creating blog posts...');

    const blogs = [
      {
        title: 'The Future of Academic Publishing in the Digital Age',
        slug: 'future-academic-publishing-digital-age',
        excerpt: 'Exploring how digital transformation is revolutionizing the way research is published, reviewed, and accessed globally.',
        content: `
# The Future of Academic Publishing in the Digital Age

The landscape of academic publishing is undergoing a dramatic transformation. With the advent of digital technologies, the traditional model of journal publishing is being challenged and reimagined.

## Key Trends

### 1. Open Access Publishing
Open access is becoming the norm rather than the exception. Researchers and institutions are increasingly demanding that publicly funded research should be freely accessible to everyone.

### 2. Preprint Servers
Platforms like arXiv and bioRxiv are changing how research is disseminated. Authors can now share their work immediately, before peer review, allowing for faster knowledge transfer.

### 3. AI-Assisted Peer Review
Artificial intelligence is being used to assist in the peer review process, helping to identify suitable reviewers, detect plagiarism, and even suggest improvements to manuscripts.

### 4. Alternative Metrics
Traditional citation counts are being supplemented with alternative metrics (altmetrics) that capture the broader impact of research, including social media mentions, policy citations, and media coverage.

## Challenges Ahead

Despite these exciting developments, several challenges remain:

- **Quality Control**: Ensuring research quality while increasing publication speed
- **Sustainability**: Finding sustainable business models for open access
- **Digital Divide**: Addressing inequalities in access to publishing platforms
- **Data Management**: Handling the increasing volume of research data

## Conclusion

The future of academic publishing is bright, but it requires collaboration between researchers, publishers, institutions, and technology providers to create a system that serves the global research community effectively.
        `,
        featuredImageUrl: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=1200',
        status: 'published',
        publishedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      },
      {
        title: 'Best Practices for Writing Research Papers',
        slug: 'best-practices-writing-research-papers',
        excerpt: 'A comprehensive guide for early-career researchers on how to structure and write compelling research papers.',
        content: `
# Best Practices for Writing Research Papers

Writing a research paper can be daunting, especially for early-career researchers. This guide provides practical tips and best practices to help you craft compelling, publishable research papers.

## Before You Start Writing

### 1. Know Your Audience
Understanding who will read your paper helps you determine the appropriate level of detail and technical language.

### 2. Choose the Right Journal
Research potential journals before you start writing. Each journal has specific requirements and target audiences.

### 3. Create an Outline
A well-structured outline serves as a roadmap for your paper and ensures logical flow of ideas.

## Writing the Paper

### Abstract
- Write it last, even though it appears first
- Include: background, methods, results, and conclusions
- Keep it concise (150-250 words)

### Introduction
- Start with a hook that captures attention
- Clearly state the research problem
- Explain why it matters
- End with your research objectives

### Methods
- Be detailed enough that others can replicate your work
- Justify your methodological choices
- Include statistical methods and analysis approaches

### Results
- Present findings objectively without interpretation
- Use tables and figures effectively
- Report both positive and negative results

### Discussion
- Interpret your findings
- Compare with existing literature
- Acknowledge limitations
- Suggest future research directions

## Common Mistakes to Avoid

1. **Poor Structure**: Jumping between ideas without logical flow
2. **Excessive Jargon**: Using complex terminology when simpler words suffice
3. **Weak Introduction**: Failing to establish the importance of your work
4. **Overstating Results**: Making claims beyond what your data supports
5. **Ignoring Guidelines**: Not following journal submission requirements

## Revision Tips

- Take a break before revising (at least a day)
- Read aloud to catch awkward phrasing
- Get feedback from colleagues
- Use professional editing services if needed
- Check references carefully

## Conclusion

Good writing is rewriting. Don't expect perfection in your first draft. Focus on getting your ideas down, then refine through multiple revisions.

Remember: Every published paper started as a blank page. With practice and persistence, you'll develop your unique writing voice and style.
        `,
        featuredImageUrl: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=1200',
        status: 'published',
        publishedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      },
      {
        title: 'Understanding the Peer Review Process',
        slug: 'understanding-peer-review-process',
        excerpt: 'Demystifying the peer review process - what happens after you submit your manuscript and how to respond to reviewer comments.',
        content: `
# Understanding the Peer Review Process

The peer review process is a cornerstone of academic publishing, but it often seems mysterious to authors, especially those new to publishing. This post explains what happens after you click "submit."

## The Submission Journey

### Stage 1: Editorial Screening
After submission, the editor performs an initial screening:
- Checks if the paper fits the journal's scope
- Ensures it meets basic quality standards
- Verifies formatting and completeness
- Decision: Desk reject or send for review

**Timeline**: 1-2 weeks

### Stage 2: Reviewer Assignment
If your paper passes screening:
- Editor identifies suitable reviewers
- Invitations sent to potential reviewers
- Reviewers accept or decline
- Multiple rounds of invitations may be needed

**Timeline**: 2-4 weeks

### Stage 3: Peer Review
Reviewers evaluate your paper on:
- **Novelty**: Is it original?
- **Significance**: Does it matter?
- **Methodology**: Is it sound?
- **Clarity**: Is it well-written?
- **References**: Is the literature review adequate?

**Timeline**: 4-8 weeks per reviewer

### Stage 4: Editorial Decision
Editor synthesizes reviewer comments and makes a decision:
- **Accept**: Rare on first submission
- **Minor Revisions**: Small changes needed
- **Major Revisions**: Substantial work required
- **Reject**: Paper doesn't meet standards

### Stage 5: Revisions (if applicable)
You revise and resubmit with:
- Revised manuscript
- Point-by-point response to reviewers
- Cover letter summarizing changes

**Timeline**: Author's choice (typically 2-4 weeks)

## Types of Peer Review

### Single-Blind
- Reviewers know author identities
- Authors don't know reviewer identities
- Most common system

### Double-Blind
- Neither party knows the other's identity
- Aims to reduce bias
- Requires careful manuscript anonymization

### Open Peer Review
- Identities known to both parties
- Reviews may be published
- Promotes accountability

### Post-Publication Review
- Paper published first, reviewed after
- Community-driven evaluation
- Emerging model

## Responding to Reviewer Comments

### Do:
- ✓ Read comments carefully multiple times
- ✓ Take time to process (don't respond immediately)
- ✓ Address every point raised
- ✓ Be respectful and professional
- ✓ Thank reviewers for their time
- ✓ Explain any disagreements politely

### Don't:
- ✗ Take criticism personally
- ✗ Ignore reviewer comments
- ✗ Be defensive or hostile
- ✗ Make changes without explanation
- ✗ Assume reviewers are wrong

## Tips for Success

1. **Choose Reviewers Wisely**: Some journals allow you to suggest reviewers
2. **Follow Instructions**: Adhere to journal guidelines exactly
3. **Be Patient**: The process takes time
4. **Stay Professional**: Maintain courtesy in all communications
5. **Learn from Feedback**: Even rejected papers provide valuable lessons

## When to Appeal

Appeal decisions only if:
- There's a clear misunderstanding
- Reviewers made factual errors
- Review process was flawed

Appeals based solely on disagreement with the decision rarely succeed.

## Conclusion

Understanding the peer review process helps set realistic expectations and navigate the publication journey more effectively. Remember, peer review improves your work - embrace it as a learning opportunity.
        `,
        featuredImageUrl: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=1200',
        status: 'published',
        publishedAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
      },
      {
        title: 'Top 10 Research Tools Every Academic Should Know',
        slug: 'top-research-tools-academics',
        excerpt: 'Essential digital tools and platforms that can streamline your research workflow and boost productivity.',
        content: `
# Top 10 Research Tools Every Academic Should Know

Modern research involves more than just lab work and literature review. The right digital tools can significantly enhance your productivity and research quality. Here are ten essential tools every academic should consider.

## 1. Reference Managers

### Zotero (Free, Open Source)
- Automatically captures citations from web browsers
- Generates bibliographies in any citation style
- Syncs across devices
- **Best for**: Researchers who want a free, comprehensive solution

### Mendeley (Free)
- PDF annotation and highlighting
- Social networking for researchers
- Institutional edition available
- **Best for**: Collaborative research projects

## 2. Writing and Collaboration

### Overleaf (Free/Paid)
- Online LaTeX editor
- Real-time collaboration
- Version control built-in
- **Best for**: Mathematical and scientific papers

### Google Docs (Free)
- Real-time collaboration
- Comment and suggestion features
- Integration with other Google services
- **Best for**: Early drafts and collaborative writing

## 3. Literature Search

### Google Scholar (Free)
- Comprehensive academic search
- Citation tracking
- Email alerts for new papers
- **Best for**: General literature searches

### Connected Papers (Free/Paid)
- Visual literature mapping
- Discover related papers
- Track research trends
- **Best for**: Literature review and discovery

## 4. Data Analysis

### R and RStudio (Free)
- Statistical computing and graphics
- Thousands of packages available
- Reproducible research support
- **Best for**: Statistical analysis and data visualization

### Python with Jupyter (Free)
- Interactive computing
- Combine code, text, and visualizations
- Multiple language support
- **Best for**: Data science and machine learning

## 5. Project Management

### Trello (Free/Paid)
- Visual project boards
- Task management
- Team collaboration
- **Best for**: Organizing research projects and to-dos

### Notion (Free/Paid)
- All-in-one workspace
- Note-taking and databases
- Project tracking
- **Best for**: Knowledge management and planning

## 6. Note-Taking

### Obsidian (Free)
- Markdown-based notes
- Bidirectional linking
- Local storage
- **Best for**: Building a personal knowledge base

### Evernote (Free/Paid)
- Cross-platform syncing
- Web clipper
- OCR for images
- **Best for**: Capturing and organizing research notes

## 7. Presentation

### Prezi (Free/Paid)
- Non-linear presentations
- Engaging visual style
- Cloud-based
- **Best for**: Conference presentations

### Canva (Free/Paid)
- Design tool for non-designers
- Poster templates
- Infographics
- **Best for**: Creating visual research materials

## 8. Academic Social Networks

### ResearchGate (Free)
- Share publications
- Ask and answer questions
- Track citations and metrics
- **Best for**: Networking and research dissemination

### Academia.edu (Free)
- Share papers and preprints
- Track readership analytics
- Discover related research
- **Best for**: Increasing paper visibility

## 9. Plagiarism Check

### Turnitin (Institutional)
- Comprehensive similarity checking
- Originality reports
- Widely accepted by journals
- **Best for**: Pre-submission checks

### Grammarly (Free/Paid)
- Grammar and plagiarism detection
- Writing suggestions
- Browser extension
- **Best for**: Writing improvement and basic checks

## 10. Time Management

### Pomodoro Technique Apps
- Focus@Will (Paid)
- Forest (Paid)
- Tomato Timer (Free)
- **Best for**: Maintaining focus during writing/analysis

## Integration Tips

1. **Start Small**: Don't try to adopt all tools at once
2. **Choose Your Stack**: Select tools that work well together
3. **Learn Shortcuts**: Invest time in learning keyboard shortcuts
4. **Backup Everything**: Use cloud storage for important files
5. **Stay Updated**: Tools evolve - keep up with new features

## Conclusion

The right tools can transform your research workflow, saving time and reducing frustration. Experiment with different options to find what works best for your specific needs and research style.

Remember: Tools are meant to support your research, not complicate it. Choose tools that genuinely solve problems you face in your workflow.
        `,
        featuredImageUrl: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=1200',
        status: 'published',
        publishedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      },
      {
        title: 'Navigating Academic Conferences: A First-Timer\'s Guide',
        slug: 'navigating-academic-conferences-guide',
        excerpt: 'Everything you need to know about attending your first academic conference, from preparation to networking.',
        content: `
# Navigating Academic Conferences: A First-Timer's Guide

Academic conferences can be intimidating, especially if it's your first time. This guide will help you prepare, participate effectively, and make the most of the networking opportunities.

## Before the Conference

### 1. Registration and Planning
- **Register Early**: Early bird rates save money
- **Book Accommodation**: Hotels near venues fill up fast
- **Review the Program**: Identify must-attend sessions
- **Submit Abstracts**: If presenting, follow guidelines carefully

### 2. What to Bring
- Business cards (at least 50)
- Laptop/tablet for note-taking
- Portable charger
- Comfortable shoes
- Professional attire (business casual usually works)
- Copies of your research (if presenting)

### 3. Prepare Your Pitch
Develop a 30-second elevator pitch about your research:
- What problem are you addressing?
- Why does it matter?
- What's your approach?
- What are your key findings?

## During the Conference

### Attending Sessions

**Do:**
- Arrive early to get good seats
- Take notes (even if slides will be shared)
- Ask thoughtful questions
- Exchange contact info with interesting speakers

**Don't:**
- Check your phone during presentations
- Leave early (it's disrespectful)
- Ask questions just to hear yourself talk
- Dominate Q&A time

### Presenting Your Work

#### Oral Presentations
- Practice timing (leave 5 minutes for questions)
- Use clear, simple slides
- Make eye contact with audience
- Speak slowly and clearly
- Anticipate common questions

#### Poster Presentations
- Stand by your poster during designated times
- Prepare a 2-minute summary
- Bring handouts with your contact info
- Be ready to discuss in detail
- Take photos for social media

### Networking Strategies

**Coffee Breaks and Meals**
- Don't eat alone - join others
- Introduce yourself to new people
- Find common research interests
- Exchange business cards

**Social Events**
- Attend conference dinners and receptions
- Join group activities
- Be approachable and friendly
- Follow up with connections later

**Twitter and Social Media**
- Use conference hashtags
- Live-tweet interesting talks
- Share photos and insights
- Connect with other attendees

## Networking Best Practices

### Starting Conversations
- "I really enjoyed your talk on..."
- "I'm working on something similar..."
- "What brought you into this field?"
- "Have you been to this conference before?"

### Following Up
Within a week after the conference:
- Email new contacts
- Connect on LinkedIn/ResearchGate
- Share relevant papers or resources
- Suggest collaboration if appropriate

## Handling Common Challenges

### Imposter Syndrome
Remember: Everyone started somewhere. Your perspective is valuable, even as a beginner.

### Social Exhaustion
It's okay to take breaks. Step outside, skip a session, or have a quiet meal alone.

### Difficult Questions
If you don't know an answer, say so honestly: "That's a great question. I haven't looked at it from that angle. Let me think about it and get back to you."

### Budget Constraints
- Look for student discounts
- Apply for travel grants
- Share accommodation
- Volunteer at the conference (often includes free registration)

## After the Conference

### 1. Follow Up
- Email new contacts within a week
- Share your presentation if requested
- Connect on academic social networks
- Send thank-you notes to anyone who helped

### 2. Process Your Notes
- Review and organize notes
- Identify new research directions
- Update your reading list
- Share insights with your research group

### 3. Plan for Next Year
- Submit abstracts early
- Volunteer to organize sessions
- Consider presenting your latest work
- Set goals for the next conference

## Types of Conference Sessions

### Keynotes
- Invited talks by leaders in the field
- Usually 45-60 minutes
- Best for getting inspired and seeing big picture

### Parallel Sessions
- Multiple concurrent tracks
- Choose based on your interests
- Can't attend everything - prioritize

### Workshops
- Hands-on learning experiences
- Often require pre-registration
- Great for skill development

### Poster Sessions
- Browse and discuss research informally
- More interactive than oral presentations
- Good for detailed discussions

## Conference Etiquette

- Respect time limits in Q&A
- Turn off phone notifications
- Don't photograph presentations without permission
- Acknowledge others' contributions
- Be inclusive in conversations
- Respect diverse perspectives

## Making the Most of Virtual Conferences

With the rise of hybrid/virtual conferences:
- Test technology beforehand
- Find a quiet space for participation
- Engage in chat discussions
- Use virtual networking features
- Take advantage of recorded sessions

## Conclusion

Conferences are invaluable for learning, networking, and career development. While they can be overwhelming at first, with preparation and the right mindset, they become exciting opportunities to engage with your research community.

Remember: Everyone was a first-timer once. Be yourself, be curious, and be open to new connections and ideas.

---

**Pro Tip**: Keep a conference journal. After each conference, write down key takeaways, new contacts, and how the experience influenced your research direction. You'll be amazed how much you learn and grow over time.
        `,
        featuredImageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200',
        status: 'published',
        publishedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
      },
    ];

    for (const blogData of blogs) {
      try {
        await prisma.blog.upsert({
          where: { slug: blogData.slug },
          update: {
            ...blogData,
            authorId: this.userId,
            viewCount: Math.floor(Math.random() * 1000) + 100,
          },
          create: {
            ...blogData,
            authorId: this.userId,
            viewCount: Math.floor(Math.random() * 1000) + 100,
          },
        });
        this.stats.blogsCreated++;
        console.log(`  ✓ Created blog: ${blogData.title.substring(0, 50)}...`);
      } catch (error: any) {
        console.error(`  ✗ Error creating blog: ${error.message}`);
      }
    }

    console.log(`✓ Created ${this.stats.blogsCreated} blog posts\n`);
  }

  /**
   * Seed conferences
   */
  async seedConferences() {
    console.log('🎤 Creating conferences...');

    const conferences = [
      {
        title: 'International Conference on Artificial Intelligence and Machine Learning 2026',
        description: 'Join leading researchers and practitioners from around the world to explore the latest advances in AI and ML. Topics include deep learning, natural language processing, computer vision, reinforcement learning, and AI ethics.',
        startDate: new Date('2026-06-15'),
        endDate: new Date('2026-06-18'),
        venue: 'Los Angeles Convention Center',
        city: 'Los Angeles',
        country: 'United States',
        websiteUrl: 'https://icaiml2026.example.com',
        registrationUrl: 'https://icaiml2026.example.com/register',
        submissionDeadline: new Date('2026-03-01'),
        notificationDate: new Date('2026-04-15'),
        conferenceType: 'hybrid',
        status: 'upcoming',
      },
      {
        title: 'IEEE International Symposium on Information Systems Management',
        description: 'This premier symposium brings together academics and industry professionals to discuss emerging trends in information systems, digital transformation, cybersecurity, and data analytics.',
        startDate: new Date('2026-08-20'),
        endDate: new Date('2026-08-23'),
        venue: 'Hilton San Francisco Union Square',
        city: 'San Francisco',
        country: 'United States',
        websiteUrl: 'https://ieee-ism2026.example.com',
        registrationUrl: 'https://ieee-ism2026.example.com/register',
        submissionDeadline: new Date('2026-04-30'),
        notificationDate: new Date('2026-06-15'),
        conferenceType: 'in_person',
        status: 'upcoming',
      },
      {
        title: 'Global Summit on Business Intelligence and Data Science',
        description: 'Explore the intersection of business intelligence and data science. Learn about predictive analytics, data visualization, business process optimization, and AI-driven decision making.',
        startDate: new Date('2026-10-05'),
        endDate: new Date('2026-10-07'),
        venue: 'Virtual Conference',
        city: 'Online',
        country: 'Global',
        websiteUrl: 'https://gsbi-ds2026.example.com',
        registrationUrl: 'https://gsbi-ds2026.example.com/register',
        submissionDeadline: new Date('2026-07-01'),
        notificationDate: new Date('2026-08-15'),
        conferenceType: 'virtual',
        status: 'upcoming',
      },
      {
        title: 'ACM Conference on Human-Computer Interaction',
        description: 'A premier forum for presenting research in the design and use of human-computer interaction. Topics include user experience, accessibility, interaction design, and usability testing.',
        startDate: new Date('2026-05-10'),
        endDate: new Date('2026-05-13'),
        venue: 'Boston Convention and Exhibition Center',
        city: 'Boston',
        country: 'United States',
        websiteUrl: 'https://acm-hci2026.example.com',
        registrationUrl: 'https://acm-hci2026.example.com/register',
        submissionDeadline: new Date('2026-01-15'),
        notificationDate: new Date('2026-03-01'),
        conferenceType: 'hybrid',
        status: 'upcoming',
      },
      {
        title: 'International Workshop on Educational Technology and Learning Analytics',
        description: 'Focus on the latest research in educational technology, learning analytics, online learning platforms, and pedagogical innovations. Perfect for educators and ed-tech researchers.',
        startDate: new Date('2025-12-01'),
        endDate: new Date('2025-12-03'),
        venue: 'University of California, San Diego',
        city: 'San Diego',
        country: 'United States',
        websiteUrl: 'https://iwetla2025.example.com',
        registrationUrl: 'https://iwetla2025.example.com/register',
        submissionDeadline: new Date('2025-08-31'),
        notificationDate: new Date('2025-10-15'),
        conferenceType: 'in_person',
        status: 'completed',
      },
    ];

    for (const confData of conferences) {
      try {
        const conference = await prisma.conference.create({
          data: confData,
        });
        this.conferenceIds.push(conference.id);
        this.stats.conferencesCreated++;
        console.log(`  ✓ Created conference: ${confData.title.substring(0, 60)}...`);
      } catch (error: any) {
        console.error(`  ✗ Error creating conference: ${error.message}`);
      }
    }

    console.log(`✓ Created ${this.stats.conferencesCreated} conferences\n`);
  }

  /**
   * Seed conference registrations
   */
  async seedConferenceRegistrations() {
    console.log('🎫 Creating conference registrations...');

    // Register for 3 out of 5 conferences
    const registrationsToCreate = this.conferenceIds.slice(0, 3);

    for (const conferenceId of registrationsToCreate) {
      try {
        await prisma.conferenceRegistration.create({
          data: {
            conferenceId,
            userId: this.userId,
            registrationType: 'academic',
            paymentStatus: 'completed',
            paymentAmount: 450.0,
            stripePaymentId: `pi_${Math.random().toString(36).substring(7)}`,
            registeredAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
          },
        });
        this.stats.registrationsCreated++;
        console.log(`  ✓ Registered for conference`);
      } catch (error: any) {
        console.error(`  ✗ Error creating registration: ${error.message}`);
      }
    }

    console.log(`✓ Created ${this.stats.registrationsCreated} conference registrations\n`);
  }

  /**
   * Seed membership
   */
  async seedMembership() {
    console.log('💳 Creating membership...');

    try {
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2026-12-31');

      await prisma.membership.upsert({
        where: { userId: this.userId },
        update: {
          tier: 'premium',
          status: 'active',
          startDate,
          endDate,
          autoRenew: true,
          stripeSubscriptionId: `sub_${Math.random().toString(36).substring(7)}`,
        },
        create: {
          userId: this.userId,
          tier: 'premium',
          status: 'active',
          startDate,
          endDate,
          autoRenew: true,
          stripeSubscriptionId: `sub_${Math.random().toString(36).substring(7)}`,
        },
      });

      this.stats.membershipCreated = 1;
      console.log(`  ✓ Created premium membership (valid until Dec 31, 2026)\n`);
    } catch (error: any) {
      console.error(`  ✗ Error creating membership: ${error.message}\n`);
    }
  }

  /**
   * Seed notifications
   */
  async seedNotifications() {
    console.log('🔔 Creating notifications...');

    const notifications = [
      {
        type: 'submission_update',
        title: 'Article Submission Accepted',
        message: 'Your article "Machine Learning Applications in Healthcare" has been accepted for publication in JAMSAI!',
        link: '/dashboard/submissions',
        isRead: false,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        type: 'review_request',
        title: 'New Review Request',
        message: 'You have been assigned to review "Deep Learning for Natural Language Processing" for JITMB.',
        link: '/dashboard/reviews',
        isRead: false,
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      },
      {
        type: 'submission_update',
        title: 'Revision Required',
        message: 'Your article "AI in Education" requires minor revisions. Please review the comments from the reviewers.',
        link: '/dashboard/submissions',
        isRead: true,
        readAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      },
      {
        type: 'message',
        title: 'Conference Registration Confirmed',
        message: 'Your registration for the International Conference on AI and ML 2026 has been confirmed.',
        link: '/conferences',
        isRead: true,
        readAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
      },
      {
        type: 'submission_update',
        title: 'Article Published',
        message: 'Your article "Blockchain Applications in Supply Chain" has been published in OJBEM Vol. 12, Issue 3.',
        link: '/dashboard/submissions',
        isRead: true,
        readAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      },
      {
        type: 'review_request',
        title: 'Review Submitted Successfully',
        message: 'Thank you for submitting your review for "IoT Security Framework". The editor has been notified.',
        link: '/dashboard/reviews',
        isRead: true,
        readAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000),
      },
      {
        type: 'message',
        title: 'Membership Renewed',
        message: 'Your premium membership has been automatically renewed for another year.',
        link: '/membership',
        isRead: true,
        readAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000),
      },
      {
        type: 'submission_update',
        title: 'Submission Received',
        message: 'We have received your submission "Cloud Computing Security". It is now undergoing editorial review.',
        link: '/dashboard/submissions',
        isRead: true,
        readAt: new Date(Date.now() - 55 * 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      },
    ];

    for (const notifData of notifications) {
      try {
        await prisma.notification.create({
          data: {
            userId: this.userId,
            ...notifData,
          },
        });
        this.stats.notificationsCreated++;
      } catch (error: any) {
        console.error(`  ✗ Error creating notification: ${error.message}`);
      }
    }

    console.log(`✓ Created ${this.stats.notificationsCreated} notifications\n`);
  }

  /**
   * Seed reviews
   */
  async seedReviews() {
    console.log('📋 Creating reviews...');

    // Get some published articles to create reviews for
    const articles = await prisma.article.findMany({
      where: { status: 'published' },
      take: 5,
      select: { id: true, title: true },
    });

    if (articles.length === 0) {
      console.log('  ⚠ No published articles found. Skipping review creation.\n');
      return;
    }

    this.articleIds = articles.map((a) => a.id);

    const reviews = [
      {
        reviewerNumber: 1,
        round: 1,
        status: 'completed',
        decision: 'accept',
        commentsToAuthor: `This is an excellent paper that makes significant contributions to the field. The methodology is sound, the results are compelling, and the writing is clear and well-organized.

**Strengths:**
- Novel approach to the problem
- Comprehensive literature review
- Rigorous experimental design
- Clear presentation of results
- Important implications for future research

**Minor Suggestions:**
- Consider adding more details about the limitations in Section 4
- Figure 3 could benefit from higher resolution
- A few typos in the references section

Overall, this is publication-ready with minor revisions. Congratulations on excellent work!`,
        commentsToEditor: 'I strongly recommend acceptance. This paper meets the high standards of the journal and will be of great interest to our readers.',
        assignedAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
        dueDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        submittedAt: new Date(Date.now() - 32 * 24 * 60 * 60 * 1000),
      },
      {
        reviewerNumber: 2,
        round: 1,
        status: 'completed',
        decision: 'accept',
        commentsToAuthor: `This paper addresses an important problem and presents valuable findings. The research design is appropriate and the analysis is thorough.

**Strengths:**
- Timely and relevant topic
- Well-structured paper
- Adequate sample size
- Proper statistical analysis
- Good discussion of implications

**Suggestions for Improvement:**
- The introduction could better motivate the research question
- Some methodological details are missing (see specific comments)
- The discussion could explore alternative explanations more thoroughly
- Consider reorganizing Section 3 for better flow

I recommend acceptance after addressing these points.`,
        commentsToEditor: 'A solid contribution that merits publication after minor revisions.',
        assignedAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000),
        dueDate: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
        submittedAt: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000),
      },
      {
        reviewerNumber: 1,
        round: 1,
        status: 'completed',
        decision: 'accept',
        commentsToAuthor: `Thank you for submitting this interesting work. The paper investigates an important question and provides useful insights.

**Major Comments:**
- The methodology section needs more detail about data collection procedures
- Statistical analysis is appropriate but assumptions should be verified
- Results section would benefit from additional visualization
- Discussion should more clearly address limitations

**Minor Comments:**
- Abstract is too long (should be max 250 words)
- References need to be updated with more recent literature
- Tables 2 and 3 could be combined
- Several formatting issues throughout

This work has merit but requires revision before publication. I look forward to seeing the revised version.`,
        commentsToEditor: 'Interesting research with potential, but needs substantial revision before acceptance.',
        assignedAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000),
        dueDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
        submittedAt: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000),
      },
      {
        reviewerNumber: 3,
        round: 1,
        status: 'in_progress',
        decision: null,
        commentsToAuthor: null,
        commentsToEditor: null,
        assignedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        submittedAt: null,
      },
      {
        reviewerNumber: 2,
        round: 1,
        status: 'pending',
        decision: null,
        commentsToAuthor: null,
        commentsToEditor: null,
        assignedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        submittedAt: null,
      },
    ];

    for (let i = 0; i < reviews.length && i < this.articleIds.length; i++) {
      try {
        // Check if review already exists with this articleId and reviewerNumber
        const existingReview = await prisma.review.findFirst({
          where: {
            articleId: this.articleIds[i],
            reviewerNumber: reviews[i].reviewerNumber,
          },
        });

        if (existingReview) {
          console.log(`  ⊘ Review already exists for article ${i + 1}, reviewer ${reviews[i].reviewerNumber}`);
          continue;
        }

        await prisma.review.create({
          data: {
            articleId: this.articleIds[i],
            reviewerId: this.userId,
            ...reviews[i],
          },
        });
        this.stats.reviewsCreated++;
        console.log(`  ✓ Created review (${reviews[i].status})`);
      } catch (error: any) {
        console.error(`  ✗ Error creating review: ${error.message}`);
      }
    }

    console.log(`✓ Created ${this.stats.reviewsCreated} reviews\n`);
  }

  /**
   * Print summary
   */
  printSummary() {
    console.log('='.repeat(60));
    console.log('📊 DEMO DATA SEEDING SUMMARY');
    console.log('='.repeat(60));
    console.log(`User:                  ${USER_EMAIL}`);
    console.log(`Blogs created:         ${this.stats.blogsCreated}`);
    console.log(`Conferences created:   ${this.stats.conferencesCreated}`);
    console.log(`Registrations:         ${this.stats.registrationsCreated}`);
    console.log(`Membership:            ${this.stats.membershipCreated ? 'Premium (Active)' : 'Not created'}`);
    console.log(`Notifications:         ${this.stats.notificationsCreated}`);
    console.log(`Reviews:               ${this.stats.reviewsCreated}`);
    console.log('='.repeat(60));
    console.log('\n✓ Demo data seeding completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Login with: koushik.saha.517@my.csun.edu / password123');
    console.log('2. Visit dashboard to see your data');
    console.log('3. Check notifications, reviews, and conferences');
    console.log('4. Browse blog posts on the homepage\n');
  }

  /**
   * Run seeding
   */
  async run(clearFirst: boolean = false) {
    console.log('='.repeat(60));
    console.log('🌱 DEMO DATA SEEDING SCRIPT');
    console.log('='.repeat(60));
    console.log(`User: ${USER_EMAIL}`);
    console.log(`Clear first: ${clearFirst}`);
    console.log('='.repeat(60));

    try {
      if (clearFirst) {
        await this.clearData();
      }

      await this.ensureUser();
      await this.seedBlogs();
      await this.seedConferences();
      await this.seedConferenceRegistrations();
      await this.seedMembership();
      await this.seedNotifications();
      await this.seedReviews();

      this.printSummary();
    } catch (error) {
      console.error('\n✗ Error during seeding:', error);
      throw error;
    }
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const clearFirst = args.includes('--clear-first');

  const seeder = new DemoDataSeeder();
  await seeder.run(clearFirst);
}

main()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
