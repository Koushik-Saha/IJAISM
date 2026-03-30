#!/usr/bin/env python3
"""
Sync article data from old website - correct DOIs, authors, dates, journal assignments
and update journal metadata (ISSNs, theme colors, etc.)
"""
import re, uuid, psycopg2
from datetime import datetime, timezone

def connect_db():
    return psycopg2.connect(
        "postgresql://neondb_owner:npg_4XAlo7GtgUuq@ep-royal-hill-ah8m2y0n-pooler.c-3.us-east-1.aws.neon.tech/neondb",
        sslmode="require", connect_timeout=60, keepalives=1,
        keepalives_idle=30, keepalives_interval=10, keepalives_count=5,
    )

def ts(date_str):
    """Convert date string to ISO timestamp."""
    fmts = ["%d %b %Y", "%d %B %Y", "%d %b, %Y", "%B %d, %Y", "%Y-%m-%d"]
    for fmt in fmts:
        try:
            return datetime.strptime(date_str.strip(), fmt).replace(tzinfo=timezone.utc).isoformat()
        except: pass
    return None

now = datetime.now(timezone.utc).isoformat()

# ─── AUTHORITATIVE ARTICLE DATA FROM OLD WEBSITE ──────────────────────────────
# Format: doi_suffix → { title_fragment, authors, pub_date, journal }
OLD_SITE_ARTICLES = [
    # ── jitmb ─────────────────────────────────────────────────────────────────
    {"doi": "https://doi.org/10.63471/jitmbh24001", "journal": "jitmb",
     "title": "Involving Cybersecurity to Protect Small to Medium-Sized Businesses",
     "authors": ["Shuchona Malek Orthi", "Mohammad Abu Saleh", "Md. Mehedi Hasan"],
     "pub_date": "21 Aug 2024"},
    {"doi": "https://doi.org/10.63471/jitmbh24002", "journal": "jitmb",
     "title": "Strategic IT Project Management: Tackling Challenges and Implementing Best Practices",
     "authors": ["Anupom Debnath", "Foysal Mahmud", "Nur Mohammad"],
     "pub_date": "21 Aug 2024"},
    {"doi": "https://doi.org/10.63471/jitmbh24003", "journal": "jitmb",
     "title": "Intelligence-driven Risk Management in Information Security Systems",
     "authors": ["Anamika Tiwari", "Md Imran Sarkar", "Abdullah Al Sakib"],
     "pub_date": "21 Aug 2024"},
    {"doi": "https://doi.org/10.63471/jitmbh24004", "journal": "jitmb",
     "title": "Business Intelligence and Analytics: Enhancing Decision-Making in Competitive Markets",
     "authors": ["Md Ekrim Hossin", "Sweety Rani Dhar"],
     "pub_date": "21 Aug 2024"},
    {"doi": "https://doi.org/10.63471/jitmbh24005", "journal": "jitmb",
     "title": "Outsourcing of IT: Reason, Benefit and Potential risks for USA Companies",
     "authors": ["Jobanpreet Kaur", "Barna Biswas"],
     "pub_date": "21 Aug 2024"},
    {"doi": "https://doi.org/10.63471/jitmbh_25002", "journal": "jitmb",
     "title": "Machine Learning Applications in U.S. Manufacturing: Predictive Maintenance and Supply Chain Optimization",
     "authors": ["Rakibul Hasan", "Jakir Hossain Ridoy", "Adib Hossain"],
     "pub_date": "07 Aug 2025"},

    # ── drsdr ─────────────────────────────────────────────────────────────────
    {"doi": "https://doi.org/10.63471/drsdr24001", "journal": "demographic-research-and-social-development-reviews",
     "title": "Micro Housing Solutions: Evaluating Tiny Homes as an Innovative Approach to Homelessness in Oregon, USA",
     "authors": ["Mohammad Abu Saleh", "Md Khokan Bhuyan"],
     "pub_date": "27 Aug 2024"},
    {"doi": "https://doi.org/10.63471/drsdr24002", "journal": "demographic-research-and-social-development-reviews",
     "title": "Digital Societies: Impact of Technology on Social Structures and Interactions",
     "authors": ["Anupom Debnath"],
     "pub_date": "27 Aug 2024"},
    {"doi": "https://doi.org/10.63471/drsdr24003", "journal": "demographic-research-and-social-development-reviews",
     "title": "Digital Transformation in Business: Strategies and Implications for Organizational Change",
     "authors": ["MD Ahsan Ullah Imran"],
     "pub_date": "27 Aug 2024"},
    {"doi": "https://doi.org/10.63471/drsdr24004", "journal": "demographic-research-and-social-development-reviews",
     "title": "Economic Strategies for Climate-Resilient Agriculture: Ensuring Sustainability in a Changing Climate",
     "authors": ["Sanchita Saha"],
     "pub_date": "27 Aug 2024"},
    {"doi": "https://doi.org/10.63471/drsdr24005", "journal": "demographic-research-and-social-development-reviews",
     "title": "Virtual Classrooms: An Inclusive Approach to Educate the Children with Autism",
     "authors": ["Raiyan"],
     "pub_date": "27 Aug 2024"},
    {"doi": "https://doi.org/10.63471/drsdr_25002", "journal": "demographic-research-and-social-development-reviews",
     "title": "Real-Time Predictive Analytics for Early Homelessness Prevention: A Machine Learning Approach",
     "authors": ["AFM Rafid Hassan Akand", "Hasan Mahmud Sozib", "Arif Ahmed Sizan", "Md Shayakh Alam", "Towsif Alam", "Md Mohaimin Rashid"],
     "pub_date": "09 Aug 2025"},

    # ── ilprom ────────────────────────────────────────────────────────────────
    {"doi": "https://doi.org/10.63471/ilprom24001", "journal": "ilprom",
     "title": "Corporate Governance and Risk Management in Banking Institutions",
     "authors": ["Sweety Rani Dhar", "Al Modabbir Zaman", "Tahmina Akther"],
     "pub_date": "30 Aug 2024"},
    {"doi": "https://doi.org/10.63471/ilprom24002", "journal": "ilprom",
     "title": "Global Impact of US Sanctions: Analyzing the Extraterritorial Reach and Its Legal Implications for International Trade Law",
     "authors": ["Md Abdul Barek Saju", "Md Asikur Rahman Chy"],
     "pub_date": "30 Aug 2024"},
    {"doi": "https://doi.org/10.63471/ilprom24003", "journal": "ilprom",
     "title": "Legal and ethical Framework for International Refugee Law: Adherence to the 1951 Refugee Convention in the Present-Day Setting",
     "authors": ["Salma Akter", "Md Faruque"],
     "pub_date": "30 Aug 2024"},
    {"doi": "https://doi.org/10.63471/ilprom24004", "journal": "ilprom",
     "title": "The Impact of the US on the Development of International Cybersecurity Law: Legal Challenges and Emerging Norms",
     "authors": ["Syeda Farjana Farabi", "Abdullah Al Sakib", "Md Faruque", "Salma Akter"],
     "pub_date": "30 Dec 2024"},
    {"doi": "https://doi.org/10.63471/ilprom24005", "journal": "ilprom",
     "title": "Ethical Considerations in AI and Information Technology Privacy and Bias",
     "authors": ["Md Alamgir Miah", "Md Faruque", "Salma Akter", "Ishrat Jahan"],
     "pub_date": "30 Aug 2024"},

    # ── tbfli ─────────────────────────────────────────────────────────────────
    {"doi": "https://doi.org/10.63471/tbfli24001", "journal": "tbfli",
     "title": "IT in Improving Integrity and Productivity in Supply Chain Management",
     "authors": ["Barna Biswas"],
     "pub_date": "15 Aug 2024"},
    {"doi": "https://doi.org/10.63471/tbfli24002", "journal": "tbfli",
     "title": "Systemic Risk and Financial Stability: Measurement and Policy Implications",
     "authors": ["Md Saddam Hosain", "Md Abdullah Al Mahmud", "Dr. Joseph P. Siegmund"],
     "pub_date": "15 Aug 2024"},
    {"doi": "https://doi.org/10.63471/tbfli24003", "journal": "tbfli",
     "title": "Digital Transformation in Leadership Management: Opportunities and Challenges in the COVID-19 Scenario",
     "authors": ["Md Mesbah Uddin"],
     "pub_date": "15 Aug 2024"},
    {"doi": "https://doi.org/10.63471/tbfli24004", "journal": "tbfli",
     "title": "Cloud Computing in Banking Flexibility and Scalability for Financial Institute",
     "authors": ["Md. Mehedi Hasan", "Md. Rakib Mia"],
     "pub_date": "15 Aug 2024"},
    {"doi": "https://doi.org/10.63471/tbfli24005", "journal": "tbfli",
     "title": "Blockchain Based Security Solutions for Banking Information Technology",
     "authors": ["Syed Nazmul Hasan", "Mst. Khadijatul Kubra Shinfa", "Oli Ahammed Sarker", "Md Redwan Hussain", "Jarin Tias Meraj"],
     "pub_date": "15 Aug 2024"},
    {"doi": "https://doi.org/10.63471/tbfli25001", "journal": "tbfli",
     "title": "Integrating AI and Econometrics for Equity Forecasting: A Case Study on Apple and Microsoft Stocks",
     "authors": ["Md Abdullah Al Mahmud", "Md Anikur Rahman", "Abdullah Al Masum", "Md Kamruzzaman"],
     "pub_date": "28 Jan 2025"},
    {"doi": "https://doi.org/10.63471/tbfli_25002", "journal": "tbfli",
     "title": "Forecasting Financial Crashes with Advanced Time-Series Methods: A Predictive Framework",
     "authors": ["Mohammad Shahidullah", "Arifa Ahmed", "Mst Shurovi Akter", "Towsif Alam", "Md Mohaimin Rashid", "Hafsa Kamal", "Arif Ahmed Sizan"],
     "pub_date": "25 Oct 2025"},
    {"doi": "https://doi.org/10.63471/tbfli_25003", "journal": "tbfli",
     "title": "Using Alternative Data and Machine Learning for Predictive Credit Scoring to Promote Financial Inclusion in the U.S.",
     "authors": ["Anseena Anees Sabeena", "Arifa Ahmed", "Sadia Sharmin", "Ali Hassan", "Fahad Ahmed", "Md Bayzid Kamal", "Arafat Islam", "Md Fakhrul Hasan Bhuiyan"],
     "pub_date": "25 Oct 2025"},
    {"doi": "https://doi.org/10.63471/tbfli_25004", "journal": "tbfli",
     "title": "Blockchain-Based Banking Infrastructure for Securing Financial Transactions and Reducing Operational Costs in the U.S.",
     "authors": ["Anseena Anees Sabeena", "Arifa Ahmed", "Sadia Sharmin", "Ali Hassan", "Fahad Ahmed", "Md Bayzid Kamal", "Arafat Islam", "Md Fakhrul Hasan Bhuiyan"],
     "pub_date": "25 Oct 2025"},
    {"doi": "https://doi.org/10.63471/tbfli_25005", "journal": "tbfli",
     "title": "Developing Data Analytics Models for Real-Time Fraud Detection in U.S. Financial and Tax Systems",
     "authors": ["Arafat Islam", "Durga Shahi", "Muslima Begom Riipa", "AFM Rafid Hassan Akand", "Arifa Ahmed", "Ali Hassan", "Md Bayzid Kamal", "Adib Hossain"],
     "pub_date": "25 Oct 2025"},
    {"doi": "https://doi.org/10.63471/tbfli_25006", "journal": "tbfli",
     "title": "Artificial Intelligence Hybrid AI-Econometric Models for Forecasting Volatile US Equities: A Comparative Study of Apple and Microsoft",
     "authors": ["Anseena Anees Sabeena"],
     "pub_date": "25 Oct 2025"},
    {"doi": "https://doi.org/10.63471/tbfli_25007", "journal": "tbfli",
     "title": "Green Finance and Its Impact on Sustainable Investment Strategies in the US",
     "authors": ["Ali Hassan", "Fahad Ahmed", "Hammed Esa"],
     "pub_date": "25 Oct 2025"},
    {"doi": "https://doi.org/10.63471/tbfli_25008", "journal": "tbfli",
     "title": "Fraud Transaction Detection using Machine Learning on Financial Datasets",
     "authors": ["Durga Shahi", "Ali Hassan", "Muslima Begom Riipa", "Hafsa Kamal", "Md Shayakh Alam", "Arif Ahmed Sizan", "Towsif Alam"],
     "pub_date": "25 Oct 2025"},
    {"doi": "https://doi.org/10.63471/tbfli_25009", "journal": "tbfli",
     "title": "Forecasting Stock Prices: A Machine Learning-Based Approach for Predictive Analytics Through a Case Study",
     "authors": ["Mohammad Shahidullah", "Fahad Ahmed", "Mst Shurovi Akter"],
     "pub_date": "25 Oct 2025"},

    # ── pmsri ─────────────────────────────────────────────────────────────────
    {"doi": "https://doi.org/10.63471/pmsri24001", "journal": "pmsri",
     "title": "Navigating the AI Revolution in Business Management: New Strategies and Innovations",
     "authors": ["Mustakim Bin Aziz"],
     "pub_date": "18 Aug 2024"},
    {"doi": "https://doi.org/10.63471/pmsri24002", "journal": "pmsri",
     "title": "E-commerce Platforms Innovations and Strategies for Market Expansion",
     "authors": ["Md Wali Ullah", "Jannatul Ferdous Mou"],
     "pub_date": "18 Sep 2024"},
    {"doi": "https://doi.org/10.63471/pmsri24003", "journal": "pmsri",
     "title": "Artificial Intelligence Based Healthcare: Applications, Challenges, and Future Directions",
     "authors": ["Tahmina Akther", "Misha Billah", "Md Samiun", "Md. Firoz Hossain", "Md Mesbah Uddin", "Ishrat Jahan", "Md Shawon Islam"],
     "pub_date": "18 Aug 2024"},
    {"doi": "https://doi.org/10.63471/pmsri24004", "journal": "pmsri",
     "title": "AI-Driven Solutions for Mental Health: Addressing the Global Mental Health Crisis",
     "authors": ["Hasan Mahmud Sozib"],
     "pub_date": "18 Aug 2024"},
    {"doi": "https://doi.org/10.63471/pmsri24005", "journal": "pmsri",
     "title": "Implementing Agile IT Management: A Path to Enhanced Business Flexibility and Responsiveness",
     "authors": ["Md Abdullah Al Mahmud", "Dr. Joseph P. Siegmund", "Mohammad Hossain"],
     "pub_date": "18 Aug 2024"},

    # ── jsae ──────────────────────────────────────────────────────────────────
    {"doi": "https://doi.org/10.63471/jsae24001", "journal": "jsae",
     "title": "The Economics of Water-Efficient Agriculture: Tackling Scarcity with Innovation",
     "authors": ["Jahanara Akter"],
     "pub_date": "23 Aug 2024"},
    {"doi": "https://doi.org/10.63471/jsae24002", "journal": "jsae",
     "title": "Carbon Sequestration Incentives for Sustainable Agriculture: Economic Impacts and Policy Recommendations",
     "authors": ["Shanjidah Tasfiah"],
     "pub_date": "23 Aug 2024"},
    {"doi": "https://doi.org/10.63471/jsae24003", "journal": "jsae",
     "title": "Circular Economy in Agriculture: Transforming Waste into Wealth",
     "authors": ["Rakibul Hasan"],
     "pub_date": "23 Aug 2024"},
    {"doi": "https://doi.org/10.63471/jsae24004", "journal": "jsae",
     "title": "Precision farming through the use of Internet of Things (IoT) innovations in agriculture",
     "authors": ["Md Redwan Hussain", "Jarin Tias Meraj", "Oli Ahammed Sarker"],
     "pub_date": "23 Aug 2024"},
    {"doi": "https://doi.org/10.63471/jsae24005", "journal": "jsae",
     "title": "AI-Driven Strategies for Reducing Deforestation in U.S. Agriculture",
     "authors": ["Rakibul Hasan"],
     "pub_date": "23 Aug 2024"},
    {"doi": "https://doi.org/10.63471/jsae_25002", "journal": "jsae",
     "title": "The Role of Microfinance in Promoting Sustainable Agriculture",
     "authors": ["AFM Rafid Hassan Akand", "Arif Ahmed Sizan", "Towsif Alam", "Md Mohaimin Rashid", "Hafsa Kamal"],
     "pub_date": "07 Aug 2025"},

    # ── amlid ─────────────────────────────────────────────────────────────────
    {"doi": "https://doi.org/10.63471/amlids24001", "journal": "amlid",
     "title": "Energy-Efficient Communication Protocols for Massive IoT Deployments: Green IoT",
     "authors": ["Nur Mohammad", "Misha Billah", "Md. Mehedi Hasan", "Md Redwan Hussain"],
     "pub_date": "25 Aug 2024"},
    {"doi": "https://doi.org/10.63471/amlids24002", "journal": "amlid",
     "title": "Blockchain Technology for Securing Digital Information: Opportunities and Challenges",
     "authors": ["Mahafuj Hassan", "Md Azhad Hossain", "Mohammad Zahidul Alam", "Md Redwan Hussain", "Jarin Tias Meraj"],
     "pub_date": "25 Aug 2024"},
    {"doi": "https://doi.org/10.63471/amlids24003", "journal": "amlid",
     "title": "Ethical Considerations in the Management of Digital Information Security",
     "authors": ["Mahafuj Hassan", "Abu Hanif"],
     "pub_date": "25 Aug 2024"},
    {"doi": "https://doi.org/10.63471/amlids24004", "journal": "amlid",
     "title": "AI-Driven Financial Security: Innovations in Protecting Assets and Mitigating Risks",
     "authors": ["Mani Prabha", "MD. Jahid Hassan", "Jarin Tias Meraj"],
     "pub_date": "25 Aug 2024"},
    {"doi": "https://doi.org/10.63471/amlids24005", "journal": "amlid",
     "title": "Cybersecurity Strategies for Businesses: Protecting Data in a Digital World",
     "authors": ["Md. Mehedi Hasan", "Abu Hanif"],
     "pub_date": "25 Aug 2024"},
    {"doi": "https://doi.org/10.63471/amlid25001", "journal": "amlid",
     "title": "Big Data Analytics and Its Usage on Financial Fraud Detection in the USA",
     "authors": ["Md Hossain Jamil", "Arif Hosen", "Shafiqul Islam Talukder", "Yeasin Arafat", "Hasan Mahmud Sozib"],
     "pub_date": "28 Feb 2025"},
    {"doi": "https://doi.org/10.63471/amlids_25002", "journal": "amlid",
     "title": "Cyber Risk Analytics and Security Frameworks for Safeguarding U.S. Digital Banking Infrastructure",
     "authors": ["Md Fakhrul Hasan Bhuiyan", "Arafat Islam", "AFM Rafid Hassan Akand", "Ali Hassan", "Sweety Rani Dhar", "Durga Shahi", "Adib Hossain", "Arif Hosen"],
     "pub_date": "25 Oct 2025"},

    # ── ojbem ─────────────────────────────────────────────────────────────────
    {"doi": "https://doi.org/10.63471/ojbem24001", "journal": "ojbem",
     "title": "The Future of E-Commerce: Innovations and Challenges",
     "authors": ["Md Kamruzzaman"],
     "pub_date": "28 Aug 2024"},
    {"doi": "https://doi.org/10.63471/ojbem24002", "journal": "ojbem",
     "title": "Consumer Behavior in Online Shopping: Insights and Implications for Marketers",
     "authors": ["Syeda Kamari Noor"],
     "pub_date": "28 Aug 2024"},
    {"doi": "https://doi.org/10.63471/ojbem24003", "journal": "ojbem",
     "title": "Financial Management in Emerging Markets: Challenges and Opportunities",
     "authors": ["Al Modabbir Zaman", "Hasan Mahmud Sozib"],
     "pub_date": "28 Aug 2024"},
    {"doi": "https://doi.org/10.63471/ojbem24004", "journal": "ojbem",
     "title": "Enhancing Sales Forecasting Accuracy through DBSCAN Clustering and Ensemble Modeling Techniques",
     "authors": ["Hasan Mahmud Sozib"],
     "pub_date": "28 Aug 2024"},
    {"doi": "https://doi.org/10.63471/ojbem24005", "journal": "ojbem",
     "title": "The Future of Banking Fraud Detection: Emerging IT Technologies and Trends",
     "authors": ["Sadia Sharmin", "Mohammad Shofiqul Islam Chowdhury"],
     "pub_date": "28 Aug 2024"},
    {"doi": "https://doi.org/10.63471/ojbem_25002", "journal": "ojbem",
     "title": "Enhancing Digital Marketing Strategies in the Food Delivery Business through AI-Driven Ensemble Machine Learning Techniques",
     "authors": ["Adib Hossain", "Afia Fairooz Tasnim", "Fariha Akhter", "Mst Masuma Akter Semi", "Rayhan Khan", "Rukshanda Rahman", "Sumaiya Yeasmin", "Anseena Anees Sabeena"],
     "pub_date": "25 Oct 2025"},

    # ── praihi ────────────────────────────────────────────────────────────────
    {"doi": "https://doi.org/10.63471/praihi24001", "journal": "praihi",
     "title": "Technology-Assisted Parent Training Programs for Autism Management",
     "authors": ["Rayhan Khan", "Md. Firoz Hossain", "Md Mesbah Uddin", "Tasmim Jamal Joti"],
     "pub_date": "19 Aug 2024"},
    {"doi": "https://doi.org/10.63471/praihi24002", "journal": "praihi",
     "title": "AI-Assisted Diagnostics for Rural and Underserved Communities: Bridging Healthcare Gaps",
     "authors": ["Rukshanda Rahman", "Ishrat Jahan", "Sumaiya Yeasmin", "Fariha Akhter"],
     "pub_date": "02 Sep 2024"},
    {"doi": "https://doi.org/10.63471/praihi24003", "journal": "praihi",
     "title": "AI-Driven Early Detection of Autism Spectrum Disorder in American Children",
     "authors": ["Mohammad Moniruzzaman", "Rayhan Khan", "Romana Nourin Nipa", "Md Redwan Hussain", "Jarin Tias Mera"],
     "pub_date": "19 Aug 2024"},
    {"doi": "https://doi.org/10.63471/praihi24004", "journal": "praihi",
     "title": "Advancements in Sensor Technologies for Remote Healthcare Monitoring",
     "authors": ["Jannatul Ferdous Mou", "Ishrat Jahan", "Md Kamruzzaman", "Fariha Akhter"],
     "pub_date": "19 Aug 2024"},
    {"doi": "https://doi.org/10.63471/praihi24005", "journal": "praihi",
     "title": "Perioperative Medicine: Investigating Preoperative and Postoperative Management, Including Reducing Complications in Diabetic and Obese Patients",
     "authors": ["Sheikh Ummey Salma Tonu", "Sk Salauddin", "Fatima tuz zahura", "Dipta Sharma", "Kishor Chandra das", "Dr. Rajib Saha", "Md. Imran Ali", "Md Mesbah Uddin"],
     "pub_date": "19 Aug 2024"},
    {"doi": "https://doi.org/10.63471/praihi_25002", "journal": "praihi",
     "title": "AI-Driven Epidemic Response: Optimizing Disease Prediction and Resource Allocation",
     "authors": ["Md Abdur Rob", "Muslima Begom Riipa"],
     "pub_date": "25 Oct 2025"},

    # ── jbvada ────────────────────────────────────────────────────────────────
    {"doi": "https://doi.org/10.63471/jbvada24001", "journal": "jbvada",
     "title": "Legal and Ethical Frameworks for Regulating Artificial Intelligence in Business",
     "authors": ["Nur Vanu", "Md. Mehedi Hasan", "Salma Akter", "Md Faruque"],
     "pub_date": "20 Aug 2024"},
    {"doi": "https://doi.org/10.63471/jbvada24002", "journal": "jbvada",
     "title": "Ecotourism and Wildlife Monitoring: Technological Innovations and Business Opportunities",
     "authors": ["Md. Shihab Hossain"],
     "pub_date": "20 Aug 2024"},
    {"doi": "https://doi.org/10.63471/jbvada24003", "journal": "jbvada",
     "title": "Artificial Intelligence in Business: Prospects and Dangers",
     "authors": ["Md Abdullah Al Mahmud", "Md Shawon Islam", "Rokeya Khatun Shorna"],
     "pub_date": "20 Aug 2024"},
    {"doi": "https://doi.org/10.63471/jbvada24004", "journal": "jbvada",
     "title": "Automating Greenhouse Gas Monitoring with Artificial Intelligence for Sustainable Agriculture",
     "authors": ["Rakibul Hasan"],
     "pub_date": "20 Aug 2024"},
    {"doi": "https://doi.org/10.63471/jbvada24005", "journal": "jbvada",
     "title": "Predictive Analytics in Customer Relationship Management in the USA",
     "authors": ["Rabeya Khatoon", "Mohammad Shofiqul Islam Chowdhury"],
     "pub_date": "20 Aug 2024"},

    # ── jamsai ────────────────────────────────────────────────────────────────
    {"doi": "https://doi.org/10.63471/jamsai24001", "journal": "jamsai",
     "title": "AI in Drug Discovery for Antimicrobial Resistance: Combating the Silent Pandemic",
     "authors": ["Mia Md Tofayel Gonee Manik", "Sadia Islam Nilima", "Md Redwan Hussain", "Jarin Tias Meraj", "Toufiqur Rahman Tonmoy", "Rokeya Khatun Shorna", "Oli Ahammed Sarker"],
     "pub_date": "22 Aug 2024"},
    {"doi": "https://doi.org/10.63471/jamsai24002", "journal": "jamsai",
     "title": "AI-Powered Early Detection of Cardiovascular Diseases: A Global Health Priority",
     "authors": ["Md Shafiqul Islam", "Md Mesbah Uddin", "Md. Firoz Hossain", "Md Redwan Hussain", "Oli Ahammed Sarker", "Toufiqur Rahman Tonmoy", "Rokeya Khatun Shorna", "Abu Hanif"],
     "pub_date": "22 Aug 2024"},
    {"doi": "https://doi.org/10.63471/jamsai24003", "journal": "jamsai",
     "title": "Deep Learning Models for Early Detection of Alzheimer's Disease Using Neuroimaging Data",
     "authors": ["Md Samiun", "Md Azhad Hossain", "Professor Sanaz Tehrani"],
     "pub_date": "22 Aug 2024"},
    {"doi": "https://doi.org/10.63471/jamsai24004", "journal": "jamsai",
     "title": "Revolutionizing Drug Discovery: AI-Driven Approaches to Personalized Medicine and Predictive Therapeutics",
     "authors": ["Afia Fairooz Tasnim", "Rukshanda Rahman", "Jarin Tias Meraj"],
     "pub_date": "22 Oct 2024"},
    {"doi": "https://doi.org/10.63471/jamsai24005", "journal": "jamsai",
     "title": "Intraoperative Hypotension Prediction: Proactive Perioperative Hemodynamic Management",
     "authors": ["Sheikh Ummey Salma Tonu", "Sk Salauddin", "Fatima tuz zahura", "Dipta Sharma", "Kishor Chandra das", "Dr. Rajib Saha", "Md. Imran Ali", "Md Mesbah Uddin"],
     "pub_date": "22 Aug 2024"},
    {"doi": "https://doi.org/10.63471/jamsai_25002", "journal": "jamsai",
     "title": "Transforming Healthcare Decisions in the U.S. Through Machine Learning",
     "authors": ["Adib Hossain", "Afia Fairooz Tasnim", "Fariha Akhter", "Mst Masuma Akter Semi", "Rayhan Khan", "Rukshanda Rahman", "Sumaiya Yeasmin", "Anseena Anees Sabeena"],
     "pub_date": "25 Oct 2025"},

    # ── aesi ──────────────────────────────────────────────────────────────────
    {"doi": "https://doi.org/10.63471/aesi24001", "journal": "aesi",
     "title": "Cyber-Physical Systems: Integration of Computing and Physical Processes",
     "authors": ["Ishrat Jahan", "Hasan Mahmud Sozib", "Md Shawon Islam", "Md. Shihab Hossain"],
     "pub_date": "26 Aug 2024"},
    {"doi": "https://doi.org/10.63471/aesi24002", "journal": "aesi",
     "title": "Dynamic Analysis of a G+13 Story RCC Building Using Shear Wall in Three Different Locations on Various Seismic Zones",
     "authors": ["Md. Kawsarul Islam Kabbo", "Md. Habibur Rahman Sobuz", "Md. Iftel Alom Emon"],
     "pub_date": "26 Aug 2024"},
    {"doi": "https://doi.org/10.63471/aesi24003", "journal": "aesi",
     "title": "Real-Time Monitoring in Smart Cities: Sensor Networks and Communication Protocols",
     "authors": ["Ishrat Jahan"],
     "pub_date": "26 Aug 2024"},
    {"doi": "https://doi.org/10.63471/aesi24004", "journal": "aesi",
     "title": "Machine Learning Models for Cybersecurity in the USA firms and develop models to enhance threat detection",
     "authors": ["Md Shawon Islam"],
     "pub_date": "26 Aug 2024"},
    {"doi": "https://doi.org/10.63471/aesi24005", "journal": "aesi",
     "title": "Utilizing Blockchain Technology for the US Supply Chain Management",
     "authors": ["Md Samiun", "Md Azhad Hossain", "Professor Sanaz Tehrani"],
     "pub_date": "26 Aug 2024"},
]

