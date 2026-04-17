import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const mockBlogs = [
  {
    title: "Quantum Computing: Breaking the RSA Encryption Barrier",
    slug: "quantum-computing-rsa-encryption",
    excerpt: "An analysis of Shor's algorithm and its imminent threat to modern digital infrastructure.",
    content: `
      <h2>The Quantum Threat</h2>
      <p>Quantum computers leverage the principles of quantum mechanics to process information in ways classical computers cannot. The most significant threat they pose is to current cryptographic algorithms, specifically RSA.</p>
      <br/>
      <p>Using <strong>Shor's algorithm</strong>, a sufficiently powerful quantum computer could factor large integers efficiently, completely dismantling the security of RSA encryption which relies on this complexity.</p>
      <div style="text-align: center; margin: 2rem 0;">
         <img src="https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=800&q=80" alt="Quantum Processor" style="max-width: 100%; border-radius: 8px;"/>
         <p style="font-size: 12px; color: gray;">Fig 1. A dilution refrigerator cooling a quantum processor.</p>
      </div>
      <h3>Post-Quantum Cryptography</h3>
      <p>The transition to post-quantum cryptography (PQC) is no longer a theoretical exercise but an urgent engineering requirement. Organizations must evaluate their cryptographic agility today.</p>
    `,
    featuredImageUrl: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=1200&q=80"
  },
  {
    title: "The Evolution of 6G Networks: Terahertz Frequencies",
    slug: "evolution-6g-networks-terahertz",
    excerpt: "How the next generation of mobile networking will leverage the terahertz spectrum for unprecedented bandwidth.",
    content: `
      <h2>Beyond 5G</h2>
      <p>While 5G is still being deployed globally, research into 6G is well underway. The hallmark metric of 6G will be its utilization of the terahertz (THz) frequency band, spanning 0.1 THz to 10 THz.</p>
      <div style="text-align: center; margin: 2rem 0;">
         <img src="https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=800&q=80" alt="Network towers" style="max-width: 100%; border-radius: 8px;"/>
      </div>
      <p>This spectrum allows for massive data rates, potentially peaking at 1 Terabit per second (Tbps), enabling applications like high-fidelity holographic communications and real-time remote surgery.</p>
      <h3>Challenges in THz Communication</h3>
      <ul>
        <li>Severe path loss and atmospheric attenuation.</li>
        <li>The need for advanced beamforming and massive MIMO architectures.</li>
        <li>Hardware design limitations for THz transceivers.</li>
      </ul>
    `,
    featuredImageUrl: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=1200&q=80"
  },
  {
    title: "Neuromorphic Engineering: Mimicking the Human Brain",
    slug: "neuromorphic-engineering-human-brain",
    excerpt: "Hardware architectures inspired by neurobiology promise lower power consumption and parallel processing capabilities.",
    content: `
      <h2>The Von Neumann Bottleneck</h2>
      <p>Traditional computing architectures separate processing and memory, leading to the Von Neumann bottleneck. Neuromorphic engineering integrates computational and memory units, similar to neurons and synapses in the biological brain.</p>
      <blockquote><p>"The future of AI hardware lies in simulating biological neural networks mechanically."</p></blockquote>
      <p>These chips process spikes of electrical current rather than continuous binary streams, dramatically reducing energy consumption. This makes them ideal for edge computing and embedded IoT devices where power is heavily constrained.</p>
      <div style="text-align: center; margin: 2rem 0;">
         <img src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=800&q=80" alt="Circuit board resembling brain" style="max-width: 100%; border-radius: 8px;"/>
      </div>
    `,
    featuredImageUrl: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1200&q=80"
  },
  {
    title: "CRISPR-Cas9 in Bioinformatics: Data-Driven Gene Editing",
    slug: "crispr-cas9-bioinformatics-data-driven",
    excerpt: "How machine learning models are predicting off-target effects in CRISPR gene editing workflows.",
    content: `
      <h2>Computational Biology at the Forefront</h2>
      <p>The revolutionary CRISPR-Cas9 mechanism allows precise genomic edits. However, 'off-target' mutations remain a serious clinical risk. Bioinformatics and machine learning (ML) are stepping in to model and predict these errors before any physical editing takes place.</p>
      <div style="text-align: center; margin: 2rem 0;">
         <img src="https://images.unsplash.com/photo-1532094349884-543559536aa9?auto=format&fit=crop&w=800&q=80" alt="DNA representation" style="max-width: 100%; border-radius: 8px;"/>
      </div>
      <p>By training convolution neural networks (CNNs) on vast datasets of historical CRISPR assays, computational biologists can score guide RNA (gRNA) sequences for their safety and efficacy.</p>
    `,
    featuredImageUrl: "https://images.unsplash.com/photo-1532094349884-543559536aa9?auto=format&fit=crop&w=1200&q=80"
  },
  {
    title: "Solid-State Batteries: The End of Lithium-Ion?",
    slug: "solid-state-batteries-end-lithium-ion",
    excerpt: "Solid electrolytes promise higher energy densities and supreme safety for the next generation of EVs.",
    content: `
      <h2>The Limitation of Liquid Electrolytes</h2>
      <p>Traditional lithium-ion batteries rely on liquid electrolytes, which are flammable and restrict operating temperatures. Solid-state architecture replaces this liquid with a solid ceramic or polymer matrix.</p>
      <p>This allows for the use of a pure lithium metal anode, drastically increasing the energy density volumetric capacity footprint. Furthermore, solid electrolytes are virtually immune to the dendritic growth that routinely shorts conventional cells.</p>
    `,
    featuredImageUrl: "https://images.unsplash.com/photo-1593941707881-081c7f999fd5?auto=format&fit=crop&w=1200&q=80"
  },
  {
    title: "Edge AI vs. Cloud AI: Architectural Trade-offs",
    slug: "edge-ai-vs-cloud-ai-architectural",
    excerpt: "Analyzing the latency, privacy, and computational trade-offs of deploying machine learning models to edge devices.",
    content: `
      <h2>Decentralizing Inference</h2>
      <p>Historically, complex machine learning inference required cloud computing arrays. With the advent of specialized NPUs (Neural Processing Units), inference is moving to the 'edge'.</p>
      <table style="width:100%; border-collapse: collapse; margin-top: 1rem;">
        <tr><th style="border:1px solid #ddd; padding:8px;">Metric</th><th style="border:1px solid #ddd; padding:8px;">Cloud AI</th><th style="border:1px solid #ddd; padding:8px;">Edge AI</th></tr>
        <tr><td style="border:1px solid #ddd; padding:8px;">Latency</td><td style="border:1px solid #ddd; padding:8px;">High (Network Dependent)</td><td style="border:1px solid #ddd; padding:8px;">Ultra-Low (Local)</td></tr>
        <tr><td style="border:1px solid #ddd; padding:8px;">Privacy</td><td style="border:1px solid #ddd; padding:8px;">Low (Data transmission)</td><td style="border:1px solid #ddd; padding:8px;">High (Data stays local)</td></tr>
      </table>
      <br/>
      <p>While Edge AI provides real-time processing necessary for autonomous vehicles and robotics, it suffers from storage limitations and higher device costs.</p>
    `,
    featuredImageUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80"
  },
  {
    title: "Photonic Processors: Computing with Light",
    slug: "photonic-processors-computing-light",
    excerpt: "Silicon photonics is reshaping high-performance computing by replacing electrons with photons for data transfer.",
    content: `
      <h2>The Speed of Light</h2>
      <p>As transistor scaling slows (the end of Moore's Law), researchers are turning to photonics. Instead of modulating electrons over copper wiring, photonic processors modulate lasers over silicon waveguides.</p>
      <p>This drastically reduces the thermal output (I^2R losses) and allows for vast data multiplexing (WDM) across a single physical medium.</p>
    `,
    featuredImageUrl: "https://images.unsplash.com/photo-1540643753767-f3708eab6276?auto=format&fit=crop&w=1200&q=80"
  },
  {
    title: "Autonomous Swarm Drones in Agriculture",
    slug: "autonomous-swarm-drones-agriculture",
    excerpt: "How decentralized control algorithms are allowing massive swarms of UAVs to optimize crop yields.",
    content: `
      <h2>Nature-Inspired Algorithms</h2>
      <p>Derived from the flocking behavior of birds, swarm robotics utilizes decentralized control. No single drone acts as the 'leader'; instead, they follow simple reactive rules relative to their neighbors.</p>
      <div style="text-align: center; margin: 2rem 0;">
         <img src="https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&w=800&q=80" alt="Drone over field" style="max-width: 100%; border-radius: 8px;"/>
      </div>
      <p>In agriculture, these swarms are deployed for dynamic hyperspectral imaging, pest detection, and autonomous spot-spraying, drastically reducing pesticide usage.</p>
    `,
    featuredImageUrl: "https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&w=1200&q=80"
  },
  {
    title: "Digital Twins in Industrial Manufacturing",
    slug: "digital-twins-industrial-manufacturing",
    excerpt: "Real-time virtual replicas of physical assets are predictive maintenance powerhouses.",
    content: `
      <h2>The Virtual Mirror</h2>
      <p>A Digital Twin is a highly synchronized virtual representation of a physical asset, updated via a continuous stream of IoT sensor data.</p>
      <p>By running simulations on the twin, manufacturers can predict mechanical failures, test load capacities, and optimize operating parameters without risking the physical system.</p>
    `,
    featuredImageUrl: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=1200&q=80"
  },
  {
    title: "Blockchain for IoT Device Authentication",
    slug: "blockchain-iot-device-authentication",
    excerpt: "Addressing the massive security vulnerabilities in IoT networks using distributed ledger technology.",
    content: `
      <h2>The IoT Security Crisis</h2>
      <p>The proliferation of cheap, loosely-secured IoT devices has created massive botnets. Traditional centralized authentication servers (PKI) represent single points of failure scaling poorly with millions of devices.</p>
      <p>By implementing a lightweight distributed ledger, devices can autonomously authenticate and establish trust across a decentralized network using smart contracts, completely eliminating the master server vulnerability.</p>
    `,
    featuredImageUrl: "https://images.unsplash.com/photo-1639762681485-074b7f4aec81?auto=format&fit=crop&w=1200&q=80"
  }
];

async function main() {
  console.log('Seeding fake IEEE articles to Blog table...');
  const firstUser = await prisma.user.findFirst();
  
  if (!firstUser) {
     console.error('No users found in database to assign as author. Run base seed first.');
     return;
  }

  for (const blog of mockBlogs) {
    await prisma.blog.upsert({
      where: { slug: blog.slug },
      update: {},
      create: {
        ...blog,
        status: 'published',
        publishedAt: new Date(Date.now() - Math.floor(Math.random() * 10000000000)), // random past date
        authorId: firstUser.id
      }
    });
  }
  
  console.log('Finished seeding 10 IEEE blogs!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
