#!/usr/bin/env ts-node
/**
 * Professional Academic Data Seeding Script
 * ============================================
 * Seeds realistic Google Scholar-like academic data into the IJAISM database.
 * 
 * This script creates:
 * - Professional authors with ORCIDs, affiliations, and bios
 * - High-quality articles with realistic titles, abstracts, keywords
 * - Proper academic metadata (DOIs, citations, views, downloads)
 * - Distributed across all 12 journals
 * 
 * Usage:
 *   npx ts-node scripts/seed-professional-data.ts
 *   npx ts-node scripts/seed-professional-data.ts --clear-first
 * 
 * Requirements:
 *   npm install ts-node @types/node --save-dev
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Professional academic authors with Google Scholar-like profiles
const PROFESSIONAL_AUTHORS = [
  {
    name: 'Dr. Sarah Chen',
    email: 'sarah.chen@stanford.edu',
    university: 'Stanford University',
    affiliation: 'Department of Computer Science',
    orcid: '0000-0001-7123-4567',
    bio: 'Dr. Chen is a Professor of Computer Science specializing in machine learning and artificial intelligence. Her research focuses on deep learning applications in healthcare and natural language processing. She has published over 150 papers with 15,000+ citations.',
    role: 'author' as const,
  },
  {
    name: 'Prof. Michael Rodriguez',
    email: 'm.rodriguez@mit.edu',
    university: 'Massachusetts Institute of Technology',
    affiliation: 'Sloan School of Management',
    orcid: '0000-0002-8234-5678',
    bio: 'Professor Rodriguez is an expert in business analytics and data science. His work on predictive analytics has been widely cited in the business and technology sectors. He holds a Ph.D. in Operations Research from MIT.',
    role: 'author' as const,
  },
  {
    name: 'Dr. Emily Watson',
    email: 'e.watson@harvard.edu',
    university: 'Harvard University',
    affiliation: 'Department of Health Informatics',
    orcid: '0000-0003-9345-6789',
    bio: 'Dr. Watson is a leading researcher in health informatics and digital health solutions. Her interdisciplinary research bridges computer science and healthcare, focusing on patient-centered technology solutions.',
    role: 'author' as const,
  },
  {
    name: 'Prof. David Kim',
    email: 'd.kim@berkeley.edu',
    university: 'University of California, Berkeley',
    affiliation: 'Haas School of Business',
    orcid: '0000-0004-0456-7890',
    bio: 'Professor Kim specializes in information systems and business strategy. His research examines how organizations leverage technology for competitive advantage. He has advised numerous Fortune 500 companies.',
    role: 'author' as const,
  },
  {
    name: 'Dr. Jessica Taylor',
    email: 'j.taylor@oxford.ac.uk',
    university: 'University of Oxford',
    affiliation: 'Department of Engineering Science',
    orcid: '0000-0005-1567-8901',
    bio: 'Dr. Taylor is a Senior Research Fellow focusing on sustainable technology and environmental engineering. Her work on renewable energy systems has received international recognition.',
    role: 'author' as const,
  },
  {
    name: 'Prof. Robert Brown',
    email: 'r.brown@cambridge.ac.uk',
    university: 'University of Cambridge',
    affiliation: 'Judge Business School',
    orcid: '0000-0006-2678-9012',
    bio: 'Professor Brown is an expert in organizational behavior and leadership. His research on digital transformation in organizations has influenced management practices globally.',
    role: 'author' as const,
  },
  {
    name: 'Dr. Maria Garcia',
    email: 'm.garcia@ethz.ch',
    university: 'ETH Zurich',
    affiliation: 'Department of Mathematics',
    orcid: '0000-0007-3789-0123',
    bio: 'Dr. Garcia is a mathematician specializing in statistical learning theory and optimization. Her theoretical contributions have advanced the understanding of machine learning algorithms.',
    role: 'author' as const,
  },
  {
    name: 'Prof. James Anderson',
    email: 'j.anderson@nus.edu.sg',
    university: 'National University of Singapore',
    affiliation: 'School of Computing',
    orcid: '0000-0008-4890-1234',
    bio: 'Professor Anderson researches cybersecurity and network systems. His work on secure communication protocols has been adopted in industry standards. He holds multiple patents.',
    role: 'author' as const,
  },
  {
    name: 'Dr. Lisa Wang',
    email: 'l.wang@tsinghua.edu.cn',
    university: 'Tsinghua University',
    affiliation: 'School of Economics and Management',
    orcid: '0000-0009-5901-2345',
    bio: 'Dr. Wang is a leading scholar in innovation management and entrepreneurship. Her research on technology startups has been published in top-tier journals and cited extensively.',
    role: 'author' as const,
  },
  {
    name: 'Prof. Ahmed Hassan',
    email: 'a.hassan@aub.edu.lb',
    university: 'American University of Beirut',
    affiliation: 'Department of Computer Science',
    orcid: '0000-0001-6012-3456',
    bio: 'Professor Hassan specializes in software engineering and empirical software studies. His research on software quality and development practices has influenced the industry.',
    role: 'author' as const,
  },
  {
    name: 'Dr. Priya Patel',
    email: 'p.patel@iitb.ac.in',
    university: 'Indian Institute of Technology Bombay',
    affiliation: 'Department of Industrial Engineering',
    orcid: '0000-0002-7123-4567',
    bio: 'Dr. Patel is an expert in operations research and supply chain management. Her optimization models have been applied in manufacturing and logistics industries.',
    role: 'author' as const,
  },
  {
    name: 'Prof. François Dubois',
    email: 'f.dubois@polytechnique.edu',
    university: 'École Polytechnique',
    affiliation: 'Department of Applied Mathematics',
    orcid: '0000-0003-8234-5678',
    bio: 'Professor Dubois researches numerical methods and scientific computing. His algorithms are widely used in computational fluid dynamics and engineering simulations.',
    role: 'author' as const,
  },
  {
    name: 'Dr. Anna Schmidt',
    email: 'a.schmidt@tum.de',
    university: 'Technical University of Munich',
    affiliation: 'Department of Informatics',
    orcid: '0000-0004-9345-6789',
    bio: 'Dr. Schmidt specializes in human-computer interaction and user experience design. Her research on adaptive interfaces has improved accessibility in digital systems.',
    role: 'author' as const,
  },
  {
    name: 'Prof. Kenji Tanaka',
    email: 'k.tanaka@u-tokyo.ac.jp',
    university: 'University of Tokyo',
    affiliation: 'Graduate School of Information Science',
    orcid: '0000-0005-0456-7890',
    bio: 'Professor Tanaka is a pioneer in quantum computing and information theory. His theoretical contributions have advanced quantum algorithms and error correction.',
    role: 'author' as const,
  },
  {
    name: 'Dr. Sophie Martin',
    email: 's.martin@unsw.edu.au',
    university: 'University of New South Wales',
    affiliation: 'School of Information Systems',
    orcid: '0000-0006-1567-8901',
    bio: 'Dr. Martin researches digital transformation and IT governance. Her work on enterprise architecture has been adopted by global organizations.',
    role: 'author' as const,
  },
];

// Journal codes for distribution
const JOURNAL_CODES = [
  'JITMB', 'JSAE', 'AMLID', 'OJBEM', 'PRAIHI',
  'JBVADA', 'JAMSAI', 'AESI', 'ILPROM', 'TBFLI', 'PMSRI', 'DRSDR'
];

// Professional article templates with Google Scholar-like quality
const ARTICLE_TEMPLATES = [
  {
    title: 'Deep Learning Approaches for Predictive Analytics in Business Intelligence',
    abstract: 'This study presents a comprehensive framework for applying deep learning techniques to business intelligence and predictive analytics. We propose a novel architecture combining convolutional neural networks with recurrent networks to analyze temporal business data. Our experimental evaluation on real-world datasets from Fortune 500 companies demonstrates significant improvements in prediction accuracy compared to traditional methods. The framework achieves 94.3% accuracy in revenue forecasting and 89.7% precision in customer churn prediction. We discuss the implications for business decision-making and provide guidelines for implementation in enterprise environments.',
    keywords: ['Deep Learning', 'Business Intelligence', 'Predictive Analytics', 'Neural Networks', 'Data Mining'],
    articleType: 'research' as const,
  },
  {
    title: 'Machine Learning Models for Early Disease Detection: A Systematic Review',
    abstract: 'Early disease detection is critical for improving patient outcomes and reducing healthcare costs. This systematic review examines machine learning approaches for early disease detection across various medical domains. We analyzed 247 peer-reviewed studies published between 2018 and 2024, covering applications in oncology, cardiology, neurology, and infectious diseases. Our analysis reveals that ensemble methods and deep learning architectures show the highest performance, with average sensitivity of 87.4% and specificity of 91.2%. We identify key challenges including data quality, model interpretability, and clinical validation. The review provides recommendations for future research directions and clinical implementation strategies.',
    keywords: ['Machine Learning', 'Disease Detection', 'Healthcare', 'Clinical Decision Support', 'Medical Informatics'],
    articleType: 'review' as const,
  },
  {
    title: 'Digital Transformation Strategies in Small and Medium Enterprises: A Multi-Case Study',
    abstract: 'Small and medium enterprises (SMEs) face unique challenges in digital transformation compared to large corporations. This multi-case study examines digital transformation strategies across 15 SMEs in different industries, including manufacturing, retail, and professional services. We conducted in-depth interviews with 45 executives and analyzed internal documents over a two-year period. Our findings reveal four distinct transformation archetypes: incremental adapters, strategic innovators, customer-driven transformers, and efficiency seekers. Success factors include leadership commitment, employee engagement, customer-centric approaches, and agile methodologies. We propose a framework to guide SME digital transformation and identify common pitfalls to avoid.',
    keywords: ['Digital Transformation', 'SMEs', 'Strategy', 'Case Study', 'Technology Adoption'],
    articleType: 'case_study' as const,
  },
  {
    title: 'Natural Language Processing for Automated Literature Review: Opportunities and Limitations',
    abstract: 'The exponential growth of scientific literature has made manual literature reviews increasingly challenging. This study explores the application of natural language processing (NLP) techniques for automated literature review generation. We developed and evaluated a system combining named entity recognition, topic modeling, and summarization algorithms. Our system processes 10,000+ papers and generates comprehensive reviews in minutes, compared to weeks for manual reviews. Evaluation by domain experts shows 82% accuracy in identifying relevant papers and 76% coherence in generated summaries. However, limitations include potential bias, difficulty with nuanced arguments, and the need for human oversight. We discuss ethical considerations and propose guidelines for responsible use of automated review systems.',
    keywords: ['Natural Language Processing', 'Literature Review', 'Automation', 'Text Mining', 'Scientific Writing'],
    articleType: 'research' as const,
  },
  {
    title: 'Blockchain Technology for Supply Chain Transparency: Implementation Challenges',
    abstract: 'Blockchain technology promises to revolutionize supply chain management by providing unprecedented transparency and traceability. This research investigates implementation challenges faced by organizations adopting blockchain for supply chain applications. Through surveys of 127 companies and case studies of 8 early adopters, we identify technical, organizational, and regulatory barriers. Key technical challenges include scalability, interoperability, and energy consumption. Organizational barriers include resistance to change, lack of technical expertise, and coordination with partners. Regulatory uncertainty and standardization issues also impede adoption. We propose solutions including hybrid architectures, consortium models, and phased implementation strategies. Our findings inform both practitioners and policymakers on blockchain adoption in supply chains.',
    keywords: ['Blockchain', 'Supply Chain', 'Transparency', 'Traceability', 'Implementation'],
    articleType: 'research' as const,
  },
  {
    title: 'Artificial Intelligence Ethics in Healthcare: A Framework for Responsible Implementation',
    abstract: 'As artificial intelligence becomes increasingly integrated into healthcare systems, ethical considerations gain paramount importance. This study develops a comprehensive framework for ethical AI implementation in healthcare settings. Drawing from medical ethics, computer ethics, and regulatory guidelines, we propose six core principles: beneficence, non-maleficence, autonomy, justice, explicability, and accountability. The framework addresses key issues including algorithmic bias, privacy concerns, informed consent, and liability. We present case studies illustrating ethical dilemmas and demonstrate how the framework guides decision-making. We also propose governance structures and processes to ensure ethical AI development and deployment. The framework serves as a practical tool for healthcare organizations, developers, and regulators.',
    keywords: ['AI Ethics', 'Healthcare', 'Responsible AI', 'Medical Ethics', 'Algorithmic Bias'],
    articleType: 'research' as const,
  },
  {
    title: 'Cloud Computing Adoption in Higher Education: Benefits, Challenges, and Best Practices',
    abstract: 'Cloud computing has transformed IT infrastructure in higher education institutions worldwide. This comprehensive study examines cloud adoption patterns, benefits realized, challenges encountered, and best practices developed across 50 universities. Data collection included surveys of IT administrators, interviews with CIOs, and analysis of adoption documentation. Key benefits include cost reduction (average 35% IT savings), improved scalability, enhanced collaboration, and disaster recovery capabilities. Major challenges involve data security, vendor lock-in, integration complexity, and change management. We identify successful adoption strategies including phased migration, strong governance, comprehensive training, and hybrid architectures. The study provides a roadmap for institutions considering or implementing cloud solutions.',
    keywords: ['Cloud Computing', 'Higher Education', 'IT Infrastructure', 'Digital Transformation', 'Institutional Management'],
    articleType: 'research' as const,
  },
  {
    title: 'Robotic Process Automation in Financial Services: Impact on Operational Efficiency',
    abstract: 'Robotic Process Automation (RPA) has emerged as a transformative technology in financial services, automating repetitive tasks and improving operational efficiency. This empirical study analyzes RPA implementation in 25 financial institutions, measuring impact on processing time, error rates, and costs. Our analysis reveals average time savings of 68%, error reduction of 82%, and cost savings of 43% in automated processes. However, we also identify challenges including implementation complexity, maintenance requirements, and employee resistance. We examine factors contributing to successful RPA projects, including process selection, change management, and governance. The study provides insights for financial institutions planning RPA initiatives and contributes to understanding automation economics in service industries.',
    keywords: ['RPA', 'Financial Services', 'Automation', 'Operational Efficiency', 'Digital Transformation'],
    articleType: 'research' as const,
  },
  {
    title: 'Data Privacy Regulations and Their Impact on Data Analytics: A Comparative Study',
    abstract: 'Global data privacy regulations, including GDPR, CCPA, and emerging frameworks, significantly impact how organizations conduct data analytics. This comparative study examines regulatory requirements and their practical implications for data analytics operations. We analyze regulations from the European Union, United States, Brazil, India, and China, identifying common themes and unique requirements. Key challenges include data minimization principles, consent management, right to explanation, and cross-border data transfers. We present case studies of organizations adapting their analytics practices to comply with regulations while maintaining analytical value. Our research provides guidance for organizations operating in multiple jurisdictions and contributes to understanding the evolving landscape of privacy-preserving analytics.',
    keywords: ['Data Privacy', 'GDPR', 'Regulations', 'Data Analytics', 'Compliance'],
    articleType: 'research' as const,
  },
  {
    title: 'Sustainable Technology Solutions for Climate Change Mitigation: A Systematic Analysis',
    abstract: 'Technology plays a crucial role in addressing climate change challenges. This systematic analysis reviews sustainable technology solutions across energy, transportation, agriculture, and manufacturing sectors. We evaluated 300+ technologies based on impact potential, scalability, cost-effectiveness, and implementation feasibility. Our analysis identifies high-impact solutions including renewable energy systems, electric vehicles, precision agriculture, and circular economy technologies. We examine barriers to adoption including cost, infrastructure requirements, and policy support. The study proposes an integrated approach combining technological innovation, policy intervention, and behavioral change. Our findings inform policymakers, investors, and technology developers on prioritizing sustainable technology investments for maximum climate impact.',
    keywords: ['Sustainability', 'Climate Change', 'Technology', 'Renewable Energy', 'Environmental Innovation'],
    articleType: 'review' as const,
  },
  {
    title: 'Cybersecurity Threats in Internet of Things Ecosystems: A Risk Assessment Framework',
    abstract: 'The proliferation of Internet of Things (IoT) devices introduces new cybersecurity vulnerabilities and attack vectors. This research develops a comprehensive risk assessment framework for IoT ecosystems, considering device, network, and application layers. We analyzed 150+ reported IoT security incidents to identify common vulnerabilities, attack patterns, and impact levels. The framework incorporates technical risk factors (vulnerability severity, exploitability) and business risk factors (asset criticality, impact scope). We validate the framework through case studies of smart city deployments and industrial IoT systems. Our assessment reveals that 73% of IoT devices have critical vulnerabilities, with healthcare and critical infrastructure showing highest risk levels. The framework enables organizations to prioritize security investments and implement layered defense strategies.',
    keywords: ['Cybersecurity', 'IoT', 'Risk Assessment', 'Vulnerability', 'Security Framework'],
    articleType: 'research' as const,
  },
  {
    title: 'Predictive Maintenance in Manufacturing: Machine Learning Applications and Economic Impact',
    abstract: 'Predictive maintenance represents a paradigm shift from reactive to proactive maintenance strategies in manufacturing. This study examines machine learning applications for predictive maintenance and quantifies economic impact through case studies of 20 manufacturing facilities. We developed and deployed ML models predicting equipment failures with 87% accuracy and 14-day advance warning. Economic analysis reveals average cost savings of $2.3 million per facility annually, primarily from reduced downtime (38% decrease), optimized maintenance scheduling (27% efficiency gain), and extended equipment lifetime (12% increase). We compare different ML approaches including time series forecasting, anomaly detection, and ensemble methods. The study provides implementation guidelines and ROI calculation methods for manufacturing organizations considering predictive maintenance adoption.',
    keywords: ['Predictive Maintenance', 'Manufacturing', 'Machine Learning', 'Industry 4.0', 'Economic Analysis'],
    articleType: 'research' as const,
  },
  {
    title: 'Social Media Analytics for Business Intelligence: Methods, Applications, and Challenges',
    abstract: 'Social media platforms generate vast amounts of data offering insights into customer behavior, market trends, and brand perception. This comprehensive review examines methods and applications of social media analytics for business intelligence. We survey text mining, sentiment analysis, network analysis, and trend detection techniques. Applications include customer segmentation, brand monitoring, product development, crisis management, and competitive intelligence. Through analysis of 50+ case studies, we demonstrate measurable business impact including increased sales (average 15%), improved customer satisfaction (12% gain), and enhanced brand reputation. However, challenges persist including data quality, privacy concerns, real-time processing requirements, and integration with existing BI systems. We discuss emerging trends including multi-modal analysis and ethical considerations in social media intelligence.',
    keywords: ['Social Media Analytics', 'Business Intelligence', 'Sentiment Analysis', 'Text Mining', 'Customer Insights'],
    articleType: 'review' as const,
  },
  {
    title: 'Quantum Computing Algorithms for Optimization Problems: Current State and Future Prospects',
    abstract: 'Quantum computing promises exponential speedups for certain optimization problems, potentially revolutionizing fields including logistics, finance, and drug discovery. This study reviews quantum algorithms for optimization, including quantum approximate optimization algorithm (QAOA), quantum annealing, and variational quantum eigensolver (VQE). We analyze algorithmic performance, hardware requirements, and practical limitations of current quantum computers. While theoretical advantages are clear, practical implementation faces challenges including qubit coherence, error rates, and limited qubit counts. We present benchmarking results on problems ranging from 10 to 100 variables, comparing quantum and classical approaches. The study identifies promising near-term applications and outlines a roadmap for quantum optimization adoption. We also discuss hybrid quantum-classical approaches that may deliver value before fully fault-tolerant quantum computers are available.',
    keywords: ['Quantum Computing', 'Optimization', 'Quantum Algorithms', 'QAOA', 'Computational Complexity'],
    articleType: 'review' as const,
  },
  {
    title: 'Augmented Reality in Education: Enhancing Learning Experiences Through Immersive Technology',
    abstract: 'Augmented Reality (AR) technology offers innovative ways to enhance educational experiences by overlaying digital information onto the physical world. This research investigates AR applications in K-12 and higher education through experimental studies and case analysis. We developed AR learning modules for subjects including biology, chemistry, history, and mathematics, and evaluated learning outcomes with 500+ students. Results show 34% improvement in knowledge retention, 42% increase in engagement, and 28% enhancement in problem-solving skills compared to traditional methods. We examine different AR approaches including marker-based, location-based, and markerless AR, analyzing their respective advantages. The study also addresses implementation challenges including cost, technical requirements, content development, and teacher training. We provide recommendations for educators and institutions considering AR adoption.',
    keywords: ['Augmented Reality', 'Education', 'Learning Technology', 'Immersive Learning', 'Educational Innovation'],
    articleType: 'research' as const,
  },
  {
    title: 'Explainable AI in Healthcare Decision Support: Bridging the Interpretability Gap',
    abstract: 'As AI systems become integral to healthcare decision-making, the need for explainable AI (XAI) grows critical. This study develops and evaluates XAI techniques for healthcare applications, focusing on methods that provide clinically meaningful explanations. We implemented and compared various explanation methods including LIME, SHAP, attention mechanisms, and rule-based systems across diagnostic, prognostic, and treatment recommendation tasks. Evaluation by 30 clinicians reveals that rule-based explanations achieve highest trust (4.2/5.0) and usefulness (4.5/5.0) ratings, though at the cost of some model accuracy. We propose a framework for XAI in healthcare that balances accuracy, interpretability, and clinical utility. Case studies demonstrate successful XAI integration in radiology, pathology, and clinical decision support systems. The research contributes to building trustworthy AI systems for critical healthcare applications.',
    keywords: ['Explainable AI', 'Healthcare', 'Clinical Decision Support', 'Interpretability', 'Trustworthy AI'],
    articleType: 'research' as const,
  },
  {
    title: '5G Networks and Edge Computing: Enabling Real-Time Applications in Smart Cities',
    abstract: 'The convergence of 5G networks and edge computing creates opportunities for real-time, low-latency applications in smart city contexts. This research investigates architectural patterns, use cases, and technical requirements for 5G-edge deployments. We analyze smart city applications including autonomous vehicles, public safety, traffic management, and environmental monitoring. Our simulation studies demonstrate that edge computing reduces latency by 68% and bandwidth consumption by 42% compared to cloud-only architectures. We propose a multi-tier edge computing framework with city, district, and device-level edge nodes. The study addresses technical challenges including resource allocation, service orchestration, and security at the edge. Through partnership with city planners, we identify deployment strategies and cost models. Our findings inform smart city infrastructure planning and contribute to understanding next-generation urban computing systems.',
    keywords: ['5G Networks', 'Edge Computing', 'Smart Cities', 'IoT', 'Real-Time Systems'],
    articleType: 'research' as const,
  },
  {
    title: 'Digital Twins for Manufacturing: Architecture, Applications, and Implementation Strategies',
    abstract: 'Digital twins—virtual replicas of physical systems—enable simulation, optimization, and predictive capabilities in manufacturing. This comprehensive study examines digital twin architectures, applications, and implementation strategies based on analysis of 35 manufacturing deployments. We categorize digital twins by complexity (component, system, process, system-of-systems) and propose a reference architecture integrating IoT sensors, data models, simulation engines, and AI analytics. Applications include product design optimization, production planning, quality control, and predictive maintenance. Measured benefits include 22% reduction in development time, 18% improvement in first-pass yield, and 15% increase in overall equipment effectiveness. Implementation challenges include data integration, model accuracy, computational requirements, and organizational change. We present best practices and a maturity model to guide digital twin adoption. The study provides actionable insights for manufacturing organizations.',
    keywords: ['Digital Twins', 'Manufacturing', 'Industry 4.0', 'Simulation', 'IoT'],
    articleType: 'review' as const,
  },
  {
    title: 'Federated Learning for Privacy-Preserving Healthcare Analytics: A Feasibility Study',
    abstract: 'Healthcare data is highly sensitive, limiting opportunities for collaborative machine learning across institutions. Federated learning enables model training without sharing raw patient data, preserving privacy while enabling insights from larger datasets. This feasibility study evaluates federated learning approaches for healthcare analytics through implementation across 5 hospitals. We trained models for disease prediction, drug response, and treatment optimization using federated averaging and secure aggregation protocols. Results demonstrate that federated models achieve 92% of centralized model performance while maintaining data privacy. We analyze communication overhead, training efficiency, and security guarantees of different federated approaches. The study addresses practical challenges including data heterogeneity, system reliability, and incentive alignment. We propose governance frameworks and technical architectures for federated healthcare learning systems. Our findings support the viability of privacy-preserving collaborative learning in healthcare.',
    keywords: ['Federated Learning', 'Healthcare', 'Privacy', 'Machine Learning', 'Data Privacy'],
    articleType: 'research' as const,
  },
  {
    title: 'Human-Centered Design of AI Systems: Principles and Practices for Building Trustworthy Interfaces',
    abstract: 'As AI systems become pervasive, designing user interfaces that foster trust, understanding, and appropriate reliance becomes crucial. This research develops principles and practices for human-centered AI design based on analysis of successful AI systems and user studies with 200+ participants. We identify key design principles including transparency, controllability, feedback, and error recovery. Through prototype development and testing, we demonstrate that well-designed interfaces improve user understanding by 45%, increase appropriate trust by 38%, and reduce over-reliance by 52% compared to poorly designed interfaces. We examine different interaction patterns including explanation interfaces, confidence indicators, and user override mechanisms. The study provides design guidelines, interaction patterns, and evaluation methods for AI system designers. Case studies illustrate applications in healthcare, finance, and customer service domains.',
    keywords: ['Human-Centered Design', 'AI Systems', 'User Interface', 'Trust', 'Human-AI Interaction'],
    articleType: 'research' as const,
  },
  {
    title: 'Agile Software Development Practices: Impact on Project Success in Large Organizations',
    abstract: 'Agile methodologies have transformed software development, but their effectiveness in large, complex organizations remains debated. This empirical study examines agile practices and project outcomes across 80 software projects in Fortune 500 companies. We analyze relationships between agile practices (daily standups, sprints, retrospectives, continuous integration) and project success metrics (on-time delivery, budget adherence, quality, customer satisfaction). Our analysis reveals that comprehensive agile adoption correlates with 31% improvement in on-time delivery and 24% increase in customer satisfaction. However, success varies significantly by organizational culture, team experience, and project characteristics. We identify critical success factors including management support, training investment, tool adoption, and cultural alignment. The study provides guidance for large organizations considering or scaling agile transformations and contributes to understanding contextual factors in agile effectiveness.',
    keywords: ['Agile Development', 'Software Engineering', 'Project Management', 'Organizational Practices', 'Empirical Study'],
    articleType: 'research' as const,
  },
];

interface Stats {
  authorsCreated: number;
  articlesCreated: number;
  errors: number;
}

class ProfessionalDataSeeder {
  private stats: Stats;
  private authorIds: Map<string, string>;
  private journalIds: Map<string, string>;
  private clearFirst: boolean;

  constructor(clearFirst: boolean = false) {
    this.stats = {
      authorsCreated: 0,
      articlesCreated: 0,
      errors: 0,
    };
    this.authorIds = new Map();
    this.journalIds = new Map();
    this.clearFirst = clearFirst;
  }

  async run() {
    console.log('\n🚀 Starting Professional Academic Data Seeding...\n');
    console.log('='.repeat(60));

    try {
      // Step 1: Get or create journals
      await this.setupJournals();

      // Step 2: Create professional authors
      await this.createAuthors();

      // Step 3: Create professional articles
      await this.createArticles();

      // Print summary
      this.printSummary();
    } catch (error) {
      console.error('\n❌ Fatal error:', error);
      throw error;
    } finally {
      await prisma.$disconnect();
    }
  }

  private async setupJournals() {
    console.log('\n📚 Setting up journals...');
    
    const journals = await prisma.journal.findMany({
      select: { id: true, code: true },
    });

    for (const journal of journals) {
      this.journalIds.set(journal.code, journal.id);
    }

    console.log(`✅ Found ${journals.length} journals`);
  }

  private async createAuthors() {
    console.log('\n👥 Creating professional authors...');

    for (const authorData of PROFESSIONAL_AUTHORS) {
      try {
        // Check if author exists
        const existing = await prisma.user.findUnique({
          where: { email: authorData.email },
        });

        if (existing) {
          console.log(`   ⏭️  Author already exists: ${authorData.name}`);
          this.authorIds.set(authorData.email, existing.id);
          continue;
        }

        // Create author
        const passwordHash = await bcrypt.hash('password123', 12);
        const author = await prisma.user.create({
          data: {
            name: authorData.name,
            email: authorData.email,
            university: authorData.university,
            affiliation: authorData.affiliation,
            orcid: authorData.orcid,
            bio: authorData.bio,
            passwordHash,
            role: authorData.role,
            isEmailVerified: true,
            isActive: true,
          },
        });

        this.authorIds.set(authorData.email, author.id);
        this.stats.authorsCreated++;
        console.log(`   ✅ Created: ${authorData.name} (${authorData.university})`);
      } catch (error: any) {
        console.error(`   ❌ Error creating ${authorData.name}:`, error.message);
        this.stats.errors++;
      }
    }

    console.log(`\n✅ Created ${this.stats.authorsCreated} new authors`);
  }

  private async createArticles() {
    console.log('\n📄 Creating professional articles...');

    const authorEmails = Array.from(this.authorIds.keys());
    
    if (authorEmails.length === 0) {
      console.log('   ⚠️  No authors available. Skipping article creation.');
      return;
    }

    // Check if journals exist
    if (this.journalIds.size === 0) {
      console.log('   ⚠️  No journals found. Please seed journals first.');
      return;
    }

    let articleIndex = 0;
    const usedDOIs = new Set<string>();

    // Create multiple variations of each template
    for (let i = 0; i < 3; i++) {
      for (const template of ARTICLE_TEMPLATES) {
        try {
          // Select author
          const authorEmail = authorEmails[articleIndex % authorEmails.length];
          const authorId = this.authorIds.get(authorEmail);
          
          if (!authorId) {
            console.error(`   ❌ Author not found: ${authorEmail}`);
            this.stats.errors++;
            articleIndex++;
            continue;
          }

          // Select journal in round-robin
          const journalCode = JOURNAL_CODES[articleIndex % JOURNAL_CODES.length];
          const journalId = this.journalIds.get(journalCode);
          
          if (!journalId) {
            console.error(`   ❌ Journal not found: ${journalCode}`);
            this.stats.errors++;
            articleIndex++;
            continue;
          }

          // Generate unique DOI
          let doi: string | null = null;
          const year = 2023 + (articleIndex % 3);
          
          // Try to generate a unique DOI
          for (let attempt = 0; attempt < 10; attempt++) {
            const timestamp = Date.now();
            const random = Math.floor(Math.random() * 10000);
            const uniqueId = `${timestamp}${random}${articleIndex}`.slice(-8); // Last 8 digits
            const candidateDOI = `10.1234/ijaism.${year}.${uniqueId}`;
            
            // Check if already used in this run
            if (usedDOIs.has(candidateDOI)) {
              continue;
            }
            
            // Check if exists in database
            const existingArticle = await prisma.article.findUnique({
              where: { doi: candidateDOI },
              select: { id: true },
            });
            
            if (!existingArticle) {
              doi = candidateDOI;
              usedDOIs.add(doi);
              break;
            }
          }
          
          // If we couldn't generate a unique DOI, set to null (it's optional)
          if (!doi) {
            console.warn(`   ⚠️  Could not generate unique DOI for article ${articleIndex + 1}, using null`);
          }

          // Generate publication dates (using same year from DOI generation)
          const submissionDate = new Date(year - 1, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);
          const acceptanceDate = new Date(submissionDate);
          acceptanceDate.setMonth(acceptanceDate.getMonth() + Math.floor(Math.random() * 6) + 2);
          const publicationDate = new Date(acceptanceDate);
          publicationDate.setMonth(publicationDate.getMonth() + 1);

          // Generate realistic metrics
          const viewCount = Math.floor(Math.random() * 5000) + 500;
          const downloadCount = Math.floor(viewCount * 0.3);
          const citationCount = Math.floor(viewCount * 0.08);

          const issue = (articleIndex % 4) + 1;
          const volume = year - 2020;

          // Create article
          await prisma.article.create({
            data: {
              journalId,
              authorId,
              title: template.title + (i > 0 ? ` (Part ${i + 1})` : ''),
              abstract: template.abstract,
              keywords: template.keywords,
              articleType: template.articleType,
              doi,
              volume,
              issue,
              pageStart: (articleIndex % 20) * 10 + 1,
              pageEnd: (articleIndex % 20) * 10 + Math.floor(Math.random() * 15) + 10,
              submissionDate,
              acceptanceDate,
              publicationDate,
              status: 'published',
              language: 'en',
              citationCount,
              viewCount,
              downloadCount,
              isOpenAccess: Math.random() > 0.3,
            },
          });

          this.stats.articlesCreated++;
          articleIndex++;

          if (articleIndex % 10 === 0) {
            console.log(`   ✅ Created ${articleIndex} articles...`);
          }
        } catch (error: any) {
          console.error(`   ❌ Error creating article ${articleIndex + 1} (${template.title.substring(0, 50)}...):`, error.message);
          if (error.code === 'P2002') {
            console.error(`      → Unique constraint violation (likely DOI). Skipping...`);
          }
          this.stats.errors++;
          articleIndex++; // Still increment to avoid infinite loop
        }
      }
    }

    console.log(`\n✅ Created ${this.stats.articlesCreated} articles`);
  }

  private printSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 Seeding Summary');
    console.log('='.repeat(60));
    console.log(`✅ Authors Created: ${this.stats.authorsCreated}`);
    console.log(`✅ Articles Created: ${this.stats.articlesCreated}`);
    if (this.stats.errors > 0) {
      console.log(`⚠️  Errors: ${this.stats.errors}`);
    }
    console.log('\n🎉 Professional data seeding completed!\n');
  }
}

// Main execution
const args = process.argv.slice(2);
const clearFirst = args.includes('--clear-first');

const seeder = new ProfessionalDataSeeder(clearFirst);
seeder.run()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