# ─── JOURNAL METADATA FROM OLD WEBSITE ────────────────────────────────────────
JOURNAL_UPDATES = {
    "jitmb":  {"issn": "3067-5308", "eIssn": "3067-5316", "impactFactor": 0.25, "citeScore": 0.4,
               "frequency": "Every Two Months", "timeToFirstDecision": "4 days",
               "reviewTime": "21 days", "revisionTime": "15 days",
               "submissionToAcceptance": "40 days", "acceptanceToPublication": "7 days",
               "articleProcessingCharge": 500.0},
    "demographic-research-and-social-development-reviews":
              {"issn": "3067-5359", "eIssn": "3067-5391", "impactFactor": 0.3, "citeScore": 0.5,
               "frequency": "Every Two Months"},
    "ilprom": {"issn": "3067-5863", "eIssn": "3067-5871", "impactFactor": 0.5, "citeScore": 0.7,
               "frequency": "Every Two Months"},
    "tbfli":  {"issn": "3067-5804", "eIssn": "3067-5812", "impactFactor": 0.7, "citeScore": 0.6,
               "frequency": "Every Two Months"},
    "pmsri":  {"issn": "3067-5758", "eIssn": "3067-5774", "impactFactor": 0.6, "citeScore": 0.4,
               "frequency": "Every Two Months"},
    "jsae":   {"issn": "3067-5618", "eIssn": "3067-5626", "impactFactor": 0.8, "citeScore": 0.5,
               "frequency": "Every Two Months"},
    "amlid":  {"issn": "3067-5529", "eIssn": "3067-5545", "impactFactor": 0.3, "citeScore": 0.5,
               "frequency": "Every Two Months"},
    "ojbem":  {"issn": "3067-5650", "eIssn": "3067-5669", "impactFactor": 0.5, "citeScore": 0.3,
               "frequency": "Every Two Months"},
    "praihi": {"issn": "3067-5723", "eIssn": "3067-5731", "impactFactor": 0.7, "citeScore": 0.6,
               "frequency": "Every Two Months"},
    "jbvada": {"issn": "3067-5987", "eIssn": "3067-6010", "impactFactor": 0.6, "citeScore": 0.5,
               "frequency": "Every Two Months"},
    "jamsai": {"issn": "3067-591X", "eIssn": "3067-5936", "impactFactor": 0.8, "citeScore": 0.5,
               "frequency": "Every Two Months"},
    "aesi":   {"issn": "3067-5421", "eIssn": "3067-5413", "impactFactor": 0.7, "citeScore": 0.4,
               "frequency": "Every Two Months"},
}


