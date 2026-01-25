import React, { useState } from 'react';
import * as images from '../assets/images';
import ChromaGrid from './ui/ChromaGrid';

export default function Landingpage() {
  const [openFaqs, setOpenFaqs] = useState<Set<number>>(new Set());

  const toggleFaq = (index: number) => {
    setOpenFaqs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const faqs = [
    {
      question: "What is Obscura?",
      answer: "Obscura is a private intent-based settlement system that lets you trade, send, and move assets across chains without exposing your address, amount, or strategy."
    },
    {
      question: "How does Obscura protect my privacy?",
      answer: "Your transaction details are encrypted, sent as commitments, and settled using stealth addresses—so the public can see that something happened, but not who you are or what you did."
    },
    {
      question: "What makes Obscura quantum-safe?",
      answer: "Obscura uses post-quantum WOTS+ signatures that remain secure even against future quantum computers."
    },
    {
      question: "Can I use Obscura across different blockchains?",
      answer: "Yes. Obscura supports both EVM chains and Solana, letting you move assets privately across multiple networks."
    },
    {
      question: "Is Obscura expensive to use?",
      answer: "No. Heavy cryptography runs off-chain, and on-chain only verifies simple proofs — keeping gas fees low."
    },
    {
      question: "How does Obscura handle compliance?",
      answer: "Obscura supports selective disclosure, so you can keep transactions private while still sharing details with authorized auditors when required."
    }
  ];

  return (
    <div className="w-full min-h-screen bg-black overflow-hidden">
      <div className="relative w-full" style={{ 
        minHeight: '100vh',
        backgroundImage: "url('data:image/svg+xml;utf8,<svg viewBox=\\'0 0 1920 6269\\' xmlns=\\'http://www.w3.org/2000/svg\\' preserveAspectRatio=\\'none\\'><rect x=\\'0\\' y=\\'0\\' height=\\'100%\\' width=\\'100%\\' fill=\\'url(%23grad)\\' opacity=\\'1\\'/><defs><radialGradient id=\\'grad\\' gradientUnits=\\'userSpaceOnUse\\' cx=\\'0\\' cy=\\'0\\' r=\\'10\\' gradientTransform=\\'matrix(5.8783e-15 313.45 -96 1.9193e-14 960 3134.5)\\'><stop stop-color=\\'rgba(0,1,0,1)\\' offset=\\'0\\'/><stop stop-color=\\'rgba(3,3,3,1)\\' offset=\\'0.5\\'/><stop stop-color=\\'rgba(5,5,5,1)\\' offset=\\'1\\'/></radialGradient></defs></svg>')",
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      } as React.CSSProperties}>
      
        {/* Hero Section */}
        <div className="relative min-h-[800px] w-full overflow-hidden">
          <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
            {/* Desktop version */}
            <img alt="" className="hidden md:block absolute top-0 left-0 w-full opacity-50" style={{ transform: 'scale(1.4) translateY(-6%)', transformOrigin: 'left top', objectFit: 'cover', filter: 'brightness(0.7) contrast(1.1)' }} src={images.imgDivBgHero} />
            {/* Mobile version */}
            <img alt="" className="block md:hidden absolute top-0 left-1/2 -translate-x-1/2 h-full w-auto min-w-full opacity-50 object-cover" style={{ filter: 'brightness(0.7) contrast(1.1)' }} src={images.imgDivBgHero} />
          </div>
          
          {/* Black transparent overlay */}
          <div className="absolute inset-0 bg-black opacity-30 pointer-events-none z-0"></div>
          
          <div className="relative h-full w-full max-w-7xl mx-auto px-8 lg:px-16">
            {/* Navigation */}
            <nav className="flex items-center justify-between py-8 relative z-10">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 relative flex-shrink-0">
                  <img alt="Obscura Logo" className="w-full h-full object-contain" src={images.imgLogoWhite1} />
                </div>
                <p className="font-poppins font-semibold text-xl text-white">Obscura</p>
              </div>
              <div className="hidden md:flex gap-8 items-center">
                <a href="#features" className="font-poppins font-medium text-base text-white cursor-pointer hover:text-[#00adb5] transition-colors">Features</a>
                <a href="#how-it-works" className="font-poppins font-medium text-base text-white cursor-pointer hover:text-[#00adb5] transition-colors">How It Works</a>
                <a href="#teams" className="font-poppins font-medium text-base text-white cursor-pointer hover:text-[#00adb5] transition-colors">Teams</a>
                <a href="#partners" className="font-poppins font-medium text-base text-white cursor-pointer hover:text-[#00adb5] transition-colors">Partners</a>
                <a href="https://docs.obscura-app.com" target="_blank" rel="noopener noreferrer" className="font-poppins font-medium text-base text-white cursor-pointer hover:text-[#00adb5] transition-colors">Docs</a>
              </div>
              <a href="https://dashboard.obscura-app.com" className="bg-[#00adb5] hover:bg-[#00969d] transition-colors flex items-center justify-center px-4 py-2 rounded-full cursor-pointer">
                <p className="font-manrope font-bold text-sm text-white">Trade Now</p>
              </a>
            </nav>

            {/* Hero Text */}
            <div className="flex flex-col justify-center h-[calc(100%-100px)] pt-20 md:pt-0">
              <h1 className="font-aeonik font-black text-7xl md:text-9xl lg:text-[10rem] text-white tracking-wider opacity-80 mb-8 leading-[1.1] md:leading-[0.85]" style={{ fontWeight: 900 }}>
                Off<br/>The<br/>Radar
              </h1>
              <p className="font-aeonik text-lg md:text-xl lg:text-2xl text-white leading-relaxed max-w-2xl mb-16">
                Trade off the radar. Keep your positions, identity, and moves completely hidden.
              </p>
              
              {/* Powered By */}
              <div className="mt-auto pt-4 flex flex-col items-center">
                <p className="font-poppins text-sm text-gray-400 mb-6">Powered By</p>
                <div className="flex items-center justify-center gap-8 flex-wrap">
                  <img src={images.daemonLogo} alt="Daemon Protocol" className="h-6 w-auto max-w-[80px] object-contain" />
                  <img src={images.img} alt="Partner" className="h-6 w-auto max-w-[80px] object-contain" />
                  <img src={images.img1} alt="Partner" className="h-6 w-auto max-w-[80px] object-contain" />
                  <img src={images.img2} alt="Partner" className="h-6 w-auto max-w-[80px] object-contain" />
                  <img src={images.img3} alt="Partner" className="h-6 w-auto max-w-[80px] object-contain" />
                  <img src={images.img4} alt="Partner" className="h-6 w-auto max-w-[80px] object-contain" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Privacy Reimagined Section */}
        <div id="features" className="relative w-full py-24 px-8">
          {/* Vertical Lines for sections below hero */}
          <div className="absolute left-0 top-0 pointer-events-none w-full h-full">
            <div className="max-w-7xl mx-auto h-full relative px-8 lg:px-16">
              <div className="absolute bg-gradient-to-b from-[rgba(255,255,255,0.2)] via-[rgba(255,255,255,0.1)] h-full left-[33.33%] to-transparent bottom-0 w-[1px]" />
              <div className="absolute bg-gradient-to-b from-[rgba(255,255,255,0.2)] via-[rgba(255,255,255,0.1)] h-full left-[66.66%] to-transparent bottom-0 w-[1px]" />
            </div>
          </div>
          
          <div className="max-w-7xl mx-auto relative z-10">
            <div className="text-center mb-16">
              <h2 className="font-dotmatrix font-bold text-5xl md:text-6xl text-white mb-6">Privacy Reimagined</h2>
              <p className="font-poppins text-base text-white max-w-3xl mx-auto">
                Built from the ground up with cutting-edge protection to keep your financial moves completely hidden.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Card 1 - Future-Proof Security */}
              <div className="bg-[#4a5058] rounded-3xl p-8">
                <div className="w-12 h-12 mb-6">
                  <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
                    <path d="M7 11V7C7 4.23858 9.23858 2 12 2C14.7614 2 17 4.23858 17 7V11" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                    <rect x="5" y="11" width="14" height="11" rx="2" stroke="white" strokeWidth="2"/>
                    <circle cx="12" cy="16" r="1.5" fill="white"/>
                  </svg>
                </div>
                <h3 className="font-poppins font-semibold text-xl text-white mb-3">Future-Proof Security</h3>
                <p className="font-poppins text-sm text-gray-300 leading-relaxed">
                  Your trades stay private forever, not just today. Built to resist even tomorrow's threats.
                </p>
              </div>

              {/* Card 2 - Hidden Identities */}
              <div className="bg-[#4a5058] rounded-3xl p-8">
                <div className="w-12 h-12 mb-6">
                  <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
                    <path d="M2 12C2 12 5 5 12 5C19 5 22 12 22 12C22 12 19 19 12 19C5 19 2 12 2 12Z" stroke="white" strokeWidth="2"/>
                    <circle cx="12" cy="12" r="3" stroke="white" strokeWidth="2"/>
                    <rect x="15" y="15" width="6" height="7" rx="1" fill="#4a5058" stroke="white" strokeWidth="1.5"/>
                    <rect x="17" y="13" width="2" height="2" rx="1" fill="#4a5058" stroke="white" strokeWidth="1.5"/>
                  </svg>
                </div>
                <h3 className="font-poppins font-semibold text-xl text-white mb-3">Hidden Identities</h3>
                <p className="font-poppins text-sm text-gray-300 leading-relaxed">
                  Receive payments invisibly. Each trade uses untraceable addresses that can't be linked to you.
                </p>
              </div>

              {/* Card 3 - Concealed Amounts */}
              <div className="bg-[#4a5058] rounded-3xl p-8">
                <div className="w-12 h-12 mb-6">
                  <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
                    <path d="M12 2L4 6V11C4 16 7 20 12 22C17 20 20 16 20 11V6L12 2Z" stroke="white" strokeWidth="2" strokeLinejoin="round"/>
                    <rect x="9" y="10" width="6" height="7" rx="1" stroke="white" strokeWidth="1.5"/>
                    <path d="M10 10V9C10 7.89543 10.8954 7 12 7C13.1046 7 14 7.89543 14 9V10" stroke="white" strokeWidth="1.5"/>
                    <circle cx="12" cy="13.5" r="1" fill="white"/>
                  </svg>
                </div>
                <h3 className="font-poppins font-semibold text-xl text-white mb-3">Concealed Amounts</h3>
                <p className="font-poppins text-sm text-gray-300 leading-relaxed">
                  Transaction values stay hidden from competitors and bots. They'll never know your trade size.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* How It Works Section */}
        <div id="how-it-works" className="relative w-full py-24 px-8">
          {/* Vertical Lines */}
          <div className="absolute left-0 top-0 pointer-events-none w-full h-full">
            <div className="max-w-7xl mx-auto h-full relative px-8 lg:px-16">
              <div className="absolute bg-gradient-to-b from-[rgba(255,255,255,0.2)] via-[rgba(255,255,255,0.1)] h-full left-[33.33%] to-transparent bottom-0 w-[1px]" />
              <div className="absolute bg-gradient-to-b from-[rgba(255,255,255,0.2)] via-[rgba(255,255,255,0.1)] h-full left-[66.66%] to-transparent bottom-0 w-[1px]" />
            </div>
          </div>
          
          <div className="max-w-7xl mx-auto relative z-10">
            <div className="text-center mb-16">
              <h2 className="font-aeonik font-bold text-5xl md:text-6xl text-white mb-6">How It Works</h2>
              <p className="font-poppins text-base text-white max-w-3xl mx-auto">
                Simple, secure, and private. Four steps to protected transactions.
              </p>
            </div>

            <div className="relative max-w-5xl mx-auto">
              {/* Center Icon with Purple Concentric Circles */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
                {/* Crosshair lines (plus) behind radar */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-0">
                  {/* Vertical line */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[1px] h-[800px] bg-gradient-to-b from-transparent via-gray-600 to-transparent opacity-30"></div>
                  {/* Horizontal line */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[1px] bg-gradient-to-r from-transparent via-gray-600 to-transparent opacity-30"></div>
                </div>
                
                {/* Multiple Purple Circles - Ring style with inward gradient and pulse animation */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-5">
                  {/* Outer circle */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full animate-radar-pulse" style={{ background: 'radial-gradient(circle, rgba(139, 92, 246, 0.05) 0%, rgba(139, 92, 246, 0.15) 40%, rgba(139, 92, 246, 0.3) 48%, rgba(139, 92, 246, 0.4) 50%, transparent 51%)', animationDelay: '2s' }}></div>
                  {/* Middle circle */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full animate-radar-pulse" style={{ background: 'radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, rgba(139, 92, 246, 0.25) 40%, rgba(139, 92, 246, 0.5) 48%, rgba(139, 92, 246, 0.6) 50%, transparent 51%)', animationDelay: '1s' }}></div>
                  {/* Inner circle */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[220px] h-[220px] rounded-full animate-radar-pulse" style={{ background: 'radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, rgba(139, 92, 246, 0.35) 40%, rgba(139, 92, 246, 0.6) 48%, rgba(139, 92, 246, 0.7) 50%, transparent 51%)', animationDelay: '0s' }}></div>
                </div>
                
                {/* Splash Background (invisible for spacing) */}
                <img src={images.splashIcon} alt="" className="w-96 h-96 object-contain opacity-0" />
                
                {/* Icon on top */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
                  <img src={images.iconPng} alt="Obscura Icon" className="w-48 h-48 object-contain" />
                </div>
              </div>

              {/* Grid Layout for 4 Steps */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-32 gap-y-24 relative z-0">
                {/* Step 1 - Top Left */}
                <div className="text-center md:pr-32">
                  <div className="flex justify-center items-center gap-3 mb-4">
                    <span className="font-aeonik font-bold text-2xl text-gray-400 bg-white/10 backdrop-blur-md rounded-lg w-12 h-12 flex items-center justify-center">1</span>
                  </div>
                  <h3 className="font-poppins font-semibold text-2xl text-white mb-3">Connect Wallet</h3>
                  <p className="font-poppins text-sm text-gray-400">
                    Connect your Solana wallet to Obscura. Works with Phantom, Backpack, Seeker.
                  </p>
                </div>

                {/* Step 2 - Top Right */}
                <div className="text-center md:pl-32">
                  <div className="flex justify-center items-center gap-3 mb-4">
                    <span className="font-aeonik font-bold text-2xl text-gray-400 bg-white/10 backdrop-blur-md rounded-lg w-12 h-12 flex items-center justify-center">2</span>
                  </div>
                  <h3 className="font-poppins font-semibold text-2xl text-white mb-3">Create Order</h3>
                  <p className="font-poppins text-sm text-gray-400">
                    OTC trade details: token pair, amount range, and private settlement terms.
                  </p>
                </div>

                {/* Step 3 - Bottom Left */}
                <div className="text-center md:pr-32">
                  <div className="flex justify-center items-center gap-3 mb-4">
                    <span className="font-aeonik font-bold text-2xl text-gray-400 bg-white/10 backdrop-blur-md rounded-lg w-12 h-12 flex items-center justify-center">3</span>
                  </div>
                  <h3 className="font-poppins font-semibold text-2xl text-white mb-3">Sign Securely</h3>
                  <p className="font-poppins text-sm text-gray-400">
                    Use advanced signatures to protect your privacy permanently.
                  </p>
                </div>

                {/* Step 4 - Bottom Right */}
                <div className="text-center md:pl-32">
                  <div className="flex justify-center items-center gap-3 mb-4">
                    <span className="font-aeonik font-bold text-2xl text-gray-400 bg-white/10 backdrop-blur-md rounded-lg w-12 h-12 flex items-center justify-center">4</span>
                  </div>
                  <h3 className="font-poppins font-semibold text-2xl text-white mb-3">Private Settlement</h3>
                  <p className="font-poppins text-sm text-gray-400">
                    Execute on-chain with hidden amounts. Only you and your counterparty know.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Teams Section */}
        <div id="teams" className="relative w-full pt-24 pb-0 px-8">
          {/* Vertical Lines */}
          <div className="absolute left-0 top-0 pointer-events-none w-full h-full">
            <div className="max-w-7xl mx-auto h-full relative px-8 lg:px-16">
              <div className="absolute bg-gradient-to-b from-[rgba(255,255,255,0.2)] via-[rgba(255,255,255,0.1)] h-full left-[33.33%] to-transparent bottom-0 w-[1px]" />
              <div className="absolute bg-gradient-to-b from-[rgba(255,255,255,0.2)] via-[rgba(255,255,255,0.1)] h-full left-[66.66%] to-transparent bottom-0 w-[1px]" />
            </div>
          </div>
          
          <div className="max-w-7xl mx-auto relative z-10">
            <div className="text-center mb-16">
              <h2 className="font-aeonik font-bold text-5xl md:text-6xl text-white mb-6">
                Meet the <span className="text-[#00adb5]">Team</span>
              </h2>
              <p className="font-poppins text-base text-gray-400 max-w-3xl mx-auto">
                The minds behind Obscura, building the future of post-quantum private transactions.
              </p>
            </div>

            <div className="relative min-h-[500px]">
              <ChromaGrid
                items={[
                  {
                    image: images.team0xbt,
                    title: '0xbt',
                    subtitle: 'Founder & CEO',
                    handle: '@XBT_kw',
                    borderColor: '#892CDC',
                    gradient: 'linear-gradient(145deg, #892CDC, #000)',
                    url: 'https://x.com/XBT_kw'
                  },
                  {
                    image: images.teamZaki,
                    title: 'Zaki',
                    subtitle: 'UI/UX Dev',
                    handle: '@zakidev',
                    borderColor: '#52057B',
                    gradient: 'linear-gradient(210deg, #52057B, #000)',
                    url: 'https://www.linkedin.com/in/muhammad-zaki-691108232/'
                  },
                  {
                    image: images.teamFikri,
                    title: 'Fikri.AI',
                    subtitle: 'AI Engineer',
                    handle: '@fikriaf',
                    borderColor: '#892CDC',
                    gradient: 'linear-gradient(165deg, #892CDC, #000)',
                    url: 'https://www.linkedin.com/in/fikri-armia-fahmi-b373b3288/'
                  },
                  {
                    image: images.teamZidan,
                    title: 'Zidan',
                    subtitle: 'Smart Contract',
                    handle: '@zidandev',
                    borderColor: '#52057B',
                    gradient: 'linear-gradient(195deg, #52057B, #000)',
                    url: 'https://www.linkedin.com/in/mzidanfatonie/'
                  },
                ]}
                radius={300}
                columns={4}
                damping={0.45}
                fadeOut={0.6}
                ease="power3.out"
              />
            </div>
          </div>
        </div>

        {/* Partners Section */}
        <div id="partners" className="relative w-full pb-24 px-8">
          {/* Vertical Lines */}
          <div className="absolute left-0 top-0 pointer-events-none w-full h-full">
            <div className="max-w-7xl mx-auto h-full relative px-8 lg:px-16">
              <div className="absolute bg-gradient-to-b from-[rgba(255,255,255,0.2)] via-[rgba(255,255,255,0.1)] h-full left-[33.33%] to-transparent bottom-0 w-[1px]" />
              <div className="absolute bg-gradient-to-b from-[rgba(255,255,255,0.2)] via-[rgba(255,255,255,0.1)] h-full left-[66.66%] to-transparent bottom-0 w-[1px]" />
            </div>
          </div>
          
          <div className="max-w-7xl mx-auto relative z-10">
            <div className="text-center mb-16">
              <h2 className="font-aeonik font-bold text-5xl md:text-6xl text-white mb-6">Our Partners</h2>
              <p className="font-poppins text-base text-white">
                Trusted by leading protocols and platforms
              </p>
            </div>

            <div className="overflow-hidden">
              <div className="flex items-center gap-16 animate-marquee whitespace-nowrap">
                {/* Set 1 */}
                <img src={images.imgLogoWhite2} alt="Partner" className="h-10 w-auto object-contain opacity-70 flex-shrink-0" />
                <img src={images.imgLogoHorizontalWhite1} alt="Partner" className="h-10 w-auto object-contain opacity-70 flex-shrink-0" />
                <img src={images.imgDaemonprotocolLogoWhiteTransparentText1} alt="Partner" className="h-10 w-auto object-contain opacity-70 flex-shrink-0" />
                <img src={images.imgQ87026E2EPng} alt="Partner" className="h-10 w-auto object-contain opacity-70 flex-shrink-0" />
                {/* Set 2 */}
                <img src={images.imgLogoWhite2} alt="Partner" className="h-10 w-auto object-contain opacity-70 flex-shrink-0" />
                <img src={images.imgLogoHorizontalWhite1} alt="Partner" className="h-10 w-auto object-contain opacity-70 flex-shrink-0" />
                <img src={images.imgDaemonprotocolLogoWhiteTransparentText1} alt="Partner" className="h-10 w-auto object-contain opacity-70 flex-shrink-0" />
                <img src={images.imgQ87026E2EPng} alt="Partner" className="h-10 w-auto object-contain opacity-70 flex-shrink-0" />
                {/* Set 3 */}
                <img src={images.imgLogoWhite2} alt="Partner" className="h-10 w-auto object-contain opacity-70 flex-shrink-0" />
                <img src={images.imgLogoHorizontalWhite1} alt="Partner" className="h-10 w-auto object-contain opacity-70 flex-shrink-0" />
                <img src={images.imgDaemonprotocolLogoWhiteTransparentText1} alt="Partner" className="h-10 w-auto object-contain opacity-70 flex-shrink-0" />
                <img src={images.imgQ87026E2EPng} alt="Partner" className="h-10 w-auto object-contain opacity-70 flex-shrink-0" />
                {/* Set 4 */}
                <img src={images.imgLogoWhite2} alt="Partner" className="h-10 w-auto object-contain opacity-70 flex-shrink-0" />
                <img src={images.imgLogoHorizontalWhite1} alt="Partner" className="h-10 w-auto object-contain opacity-70 flex-shrink-0" />
                <img src={images.imgDaemonprotocolLogoWhiteTransparentText1} alt="Partner" className="h-10 w-auto object-contain opacity-70 flex-shrink-0" />
                <img src={images.imgQ87026E2EPng} alt="Partner" className="h-10 w-auto object-contain opacity-70 flex-shrink-0" />
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="relative w-full py-24 px-8">
          {/* Vertical Lines */}
          <div className="absolute left-0 top-0 pointer-events-none w-full h-full">
            <div className="max-w-7xl mx-auto h-full relative px-8 lg:px-16">
              <div className="absolute bg-gradient-to-b from-[rgba(255,255,255,0.2)] via-[rgba(255,255,255,0.1)] h-full left-[33.33%] to-transparent bottom-0 w-[1px]" />
              <div className="absolute bg-gradient-to-b from-[rgba(255,255,255,0.2)] via-[rgba(255,255,255,0.1)] h-full left-[66.66%] to-transparent bottom-0 w-[1px]" />
            </div>
          </div>
          
          <div className="max-w-5xl mx-auto relative z-10">
            <div className="text-center mb-16">
              <h2 className="font-aeonik font-bold text-5xl md:text-6xl text-white mb-6">FAQ</h2>
              <p className="font-poppins text-base text-gray-300 max-w-3xl mx-auto">
                Everything you need to know about private, quantum-safe, cross-chain transactions with Obscura.
              </p>
            </div>
            
            <div className="bg-[#3a3f47] rounded-3xl p-8 md:p-12">
              <div className="space-y-4">
                {/* Row 1 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                  {[0, 1].map((index) => {
                    const faq = faqs[index];
                    const isOpen = openFaqs.has(index);
                    return (
                      <div key={index} className="bg-[#2a2f35] rounded-xl overflow-hidden transition-all">
                        <div 
                          className="p-6 cursor-pointer hover:bg-[#323840] transition-colors"
                          onClick={() => toggleFaq(index)}
                        >
                          <div className="flex items-center justify-between">
                            <h3 className="font-poppins font-medium text-sm text-white pr-4">{faq.question}</h3>
                            <svg className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${isOpen ? 'rotate-45' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <circle cx="12" cy="12" r="10" strokeWidth="2"/>
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v8m-4-4h8"/>
                            </svg>
                          </div>
                        </div>
                        <div className={`transition-all duration-300 ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                          <div className="px-6 pb-6">
                            <p className="font-poppins text-sm text-gray-300 leading-relaxed">{faq.answer}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Row 2 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                  {[2, 3].map((index) => {
                    const faq = faqs[index];
                    const isOpen = openFaqs.has(index);
                    return (
                      <div key={index} className="bg-[#2a2f35] rounded-xl overflow-hidden transition-all">
                        <div 
                          className="p-6 cursor-pointer hover:bg-[#323840] transition-colors"
                          onClick={() => toggleFaq(index)}
                        >
                          <div className="flex items-center justify-between">
                            <h3 className="font-poppins font-medium text-sm text-white pr-4">{faq.question}</h3>
                            <svg className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${isOpen ? 'rotate-45' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <circle cx="12" cy="12" r="10" strokeWidth="2"/>
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v8m-4-4h8"/>
                            </svg>
                          </div>
                        </div>
                        <div className={`transition-all duration-300 ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                          <div className="px-6 pb-6">
                            <p className="font-poppins text-sm text-gray-300 leading-relaxed">{faq.answer}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Row 3 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                  {[4, 5].map((index) => {
                    const faq = faqs[index];
                    const isOpen = openFaqs.has(index);
                    return (
                      <div key={index} className="bg-[#2a2f35] rounded-xl overflow-hidden transition-all">
                        <div 
                          className="p-6 cursor-pointer hover:bg-[#323840] transition-colors"
                          onClick={() => toggleFaq(index)}
                        >
                          <div className="flex items-center justify-between">
                            <h3 className="font-poppins font-medium text-sm text-white pr-4">{faq.question}</h3>
                            <svg className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${isOpen ? 'rotate-45' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <circle cx="12" cy="12" r="10" strokeWidth="2"/>
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v8m-4-4h8"/>
                            </svg>
                          </div>
                        </div>
                        <div className={`transition-all duration-300 ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                          <div className="px-6 pb-6">
                            <p className="font-poppins text-sm text-gray-300 leading-relaxed">{faq.answer}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="relative w-full py-32 px-8 overflow-hidden">
          {/* Teal gradient background with circle */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#1a7a7e] via-[#0d5a5d] to-[#0a4a4d]">
            {/* Three half circles at bottom center with fading colors */}
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2">
              {/* Outer circle - lightest */}
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-[900px] h-[450px] rounded-t-full bg-gradient-to-t from-[#0d5a5d]/60 to-transparent"></div>
              {/* Middle circle */}
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-[600px] h-[300px] rounded-t-full bg-gradient-to-t from-[#0a4a4d]/70 to-transparent"></div>
              {/* Inner circle - darkest */}
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-[350px] h-[175px] rounded-t-full bg-gradient-to-t from-[#083a3d]/80 to-transparent"></div>
            </div>
          </div>
          
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <h2 className="font-aeonik font-medium text-4xl md:text-5xl lg:text-7xl text-white mb-6" style={{ letterSpacing: '0.1em' }}>
              Ready for Private<br/>Transactions?
            </h2>
            <p className="font-aeonik font-normal text-base md:text-lg text-white/90 mb-10 max-w-xl mx-auto leading-relaxed" style={{ letterSpacing: '0.05em' }}>
              Join the future of privacy-preserving finance. Your transactions, your business.
            </p>
            <a href="https://dashboard.obscura-app.com" className="bg-[#2a2f35] hover:bg-[#3a3f47] transition-colors px-8 py-3 rounded-lg inline-block">
              <span className="font-aeonik font-medium text-base text-white" style={{ letterSpacing: '0.08em' }}>Stealth Now</span>
            </a>
          </div>
        </div>

        {/* Footer */}
        <footer className="relative w-full border-t border-gray-800 py-12 px-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
              {/* Logo & Description */}
              <div className="col-span-1 md:col-span-2">
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-7 w-7">
                    <img alt="Obscura Logo" className="w-full h-full object-contain" src={images.imgLogoWhite1} />
                  </div>
                  <p className="font-poppins font-semibold text-xl text-white">Obscura</p>
                </div>
                <p className="font-poppins text-sm text-gray-400 max-w-md mb-6">
                  The first truly private trading protocol. Trade off the radar with complete anonymity.
                </p>
                {/* Social Media Icons */}
                <div className="flex items-center gap-4">
                  <a href="#" className="text-gray-400 hover:text-[#00adb5] transition-colors">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                  </a>
                  <a href="#" className="text-gray-400 hover:text-[#00adb5] transition-colors">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
                    </svg>
                  </a>
                  <a href="#" className="text-gray-400 hover:text-[#00adb5] transition-colors">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12s12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21l-1.446 1.394c-.14.18-.357.295-.6.295c-.002 0-.003 0-.005 0l.213-3.054l5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326l-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z"/>
                    </svg>
                  </a>
                  <a href="#" className="text-gray-400 hover:text-[#00adb5] transition-colors">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387c.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416c-.546-1.387-1.333-1.756-1.333-1.756c-1.089-.745.083-.729.083-.729c1.205.084 1.839 1.237 1.839 1.237c1.07 1.834 2.807 1.304 3.492.997c.107-.775.418-1.305.762-1.604c-2.665-.305-5.467-1.334-5.467-5.931c0-1.311.469-2.381 1.236-3.221c-.124-.303-.535-1.524.117-3.176c0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404c2.291-1.552 3.297-1.23 3.297-1.23c.653 1.653.242 2.874.118 3.176c.77.84 1.235 1.911 1.235 3.221c0 4.609-2.807 5.624-5.479 5.921c.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
                    </svg>
                  </a>
                </div>
              </div>

              {/* Links */}
              <div>
                <h4 className="font-poppins font-semibold text-white mb-4">Product</h4>
                <ul className="space-y-2">
                  <li><a href="#features" className="font-poppins text-sm text-gray-400 hover:text-[#00adb5] transition-colors">Features</a></li>
                  <li><a href="#how-it-works" className="font-poppins text-sm text-gray-400 hover:text-[#00adb5] transition-colors">How It Works</a></li>
                  <li><a href="#teams" className="font-poppins text-sm text-gray-400 hover:text-[#00adb5] transition-colors">Teams</a></li>
                  <li><a href="#partners" className="font-poppins text-sm text-gray-400 hover:text-[#00adb5] transition-colors">Partners</a></li>
                  <li><a href="https://docs.obscura-app.com" target="_blank" rel="noopener noreferrer" className="font-poppins text-sm text-gray-400 hover:text-[#00adb5] transition-colors">Docs</a></li>
                </ul>
              </div>

              <div>
                <h4 className="font-poppins font-semibold text-white mb-4">Community</h4>
                <ul className="space-y-2">
                  <li>
                    <a href="#" className="font-poppins text-sm text-gray-400 hover:text-[#00adb5] transition-colors flex items-center gap-2">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                      </svg>
                      Twitter
                    </a>
                  </li>
                  <li>
                    <a href="#" className="font-poppins text-sm text-gray-400 hover:text-[#00adb5] transition-colors flex items-center gap-2">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
                      </svg>
                      Discord
                    </a>
                  </li>
                  <li>
                    <a href="#" className="font-poppins text-sm text-gray-400 hover:text-[#00adb5] transition-colors flex items-center gap-2">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12s12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21l-1.446 1.394c-.14.18-.357.295-.6.295c-.002 0-.003 0-.005 0l.213-3.054l5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326l-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z"/>
                      </svg>
                      Telegram
                    </a>
                  </li>
                </ul>
              </div>
            </div>

            <div className="border-t border-gray-800 pt-8">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <p className="font-poppins text-sm text-gray-400">
                  © 2026 Obscura. All rights reserved.
                </p>
                <p className="font-poppins text-sm text-gray-400 flex items-center gap-2">
                  Built by 
                  <a href="https://daemonprotocol.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[#00adb5] hover:text-[#00969d] transition-colors font-medium">
                    <img src={images.daemonLogo} alt="Daemon Protocol" className="h-5 w-auto object-contain" />
                    Daemon BlockInt Technologies
                  </a>
                </p>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
