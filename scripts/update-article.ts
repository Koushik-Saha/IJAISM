
import { prisma } from "../lib/prisma";

async function main() {
    const id = "3e53b2a5-74d6-4d4e-91e8-07a231c1ebb5";
    const dummyPdfUrl = "/uploads/dummy.pdf";
    const dummyHtml = `
    <h2>Introduction</h2>
    <p>The rapid expansion of digital technologies has significantly increased organizations' dependence on information systems, making cybersecurity a critical concern in modern business and institutional environments. This study examines key cybersecurity challenges faced by organizations, including data breaches, ransomware attacks, insider threats, and system vulnerabilities.</p>
    <h2>Literature Review</h2>
    <p>Using a conceptual and analytical approach based on existing literature, industry reports, and real-world incidents, the paper explores how inadequate security frameworks and human factors contribute to cyber risks. The findings highlight that while technological solutions such as firewalls, encryption, and intrusion detection systems are essential, effective cybersecurity management also requires organizational policies, employee awareness, and proactive risk assessment strategies.</p>
    <h2>Methodology</h2>
    <p>The study emphasizes the importance of integrating cybersecurity into overall risk management and decision-making processes rather than treating it as a purely technical issue.</p>
    <h2>Results</h2>
    <p>Furthermore, the paper discusses emerging trends such as zero-trust architecture and cybersecurity governance models that can enhance system resilience.</p>
    <h2>Conclusion</h2>
    <p>The research contributes to a better understanding of cybersecurity from both technical and managerial perspectives and provides practical insights for organizations seeking to protect sensitive information and ensure the continuity of digital operations in an increasingly complex threat landscape.</p>
  `;

    const article = await prisma.article.update({
        where: { id },
        data: {
            pdfUrl: dummyPdfUrl,
            fullText: dummyHtml
        }
    });
    console.log("Updated Article:", JSON.stringify(article, null, 2));
}

main()
    .catch((e) => console.error(e))
    .finally(async () => await prisma.$disconnect());