def main():
    print("=== Sync Articles from Old Website ===\n")
    conn = connect_db()
    conn.autocommit = True
    cur = conn.cursor()

    # ── Load journal and issue maps ────────────────────────────────────────────
    cur.execute('SELECT id, code FROM "Journal"')
    journal_map = {row[1].lower(): row[0] for row in cur.fetchall()}

    cur.execute('SELECT id, "journalId", volume, issue FROM "JournalIssue"')
    issue_map = {}  # (journalId, vol, iss) → id
    for row in cur.fetchall():
        key = (row[1], row[2], row[3])
        if key not in issue_map:
            issue_map[key] = row[0]

    # ── Load existing articles by DOI ──────────────────────────────────────────
    cur.execute('SELECT id, doi, title, "journalId" FROM "Article"')
    db_articles = {}  # doi → (id, title, journalId)
    for row in cur.fetchall():
        if row[1]:
            db_articles[row[1]] = (row[0], row[2], row[3])

    # Also build title→id map for fuzzy matching
    cur.execute('SELECT id, title, doi, "journalId" FROM "Article"')
    title_map = {}
    for row in cur.fetchall():
        key = re.sub(r'\s+', ' ', (row[1] or '').lower().strip())[:60]
        title_map[key] = (row[0], row[2], row[3])

    # ── Update journal metadata ────────────────────────────────────────────────
    print("[1] Updating journal metadata...")
    for code, updates in JOURNAL_UPDATES.items():
        jid = journal_map.get(code)
        if not jid:
            print(f"  [WARN] Journal not found: {code}")
            continue
        set_parts = []
        vals = []
        for k, v in updates.items():
            set_parts.append(f'"{k}" = %s')
            vals.append(str(v).strip() if isinstance(v, str) else v)
        set_parts.append('"updatedAt" = %s')
        vals.append(now)
        vals.append(jid)
        cur.execute(f'UPDATE "Journal" SET {", ".join(set_parts)} WHERE id = %s', vals)
        print(f"  ✓ {code}")

    # ── Process each article from old site data ────────────────────────────────
    print("\n[2] Syncing articles...")
    updated = 0
    new_doi_assigned = 0
    journal_fixed = 0

    for article_data in OLD_SITE_ARTICLES:
        old_doi = article_data["doi"]
        journal_code = article_data["journal"]
        title = article_data["title"]
        authors = article_data["authors"]
        pub_date = ts(article_data["pub_date"])

        journal_id = journal_map.get(journal_code)
        if not journal_id:
            print(f"  [SKIP] Journal not found: {journal_code}")
            continue

        # ── Find matching article in DB ───────────────────────────────────────
        art_id = None
        current_doi = None
        current_journal_id = None

        # Try exact DOI match first
        if old_doi in db_articles:
            art_id, _, current_journal_id = db_articles[old_doi]
            current_doi = old_doi

        # Try title match
        if not art_id:
            title_key = re.sub(r'\s+', ' ', title.lower().strip())[:60]
            if title_key in title_map:
                art_id, current_doi, current_journal_id = title_map[title_key]

        # Try partial title match (first 40 chars)
        if not art_id:
            short_key = title_key[:40]
            for tk, (aid, cdoi, cjid) in title_map.items():
                if tk[:40] == short_key:
                    art_id = aid
                    current_doi = cdoi
                    current_journal_id = cjid
                    break

        if not art_id:
            print(f"  [NOT FOUND] {title[:60]}")
            continue

        # ── Build updates ─────────────────────────────────────────────────────
        updates = {}

        # Fix DOI
        if current_doi != old_doi:
            # Check no conflict
            if old_doi not in db_articles or db_articles[old_doi][0] == art_id:
                updates["doi"] = old_doi
                new_doi_assigned += 1

        # Fix journal if wrong
        if current_journal_id != journal_id:
            updates["journalId"] = journal_id
            journal_fixed += 1

        # Always update pub_date and title
        updates["publicationDate"] = pub_date
        updates["title"] = title

        # Apply updates
        if updates:
            set_parts = [f'"{k}" = %s' for k in updates]
            set_parts.append('"updatedAt" = %s')
            vals = list(updates.values()) + [now, art_id]
            try:
                cur.execute(f'UPDATE "Article" SET {", ".join(set_parts)} WHERE id = %s', vals)
                updated += 1
            except Exception as e:
                print(f"  [ERROR] {title[:50]}: {e}")
                continue

        # ── Update co-authors ─────────────────────────────────────────────────
        cur.execute('DELETE FROM "CoAuthor" WHERE "articleId" = %s', (art_id,))
        for i, author_name in enumerate(authors):
            if not author_name.strip():
                continue
            cur.execute(
                'INSERT INTO "CoAuthor" (id, "articleId", name, "isMain", "order", "createdAt", "updatedAt") '
                'VALUES (%s, %s, %s, %s, %s, %s, %s)',
                (str(uuid.uuid4()), art_id, author_name.strip()[:200], i == 0, i, now, now)
            )

        status = "updated" if updates else "authors-only"
        journal_flag = " [journal-fixed]" if "journalId" in updates else ""
        doi_flag = f" [doi: {old_doi.split('/')[-1]}]" if "doi" in updates else ""
        print(f"  ✓ {status}{journal_flag}{doi_flag} | {title[:55]}")

    # ── Fix issue years (ensure 2025 articles use year 2025 not 2026) ─────────
    print("\n[3] Fixing issue years for 2025 articles...")
    cur.execute('''
        SELECT a.id, a."journalId", a.volume, a.issue, a."publicationDate", a."issueId"
        FROM "Article" a
        WHERE a."publicationDate" >= '2025-01-01'
    ''')
    articles_2025 = cur.fetchall()
    for art_id, jid, vol, iss, pub_dt, issue_id in articles_2025:
        year = pub_dt.year if pub_dt else 2025
        key = (jid, vol or 1, iss or 2)
        if key in issue_map:
            # Check if the issue has wrong year
            cur.execute('SELECT year FROM "JournalIssue" WHERE id = %s', (issue_map[key],))
            row = cur.fetchone()
            if row and row[0] != year:
                # Find or create correct year issue
                correct_key = (jid, vol or 1, iss or 2)
                cur.execute('SELECT id FROM "JournalIssue" WHERE "journalId"=%s AND volume=%s AND issue=%s AND year=%s LIMIT 1',
                            (jid, vol or 1, iss or 2, year))
                existing = cur.fetchone()
                if existing:
                    cur.execute('UPDATE "Article" SET "issueId"=%s, "updatedAt"=%s WHERE id=%s',
                                (existing[0], now, art_id))
                else:
                    new_issue_id = str(uuid.uuid4())
                    cur.execute(
                        'INSERT INTO "JournalIssue" (id, "journalId", volume, issue, year, "isCurrent", "isSpecial", "createdAt", "updatedAt", "publishedAt") '
                        'VALUES (%s,%s,%s,%s,%s,false,false,%s,%s,%s)',
                        (new_issue_id, jid, vol or 1, iss or 2, year, now, now, now)
                    )
                    cur.execute('UPDATE "Article" SET "issueId"=%s, "updatedAt"=%s WHERE id=%s',
                                (new_issue_id, now, art_id))
                    issue_map[correct_key] = new_issue_id

    cur.close()
    conn.close()

    print(f"\n{'='*50}")
    print(f"Articles updated: {updated}")
    print(f"DOIs fixed/assigned: {new_doi_assigned}")
    print(f"Journal assignments fixed: {journal_fixed}")
    print("Done!")


if __name__ == "__main__":
    main()
